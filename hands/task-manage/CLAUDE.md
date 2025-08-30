# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a full-stack Kanban-style task management application with Git workflow integration:

- **Backend**: Go server (`backend/`) using only standard library, JSON file persistence
- **Frontend**: React + TypeScript + Vite (`frontend/`), builds to `web/` for Go server distribution
- **Data**: JSON files in `data/` directory (tasks, attempts, profiles, executions)
- **Core Domain**: Tasks, Attempts (Git branches), Executions (agent runs), Profiles (agent configs)

### Key Architecture Concepts

- **Tasks**: Kanban items with status lifecycle (todo → doing → done)
- **Attempts**: Work sessions tied to Git feature branches created from base branches
- **Executions**: Single agent runs with streaming logs via SSE, can be linked to attempts
- **Profiles**: Agent launch configurations (command + flags) stored in `profiles.json`

## Common Development Commands

### Backend Development

```bash
cd backend
go run .                    # Start server on :8888
```

### Frontend Development

```bash
cd frontend
npm install                 # Install dependencies
npm run dev                # Dev server with API proxy to :8888
npm run build              # Build to ../web/ for Go server
```

### With mise (recommended)

```bash
mise run dev               # Start backend + frontend servers and open browser
mise run frontend.dev      # Frontend dev server only
mise run frontend.build    # Build frontend
mise run fmt               # Format Go + Frontend
mise run lint              # Lint check
mise run test              # Run tests
mise run check             # Full check suite
```

## API Structure

- **REST API**: `/api/*` endpoints serving JSON
- **SSE Streaming**: `/api/executions/{id}/stream` for real-time logs
- **Static Files**: Go server serves built frontend from `web/`
- **Git Operations**: Uses `git` and `gh` CLI for branch/PR management

## Key Data Flow

1. Tasks created via UI → JSON persistence
2. Attempts create Git feature branches (always `feature/` prefixed)
3. Executions run coding agents with streaming output
4. Branch status tracking (ahead/behind vs base and remote)
5. PR creation via GitHub CLI integration

## Important Constraints

- Feature branches always prefixed with `feature/`
- Explicit push operations (no auto-push)
- Base branch required per attempt
- Agent executions can be linked to attempts via `attempt_id`
- Server expects `git` and `gh` CLI tools for Git operations

@./UBIQUITOUS_LANGUAGE.md
