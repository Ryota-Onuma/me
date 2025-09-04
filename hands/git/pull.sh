#!/usr/bin/env zsh
# git-smart-pull.zsh
# Smart "git pull": fetch+merge from the same-named remote branch (or the configured upstream).
# - Works even if no upstream is set, as long as <remote>/<branch> exists.
# - Prefers branch.<name>.remote, then 'origin', then the first remote.
# - Uses fast-forward when possible; otherwise creates a merge commit.
# Usage: run inside a git repo:  ./git-smart-pull.zsh

set -euo pipefail

# Ensure we're inside a Git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository." >&2
  exit 1
fi

# Current branch (reject detached HEAD)
branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo "")
if [[ -z "$branch" ]]; then
  echo "Detached HEAD; aborting." >&2
  exit 1
fi

# Pick a remote: branch.<name>.remote -> origin -> first remote
remote=$(git config "branch.$branch.remote" 2>/dev/null || echo "")
if [[ -z "$remote" ]]; then
  if git remote | grep -qx origin; then
    remote=origin
  else
    remote=$(git remote | head -n1)
  fi
fi
if [[ -z "$remote" ]]; then
  echo "No remote configured." >&2
  exit 1
fi

# Determine target upstream (use existing upstream if present)
upstream_ref=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "")
if [[ -n "$upstream_ref" ]]; then
  remote_name=${upstream_ref%%/*}
  remote_branch=${upstream_ref#*/}
else
  remote_name=$remote
  remote_branch=$branch
  # If same-named remote branch exists, set upstream silently
  if git ls-remote --exit-code --heads "$remote_name" "$remote_branch" >/dev/null 2>&1; then
    git branch --set-upstream-to="$remote_name/$remote_branch" >/dev/null 2>&1 || true
  else
    echo "No same-named branch on $remote_name: $remote_name/$remote_branch" >&2
    echo "Hint: git push -u $remote_name $branch" >&2
    exit 2
  fi
fi

# Fetch only the target branch
git fetch "$remote_name" "$remote_branch"

target="refs/remotes/$remote_name/$remote_branch"

# If target already contained in HEAD, nothing to do
if git merge-base --is-ancestor "$target" HEAD; then
  echo "Already up to date."
  exit 0
fi

# Fast-forward if possible; otherwise merge with a commit
if git merge-base --is-ancestor HEAD "$target"; then
  exec git merge --ff-only "$target"
fi

exec git merge --no-edit "$target"
