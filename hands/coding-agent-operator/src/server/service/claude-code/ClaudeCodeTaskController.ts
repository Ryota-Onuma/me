import { execSync } from "node:child_process";
import { query } from "@anthropic-ai/claude-code";
import prexit from "prexit";
import { ulid } from "ulid";
import { type EventBus, getEventBus } from "../events/EventBus";
import { PermissionService } from "../permission/PermissionService";
import {
  createMessageGenerator,
  type UserMessageInput,
} from "./createMessageGenerator";
import type {
  AliveClaudeCodeTask,
  ClaudeCodeTask,
  PendingClaudeCodeTask,
  RunningClaudeCodeTask,
} from "./types";

export class ClaudeCodeTaskController {
  private pathToClaudeCodeExecutable: string;
  private tasks: ClaudeCodeTask[] = [];
  private eventBus: EventBus;

  constructor() {
    this.pathToClaudeCodeExecutable = execSync("which claude", {})
      .toString()
      .trim();
    this.eventBus = getEventBus();

    prexit(() => {
      this.aliveTasks.forEach((task) => {
        task.abortController.abort();
      });
    });
  }

  public get aliveTasks() {
    return this.tasks.filter(
      (task) => task.status === "running" || task.status === "paused",
    );
  }

  public async startOrContinueTask(
    currentSession: {
      cwd: string;
      projectId: string;
      sessionId?: string;
    },
    input: UserMessageInput,
  ): Promise<AliveClaudeCodeTask> {
    const existingTask = this.aliveTasks.find(
      (task) => task.sessionId === currentSession.sessionId,
    );

    if (existingTask) {
      return await this.continueTask(existingTask, input);
    } else {
      return await this.startTask(currentSession, input);
    }
  }

  private async continueTask(
    task: AliveClaudeCodeTask,
    message: UserMessageInput,
  ) {
    task.setNextMessage(message);
    await task.awaitFirstMessage();
    return task;
  }

  private startTask(
    currentSession: {
      cwd: string;
      projectId: string;
      sessionId?: string;
    },
    message: UserMessageInput,
  ) {
    const {
      generateMessages,
      setNextMessage,
      setFirstMessagePromise,
      resolveFirstMessage,
      awaitFirstMessage,
    } = createMessageGenerator(message);

    const task: PendingClaudeCodeTask = {
      status: "pending",
      id: ulid(),
      projectId: currentSession.projectId,
      baseSessionId: currentSession.sessionId,
      cwd: currentSession.cwd,
      generateMessages,
      setNextMessage,
      setFirstMessagePromise,
      resolveFirstMessage,
      awaitFirstMessage,
      onMessageHandlers: [],
    };

    let aliveTaskResolve: (task: AliveClaudeCodeTask) => void;
    let aliveTaskReject: (error: unknown) => void;

    const aliveTaskPromise = new Promise<AliveClaudeCodeTask>(
      (resolve, reject) => {
        aliveTaskResolve = resolve;
        aliveTaskReject = reject;
      },
    );

    let resolved = false;

    const handleTask = async () => {
      try {
        const abortController = new AbortController();

        let currentTask: AliveClaudeCodeTask | undefined;

        const permissionService = PermissionService.getInstance();

        for await (const message of query({
          prompt: task.generateMessages(),
          options: {
            resume: task.baseSessionId,
            cwd: task.cwd,
            pathToClaudeCodeExecutable: this.pathToClaudeCodeExecutable,
            permissionMode: permissionService.getPermissionMode(),
            abortController: abortController,
            canUseTool: async (toolName, toolInput) => {
              // Generate a unique tool use ID for this request
              const toolUseId = `tool_use_${ulid()}`;

              // Determine session ID from current task
              const sessionId =
                currentTask?.sessionId || task.baseSessionId || "unknown";

              // Create a description based on tool name and input
              const description = this.createToolDescription(
                toolName,
                toolInput,
              );

              return await permissionService.requestPermission(
                sessionId,
                toolName,
                toolUseId,
                toolInput,
                description,
              );
            },
          },
        })) {
          currentTask ??= this.aliveTasks.find((t) => t.id === task.id);

          if (currentTask !== undefined && currentTask.status === "paused") {
            this.updateExistingTask({
              ...currentTask,
              status: "running",
            });
          }

          // 初回の system message だとまだ history ファイルが作成されていないので
          if (
            (message.type === "user" || message.type === "assistant") &&
            message.uuid !== undefined
          ) {
            if (!resolved) {
              const runningTask: RunningClaudeCodeTask = {
                status: "running",
                id: task.id,
                projectId: task.projectId,
                cwd: task.cwd,
                generateMessages: task.generateMessages,
                setNextMessage: task.setNextMessage,
                resolveFirstMessage: task.resolveFirstMessage,
                setFirstMessagePromise: task.setFirstMessagePromise,
                awaitFirstMessage: task.awaitFirstMessage,
                onMessageHandlers: task.onMessageHandlers,
                userMessageId: message.uuid,
                sessionId: message.session_id,
                abortController: abortController,
              };
              this.tasks.push(runningTask);
              aliveTaskResolve(runningTask);
              resolved = true;
            }

            resolveFirstMessage();
          }

          await Promise.all(
            task.onMessageHandlers.map(async (onMessageHandler) => {
              await onMessageHandler(message);
            }),
          );

          if (currentTask !== undefined && message.type === "result") {
            this.updateExistingTask({
              ...currentTask,
              status: "paused",
            });
            resolved = true;
            setFirstMessagePromise();
          }
        }

        const updatedTask = this.aliveTasks.find((t) => t.id === task.id);

        if (updatedTask === undefined) {
          const error = new Error(
            `illegal state: task is not running, task: ${JSON.stringify(updatedTask)}`,
          );
          aliveTaskReject(error);
          throw error;
        }

        this.updateExistingTask({
          ...updatedTask,
          status: "completed",
        });
      } catch (error) {
        if (!resolved) {
          aliveTaskReject(error);
          resolved = true;
        }

        console.error("Error resuming task", error);
        this.updateExistingTask({
          ...task,
          status: "failed",
        });
      }
    };

    // continue background
    void handleTask();

    return aliveTaskPromise;
  }

  public abortTask(sessionId: string) {
    const task = this.aliveTasks.find((task) => task.sessionId === sessionId);
    if (!task) {
      throw new Error("Alive Task not found");
    }

    task.abortController.abort();
    this.updateExistingTask({
      id: task.id,
      projectId: task.projectId,
      sessionId: task.sessionId,
      status: "failed",
      cwd: task.cwd,
      generateMessages: task.generateMessages,
      setNextMessage: task.setNextMessage,
      resolveFirstMessage: task.resolveFirstMessage,
      setFirstMessagePromise: task.setFirstMessagePromise,
      awaitFirstMessage: task.awaitFirstMessage,
      onMessageHandlers: task.onMessageHandlers,
      baseSessionId: task.baseSessionId,
      userMessageId: task.userMessageId,
    });
  }

  private updateExistingTask(task: ClaudeCodeTask) {
    const target = this.tasks.find((t) => t.id === task.id);

    if (!target) {
      throw new Error("Task not found");
    }

    Object.assign(target, task);

    this.eventBus.emit("task_changed", {
      type: "task_changed",
      data: this.aliveTasks,
    });
  }

  private createToolDescription(
    toolName: string,
    toolInput: Record<string, unknown>,
  ): string {
    switch (toolName) {
      case "Edit":
        return `Edit file ${toolInput["file_path"] || "unknown file"}`;

      case "Write":
        return `Write to file ${toolInput["file_path"] || "unknown file"}`;

      case "Read":
        return `Read file ${toolInput["file_path"] || "unknown file"}`;

      case "Bash": {
        const command = toolInput["command"] as string;
        return `Execute shell command: ${command ? command.substring(0, 100) : "unknown command"}${command && command.length > 100 ? "..." : ""}`;
      }

      case "Glob":
        return `Search for files matching pattern: ${toolInput["pattern"] || "unknown pattern"}`;

      case "Grep":
        return `Search for pattern "${toolInput["pattern"] || "unknown"}" in files`;

      case "WebFetch":
        return `Fetch content from URL: ${toolInput["url"] || "unknown URL"}`;

      case "Task":
        return `Launch task: ${toolInput["description"] || "unknown task"}`;

      default:
        return `Use tool ${toolName}`;
    }
  }
}
