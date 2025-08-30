package main

import (
    "encoding/json"
    "errors"
    "os"
    "path/filepath"
    "sort"
    "strings"
    "sync"
    "time"
)

type repoStore struct {
    mu   sync.RWMutex
    all  map[string]*RepoBookmark
    path string
}

func newRepoStore(path string) *repoStore {
    s := &repoStore{all: map[string]*RepoBookmark{}, path: path}
    _ = os.MkdirAll(filepath.Dir(path), 0o755)
    s.load()
    return s
}

func (s *repoStore) load() {
    s.mu.Lock()
    defer s.mu.Unlock()
    f, err := os.Open(s.path)
    if err != nil {
        return
    }
    defer f.Close()
    var list []*RepoBookmark
    if err := json.NewDecoder(f).Decode(&list); err != nil {
        return
    }
    for _, r := range list {
        s.all[r.ID] = r
    }
}

func (s *repoStore) persistLocked() {
    tmp := s.path + ".tmp"
    f, err := os.Create(tmp)
    if err != nil {
        return
    }
    enc := json.NewEncoder(f)
    enc.SetIndent("", "  ")
    list := make([]*RepoBookmark, 0, len(s.all))
    for _, r := range s.all {
        list = append(list, r)
    }
    sort.Slice(list, func(i, j int) bool { return list[i].CreatedAt.After(list[j].CreatedAt) })
    _ = enc.Encode(list)
    _ = f.Close()
    _ = os.Rename(tmp, s.path)
}

func (s *repoStore) list() []*RepoBookmark {
    s.mu.RLock()
    defer s.mu.RUnlock()
    out := make([]*RepoBookmark, 0, len(s.all))
    for _, r := range s.all {
        cp := *r
        out = append(out, &cp)
    }
    sort.Slice(out, func(i, j int) bool { return out[i].UpdatedAt.After(out[j].UpdatedAt) })
    return out
}

func (s *repoStore) get(id string) (*RepoBookmark, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    r, ok := s.all[id]
    if !ok {
        return nil, false
    }
    cp := *r
    return &cp, true
}

func (s *repoStore) create(label, p, defBase string) (*RepoBookmark, error) {
    label = strings.TrimSpace(label)
    p = strings.TrimSpace(p)
    if label == "" || p == "" {
        return nil, errors.New("label and path are required")
    }
    if _, err := os.Stat(p); err != nil {
        return nil, errors.New("path not found or inaccessible")
    }
    s.mu.Lock()
    defer s.mu.Unlock()
    // 重複チェック（ラベル/パス）
    for _, r := range s.all {
        if strings.EqualFold(r.Label, label) {
            return nil, errors.New("label already exists")
        }
        if filepath.Clean(r.Path) == filepath.Clean(p) {
            return nil, errors.New("path already registered")
        }
    }
    now := time.Now()
    rb := &RepoBookmark{ID: newID(), Label: label, Path: p, DefaultBaseBranch: strings.TrimSpace(defBase), CreatedAt: now, UpdatedAt: now}
    s.all[rb.ID] = rb
    s.persistLocked()
    cp := *rb
    return &cp, nil
}

func (s *repoStore) update(id string, label, p, defBase *string) (*RepoBookmark, error) {
    s.mu.Lock()
    defer s.mu.Unlock()
    r := s.all[id]
    if r == nil {
        return nil, os.ErrNotExist
    }
    newLabel := r.Label
    newPath := r.Path
    newDefBase := r.DefaultBaseBranch
    if label != nil {
        if strings.TrimSpace(*label) == "" {
            return nil, errors.New("label cannot be empty")
        }
        newLabel = strings.TrimSpace(*label)
    }
    if p != nil {
        if strings.TrimSpace(*p) == "" {
            return nil, errors.New("path cannot be empty")
        }
        if _, err := os.Stat(*p); err != nil {
            return nil, errors.New("path not found or inaccessible")
        }
        newPath = strings.TrimSpace(*p)
    }
    if defBase != nil {
        newDefBase = strings.TrimSpace(*defBase) // 空文字ならクリア
    }
    // 重複チェック
    for _, x := range s.all {
        if x.ID == id {
            continue
        }
        if strings.EqualFold(x.Label, newLabel) {
            return nil, errors.New("label already exists")
        }
        if filepath.Clean(x.Path) == filepath.Clean(newPath) {
            return nil, errors.New("path already registered")
        }
    }
    r.Label = newLabel
    r.Path = newPath
    r.DefaultBaseBranch = newDefBase
    r.UpdatedAt = time.Now()
    s.persistLocked()
    cp := *r
    return &cp, nil
}

func (s *repoStore) delete(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    if _, ok := s.all[id]; !ok {
        return os.ErrNotExist
    }
    delete(s.all, id)
    s.persistLocked()
    return nil
}
