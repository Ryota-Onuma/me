import type {
  Attempt,
  BranchStatus,
  ExecProcess,
  ProfileDef,
  RepoBookmark,
  Status,
  Task,
} from "./types";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const readJson = async (res: Response): Promise<unknown> => {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const looksJson = ct.includes("json");
  try {
    if (looksJson) {
      return await res.json();
    }
    const text = await res.text();
    const hint = text.trim().slice(0, 256);
    if (hint.startsWith("<!doctype") || hint.startsWith("<html")) {
      throw new Error(
        `[${res.status}] API 応答が JSON ではなく HTML です。バックエンドや /api プロキシ設定を確認してください。`,
      );
    }
    throw new Error(
      `[${res.status}] API 応答が JSON ではありません: ${res.statusText} ${hint ? `- ${hint}` : ""}`,
    );
  } catch (e) {
    const err = e as Error;
    if (looksJson) {
      try {
        const txt = await res.clone().text();
        throw new Error(
          `[${res.status}] JSON パースに失敗しました: ${err.message}${txt ? ` - ${txt.slice(0, 256)}` : ""}`,
        );
      } catch {
        throw err;
      }
    }
    throw err;
  }
};

const j = async <T>(res: Response): Promise<T> => {
  const data: unknown = await readJson(res);
  if (!res.ok) {
    if (isRecord(data) && typeof data.message === "string" && data.message) {
      throw new Error(String(data.message));
    }
    throw new Error(res.statusText);
  }
  if (isRecord(data)) {
    const env = data as ApiEnvelope<T>;
    if (env.success === false) throw new Error(env.message || res.statusText);
    if ("data" in env && env.data !== undefined) return env.data as T;
  }
  return data as T;
};

// NOTE: 一部エンドポイントで応答が返らず UI が永遠に「更新中」になるのを避けるため、
// 明示的なタイムアウト付き fetch を用意する（不要な外部依存は追加しない）。
const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> => {
  const { timeoutMs = 8000, signal, ...rest } = init || {};
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: signal ?? controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
};

export const API = {
  listTasks: async (): Promise<Task[]> => j<Task[]>(await fetch("/api/tasks")),
  getTask: async (id: string): Promise<Task> =>
    j<Task>(await fetch(`/api/tasks/${encodeURIComponent(id)}`)),
  listTasksPaged: async (opts: {
    limit: number;
    offset?: number;
    q?: string;
    status?: string; // comma-separated
  }): Promise<Task[]> => {
    const sp = new URLSearchParams();
    sp.set("limit", String(opts.limit));
    if (opts.offset != null) sp.set("offset", String(opts.offset));
    if (opts.q) sp.set("q", opts.q);
    if (opts.status) sp.set("status", opts.status);
    return j<Task[]>(await fetch(`/api/tasks?${sp.toString()}`));
  },
  listTasksPagedWithMeta: async (opts: {
    limit: number;
    offset?: number;
    q?: string;
    status?: string;
  }): Promise<{
    data: Task[];
    total: number;
    limit: number;
    offset: number;
  }> => {
    const sp = new URLSearchParams();
    sp.set("limit", String(opts.limit));
    if (opts.offset != null) sp.set("offset", String(opts.offset));
    if (opts.q) sp.set("q", opts.q);
    if (opts.status) sp.set("status", opts.status);
    const res = await fetch(`/api/tasks?${sp.toString()}`);
    const raw = (await readJson(res)) as ApiEnvelope<Task[]> & { meta?: unknown };
    if (!res.ok || (isRecord(raw) && raw.success === false))
      throw new Error((isRecord(raw) ? (raw.message as string) : null) || res.statusText);
    const meta = isRecord(raw) && isRecord(raw.meta) ? (raw.meta as Record<string, unknown>) : {};
    const total = Number(meta?.total ?? 0);
    const limit = Number(meta?.limit ?? opts.limit);
    const offset = Number(meta?.offset ?? opts.offset ?? 0);
    return { data: (isRecord(raw) && (raw.data as Task[])) || [], total, limit, offset };
  },
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
  get: async (id: string): Promise<ExecProcess> =>
    j<ExecProcess>(await fetch(`/api/executions/${encodeURIComponent(id)}`)),
  listPaged: async (opts: {
    limit: number;
    offset?: number;
    profile?: string;
    status?: string; // "running,completed"など
    q?: string;
    attempt_id?: string;
  }): Promise<ExecProcess[]> => {
    const sp = new URLSearchParams();
    sp.set("limit", String(opts.limit));
    if (opts.offset != null) sp.set("offset", String(opts.offset));
    if (opts.profile) sp.set("profile", opts.profile);
    if (opts.status) sp.set("status", opts.status);
    if (opts.q) sp.set("q", opts.q);
    if (opts.attempt_id) sp.set("attempt_id", opts.attempt_id);
    return j<ExecProcess[]>(await fetch(`/api/executions?${sp.toString()}`));
  },
  listPagedWithMeta: async (opts: {
    limit: number;
    offset?: number;
    profile?: string;
    status?: string;
    q?: string;
    attempt_id?: string;
  }): Promise<{
    data: ExecProcess[];
    total: number;
    limit: number;
    offset: number;
  }> => {
    const sp = new URLSearchParams();
    sp.set("limit", String(opts.limit));
    if (opts.offset != null) sp.set("offset", String(opts.offset));
    if (opts.profile) sp.set("profile", opts.profile);
    if (opts.status) sp.set("status", opts.status);
    if (opts.q) sp.set("q", opts.q);
    if (opts.attempt_id) sp.set("attempt_id", opts.attempt_id);
    const res = await fetch(`/api/executions?${sp.toString()}`);
    const raw = (await readJson(res)) as ApiEnvelope<ExecProcess[]> & { meta?: unknown };
    if (!res.ok || (isRecord(raw) && raw.success === false))
      throw new Error((isRecord(raw) ? (raw.message as string) : null) || res.statusText);
    const meta = isRecord(raw) && isRecord(raw.meta) ? (raw.meta as Record<string, unknown>) : {};
    const total = Number(meta?.total ?? 0);
    const limit = Number(meta?.limit ?? opts.limit);
    const offset = Number(meta?.offset ?? opts.offset ?? 0);
    return { data: (isRecord(raw) && (raw.data as ExecProcess[])) || [], total, limit, offset };
  },
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
  get: async (id: string): Promise<Attempt> =>
    j<Attempt>(await fetch(`/api/attempts/${encodeURIComponent(id)}`)),
  create: async (body: {
    task_id: string;
    repo_path: string;
    base_branch: string;
    branch?: string;
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
  listPaged: async (
    task_id: string,
    opts: { limit: number; offset?: number },
  ): Promise<Attempt[]> =>
    j<Attempt[]>(
      await fetch(
        `/api/attempts?task_id=${encodeURIComponent(task_id)}&limit=${opts.limit}&offset=${opts.offset ?? 0}`,
      ),
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
      await fetchWithTimeout(
        `/api/attempts/${encodeURIComponent(id)}/status`,
        { timeoutMs: 8000 },
      ),
    ),
  push: async (id: string): Promise<Attempt> =>
    j<Attempt>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/push`, {
        method: "POST",
      }),
    ),
  diff: async (
    id: string,
    opts?: { context?: number; worktree?: boolean; renderer?: string },
  ): Promise<{ text: string }> => {
    const sp = new URLSearchParams();
    if (opts?.context != null) sp.set("context", String(opts.context));
    if (opts?.worktree) sp.set("worktree", "1");
    if (opts?.renderer) sp.set("renderer", opts.renderer);
    return j<{ text: string }>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/diff?${sp.toString()}`),
    );
  },
  difit: async (
    id: string,
    opts?: { worktree?: boolean; remote?: string; no_open?: boolean },
  ): Promise<{ started: boolean } & Record<string, unknown>> => {
    const sp = new URLSearchParams();
    if (opts?.worktree) sp.set("worktree", "1");
    if (opts?.remote) sp.set("remote", opts.remote);
    if (opts?.no_open) sp.set("no_open", "1");
    return j<{ started: boolean } & Record<string, unknown>>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/difit?${sp.toString()}`, {
        method: "POST",
      }),
    );
  },
  lock: async (id: string, locked: boolean): Promise<Attempt> =>
    j<Attempt>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked }),
      }),
    ),
  worktreeStatus: async (
    id: string,
  ): Promise<{ path: string; exists: boolean; branch: string; locked: boolean }> =>
    j<{ path: string; exists: boolean; branch: string; locked: boolean }>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/worktree/status`),
    ),
  worktreeRemove: async (id: string, keepBranch = true): Promise<Attempt> =>
    j<Attempt>(
      await fetch(
        `/api/attempts/${encodeURIComponent(id)}/worktree/remove?keep_branch=${keepBranch ? "1" : "0"}`,
        { method: "POST" },
      ),
    ),
  worktreeRecreate: async (id: string): Promise<Attempt> =>
    j<Attempt>(
      await fetch(`/api/attempts/${encodeURIComponent(id)}/worktree/recreate`, { method: "POST" }),
    ),
  gc: async (): Promise<Record<string, string>> =>
    j<Record<string, string>>(
      await fetch(`/api/attempts/gc`, { method: "POST" }),
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

export const ReposAPI = {
  list: async (): Promise<RepoBookmark[]> => j<RepoBookmark[]>(await fetch("/api/repos")),
  create: async (body: { label: string; path: string; default_base_branch?: string }): Promise<RepoBookmark> =>
    j<RepoBookmark>(
      await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),
  update: async (
    id: string,
    patch: Partial<Pick<RepoBookmark, "label" | "path" | "default_base_branch">>,
  ): Promise<RepoBookmark> =>
    j<RepoBookmark>(
      await fetch(`/api/repos/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    ),
  delete: async (id: string): Promise<void> => {
    await fetch(`/api/repos/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
