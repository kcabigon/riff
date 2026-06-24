#!/usr/bin/env bash
# Hook A — SessionStart bootstrap.
# Idempotent. Installs deps if missing, generates Prisma client if missing,
# warns on missing .env, prints a one-line status. Runs once per session.

set -uo pipefail

cd "$(dirname "$0")/../.." || exit 0

# 1. Install deps if missing
if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run, ~30s)..." >&2
  npm ci --silent >/dev/null 2>&1 || echo "⚠️ npm ci failed — run it manually" >&2
fi

# 2. Generate Prisma client if missing
if [ ! -d node_modules/.prisma/client ] && [ -f prisma/schema.prisma ]; then
  echo "Generating Prisma client..." >&2
  npx prisma generate >/dev/null 2>&1 || echo "⚠️ prisma generate failed — DB calls will fail until fixed" >&2
fi

# 3. Warn on missing .env.development
if [ ! -f .env.development ]; then
  echo "⚠️ Missing .env.development — DB-dependent commands will fail. Hit up Kyle for the values." >&2
fi

# 4. Status line
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
git fetch origin develop --quiet 2>/dev/null || true
BEHIND=$(git rev-list --count "HEAD..origin/develop" 2>/dev/null || echo "?")
if [ "$BRANCH" = "develop" ] || [ "$BRANCH" = "main" ] || [ "$BRANCH" = "staging" ]; then
  echo "Ready. On $BRANCH. ($BEHIND commits behind develop.)"
else
  echo "Ready. On $BRANCH ($BEHIND commits behind develop)."
fi

exit 0
