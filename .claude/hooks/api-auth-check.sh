#!/usr/bin/env bash
# Hook G — PostToolUse requireAuth() check on API routes.
# Surfaces a warning if a src/app/api/**/route.ts file doesn't reference
# requireAuth(). Doesn't block — some routes are legitimately public.

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# Skip if no file path
[ -z "$FILE" ] && exit 0

# Only fire on API route files
case "$FILE" in
  *src/app/api/*route.ts) ;;
  *) exit 0 ;;
esac

# Skip auth callbacks themselves — they ARE the auth
case "$FILE" in
  *src/app/api/auth/*) exit 0 ;;
esac

# Skip if file no longer exists (e.g. deletion)
[ -f "$FILE" ] || exit 0

# Check whether requireAuth is referenced
if ! grep -q 'requireAuth\b' "$FILE" 2>/dev/null; then
  cat >&2 <<EOF
⚠️ $FILE doesn't reference requireAuth().

Per CLAUDE.md: all protected API routes need requireAuth() to enforce
authentication.

If this route is INTENTIONALLY public (webhooks, OG metadata, leaderboard
data, cron triggers with a CRON_SECRET check), ignore this warning. Otherwise,
add at the top of the handler:

  await requireAuth();
EOF
fi

exit 0
