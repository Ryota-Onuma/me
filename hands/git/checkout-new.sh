#!/usr/bin/env zsh
# Create & checkout a new git branch using Claude to generate a safe slug.
# No date/time is included in the branch name.
# Prefix is overridable with env BRANCH_PREFIX (default: "develop/onuma/").
#
# Usage:
#   gen-branch.zsh "Add login API"
#   echo "ユーザー削除の監査ログ" | gen-branch.zsh
#   BRANCH_PREFIX="feature/ryota" gen-branch.zsh "cleanup build"
#
# Behavior:
# - Name: <PREFIX><slug>               (NO timestamp)
# - Uniqueness: adds -1, -2, ... if the name exists (local or remote)
# - Base branch auto-detected: origin/HEAD → main → master → develop → current
# - Requires: git, claude

set -euo pipefail

# --- ▼▼▼ ADDED: Spinner function and color definitions ▼▼▼ ---
# ANSI color codes for better UI feedback
c_cyan="\e[36m"
c_green="\e[32m"
c_reset="\e[0m"

# Spinner function to show activity during long-running commands.
# Usage: spinner $! "Doing something..."
spinner() {
  local pid=$1
  local msg=${2:-"Processing..."}
  local -a spin_chars=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

  # Hide cursor
  print -u2 -n -- "\e[?25l"

  while kill -0 "$pid" 2>/dev/null; do
    for char in "${spin_chars[@]}"; do
      print -u2 -n -- "${c_cyan}${char}${c_reset} ${msg}\r"
      sleep 0.1
    done
  done

  # Show cursor again
  print -u2 -n -- "\e[?25h"
}
# --- ▲▲▲ END of ADDED section ▲▲▲ ---

err() { print -u2 -- "Error: $*"; }
die() { err "$@"; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Required command '$1' not found"; }

slug_sanitize() {
  # Lowercase, replace non-alnum with '-', collapse repeats, trim edges, cap length (48).
  local s
  s="$(printf '%s' "$*" | tr '[:upper:]' '[:lower:]')"
  s="$(printf '%s' "$s" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')"
  printf '%s' "${s[1,48]:-$s}"
}

branch_exists_anywhere() {
  local name="$1" remote="$2"
  git show-ref --verify --quiet "refs/heads/${name}" && return 0
  git ls-remote --exit-code --heads "$remote" "$name" >/dev/null 2>&1 && return 0
  return 1
}

choose_base_branch() {
  local remote="$1" ref
  if ref="$(git symbolic-ref --quiet --short "refs/remotes/${remote}/HEAD" 2>/dev/null)"; then
    print -- "${ref#${remote}/}"; return 0
  fi
  for cand in main master develop; do
    git ls-remote --exit-code --heads "$remote" "$cand" >/dev/null 2>&1 && { print -- "$cand"; return 0; }
  done
  git rev-parse --abbrev-ref HEAD
}

#--- preflight -------------------------------------------------------------
need git
need claude
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repository"

REMOTE="${GIT_REMOTE:-origin}"

# Prefix (env override) — ensure exactly one trailing slash and no leading slash
PREFIX_DEFAULT="develop/onuma/"
PREFIX_RAW="${BRANCH_PREFIX:-$PREFIX_DEFAULT}"
PREFIX_RAW="${PREFIX_RAW#/}"                   # drop leading '/'
[[ "$PREFIX_RAW" == */ ]] && PREFIX="$PREFIX_RAW" || PREFIX="${PREFIX_RAW}/"
# Validate prefix by appending a token
git check-ref-format --branch "${PREFIX}x" >/dev/null 2>&1 || die "Invalid BRANCH_PREFIX: '$PREFIX'"

# Gather prompt (args > stdin > interactive)
PROMPT=""
if (( $# > 0 )); then
  PROMPT="$*"
else
  if [ -t 0 ]; then
    print -u2 -- "Short description for branch (enter for 'work'): "
    read -r PROMPT || true
  else
    PROMPT="$(cat || true)"
  fi
fi
[[ -z "${PROMPT// }" ]] && PROMPT="work"

#--- ask Claude to generate a slug (no date, no prefix) -------------------
SYS_RULES=$'You are a branch slug generator.\nRules:\n- Output ONE LINE only.\n- Lowercase ASCII [a-z0-9-] only.\n- Kebab-case, collapse repeats, no leading/trailing dashes.\n- No date/time, no prefix, no quotes, no explanations.\n- If input is Japanese, romanize then slugify.\n- Max 48 characters.\nReturn only the slug.'

# --- ▼▼▼ MODIFIED: Claude call with spinner ▼▼▼ ---
# Create a temporary file to store Claude's output
TMP_OUTPUT=$(mktemp)
# Ensure the temporary file is removed when the script exits
trap 'rm -f "$TMP_OUTPUT"' EXIT

# Run Claude in the background, redirecting its output to the temp file
(claude -p "Make a short, descriptive slug for: ${PROMPT}" \
  --append-system-prompt "$SYS_RULES" \
  --output-format text \
  --max-turns 1 > "$TMP_OUTPUT" 2>/dev/null) &
CLAUDE_PID=$!

# Show the spinner while the background process is running
spinner $CLAUDE_PID "Asking Claude to generate a slug..."

# Wait for the process to finish and check its exit code
local claude_exit_code=0
wait $CLAUDE_PID || claude_exit_code=$?

# Clear the spinner line and show a confirmation
print -u2 -n -- "\r\e[K" # Erase the current line
print -u2 -- "${c_green}✓${c_reset} Slug received from Claude."

# If claude failed, we can still proceed with a fallback
SLUG_RAW=""
if [[ $claude_exit_code -eq 0 ]]; then
  SLUG_RAW="$(cat "$TMP_OUTPUT" || true)"
fi
# --- ▲▲▲ END of MODIFIED section ▲▲▲ ---

SLUG_LINE="$(printf '%s' "$SLUG_RAW" | head -n1)"
SLUG="$(slug_sanitize "$SLUG_LINE")"
[[ -z "$SLUG" ]] && SLUG="work"

CANDIDATE="${PREFIX}${SLUG}"

#--- uniqueness: add -1, -2, ... if needed --------------------------------
NEW="$CANDIDATE"
i=1
while branch_exists_anywhere "$NEW" "$REMOTE"; do
  NEW="${CANDIDATE}-$i"
  i=$((i+1))
done
git check-ref-format --branch "$NEW" >/dev/null 2>&1 || die "Invalid branch name: $NEW"

#--- base + create/switch --------------------------------------------------
print -u2 -- "Fetching from remote and creating branch..."

BASE_BRANCH="$(choose_base_branch "$REMOTE")"
git fetch "$REMOTE" --prune >/dev/null 2>&1 || true
if git show-ref --verify --quiet "refs/remotes/${REMOTE}/${BASE_BRANCH}"; then
  BASE_REF="${REMOTE}/${BASE_BRANCH}"
else
  BASE_REF="${BASE_BRANCH}"
fi

if git switch -c "$NEW" "$BASE_REF" 2>/dev/null; then :; else git checkout -b "$NEW" "$BASE_REF"; fi

print -u2 -- "\n${c_green}Success!${c_reset}"
print -u2 -- "Created and checked out: ${c_cyan}${NEW}${c_reset}"
print -u2 -- "Base: $BASE_REF"
print -u2 -- "Prefix used: $PREFIX"

# Output branch name to stdout for git-worktree.sh compatibility
print -- "$NEW"
