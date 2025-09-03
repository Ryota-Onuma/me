---

description: "Polish a PR via gh: read diff, use PR template if present, generate JA/EN body, set an English title, then update."
argument-hint: \[pr-url]
allowed-tools: Bash(gh:*), Bash(jq:*), Bash(sed:*), Bash(mktemp:*), Bash(cat:*), Bash(rm:*)
-------------------------------------------------------------------------------------------

# /pr-polish — Minimal & Reliable

**Arg:** `$1` = Pull Request URL (e.g. `https://github.com/OWNER/REPO/pull/123`)

> This command loads PR context and diff, optionally reads a PR template from the default branch, drafts a **bilingual (JA/EN)** PR body, proposes an **English title**, and updates the PR via `gh`.

---

## Load context (gh)

- PR core JSON
  !`gh pr view "$1" --json number,title,body,baseRefName,headRefName,url`

- Changed files
  !`gh pr diff "$1" --name-only`

- Diff (unified)
  !`gh pr diff "$1"`

- **PR template (first match among common paths on default branch)**
  !`( set -e; OWNER_REPO=$(echo "$1" | sed -E 's#https?://github.com/([^/]+/[^/]+)/pull/[0-9]+#\1#'); DEFAULT=$(gh repo view "$OWNER_REPO" --json defaultBranchRef --jq .defaultBranchRef.name); FOUND=""; for p in ".github/pull_request_template.md" ".github/PULL_REQUEST_TEMPLATE.md" "PULL_REQUEST_TEMPLATE.md"; do if gh api "repos/$OWNER_REPO/contents/$p?ref=$DEFAULT" -H "Accept: application/vnd.github.raw" >/tmp/_pr_tmpl 2>/dev/null; then FOUND="$p"; break; fi; done; echo "TEMPLATE_PATH=$FOUND"; if [ -n "$FOUND" ]; then echo "-----BEGIN_TEMPLATE-----"; cat /tmp/_pr_tmpl; echo "-----END_TEMPLATE-----"; fi )`

> If `TEMPLATE_PATH` is empty, treat as “no template”.

---

## Requirements / 制約

- **Title:** English only; specific and action‑oriented.
- **Body:** JA/EN bilingual; concise but accurate; grounded in the diff (no speculation).
- **Template adherence:** If a template is found, keep its **headings & order**. Irrelevant fields → `N/A / 該当なし`.
- **Linking:** Autolink issues (`Fixes #123`) when applicable.

**Fallback body (when no template):**

1. **Summary / 概要**
2. **Changes / 変更点**（file-wise bullets）
3. **Tests / テスト**（steps & expected）
4. **Risks / リスク**

---

## What to produce

- `TITLE_EN`: one final English title (optionally Conventional Commits prefix if helpful)
- `BODY_MD`: Markdown (JA/EN), precise and minimal

## Update PR (gh)

```bash
set -euo pipefail
TMP="$(mktemp)"
cat > "$TMP" <<'__PR_BODY__'
<BODY_MD>
__PR_BODY__

gh pr edit "$1" --title "<TITLE_EN>" --body-file "$TMP"
rm -f "$TMP"
```

## Report back (preview)

- Show the final **English title** and the first \~20 lines of the body.
- State whether `gh pr edit` succeeded.
- If a template was used, print the matched `TEMPLATE_PATH`.
