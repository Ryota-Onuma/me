package main

import (
    "encoding/json"
    "errors"
    "log"
    "os"
    "path/filepath"
    "sync"
    "time"
)

type taskStore struct {
	mu       sync.RWMutex
	tasks    map[string]*Task
	dataPath string
}

func newTaskStore(dataPath string) *taskStore {
	s := &taskStore{
		tasks:    map[string]*Task{},
		dataPath: dataPath,
	}
	_ = os.MkdirAll(filepath.Dir(dataPath), 0o755)
	if err := s.load(); err != nil {
		log.Printf("[warn] could not load tasks: %v", err)
	}
	return s
}

func (s *taskStore) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	f, err := os.Open(s.dataPath)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	defer f.Close()

	var list []*Task
	if err := json.NewDecoder(f).Decode(&list); err != nil {
		return err
	}
	for _, t := range list {
		s.tasks[t.ID] = t
	}
	return nil
}

func (s *taskStore) persistLocked() error {
	tmp := s.dataPath + ".tmp"
	list := make([]*Task, 0, len(s.tasks))
	for _, t := range s.tasks {
		list = append(list, t)
	}
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(list); err != nil {
		f.Close()
		_ = os.Remove(tmp)
		return err
	}
	if err := f.Close(); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return os.Rename(tmp, s.dataPath)
}

func (s *taskStore) list() []*Task {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*Task, 0, len(s.tasks))
	for _, t := range s.tasks {
		out = append(out, cloneTask(t))
	}
	sortTasks(out)
	return out
}

func (s *taskStore) create(title, desc, status string) *Task {
    s.mu.Lock()
    defer s.mu.Unlock()
    if status == "" {
        status = "todo"
    }
    id := newID()
    now := time.Now()
    order := s.nextOrderLocked(status)
    t := &Task{ID: id, Title: title, Description: desc, Status: status, Order: order, CreatedAt: now, UpdatedAt: now}
    s.tasks[id] = t
    _ = s.persistLocked()
    return cloneTask(t)
}

func (s *taskStore) nextOrderLocked(status string) int {
	max := -1
	for _, t := range s.tasks {
		if t.Status == status && t.Order > max {
			max = t.Order
		}
	}
	return max + 1
}

func (s *taskStore) get(id string) (*Task, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	t, ok := s.tasks[id]
	if !ok {
		return nil, false
	}
	return cloneTask(t), true
}

func (s *taskStore) update(id string, title, desc, status *string) (*Task, error) {
    s.mu.Lock()
    defer s.mu.Unlock()
    t, ok := s.tasks[id]
	if !ok {
		return nil, os.ErrNotExist
	}

	if title != nil {
		t.Title = *title
	}
	if desc != nil {
		t.Description = *desc
	}
    if status != nil && *status != t.Status {
        t.Status = *status
        t.Order = s.nextOrderLocked(t.Status)
    }
    t.UpdatedAt = time.Now()
    if err := s.persistLocked(); err != nil {
        return nil, err
    }
    return cloneTask(t), nil
}

func (s *taskStore) delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.tasks[id]; !ok {
		return os.ErrNotExist
	}
	delete(s.tasks, id)
	return s.persistLocked()
}

func (s *taskStore) move(id, toStatus string, toIndex int) (*Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.tasks[id]
	if !ok {
		return nil, os.ErrNotExist
	}

	column := make([]*Task, 0, len(s.tasks))
	for _, x := range s.tasks {
		if x.Status == toStatus && x.ID != id {
			column = append(column, x)
		}
	}
	sortTasks(column)

	if toIndex < 0 {
		toIndex = 0
	}
	if toIndex > len(column) {
		toIndex = len(column)
	}

	column = append(column, nil)
	copy(column[toIndex+1:], column[toIndex:])
	column[toIndex] = t

	for i, x := range column {
		x.Status = toStatus
		x.Order = i
		x.UpdatedAt = time.Now()
	}

	if err := s.persistLocked(); err != nil {
		return nil, err
	}
	return cloneTask(t), nil
}

// Tag機能は廃止
