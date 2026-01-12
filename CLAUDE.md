# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Repository Structure

This is a monorepo containing multiple projects:
- `bag/blog/` - Personal blog and portfolio (Next.js)
- `brain/` - Knowledge management and shell configurations
- `hands/` - Utility tools and scripts

Each project may have its own CLAUDE.md with project-specific guidelines.

## Git Workflow

### Branch Naming Convention

**IMPORTANT:** All development branches must follow this naming format:
```
develop/claude/{session-id}
```

**Examples:**
- `develop/claude/test-gh-cli-access-ExqDL`
- `develop/claude/add-new-feature-Ab12C`
- `develop/claude/fix-navigation-bug-Xy34Z`

Always create branches with the `develop/claude/` prefix followed by a descriptive name and session ID.

### Pull Request Guidelines

**When creating a Pull Request, you MUST:**
1. Fill out ALL sections in the PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
2. Write a clear summary explaining what this PR achieves and why it's needed
3. List all specific changes made in bullet points
4. Ensure tests pass locally before creating the PR
5. Include screenshots for UI changes

**Required sections:**
- **概要 / Summary**: What this PR accomplishes and why it's necessary
- **変更内容 / Changes**: Specific changes made (in bullet points)
- **テスト / Testing**: How you tested and verification checklist

**Creating PRs with gh CLI:**
```bash
gh pr create --repo Ryota-Onuma/me --fill
# Then edit the PR description to follow the template
```

### GitHub CLI

This repository uses a local proxy for git operations, so when using `gh` commands, you need to explicitly specify the repository name.

**Example:**
```bash
# Instead of just `gh repo view`
gh repo view Ryota-Onuma/me

# For issues and PRs, also specify the repo
gh issue list --repo Ryota-Onuma/me
gh pr list --repo Ryota-Onuma/me
```

## Project-Specific Guidelines

For project-specific development guidelines, refer to the CLAUDE.md file in each project directory:
- Blog project: `bag/blog/CLAUDE.md`
