#!/usr/bin/env bash
# Hook B — PreToolUse Prisma migration gate.
# Blocks any Bash command containing `prisma migrate` with a friendly error
# pointing Claude at the right behavior. Fail-open: if input is unparseable,
# allow the command (defense in depth — deny rules in settings.json still apply).

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)

# Allow empty command (parse failure)
[ -z "$CMD" ] && exit 0

# Match `prisma migrate` anywhere in the command (handles npx prefix, env vars, pipes)
if echo "$CMD" | grep -qE '(npx[[:space:]]+)?prisma[[:space:]]+migrate'; then
  cat >&2 <<'EOF'
🛑 Schema migrations are coordinated through Kyle.

Per CLAUDE.md: the team shares a single dev database. A botched migration
deletes everyone's test data. This has happened before — it was catastrophic.

DO NOT run any prisma migrate commands. Stop and tell the user:
"Schema changes need Kyle's coordination first. DM him with what you want
to change and he'll handle the migration."
EOF
  exit 2
fi

exit 0
