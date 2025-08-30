package main

import (
	"encoding/json"
	"fmt"
	"log"
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
}

func newAttemptStore(path string) *attemptStore {
	s := &attemptStore{all: map[string]*Attempt{}, path: path}
	_ = os.MkdirAll(filepath.Dir(path), 0o755)
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

func (s *attemptStore) createAndInitGit(taskID, profile, repoPath, baseBranch string) (*Attempt, error) {
	if _, err := os.Stat(repoPath); err != nil {
		return nil, fmt.Errorf("repo_path not found: %v", err)
	}
	if strings.TrimSpace(baseBranch) == "" {
		return nil, fmt.Errorf("base_branch is required")
	}
	branch := fmt.Sprintf("feature/%s-%s", shortID(), time.Now().UTC().Format("20060102-150405"))

	if _, err := runCmd(repoPath, "git", "fetch", "--all"); err != nil {
	}
	if _, err := runCmd(repoPath, "git", "checkout", baseBranch); err != nil {
		return nil, fmt.Errorf("git checkout base failed: %v", err)
	}
	if _, err := runCmd(repoPath, "git", "checkout", "-b", branch); err != nil {
		return nil, fmt.Errorf("git create branch failed: %v", err)
	}
	if _, err := runCmd(repoPath, "git", "push", "-u", "origin", branch); err != nil {
		log.Printf("[warn] push failed: %v", err)
	}

	id := newID()
	now := time.Now()
	a := &Attempt{ID: id, TaskID: taskID, Profile: profile, RepoPath: repoPath, BaseBranch: baseBranch, Branch: branch, CreatedAt: now, UpdatedAt: now}
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
	if base == "" {
		base = a.BaseBranch
	}
	if title == "" {
		title = fmt.Sprintf("Task %s (%s)", a.TaskID, a.Branch)
	}

	if _, err := runCmd(a.RepoPath, "git", "rev-parse", "--verify", "origin/"+a.Branch); err != nil {
		return nil, fmt.Errorf("branch not pushed to origin; please push before creating PR")
	}
	out, err := runCmd(a.RepoPath, "gh", "pr", "create", "-B", base, "-H", a.Branch, "-t", title, "-b", body, "--json", "number,url,state,mergedAt,mergeCommit")
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

func (s *attemptStore) branchStatus(id string) (*BranchStatus, error) {
	s.mu.RLock()
	a := s.all[id]
	s.mu.RUnlock()
	if a == nil {
		return nil, os.ErrNotExist
	}

	_, _ = runCmd(a.RepoPath, "git", "fetch", "--all")

	out, err := runCmd(a.RepoPath, "git", "rev-list", "--left-right", "--count", a.BaseBranch+"..."+a.Branch)
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
	if _, err := runCmd(a.RepoPath, "git", "rev-parse", "--verify", "origin/"+a.Branch); err == nil {
		out2, err2 := runCmd(a.RepoPath, "git", "rev-list", "--left-right", "--count", "origin/"+a.Branch+"..."+a.Branch)
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

	out3, _ := runCmd(a.RepoPath, "git", "status", "--porcelain")
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
	if _, err := runCmd(a.RepoPath, "git", "push", "-u", "origin", a.Branch); err != nil {
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
