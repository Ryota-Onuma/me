package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

func handleTasks(store *taskStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			list := store.list()
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: list})
		case http.MethodPost:
			var body struct {
				Title       string `json:"title"`
				Description string `json:"description"`
				Status      string `json:"status"`
			}
			if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
				writeError(w, http.StatusBadRequest, "invalid JSON body")
				return
			}
			if strings.TrimSpace(body.Title) == "" {
				writeError(w, http.StatusBadRequest, "title is required")
				return
			}
			t := store.create(strings.TrimSpace(body.Title), strings.TrimSpace(body.Description), strings.TrimSpace(body.Status))
			writeJSON(w, http.StatusCreated, apiResponse{Success: true, Data: t})
		default:
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	}
}

func handleTasksWithID(store *taskStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/tasks/")
		parts := strings.Split(path, "/")
		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusBadRequest, "missing task id")
			return
		}
		id := parts[0]

		if len(parts) >= 2 && parts[1] == "move" {
			if r.Method != http.MethodPost {
				writeError(w, http.StatusMethodNotAllowed, "method not allowed")
				return
			}
			var body struct {
				ToStatus string `json:"to_status"`
				ToIndex  int    `json:"to_index"`
			}
			if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
				writeError(w, http.StatusBadRequest, "invalid JSON body")
				return
			}
			if body.ToStatus == "" {
				writeError(w, http.StatusBadRequest, "to_status is required")
				return
			}
			t, err := store.move(id, body.ToStatus, body.ToIndex)
			if err != nil {
				writeError(w, http.StatusNotFound, "task not found")
				return
			}
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: t})
			return
		}

		switch r.Method {
		case http.MethodGet:
			if t, ok := store.get(id); ok {
				writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: t})
			} else {
				writeError(w, http.StatusNotFound, "task not found")
			}
		case http.MethodPatch:
			var body map[string]interface{}
			if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
				writeError(w, http.StatusBadRequest, "invalid JSON body")
				return
			}
			var titlePtr, descPtr, statusPtr *string
			if v, ok := body["title"].(string); ok {
				v = strings.TrimSpace(v)
				titlePtr = &v
			}
			if v, ok := body["description"].(string); ok {
				descPtr = &v
			}
			if v, ok := body["status"].(string); ok {
				v = strings.TrimSpace(v)
				statusPtr = &v
			}
			t, err := store.update(id, titlePtr, descPtr, statusPtr)
			if err != nil {
				writeError(w, http.StatusNotFound, "task not found")
				return
			}
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: t})
		case http.MethodDelete:
			if err := store.delete(id); err != nil {
				writeError(w, http.StatusNotFound, "task not found")
				return
			}
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: map[string]any{"id": id}})
		default:
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	}
}

func handleAttempts(attempts *attemptStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			taskID := r.URL.Query().Get("task_id")
			list := attempts.list(taskID)
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: list})
		case http.MethodPost:
			var body struct {
				TaskID     string `json:"task_id"`
				Profile    string `json:"profile"`
				RepoPath   string `json:"repo_path"`
				BaseBranch string `json:"base_branch"`
			}
			if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
				writeError(w, http.StatusBadRequest, "invalid JSON body")
				return
			}
			if body.TaskID == "" || body.Profile == "" || body.RepoPath == "" || strings.TrimSpace(body.BaseBranch) == "" {
				writeError(w, http.StatusBadRequest, "task_id, profile, repo_path, base_branch are required")
				return
			}
			at, err := attempts.createAndInitGit(body.TaskID, body.Profile, body.RepoPath, body.BaseBranch)
			if err != nil {
				writeError(w, http.StatusBadRequest, err.Error())
				return
			}
			writeJSON(w, http.StatusCreated, apiResponse{Success: true, Data: at})
		default:
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	}
}

func handleAttemptsWithID(attempts *attemptStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/attempts/")
		parts := strings.Split(path, "/")
		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusBadRequest, "missing attempt id")
			return
		}
		id := parts[0]

		if len(parts) >= 2 && parts[1] == "push" {
			if r.Method != http.MethodPost {
				writeError(w, http.StatusMethodNotAllowed, "method not allowed")
				return
			}
			a, err := attempts.push(id)
			if err != nil {
				writeError(w, http.StatusBadRequest, err.Error())
				return
			}
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: a})
			return
		}

		if len(parts) >= 2 && parts[1] == "status" {
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "method not allowed")
				return
			}
			st, err := attempts.branchStatus(id)
			if err != nil {
				writeError(w, http.StatusBadRequest, err.Error())
				return
			}
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: st})
			return
		}

		if len(parts) >= 2 && parts[1] == "pr" {
			if r.Method != http.MethodPost {
				writeError(w, http.StatusMethodNotAllowed, "method not allowed")
				return
			}
			var body struct {
				Title string `json:"title"`
				Body  string `json:"body"`
				Base  string `json:"base_branch"`
			}
			if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
				writeError(w, http.StatusBadRequest, "invalid JSON body")
				return
			}
			pr, err := attempts.createPR(id, body.Title, body.Body, body.Base)
			if err != nil {
				writeError(w, http.StatusBadRequest, err.Error())
				return
			}
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: pr})
			return
		}

		if r.Method == http.MethodGet {
			if a, ok := attempts.get(id); ok {
				writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: a})
			} else {
				writeError(w, http.StatusNotFound, "attempt not found")
			}
			return
		}
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleExecutions(execs *execStore, profMgr *profileManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: execs.list()})
			return
		case http.MethodPost:
			var body struct {
				Profile string `json:"profile"`
				Prompt  string `json:"prompt"`
				Cwd     string `json:"cwd"`
				Attempt string `json:"attempt_id"`
			}
			if err := json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&body); err != nil {
				writeError(w, http.StatusBadRequest, "invalid JSON body")
				return
			}
			if strings.TrimSpace(body.Profile) == "" {
				writeError(w, http.StatusBadRequest, "profile is required")
				return
			}
			if strings.TrimSpace(body.Prompt) == "" {
				writeError(w, http.StatusBadRequest, "prompt is required")
				return
			}
			if body.Cwd == "" {
				body.Cwd = "."
			}
			proc, err := execs.start(body.Profile, body.Prompt, body.Cwd, profMgr, body.Attempt)
			if err != nil {
				writeError(w, http.StatusBadRequest, err.Error())
				return
			}
			writeJSON(w, http.StatusCreated, apiResponse{Success: true, Data: proc.min()})
			return
		default:
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	}
}

func handleExecutionsWithID(execs *execStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/executions/")
		parts := strings.Split(path, "/")
		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusBadRequest, "missing execution id")
			return
		}
		id := parts[0]

		if len(parts) >= 2 && parts[1] == "stream" {
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "method not allowed")
				return
			}
			execs.streamSSE(w, r, id)
			return
		}

		if len(parts) >= 2 && parts[1] == "kill" {
			if r.Method != http.MethodPost {
				writeError(w, http.StatusMethodNotAllowed, "method not allowed")
				return
			}
			if err := execs.kill(id); err != nil {
				writeError(w, http.StatusNotFound, err.Error())
				return
			}
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: map[string]any{"id": id}})
			return
		}

		switch r.Method {
		case http.MethodGet:
			if p, ok := execs.get(id); ok {
				writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: p})
			} else {
				writeError(w, http.StatusNotFound, "execution not found")
			}
		default:
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	}
}

func handleProfiles(profMgr *profileManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: profMgr.list()})
		case http.MethodPut:
			var ps []profile
			if err := json.NewDecoder(io.LimitReader(r.Body, 2<<20)).Decode(&ps); err != nil {
				writeError(w, http.StatusBadRequest, "invalid JSON body")
				return
			}
			if err := profMgr.save(ps); err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
			writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: profMgr.list()})
		default:
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	}
}
