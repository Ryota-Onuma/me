export type Status = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ExecProcess {
  id: string;
  profile: string;
  prompt: string;
  cwd: string;
  cmd: string[];
  status: "running" | "completed" | "failed" | "killed";
  exit_code?: number;
  started_at: string;
  ended_at?: string;
  attempt_id?: string;
}

export interface Attempt {
  id: string;
  task_id: string;
  profile: string;
  repo_path: string;
  base_branch: string;
  branch: string;
  pr_number?: number;
  pr_url?: string;
  pr_status?: string;
  created_at: string;
  updated_at: string;
}

export interface BranchStatus {
  base_branch_name: string;
  commits_behind: number;
  commits_ahead: number;
  remote_commits_behind?: number;
  remote_commits_ahead?: number;
  has_uncommitted_changes: boolean;
}

export interface ProfileDef {
  label: string;
  command: string[];
}

export interface RepoBookmark {
  id: string;
  label: string;
  path: string;
  default_base_branch?: string;
  created_at: string;
  updated_at: string;
}
