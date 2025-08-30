import type {
  Attempt,
  BranchStatus,
  ExecProcess,
  ProfileDef,
  Status,
  Task,
} from "./types";

const j = async <T>(res: Response) => {
  const data = await res.json();
  if (!res.ok || data.success === false)
    throw new Error(data.message || res.statusText);
  return (data.data ?? data) as T;
};

export const API = {
  listTasks: async (): Promise<Task[]> => j<Task[]>(await fetch("/api/tasks")),
  createTask: async (
    title: string,
    description: string,
    status: Status,
  ): Promise<Task> =>
    j<Task>(
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status }),
      }),
    ),
  updateTask: async (
    id: string,
    patch: Partial<Pick<Task, "title" | "description" | "status">>,
  ): Promise<Task> =>
    j<Task>(
      await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    ),
  deleteTask: async (id: string): Promise<void> => {
    await fetch(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  moveTask: async (
    id: string,
    toStatus: Status,
    toIndex: number,
  ): Promise<Task> =>
    j<Task>(
      await fetch(`/api/tasks/${encodeURIComponent(id)}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_status: toStatus, to_index: toIndex }),
      }),
    ),
};

export const ExecAPI = {
  listProfiles: async (): Promise<ProfileDef[]> =>
    j<ProfileDef[]>(await fetch("/api/profiles")),
  start: async (body: {
    profile: string;
    prompt: string;
    cwd?: string;
    attempt_id?: string;
  }): Promise<ExecProcess> =>
    j<ExecProcess>(
      await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),
  kill: async (id: string) =>
    fetch(`/api/executions/${id}/kill`, { method: "POST" }),
  list: async (): Promise<ExecProcess[]> =>
    j<ExecProcess[]>(await fetch("/api/executions")),
};

export const AttemptAPI = {
  create: async (body: {
    task_id: string;
    profile: string;
    repo_path: string;
    base_branch: string;
  }): Promise<Attempt> =>
    j<Attempt>(
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),
  list: async (task_id: string): Promise<Attempt[]> =>
    j<Attempt[]>(
      await fetch(`/api/attempts?task_id=${encodeURIComponent(task_id)}`),
    ),
  pr: async (
    id: string,
    body: { title?: string; body?: string; base_branch?: string },
  ): Promise<Attempt> =>
    j<Attempt>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),
  status: async (id: string): Promise<BranchStatus> =>
    j<BranchStatus>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/status`),
    ),
  push: async (id: string): Promise<Attempt> =>
    j<Attempt>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/push`, {
        method: "POST",
      }),
    ),
};

export const SettingsAPI = {
  get: async (): Promise<ProfileDef[]> =>
    j<ProfileDef[]>(await fetch("/api/profiles")),
  save: async (arr: ProfileDef[]): Promise<ProfileDef[]> =>
    j<ProfileDef[]>(
      await fetch("/api/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arr),
      }),
    ),
};
