package main

import (
    "context"
    "log"
    "math/rand"
    "net/http"
    "os"
    "os/signal"
    "path/filepath"
    "strings"
    "syscall"
    "time"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	// Resolve paths relative to backend/
	wd, _ := os.Getwd()
	baseDataDir := filepath.Clean(filepath.Join(wd, "..", "data"))
	_ = os.MkdirAll(baseDataDir, 0o755)
	tasksPath := filepath.Join(baseDataDir, "tasks.json")
	profilesPath := filepath.Join(baseDataDir, "profiles.json")
	attemptsPath := filepath.Join(baseDataDir, "attempts.json")
	execsDir := filepath.Join(baseDataDir, "executions")
	_ = os.MkdirAll(execsDir, 0o755)
	webPath := filepath.Clean(filepath.Join(wd, "..", "web"))

	store := newTaskStore(tasksPath)
	profMgr := &profileManager{path: profilesPath}
	attempts := newAttemptStore(attemptsPath)
	execs := newExecStore(execsDir)

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/tasks", handleTasks(store))
	mux.HandleFunc("/api/tasks/", handleTasksWithID(store))
	mux.HandleFunc("/api/attempts", handleAttempts(attempts))
	mux.HandleFunc("/api/attempts/", handleAttemptsWithID(attempts))
	mux.HandleFunc("/api/executions", handleExecutions(execs, profMgr))
	mux.HandleFunc("/api/executions/", handleExecutionsWithID(execs))
	mux.HandleFunc("/api/profiles", handleProfiles(profMgr))

	// Static web UI with cache headers
	fs := http.FileServer(http.Dir(webPath))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		p := r.URL.Path
		if p == "/" || p == "/index.html" {
			// Ensure the shell HTML is always revalidated
			w.Header().Set("Cache-Control", "no-cache")
		} else if strings.HasPrefix(p, "/assets/") {
			// Fingerprinted assets from Vite; safe to cache long
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			// Other files (images, etc.) get a modest cache
			w.Header().Set("Cache-Control", "public, max-age=300")
		}
		fs.ServeHTTP(w, r)
	})

	addr := ":8888"
	server := &http.Server{
		Addr:    addr,
		Handler: withCORS(mux),
	}

	// Start server in a goroutine
	go func() {
		log.Printf("task-manage listening on %s (web: %s, data: %s)", addr, webPath, baseDataDir)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests a deadline to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
}
