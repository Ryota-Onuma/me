# AGENTS.md

This file documents agent profiles, execution workflows, and best practices for AI-assisted development in this task management application.

## Agent Profiles

Agents are configured via profiles that define which AI coding assistant to use and how to invoke it. Profiles are stored in `data/profiles.json` and can be managed through the UI or directly via API.

### Default Profiles

The system includes three built-in agent profiles:

- **claude-code**: Anthropic's Claude Code CLI (`@anthropic-ai/claude-code`)
- **cursor**: Cursor AI agent (`cursor-agent`)
- **codex**: OpenAI Codex CLI (`@openai/codex`)

### Profile Structure

Each profile contains:

- `label`: Human-readable identifier
- `command`: Array of command parts to execute the agent

Example profile configuration:

```json
[
  {
    "label": "claude-code",
    "command": ["npx", "-y", "@anthropic-ai/claude-code@latest"]
  },
  {
    "label": "cursor",
    "command": ["cursor-agent"]
  },
  {
    "label": "codex",
    "command": ["npx", "-y", "@openai/codex", "exec"]
  }
]
```

## Execution Workflow

### 1. Standalone Execution

Run agents directly without tracking:

```bash
# Claude Code
mise run agent.claude PROMPT='Fix the authentication bug' CWD='/path/to/repo'

# Cursor Agent
mise run agent.cursor PROMPT='Add dark mode toggle' CWD='/path/to/repo'

# Codex
mise run agent.codex PROMPT='Optimize database queries' CWD='/path/to/repo'
```

### 2. Tracked Execution

Create executions that are logged and can be streamed via the API:

```bash
# Start execution
ID=$(mise run exec.start PROFILE='claude-code' PROMPT='Implement user registration')

# Stream live output
mise run exec.stream ID="$ID"

# List all executions
mise run exec.list
```

### 3. Attempt-Linked Execution

Link executions to specific attempts (Git branches) for better organization:

```bash
# Create attempt first
ATTEMPT_ID=$(mise run attempt.new TASK='task123' PROFILE='claude-code' REPO='/path/to/repo' BASE='main')

# Execute with attempt linkage
EXEC_ID=$(mise run exec.start PROFILE='claude-code' PROMPT='Fix issue' ATTEMPT="$ATTEMPT_ID")

# Stream execution
mise run exec.stream ID="$EXEC_ID"
```

## API Endpoints

### Profiles

- `GET /api/profiles` - List all profiles
- `POST /api/profiles` - Create/update profiles
- `PUT /api/profiles` - Replace all profiles

### Executions

- `POST /api/executions` - Start new execution
- `GET /api/executions` - List executions
- `GET /api/executions/{id}` - Get execution details
- `GET /api/executions/{id}/stream` - SSE stream of execution logs
- `POST /api/executions/{id}/kill` - Terminate running execution

## Best Practices

### Profile Management

1. **Version Pinning**: Use specific versions for reproducible builds

   ```json
   { "command": ["npx", "-y", "@anthropic-ai/claude-code@1.2.3"] }
   ```

2. **Custom Profiles**: Create profiles for specialized workflows

   ```json
   {
     "label": "claude-testing",
     "command": [
       "npx",
       "-y",
       "@anthropic-ai/claude-code@latest",
       "--mode",
       "test"
     ]
   }
   ```

3. **Edit Profiles**: Use the built-in editor
   ```bash
   mise run profiles.edit
   ```

### Execution Patterns

1. **Exploratory Work**: Use standalone agents for quick experiments
2. **Feature Development**: Link executions to attempts for tracking
3. **Code Review**: Stream execution logs for real-time monitoring
4. **Batch Processing**: Queue multiple executions for different profiles

### Integration with Attempts

- Each execution can be linked to an attempt via `attempt_id`
- Attempts create feature branches automatically (`feature/` prefix)
- Execution logs are preserved for later review
- Branch status tracking includes uncommitted changes from agent runs

### Monitoring and Debugging

1. **Live Streaming**: Use SSE endpoints for real-time log viewing
2. **Execution History**: All runs are preserved with timestamps
3. **Status Tracking**: Monitor running/completed/failed/killed states
4. **Error Handling**: Failed executions preserve error output

## Security Considerations

- Agents run with full filesystem access in specified working directories
- Execution logs may contain sensitive information - review before sharing
- Profile commands are executed directly - validate trusted sources only
- Git operations respect repository permissions and authentication

## Troubleshooting

### Common Issues

1. **Profile Not Found**: Ensure profile exists in `data/profiles.json`
2. **Command Failed**: Check agent installation and PATH configuration
3. **Permission Denied**: Verify working directory and file permissions
4. **Streaming Interrupted**: Check network connectivity for SSE endpoints

### Debug Commands

```bash
# Check agent availability
mise run doctor

# Validate profiles
mise run exec.start PROFILE='claude-code' PROMPT='echo test'

# Test API connectivity
mise run check.api
```

## Advanced Usage

### Custom Agent Integration

Add your own AI coding assistants by creating custom profiles:

1. Install your agent CLI tool
2. Add profile to `data/profiles.json`
3. Test execution with simple prompts
4. Integrate with attempt workflow

### Batch Execution

Run multiple agents on the same task:

```bash
for profile in claude-code cursor codex; do
  mise run exec.start PROFILE="$profile" PROMPT="Review code quality" &
done
wait
```

### Execution Chaining

Use execution outputs to drive subsequent agent runs:

```bash
# Analysis phase
ANALYSIS_ID=$(mise run exec.start PROFILE='claude-code' PROMPT='Analyze codebase structure')

# Implementation phase (after analysis completes)
IMPL_ID=$(mise run exec.start PROFILE='cursor' PROMPT='Implement based on analysis')
```

@./UBIQUITOUS_LANGUAGE.md
