package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

type execStore struct {
	mu       sync.RWMutex
	procs    map[string]*ExecProcess
	procsCmd map[string]*exec.Cmd
	subs     map[string]map[chan string]struct{}
	baseDir  string
}

func newExecStore(baseDir string) *execStore {
	_ = os.MkdirAll(baseDir, 0o755)
	s := &execStore{procs: map[string]*ExecProcess{}, procsCmd: map[string]*exec.Cmd{}, subs: map[string]map[chan string]struct{}{}, baseDir: baseDir}
	s.loadIndex()
	return s
}

func (s *execStore) get(id string) (*ExecProcess, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.procs[id]
	if !ok {
		return nil, false
	}
	cp := *p
	return &cp, true
}

func (s *execStore) start(profileLabel, prompt, cwd string, pm *profileManager, attemptID string) (*ExecProcess, error) {
	profs := pm.list()
	var prof *profile
	for i := range profs {
		if profs[i].Label == profileLabel {
			prof = &profs[i]
			break
		}
	}
	if prof == nil {
		return nil, fmt.Errorf("unknown profile: %s", profileLabel)
	}

	id := newID()
	now := time.Now()
	cmd, args := buildCommand(*prof, prompt)
	c := exec.Command(cmd, args...)
	c.Dir = cwd
	c.Env = os.Environ()

	stdout, _ := c.StdoutPipe()
	stderr, _ := c.StderrPipe()

	if err := c.Start(); err != nil {
		return nil, err
	}

	p := &ExecProcess{ID: id, Profile: profileLabel, Prompt: prompt, Cwd: cwd, Cmd: append([]string{cmd}, args...), Status: execRunning, StartedAt: now, AttemptID: attemptID}

	s.mu.Lock()
	s.procs[id] = p
	s.procsCmd[id] = c
	s.mu.Unlock()

	go s.pipeLogs(id, "stdout", stdout)
	go s.pipeLogs(id, "stderr", stderr)
	go func() {
		err := c.Wait()
		code := 0
		if err != nil {
			if exitErr, ok := err.(*exec.ExitError); ok {
				code = exitErr.ExitCode()
			} else {
				code = 1
			}
		}
		s.mu.Lock()
		defer s.mu.Unlock()
		end := time.Now()
		p := s.procs[id]
		if p != nil {
			p.EndedAt = &end
			p.ExitCode = &code
			if code == 0 && p.Status == execRunning {
				p.Status = execComplete
			} else if p.Status == execRunning {
				p.Status = execFailed
			}
			s.broadcast(id, sseLine("status", fmt.Sprintf("%s", p.Status)))
		}
	}()

	return p, nil
}

func (s *execStore) kill(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	cmd := s.procsCmd[id]
	p := s.procs[id]
	if cmd == nil || p == nil {
		return os.ErrNotExist
	}
	_ = cmd.Process.Kill()
	now := time.Now()
	p.Status = execKilled
	p.EndedAt = &now
	code := -1
	p.ExitCode = &code
	s.broadcast(id, sseLine("status", "killed"))
	return nil
}

func (s *execStore) pipeLogs(id, stream string, r io.Reader) {
	br := bufio.NewScanner(r)
	br.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for br.Scan() {
		line := br.Text()
		s.mu.Lock()
		if p := s.procs[id]; p != nil {
			p.Logs = append(p.Logs, logLine{Time: time.Now(), Stream: stream, Content: line})
		}
		s.broadcast(id, sseLine(stream, line))
		s.mu.Unlock()
	}
}

func (s *execStore) subscribe(id string) chan string {
	ch := make(chan string, 128)
	s.mu.Lock()
	if s.subs[id] == nil {
		s.subs[id] = map[chan string]struct{}{}
	}
	s.subs[id][ch] = struct{}{}
	s.mu.Unlock()
	return ch
}

func (s *execStore) unsubscribe(id string, ch chan string) {
	s.mu.Lock()
	if subs, ok := s.subs[id]; ok {
		delete(subs, ch)
	}
	s.mu.Unlock()
	close(ch)
}

func (s *execStore) broadcast(id string, line string) {
	if subs, ok := s.subs[id]; ok {
		for ch := range subs {
			select {
			case ch <- line:
			default:
			}
		}
	}
}

func (s *execStore) list() []*ExecProcess {
	s.mu.RLock()
	defer s.mu.RUnlock()
	list := make([]*ExecProcess, 0, len(s.procs))
	for _, p := range s.procs {
		cp := *p
		cp.Logs = nil
		list = append(list, &cp)
	}
	sort.Slice(list, func(i, j int) bool { return list[i].StartedAt.After(list[j].StartedAt) })
	return list
}

func (s *execStore) persistMetaLocked(p *ExecProcess) {
	idx := make(map[string]*ExecProcess, len(s.procs))
	for id, pp := range s.procs {
		cp := *pp
		cp.Logs = nil
		idx[id] = &cp
	}
	path := filepath.Join(s.baseDir, "index.json")
	tmp := path + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		return
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	_ = enc.Encode(idx)
	_ = f.Close()
	_ = os.Rename(tmp, path)
}

func (s *execStore) loadIndex() {
	path := filepath.Join(s.baseDir, "index.json")
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	var idx map[string]*ExecProcess
	if err := json.NewDecoder(f).Decode(&idx); err == nil {
		if idx != nil {
			s.procs = idx
		}
	}
}

func (s *execStore) appendLogLineLocked(id, stream, line string) {
	p := s.procs[id]
	if p == nil {
		return
	}
	path := filepath.Join(s.baseDir, id+".jsonl")
	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return
	}
	defer f.Close()
	rec := logLine{Time: time.Now(), Stream: stream, Content: line}
	b, _ := json.Marshal(rec)
	_, _ = f.Write(b)
	_, _ = f.Write([]byte("\n"))
}

func (s *execStore) streamSSE(w http.ResponseWriter, r *http.Request, id string) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ch := s.subscribe(id)
	defer s.unsubscribe(id, ch)

	if p, ok := s.get(id); ok {
		tail := p.Logs
		if len(tail) > 50 {
			tail = tail[len(tail)-50:]
		}
		for _, l := range tail {
			_, _ = w.Write([]byte(sseLine(l.Stream, l.Content)))
			flusher(w)
		}
		_, _ = w.Write([]byte(sseLine("status", string(p.Status))))
		flusher(w)
	}

	notify := r.Context().Done()
	for {
		select {
		case <-notify:
			return
		case msg := <-ch:
			_, _ = w.Write([]byte(msg))
			flusher(w)
		}
	}
}
