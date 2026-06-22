#!/usr/bin/env bash
# Hook C — PostToolUse per-edit lint sweep.
# Runs ESLint on the just-edited file. Surfaces errors only (not warnings)
# to keep noise low. Doesn't block — just feeds the result back so Claude
# can self-correct on the next turn.

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# Skip if no file path
[ -z "$FILE" ] && exit 0

# Only lint TS/JS source files in src/
case "$FILE" in
  *src/*.ts|*src/*.tsx|*src/*.js|*src/*.jsx) ;;
  *) exit 0 ;;
esac

# Skip if eslint binary isn't present (e.g. node_modules not installed yet)
[ -x "./node_modules/.bin/eslint" ] || exit 0

# Lint with cache for speed. --quiet = errors only, no warnings.
OUTPUT=$(./node_modules/.bin/eslint --quiet --cache --cache-location node_modules/.cache/eslint-hook-cache --no-error-on-unmatched-pattern "$FILE" 2>&1) || true

# If lint found errors, surface them so Claude reads + corrects
if [ -n "$OUTPUT" ]; then
  cat >&2 <<EOF
ESLint errors in $FILE (introduced or pre-existing on the just-edited file):

$OUTPUT

If these errors are from code you just wrote, fix them before continuing.
EOF
fi

exit 0
