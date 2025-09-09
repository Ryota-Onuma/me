import fs from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type {
  PermissionMode,
  PermissionResult,
} from "@anthropic-ai/claude-code";
import type { PermissionRequest } from "@/lib/types/permission";
import { type EventBus, getEventBus } from "../events/EventBus";

export type PermissionSettings = {
  defaultMode: PermissionMode;
  globalBypass: boolean;
};

export class PermissionService {
  private static instance: PermissionService;
  private settingsPath: string;
  private settings: PermissionSettings;
  private pendingRequests = new Map<
    string,
    {
      resolve: (result: PermissionResult) => void;
      request: PermissionRequest;
    }
  >();
  private eventBus: EventBus;

  private constructor() {
    this.settingsPath = path.join(
      homedir(),
      ".claude",
      "permission-settings.json",
    );
    this.settings = this.loadSettings();
    this.eventBus = getEventBus();
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  private loadSettings(): PermissionSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const content = fs.readFileSync(this.settingsPath, "utf-8");
        const parsed = JSON.parse(content);
        return {
          defaultMode:
            this.validatePermissionMode(parsed.defaultMode) || "default",
          globalBypass: parsed.globalBypass === true,
        };
      }
    } catch (error) {
      console.warn("Failed to load permission settings:", error);
    }

    // デフォルト設定
    return {
      defaultMode: "default",
      globalBypass: false,
    };
  }

  private validatePermissionMode(mode: unknown): PermissionMode | null {
    const validModes: PermissionMode[] = [
      "default",
      "acceptEdits",
      "bypassPermissions",
      "plan",
    ];
    return validModes.includes(mode as PermissionMode)
      ? (mode as PermissionMode)
      : null;
  }

  public saveSettings(settings: Partial<PermissionSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings,
    };

    try {
      // ~/.claude ディレクトリが存在しない場合は作成
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2),
      );
    } catch (error) {
      console.error("Failed to save permission settings:", error);
      throw error;
    }
  }

  public getSettings(): PermissionSettings {
    return { ...this.settings };
  }

  public getPermissionMode(): PermissionMode {
    return this.settings.globalBypass
      ? "bypassPermissions"
      : this.settings.defaultMode;
  }

  public setPermissionMode(mode: PermissionMode): void {
    this.saveSettings({ defaultMode: mode });
  }

  public setGlobalBypass(bypass: boolean): void {
    this.saveSettings({ globalBypass: bypass });
  }

  public async requestPermission(
    sessionId: string,
    toolName: string,
    toolUseId: string,
    toolInput: Record<string, unknown>,
    description: string,
    reason?: string,
  ): Promise<PermissionResult> {
    // Bypass permissions if globally enabled
    if (this.settings.globalBypass) {
      return {
        behavior: "allow",
        updatedInput: toolInput,
      };
    }

    // Auto-allow edits if in acceptEdits mode
    if (
      this.settings.defaultMode === "acceptEdits" &&
      this.isEditTool(toolName)
    ) {
      return {
        behavior: "allow",
        updatedInput: toolInput,
      };
    }

    // Plan mode - deny all actions
    if (this.settings.defaultMode === "plan") {
      return {
        behavior: "deny",
        message: "Plan mode: Actions are not executed",
      };
    }

    // Create permission request
    const requestId = Math.random().toString(36).substr(2, 9);
    const request: PermissionRequest = {
      id: requestId,
      sessionId,
      toolName,
      toolUseId,
      toolInput,
      description,
      reason,
      severity: this.calculateSeverity(toolName, toolInput),
      timestamp: new Date(),
    };

    // Emit event to notify frontend
    this.eventBus.emit("permission_request", {
      type: "permission_request",
      data: request,
    });

    // Wait for user response
    return new Promise<PermissionResult>((resolve) => {
      this.pendingRequests.set(requestId, { resolve, request });
    });
  }

  public respondToPermissionRequest(
    requestId: string,
    decision: "allow" | "deny",
    reason?: string,
  ): void {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      console.warn(`Permission request ${requestId} not found`);
      return;
    }

    this.pendingRequests.delete(requestId);

    const result: PermissionResult =
      decision === "allow"
        ? {
            behavior: "allow",
            updatedInput: pending.request.toolInput,
          }
        : {
            behavior: "deny",
            message: reason || "Permission denied by user",
          };

    pending.resolve(result);
  }

  private isEditTool(toolName: string): boolean {
    const editTools = ["Edit", "Write", "MultiEdit"];
    return editTools.includes(toolName);
  }

  private calculateSeverity(
    toolName: string,
    _toolInput: Record<string, unknown>,
  ): "low" | "medium" | "high" {
    // High risk tools
    if (toolName === "Bash" || toolName === "Task") {
      return "high";
    }

    // Medium risk tools
    if (this.isEditTool(toolName)) {
      return "medium";
    }

    // Low risk tools (Read, Glob, Grep, etc.)
    return "low";
  }
}
