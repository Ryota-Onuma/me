# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `go build -o daily-report-creator`
- **Run**: `go run main.go [command]`
- **Tests**: `go test ./...`
- **Format**: `go fmt ./...`

Daily-report command usage is organized in `.claude/commands/daily-report.md`.
Platform-specific details live in `.claude/agents/github-client.md` and `.claude/agents/slack-client.md`.

## Project Structure

This is a Go CLI application for creating daily reports:

- `main.go` - Application entry point
- `cmd/` - CLI command definitions and handlers
  - `root.go` - Root command and CLI framework
  - `create.go` - Daily report creation command
  - `github.go` - GitHub work summary command
  - `integrate.go` - Manual work integration command
  - `generate.go` - Comprehensive report generation command
- `internal/report/` - Internal report generation logic
  - `generator.go` - Report file generation functionality
  - `github.go` - GitHub CLI integration and work summary
  - `integrate.go` - Manual work parsing and integration

## Architecture Notes

- Custom lightweight CLI framework in `cmd/root.go` for extensibility
- Commands are easily extensible by adding new files in `cmd/` package
- Report generation creates directory structure: `reports/YEAR/YYYY-MM-DD/daily-report.md`
- Integration outputs:
  - GitHub: `reports/YEAR/YYYY-MM-DD/github-work/`
  - Slack: `reports/YEAR/YYYY-MM-DD/slack-work/`
- Uses Go standard library only (no external dependencies)
- Japanese template format for daily reports
- Prevents duplicate report creation for the same date
- For platform-specific requirements, see `.claude/agents/*`

## Report Structure

Daily reports now organize content by platform with minimal speculation:

- **GitHub作業**: PR-based sections with actual implementation details
- **Slack作業**: Channel-based activity summaries with message analysis
- **その他の作業**: Manual work input area with comment-based parsing
- **学んだこと・気づき**: Learning points from actual work
- **明日以降の予定**: Action items and follow-ups

## Manual Work Integration

Users can add manual work by:
1. Editing daily report file
2. Adding content in the HTML comment section under "その他の作業"
3. Running `go run main.go integrate-manual` to process and integrate content

## Further Reading

- Daily report commands: `.claude/commands/daily-report.md`
- GitHub client: `.claude/agents/github-client.md`
- Slack client: `.claude/agents/slack-client.md`
