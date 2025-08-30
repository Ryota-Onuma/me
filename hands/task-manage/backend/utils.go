package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"sort"
	"strings"
	"time"
)

func cloneTask(t *Task) *Task {
	c := *t
	return &c
}

func sortTasks(ts []*Task) {
	sort.Slice(ts, func(i, j int) bool {
		si := statusRank(ts[i].Status)
		sj := statusRank(ts[j].Status)
		if si != sj {
			return si < sj
		}
		if ts[i].Order != ts[j].Order {
			return ts[i].Order < ts[j].Order
		}
		return ts[i].CreatedAt.Before(ts[j].CreatedAt)
	})
}

func statusRank(s string) int {
	switch s {
	case "todo":
		return 0
	case "doing":
		return 1
	case "done":
		return 2
	default:
		return 99
	}
}

func newID() string {
	ts := time.Now().UTC().Format("20060102150405")
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return ts + "-" + string(b)
}

func shortID() string {
	id := newID()
	if len(id) > 8 {
		return id[:8]
	}
	return id
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	_ = enc.Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, apiResponse{Success: false, Message: msg})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func runCmd(dir string, name string, args ...string) (string, error) {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	cmd.Env = os.Environ()
	b, err := cmd.CombinedOutput()
	out := string(b)
	if err != nil {
		return out, fmt.Errorf("%v: %s", err, strings.TrimSpace(out))
	}
	return out, nil
}

func buildCommand(p profile, prompt string) (string, []string) {
	switch p.Label {
	case "claude-code":
		args := append([]string{}, p.Command[1:]...)
		args = append(args, "-p", prompt, "--dangerously-skip-permissions")
		return p.Command[0], args
	case "cursor":
		args := append([]string{}, p.Command[1:]...)
		args = append(args, "-p", prompt, "--output-format=stream-json")
		return p.Command[0], args
	case "codex":
		args := append([]string{}, p.Command[1:]...)
		args = append(args, "--json", "-p", prompt)
		return p.Command[0], args
	default:
		args := append([]string{}, p.Command[1:]...)
		args = append(args, prompt)
		return p.Command[0], args
	}
}

func flusher(w http.ResponseWriter) {
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}

func sseLine(event, data string) string {
	data = strings.ReplaceAll(data, "\n", "\\n")
	return "event: " + event + "\n" + "data: " + data + "\n\n"
}
