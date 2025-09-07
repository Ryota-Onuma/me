# CodingAgentOperator

A full-featured web-based Claude Code client that provides complete interactive functionality for managing Claude Code projects. Start new conversations, resume existing sessions, monitor running tasks in real-time, and browse your conversation history - all through a modern web interface.



## Overview

CodingAgentOperator has evolved from a simple conversation viewer into a comprehensive web-based Claude Code client. It provides all essential Claude Code functionality through an intuitive web interface, including creating new sessions, resuming conversations, real-time task management, and live synchronization with your local Claude Code projects.

The application leverages Server-Sent Events (SSE) for real-time bidirectional communication, automatically syncing with JSONL conversation files in `~/.claude/projects/` and providing instant updates as conversations progress.

## Features

### Interactive Claude Code Client

- **New Chat Creation** - Start new Claude sessions directly from the web interface
- **Session Resumption** - Continue paused Claude conversations with full context
- **Real-time Task Management** - Monitor, control, and abort running Claude tasks
- **Command Autocompletion** - Smart completion for both global and project-specific Claude commands
- **Live Status Indicators** - Visual feedback for running, paused, and completed tasks

### Real-time Synchronization

- **Server-Sent Events (SSE)** - Instant bidirectional communication and updates
- **File System Monitoring** - Automatic detection of conversation file changes
- **Live Task Updates** - Real-time progress tracking for active Claude sessions
- **Auto-refresh UI** - Instant updates when conversations are modified externally

### Advanced Conversation Management

- **Project Browser** - View all Claude Code projects with metadata and session counts
- **Smart Session Filtering** - Hide empty sessions, unify duplicates, filter by status
- **Multi-tab Interface** - Sessions, Tasks, and Settings in an organized sidebar
- **Conversation Display** - Human-readable format with syntax highlighting and tool usage
- **Command Detection** - Enhanced display of XML-like command structures
- **Task Controller** - Full lifecycle management of Claude processes

## Installation & Usage

### With mise (recommended)

```bash
# ツールをプロジェクト指定バージョンで用意
mise install

# 依存取得 / 開発起動
mise run install
mise run dev      # 開発: http://localhost:3400

# 品質チェック
mise run lint
mise run typecheck
mise run test
mise run format:write
```

### Clone and Run Locally

Clone and run locally:

```bash
git clone https://github.com/d-kimuson/coding-agent-operator.git
cd coding-agent-operator
pnpm i
pnpm dev
```

## Data Source

The application reads Claude Code conversation files from:

- **Location**: `~/.claude/projects/<project>/<session-id>.jsonl`
- **Format**: JSONL files containing conversation entries
- **Auto-detection**: Automatically discovers new projects and sessions

## Usage Guide

### 1. Project List

- Browse all Claude Code projects
- View project metadata (name, path, session count, last modified)
- Click any project to view its sessions

### 2. Session Browser  

- View all conversation sessions within a project
- Filter to hide empty sessions
- Sessions show message counts and timestamps
- Click to view detailed conversation

### 3. Conversation Viewer

- Full conversation history with proper formatting
- Syntax highlighting for code blocks
- Tool usage and results clearly displayed
- Navigation sidebar for jumping between sessions
- Support for different message types (user, assistant, system, tools)

## Configuration

### Port Configuration

```bash
PORT=8080 coding-agent-operator
```

### Data Directory

The application automatically detects the standard Claude Code directory at `~/.claude/projects/`. No additional configuration is required.

## License

This project is available under the MIT License.

## Contributing

See [docs/dev.md](docs/dev.md) for detailed development setup and contribution guidelines.
