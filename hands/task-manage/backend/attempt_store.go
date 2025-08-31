package main

import (
    "encoding/json"
    "fmt"
    "os"
    "path/filepath"
    "sort"
    "strings"
    "sync"
    "time"
)

type attemptStore struct {
    mu   sync.RWMutex
    all  map[string]*Attempt
    path string
    wtRoot string
}

func newAttemptStore(path string, wtRoot string) *attemptStore {
    s := &attemptStore{all: map[string]*Attempt{}, path: path, wtRoot: wtRoot}
    _ = os.MkdirAll(filepath.Dir(path), 0o755)
    if wtRoot != "" {
        _ = os.MkdirAll(wtRoot, 0o755)
    }
    s.load()
    return s
}

func (s *attemptStore) load() {
	s.mu.Lock()
	defer s.mu.Unlock()
	f, err := os.Open(s.path)
	if err != nil {
		return
	}
	defer f.Close()
	var list []*Attempt
	if err := json.NewDecoder(f).Decode(&list); err != nil {
		return
	}
	for _, a := range list {
		s.all[a.ID] = a
	}
}

func (s *attemptStore) persistLocked() {
	tmp := s.path + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		return
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	list := make([]*Attempt, 0, len(s.all))
	for _, a := range s.all {
		list = append(list, a)
	}
	_ = enc.Encode(list)
	_ = f.Close()
	_ = os.Rename(tmp, s.path)
}

func (s *attemptStore) list(taskID string) []*Attempt {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*Attempt, 0)
	for _, a := range s.all {
		if taskID == "" || a.TaskID == taskID {
			cp := *a
			out = append(out, &cp)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	return out
}

func (s *attemptStore) gc() map[string]string {
    s.mu.RLock()
    paths := make(map[string]struct{})
    for _, a := range s.all { paths[a.RepoPath] = struct{}{} }
    s.mu.RUnlock()
    out := map[string]string{}
    for p := range paths {
        if strings.TrimSpace(p) == "" { continue }
        msg, err := runCmd(p, "git", "worktree", "prune")
        if err != nil { out[p] = err.Error() } else { out[p] = strings.TrimSpace(msg) }
    }
    return out
}

func (s *attemptStore) get(id string) (*Attempt, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	a, ok := s.all[id]
	if !ok {
		return nil, false
	}
	cp := *a
	return &cp, true
}

func (s *attemptStore) createAndInitGit(taskID, repoPath, baseBranch, branchInput string) (*Attempt, error) {
    if _, err := os.Stat(repoPath); err != nil {
        return nil, fmt.Errorf("repo_path not found: %v", err)
    }
    if strings.TrimSpace(baseBranch) == "" {
        return nil, fmt.Errorf("base_branch is required")
    }
    // 決定ルール: 入力があればそれを使用。なければ従来の自動生成。
    branch := strings.TrimSpace(branchInput)
    if branch != "" {
        if err := validateGitBranchName(branch); err != nil {
            return nil, fmt.Errorf("invalid branch name: %v", err)
        }
    } else {
        branch = fmt.Sprintf("feature/%s-%s", shortID(), time.Now().UTC().Format("20060102-150405"))
    }

    if _, err := runCmd(repoPath, "git", "rev-parse", "--git-dir"); err != nil {
        return nil, fmt.Errorf("not a git repository: %v", err)
    }
    _, _ = runCmd(repoPath, "git", "fetch", "--all")
    id := newID()
    wtPath := filepath.Join(s.wtRoot, id)
    if err := os.MkdirAll(s.wtRoot, 0o755); err != nil {
        return nil, fmt.Errorf("failed to prepare worktrees dir: %v", err)
    }
    if _, err := runCmd(repoPath, "git", "rev-parse", "--verify", branch); err == nil {
        if _, err := runCmd(repoPath, "git", "worktree", "add", wtPath, branch); err != nil {
            return nil, fmt.Errorf("git worktree add failed: %v", err)
        }
    } else {
        if _, err := runCmd(repoPath, "git", "worktree", "add", "-b", branch, wtPath, baseBranch); err != nil {
            return nil, fmt.Errorf("git worktree add -b failed: %v", err)
        }
    }

    now := time.Now()
    a := &Attempt{ID: id, TaskID: taskID, RepoPath: repoPath, WorktreePath: wtPath, BaseBranch: baseBranch, Branch: branch, CreatedAt: now, UpdatedAt: now}
    s.mu.Lock()
    s.all[id] = a
    s.persistLocked()
    s.mu.Unlock()
    a2, _ := s.get(id)
    return a2, nil
}

func (s *attemptStore) createPR(id, title, body, base string) (*Attempt, error) {
    s.mu.RLock()
    a := s.all[id]
    s.mu.RUnlock()
    if a == nil {
        return nil, os.ErrNotExist
    }
    if a.Locked {
        return nil, fmt.Errorf("attempt is locked")
    }
    if base == "" {
        base = a.BaseBranch
    }
    if title == "" {
        title = fmt.Sprintf("Task %s (%s)", a.TaskID, a.Branch)
    }

    dir := a.WorktreePath
    if dir == "" { dir = a.RepoPath }
    if _, err := runCmd(dir, "git", "rev-parse", "--verify", "origin/"+a.Branch); err != nil {
        return nil, fmt.Errorf("branch not pushed to origin; please push before creating PR")
    }
    if strings.TrimSpace(body) == "" {
        if tpl, ok := prTemplate(dir); ok {
            body = tpl
        } else {
            body = defaultPRBody(a)
        }
    }
    out, err := runCmd(dir, "gh", "pr", "create", "-B", base, "-H", a.Branch, "-t", title, "-b", body, "--json", "number,url,state,mergedAt,mergeCommit")
	if err != nil {
		return nil, fmt.Errorf("gh pr create failed: %v", err)
	}

	var pr struct {
		Number      int        `json:"number"`
		URL         string     `json:"url"`
		State       string     `json:"state"`
		MergedAt    *time.Time `json:"mergedAt"`
		MergeCommit *string    `json:"mergeCommit"`
	}
	if err := json.Unmarshal([]byte(out), &pr); err != nil {
		return nil, fmt.Errorf("failed to parse gh output: %v", err)
	}
    s.mu.Lock()
    a = s.all[id]
    if a != nil {
        a.PRNumber = &pr.Number
        a.PRURL = &pr.URL
        a.PRStatus = &pr.State
        a.PRMergedAt = pr.MergedAt
        a.MergeCommit = pr.MergeCommit
        a.UpdatedAt = time.Now()
        s.persistLocked()
    }
    s.mu.Unlock()
    a2, _ := s.get(id)
    return a2, nil
}

func prTemplate(dir string) (string, bool) {
    candidates := []string{
        ".github/PULL_REQUEST_TEMPLATE.md",
        "PULL_REQUEST_TEMPLATE.md",
        "docs/PULL_REQUEST_TEMPLATE.md",
    }
    for _, p := range candidates {
        b, err := os.ReadFile(filepath.Join(dir, p))
        if err == nil && len(b) > 0 {
            return string(b), true
        }
    }
    return "", false
}

func defaultPRBody(a *Attempt) string {
    return "# 概要\n\n- 変更内容を記載してください\n\n## チェックリスト\n- [ ] 動作確認\n- [ ] テスト\n- [ ] ドキュメント\n"
}

func (s *attemptStore) branchStatus(id string) (*BranchStatus, error) {
	s.mu.RLock()
	a := s.all[id]
	s.mu.RUnlock()
	if a == nil {
		return nil, os.ErrNotExist
	}

    repoDir := a.WorktreePath
    if repoDir == "" { // fallback for legacy records
        repoDir = a.RepoPath
    }
    _, _ = runCmd(repoDir, "git", "fetch", "--all")

    out, err := runCmd(repoDir, "git", "rev-list", "--left-right", "--count", a.BaseBranch+"...HEAD")
    if err != nil {
        return nil, fmt.Errorf("rev-list failed: %v", err)
    }
	parts := strings.Fields(strings.TrimSpace(out))
	lb, la := 0, 0
	if len(parts) >= 2 {
		fmt.Sscanf(parts[0], "%d", &lb)
		fmt.Sscanf(parts[1], "%d", &la)
	}

    var rBehindPtr, rAheadPtr *int
    if _, err := runCmd(repoDir, "git", "rev-parse", "--verify", "origin/"+a.Branch); err == nil {
        out2, err2 := runCmd(repoDir, "git", "rev-list", "--left-right", "--count", "origin/"+a.Branch+"...HEAD")
        if err2 == nil {
            p2 := strings.Fields(strings.TrimSpace(out2))
            if len(p2) >= 2 {
                rb, ra := 0, 0
                fmt.Sscanf(p2[0], "%d", &rb)
                fmt.Sscanf(p2[1], "%d", &ra)
                rBehindPtr, rAheadPtr = &rb, &ra
            }
        }
    }

    out3, _ := runCmd(repoDir, "git", "status", "--porcelain")
    hasChanges := strings.TrimSpace(out3) != ""

	st := &BranchStatus{
		BaseBranchName:        a.BaseBranch,
		CommitsBehind:         lb,
		CommitsAhead:          la,
		RemoteCommitsBehind:   rBehindPtr,
		RemoteCommitsAhead:    rAheadPtr,
		HasUncommittedChanges: hasChanges,
	}
	return st, nil
}

func (s *attemptStore) push(id string) (*Attempt, error) {
    s.mu.RLock()
    a := s.all[id]
    s.mu.RUnlock()
    if a == nil {
        return nil, os.ErrNotExist
    }
    if a.Locked {
        return nil, fmt.Errorf("attempt is locked")
    }
    dir := a.WorktreePath
    if dir == "" { dir = a.RepoPath }
    if _, err := runCmd(dir, "git", "push", "-u", "origin", a.Branch); err != nil {
        return nil, err
    }
    s.mu.Lock()
    if a2 := s.all[id]; a2 != nil {
        a2.UpdatedAt = time.Now()
        s.persistLocked()
    }
    s.mu.Unlock()
    a3, _ := s.get(id)
    return a3, nil
}

// diff returns unified diff text between base and branch. If includeWorktree is true,
// it appends working tree changes (relative to HEAD) after the committed diff.
func (s *attemptStore) diff(id string, context int, includeWorktree bool, renderer string) (string, error) {
    s.mu.RLock()
    a := s.all[id]
    s.mu.RUnlock()
    if a == nil {
        return "", os.ErrNotExist
    }
    if a.Locked {
        // diffはロック中でも許可
    }
    if context < 0 {
        context = 0
    }
    if context > 100 {
        context = 100
    }
    dir := a.WorktreePath
    if dir == "" { dir = a.RepoPath }
    _, _ = runCmd(dir, "git", "fetch", "--all")
    // committed changes vs merge-base
    var committed string
    var err error
    committed, err = runCmd(dir, "git", "diff", "--no-color", fmt.Sprintf("-U%d", context), a.BaseBranch+"...HEAD")
    if err != nil {
        // still return whatever was captured (runCmd returns combined output on error)
        // but annotate
        committed = "" + strings.TrimSpace(committed)
    }
    out := strings.TrimSuffix(committed, "\n")
    if includeWorktree {
        // Worktree changes vs HEAD (on current checkout). Avoid checkout; take only if repo HEAD matches attempt branch.
        headBranch, _ := runCmd(dir, "git", "rev-parse", "--abbrev-ref", "HEAD")
        headBranch = strings.TrimSpace(headBranch)
        if headBranch == a.Branch {
            wt, _ := runCmd(dir, "git", "diff", "--no-color", fmt.Sprintf("-U%d", context))
            wt = strings.TrimSuffix(wt, "\n")
            if strings.TrimSpace(wt) != "" {
                if out != "" {
                    out += "\n\n"
                }
                out += "### Uncommitted changes (worktree) ###\n" + wt
            }
        } else {
            if out != "" {
                out += "\n\n"
            }
            out += fmt.Sprintf("(info) worktree diff omitted: current HEAD is %q, attempt branch is %q", headBranch, a.Branch)
        }
    }
    if strings.TrimSpace(out) == "" {
        out = "(no diff)"
    }
    return out, nil
}
