#!/usr/bin/env bash
# Hook B — PreToolUse Prisma migration gate.
# Blocks direct `prisma migrate` commands and npm migration aliases with a friendly error
# pointing Claude at the right behavior. Fail-open: if input is unparseable,
# allow the command (defense in depth — deny rules in settings.json still apply).

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)

# Allow empty command (parse failure)
[ -z "$CMD" ] && exit 0

# Match direct commands and the package scripts that invoke them.
if echo "$CMD" | grep -qE '(npx[[:space:]]+)?prisma[[:space:]]+migrate|npm[[:space:]]+run[[:space:]]+db:migrate(:[[:alnum:]_-]+)*'; then
  cat >&2 <<'EOF'
🛑 Schema migrations are coordinated through Kyle.

Per CLAUDE.md: local development and staging share one database. A reset
deletes everyone's test data. This has happened before.

DO NOT run Prisma migration commands or npm migration scripts. Stop and tell the user:
"Schema changes need Kyle's coordination first. DM him with what you want
to change and he'll handle the migration."
EOF
  exit 2
fi

exit 0
