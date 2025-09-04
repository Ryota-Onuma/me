#!/usr/bin/env zsh

# Fail fast on errors and undefined variables; make pipelines fail on any error
set -eu
(set -o pipefail) 2>/dev/null || setopt pipefail 2>/dev/null || true

# Validate required environment variables
: ${GITHUB_ORG:?GITHUB_ORG must be set}
: ${GITHUB_REPO:?GITHUB_REPO must be set}

REPO="${GITHUB_ORG}/${GITHUB_REPO}"

# Get current GitHub username via gh CLI
GITHUB_USER="$(gh api user --jq .login)"

echo "Fetching PRs requested for you (including your teams) in ${REPO}..."

# Use gh to list open PRs in the repo where review is requested from you (teams included), excluding drafts
PR_URLS="$(gh pr list --repo "${REPO}" \
  --search 'is:open review-requested:@me' \
  --json url --jq '.[].url')"

# Exit early if nothing was found
if [[ -z "${PR_URLS}" ]]; then
  echo "No PRs found."
  exit 0
fi

# Filter out PRs where you already submitted APPROVED or CHANGES_REQUESTED
FILTERED_URLS=""
while IFS= read -r url; do
  [[ -z "${url}" ]] && continue
  number="${${url##*/}%%[^0-9]*}"  # extract PR number from URL
  count="$(GITHUB_USER="${GITHUB_USER}" gh api "repos/${REPO}/pulls/${number}/reviews" \
            --jq '[.[] | select(.user.login==env.GITHUB_USER and (.state=="APPROVED" or .state=="CHANGES_REQUESTED"))] | length')"
  if [[ "${count}" -eq 0 ]]; then
    FILTERED_URLS+="${url}"$'\n'
  fi
done <<< "${PR_URLS}"

# Exit if all candidate PRs were already reviewed by you
if [[ -z "${FILTERED_URLS}" ]]; then
  echo "Nothing to review (you have already approved or requested changes on all requested PRs)."
  exit 0
fi

echo "Opening:"
printf '%s' "${FILTERED_URLS}"

# Choose opener command depending on OS
opener="open"
if ! command -v "${opener}" >/dev/null 2>&1; then
  opener="xdg-open"
fi

# Open each PR in browser with a small delay to avoid heavy browser load
while IFS= read -r url; do
  [[ -z "${url}" ]] && continue
  "${opener}" "${url}"
  sleep 1
done <<< "${FILTERED_URLS}"

echo "Done."
