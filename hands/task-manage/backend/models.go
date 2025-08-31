package main

import (
	"time"
)

type Task struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description,omitempty"`
    Status      string    `json:"status"` // todo | doing | reviewing | done
    Order       int       `json:"order"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type Attempt struct {
    ID          string     `json:"id"`
    TaskID      string     `json:"task_id"`
    RepoPath    string     `json:"repo_path"`
    WorktreePath string    `json:"worktree_path"`
    BaseBranch  string     `json:"base_branch"`
    Branch      string     `json:"branch"`
    Locked      bool       `json:"locked"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
    PRNumber    *int       `json:"pr_number,omitempty"`
    PRURL       *string    `json:"pr_url,omitempty"`
    PRStatus    *string    `json:"pr_status,omitempty"`
	PRMergedAt  *time.Time `json:"pr_merged_at,omitempty"`
	MergeCommit *string    `json:"merge_commit_sha,omitempty"`
}

type BranchStatus struct {
	BaseBranchName        string `json:"base_branch_name"`
	CommitsBehind         int    `json:"commits_behind"`
	CommitsAhead          int    `json:"commits_ahead"`
	RemoteCommitsBehind   *int   `json:"remote_commits_behind"`
	RemoteCommitsAhead    *int   `json:"remote_commits_ahead"`
	HasUncommittedChanges bool   `json:"has_uncommitted_changes"`
}

type execStatus string

const (
	execRunning  execStatus = "running"
	execComplete execStatus = "completed"
	execFailed   execStatus = "failed"
	execKilled   execStatus = "killed"
)

type logLine struct {
	Time    time.Time `json:"time"`
	Stream  string    `json:"stream"` // stdout | stderr | status
	Content string    `json:"content"`
}

type ExecProcess struct {
	ID        string     `json:"id"`
	Profile   string     `json:"profile"`
	Prompt    string     `json:"prompt"`
	Cwd       string     `json:"cwd"`
	Cmd       []string   `json:"cmd"`
	Status    execStatus `json:"status"`
	ExitCode  *int       `json:"exit_code"`
	StartedAt time.Time  `json:"started_at"`
	EndedAt   *time.Time `json:"ended_at"`
	Logs      []logLine  `json:"logs"`
	AttemptID string     `json:"attempt_id"`
}

func (p *ExecProcess) min() *ExecProcess {
	cp := *p
	if len(cp.Logs) > 0 {
		cp.Logs = cp.Logs[max(0, len(cp.Logs)-50):]
	}
	return &cp
}

type profile struct {
	Label   string   `json:"label"`
	Command []string `json:"command"`
}

type apiResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Message string      `json:"message,omitempty"`
}

// RepoBookmark は、ユーザーが保存するリポジトリ（ラベルとパスのペア）
type RepoBookmark struct {
    ID        string    `json:"id"`
    Label     string    `json:"label"`
    Path      string    `json:"path"`
    DefaultBaseBranch string `json:"default_base_branch,omitempty"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
