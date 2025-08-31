package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

func main() {
	rand.Seed(time.Now().UnixNano())

    wd, _ := os.Getwd()
	baseDataDir := filepath.Clean(filepath.Join(wd, "..", "data"))
	_ = os.MkdirAll(baseDataDir, 0o755)
	tasksPath := filepath.Join(baseDataDir, "tasks.json")
	profilesPath := filepath.Join(baseDataDir, "profiles.json")
    attemptsPath := filepath.Join(baseDataDir, "attempts.json")
    worktreesRoot := filepath.Clean(filepath.Join(wd, "..", "worktrees"))
	reposPath := filepath.Join(baseDataDir, "repos.json")
	execsDir := filepath.Join(baseDataDir, "executions")
	_ = os.MkdirAll(execsDir, 0o755)
	webPath := filepath.Clean(filepath.Join(wd, "..", "web"))

	store := newTaskStore(tasksPath)
	profMgr := &profileManager{path: profilesPath}
    attempts := newAttemptStore(attemptsPath, worktreesRoot)
	repos := newRepoStore(reposPath)
	execs := newExecStore(execsDir)

	mux := http.NewServeMux()

    mux.HandleFunc("/api/tasks", handleTasks(store))
    mux.HandleFunc("/api/tasks/", handleTasksWithID(store))
    mux.HandleFunc("/api/attempts", handleAttempts(attempts))
    mux.HandleFunc("/api/attempts/gc", handleAttemptsGC(attempts))
	mux.HandleFunc("/api/attempts/", handleAttemptsWithID(attempts))
	mux.HandleFunc("/api/executions", handleExecutions(execs, profMgr))
	mux.HandleFunc("/api/executions/", handleExecutionsWithID(execs))
	mux.HandleFunc("/api/profiles", handleProfiles(profMgr))
	mux.HandleFunc("/api/repos", handleRepos(repos))
    mux.HandleFunc("/api/repos/", handleReposWithID(repos))
    mux.HandleFunc("/api/admin/migrate_attempts", handleAdmin(execs, attempts))

    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        writeJSON(w, http.StatusOK, apiResponse{Success: true, Data: map[string]string{"status": "ok"}})
    })

    fs := http.FileServer(http.Dir(webPath))
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        p := r.URL.Path
        if p == "/" || p == "/index.html" {
            w.Header().Set("Cache-Control", "no-cache")
        } else if strings.HasPrefix(p, "/assets/") {
            w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
        } else {
            w.Header().Set("Cache-Control", "public, max-age=300")
        }

        cleaned := strings.TrimPrefix(path.Clean(p), "/")
        local := filepath.Join(webPath, cleaned)
        if info, err := os.Stat(local); err == nil && !info.IsDir() {
            fs.ServeHTTP(w, r)
            return
        }

        index := filepath.Join(webPath, "index.html")
        if b, err := os.ReadFile(index); err == nil {
            w.Header().Set("Content-Type", "text/html; charset=utf-8")
            w.Header().Set("Cache-Control", "no-cache")
            w.WriteHeader(http.StatusOK)
            _, _ = w.Write(b)
            return
        }

        w.Header().Set("Content-Type", "text/html; charset=utf-8")
        w.Header().Set("Cache-Control", "no-cache")
        w.WriteHeader(http.StatusOK)
		_, _ = fmt.Fprintf(w, `<!doctype html>
<meta charset="utf-8" />
<title>task-manage</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Inter,\"Helvetica Neue\",Arial,sans-serif;padding:32px;line-height:1.6}code{background:#f5f5f5;padding:2px 4px;border-radius:4px}</style>
<h1>task-manage</h1>
<p>フロントエンドのビルド成果物が見つかりませんでした（<code>%s</code>）。</p>
<ol>
  <li>開発サーバで動かす: <code>cd task-manage && mise run dev</code>（フロントは :5173、API は :8888）</li>
  <li>ビルドして配信: <code>cd task-manage && mise run frontend.build</code> の後、<code>mise run dev.open</code></li>
  <li>環境診断: <code>cd task-manage && mise run doctor</code></li>
  <li>API 直接: <a href="/api/tasks">/api/tasks</a></li>
  <li>ヘルプ: <code>mise run help</code></li>
 </ol>
`, webPath)
	})

    port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = os.Getenv("PORT")
	}
	if port == "" {
		port = "8888"
	}
	addr := ":" + port
	server := &http.Server{
		Addr:    addr,
		Handler: withCORS(mux),
	}

    go func() {
        log.Printf("task-manage listening on %s (web: %s, data: %s)", addr, webPath, baseDataDir)
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
}
