#!/usr/bin/env bash
# Hooks D + E — PreToolUse commit gate.
# Combined check on git commit calls:
#   E. Block commits on main / develop / staging (protected branches)
#   D. Block commits with .env* or docs/ files staged

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)

# Allow empty command (parse failure)
[ -z "$CMD" ] && exit 0

# Only fire on git commit calls (allow git commit --amend through too, even though we discourage it)
if ! echo "$CMD" | grep -qE '(^|[[:space:]&;|])git[[:space:]]+commit\b'; then
  exit 0
fi

# Hook E: protected branch check
BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [[ "$BRANCH" == "main" || "$BRANCH" == "develop" || "$BRANCH" == "staging" ]]; then
  cat >&2 <<EOF
🛑 You're on the protected branch '$BRANCH'.

Per CLAUDE.md: all work goes through feature branches and PRs. Direct
commits to main, develop, and staging are not allowed.

Stop and tell the user to switch to a feature branch first:
  git checkout -b feature/your-change

Or if they're sure this is the right place to commit, they can do it
manually outside Claude — but it almost certainly isn't.
EOF
  exit 2
fi

# Hook D: sensitive files staged check
SENSITIVE=$(git diff --cached --name-only 2>/dev/null | grep -E '^(\.env|docs/)' || true)
if [ -n "$SENSITIVE" ]; then
  cat >&2 <<EOF
🛑 Sensitive files are staged for commit:

$SENSITIVE

Per CLAUDE.md: these never go in git.
  - .env* files contain secrets — share offline only
  - docs/ contains personal session notes

Unstage them before committing:
  git restore --staged $(echo "$SENSITIVE" | tr '\n' ' ')
EOF
  exit 2
fi

exit 0
