#!/usr/bin/env zsh
# gws-from-cmd.zsh
# Create or open a git worktree using the first non-empty line printed by a generator command (default: checkout-new.sh).
# Comments are in English by request.

set -euo pipefail

# ---- Defaults (overridable by CLI flags or environment variables) ----
remote="${GWS_REMOTE:-origin}"
base="${GWS_BASE:-}"
base_dir="${GWS_BASE_DIR:-$HOME/.git-workspaces}"
gen_cmd="${GWS_GEN_CMD:-checkout-new.sh}"
quiet=0
allow_dirty=0
do_fetch=1
spawn=0

print_usage() {
  cat <<'USAGE' >&2
Usage:
  gws-from-cmd.zsh [options] [-- <generator-args>]

Options:
  --gen=PATH          Generator command (default: checkout-new.sh)
  --remote=NAME       Git remote name (default: origin)
  --base=BRANCH       Base branch (default: auto: main -> master -> develop -> current)
  --base-dir=DIR      Worktree root (default: ~/.git-workspaces/<repo>/<branch>)
  --no-fetch          Skip "git fetch --prune"
  --dirty             Allow uncommitted changes in main working tree
  -q, --quiet         Print worktree path only (suitable for: cd "$(./gws-from-cmd.zsh -q)")
  --spawn             Spawn an interactive shell in the worktree (new shell)
  -h, --help          Show this help

Env overrides:
  GWS_GEN_CMD, GWS_REMOTE, GWS_BASE, GWS_BASE_DIR

Notes:
  - The first non-empty line from the generator stdout is used as branch name.
  - Branch name is validated by: git check-ref-format --branch
  - If a worktree for that branch already exists, it is reused.
  - This script cannot change the parent shell's directory. Use:
      cd "$(./gws-from-cmd.zsh -q -- ...)"
    or:
      ./gws-from-cmd.zsh --spawn -- ...
USAGE
}

log() { (( quiet )) || print -u2 -- "$@"; }
die() { print -u2 -- "Error: $1"; exit 1; }

# ---- Parse arguments ----
gen_args=()
while (( $# )); do
  case "$1" in
    --gen=*)      gen_cmd="${1#--gen=}" ;;
    --remote=*)   remote="${1#--remote=}" ;;
    --base=*)     base="${1#--base=}" ;;
    --base-dir=*) base_dir="${1#--base-dir=}" ;;
    --no-fetch)   do_fetch=0 ;;
    --dirty)      allow_dirty=1 ;;
    -q|--quiet)   quiet=1 ;;
    --spawn)      spawn=1 ;;
    -h|--help)    print_usage; exit 0 ;;
    --)           shift; gen_args=("$@"); break ;;
    *)            die "Unknown option: $1 (use --help)" ;;
  esac
  shift
done

# ---- Repo checks ----
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$repo_root" ]] || die "Not inside a Git repository."
repo_name="$(basename "$repo_root")"
cur_branch="$(git -C "$repo_root" rev-parse --abbrev-ref HEAD)"

# ---- Helpers ----
branch_exists_local()   { git -C "$repo_root" show-ref --quiet --verify "refs/heads/$1"; }
branch_exists_remote()  { git -C "$repo_root" show-ref --quiet --verify "refs/remotes/$remote/$1"; }
detect_base() {
  if [[ -n "$base" ]]; then print -- "$base"; return 0; fi
  for c in main master develop; do
    if branch_exists_local "$c" || branch_exists_remote "$c"; then
      print -- "$c"; return 0
    fi
  done
  print -- "$cur_branch"
}
worktree_for_branch() {
  # Return existing worktree path for given branch if any (empty otherwise)
  git -C "$repo_root" worktree list --porcelain | \
    awk -v b="refs/heads/$1" '
      $1=="worktree"{wt=$2}
      $1=="branch" && $2==b {print wt; exit}
    '
}

# ---- Enforce clean state unless --dirty ----
if (( ! allow_dirty )); then
  if [[ -n "$(git -C "$repo_root" status --porcelain)" ]]; then
    die "Uncommitted changes in main working tree. Use --dirty to override."
  fi
fi

# ---- Run generator to get branch name ----
if ! branch="$("$gen_cmd" "${gen_args[@]}" | awk 'NF{print; exit}')" ; then
  die "Generator failed: $gen_cmd"
fi
# Trim whitespace
branch="${branch##[[:space:]]#}"; branch="${branch%%[[:space:]]#}"
[[ -n "$branch" ]] || die "Generator produced an empty branch name."
git check-ref-format --branch "$branch" >/dev/null 2>&1 || die "Invalid branch name: '$branch'"

log "Using branch: $branch"

# ---- Reuse existing worktree if present ----
existing_path="$(worktree_for_branch "$branch" || true)"
if [[ -n "${existing_path:-}" ]]; then
  (( quiet )) || log "Existing worktree detected: $existing_path"
  if (( spawn )); then
    exec "${SHELL:-/bin/zsh}" -l -c "cd ${(q)existing_path}; exec ${ZSH_NAME:-zsh} -i"
  fi
  if (( quiet )); then
    print -- "$existing_path"
  else
    log "Done. (tip) cd ${(q)existing_path}"
    print -- "$existing_path"
  fi
  exit 0
fi

# ---- Prepare branch & add new worktree ----
(( do_fetch )) && git -C "$repo_root" fetch --prune "$remote"

if branch_exists_local "$branch"; then
  : # use as-is
elif branch_exists_remote "$branch"; then
  git -C "$repo_root" branch --track "$branch" "$remote/$branch"
  log "Created tracking branch: $branch -> $remote/$branch"
else
  detected_base="$(detect_base)"
  if branch_exists_remote "$detected_base"; then
    git -C "$repo_root" branch "$branch" "$remote/$detected_base"
  else
    git -C "$repo_root" branch "$branch" "$detected_base"
  fi
  log "Created new branch: $branch (base: $detected_base)"
fi

target_path="${base_dir}/${repo_name}/${branch}"
mkdir -p "$(dirname "$target_path")"

git -C "$repo_root" worktree add "$target_path" "$branch"
(( quiet )) || log "Worktree added: $target_path"

# ---- Output / Spawn ----
if (( spawn )); then
  exec "${SHELL:-/bin/zsh}" -l -c "cd ${(q)target_path}; exec ${ZSH_NAME:-zsh} -i"
fi

if (( quiet )); then
  print -- "$target_path"
else
  log "Done. (tip) cd ${(q)target_path}"
  print -- "$target_path"
fi
