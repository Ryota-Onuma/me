---
description: "Read PR information, use template if available to generate English-only PR body and set English title to update PR"
argument-hint: [pr-url]
allowed-tools: Bash(gh:*), Bash(jq:*), Bash(sed:*), Bash(mktemp:*), Bash(cat:*), Bash(rm:*)
---

# /pr-polish

**Arguments:** `$1` = Pull Request URL (e.g., `https://github.com/OWNER/REPO/pull/123`)

Read PR changes and template, generate **English-only** body and **English title** to update the PR.

## Data Collection

### PR Information:

`gh pr view "$1" --json number,title,body,baseRefName,headRefName,url`

### Changed Files:

`gh pr diff "$1" --name-only`

### Change Content:

`gh pr diff "$1"`

## Requirements

- **<PR Title>:** English only, specific and action-oriented
- **<PR Body>:** **Must be written in English only**, concise and polished, bullet points without emojis, based on changes. If `PULL_REQUEST_TEMPLATE.md` is found, maintain headings and order
- **Issue Reference:** Use `Fixes #123` for automatic linking when applicable

### <PR Body> Structure When No Template

1. **Summary** (English only, concise single paragraph)
2. **Changes** (English only, bullet points per file, no emojis)
3. **Tests** (English only, bullet points for procedures and results)
4. **Risks** (English only, bullet points if applicable)

## Processing Flow

1. Collect PR information using the above commands
2. Retrieve PR template if available (check `.github/pull_request_template.md` etc.)
3. Analyze changes and generate English-only body
4. Generate English title
5. Update PR using `gh pr edit "$1" --title "<PR Title>" --body "<PR Body>"`
6. Display preview of updated results
