# Riff guidance for Codex

This repository is shared with Claude Code users. Keep `CLAUDE.md`, `.claude/`, and the collaborator experience intact. Read `CLAUDE.md` for project rules, and use `CONTRIBUTING.md` for the branch and PR workflow. For a task, read the relevant files rather than loading the whole project at startup.

## Working in this repo

- Work on `feature/short-description` or `fix/short-description` branches. Never commit directly to `main`, `develop`, or `staging`. Target PRs at `develop`; Kyle handles promotion to staging and production.
- Use lowercase conventional commits. Before a PR, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Format changed source files with Prettier before committing. `npm run format` formats all of `src/`, so review its diff for unrelated changes if you use it.
- Follow existing TypeScript, Prisma, and API auth patterns. Use `requireAuth()` for protected API routes. Read `DESIGN-SYSTEM.md` before UI work and reuse its shared components.
- Never commit `.env*` files or `docs/` session notes.
- The development database is shared. Do not run Prisma migration, reset, or `db push` commands, including npm scripts that invoke them, as part of routine Codex work. Do not edit `prisma/schema.prisma` unless Kyle explicitly requests a coordinated schema change. The Codex hook blocks direct schema edits by default; Kyle must deliberately turn it off for approved schema work. Never accept a prompt to reset the shared database. Only one person creates migrations at a time.

## Using the existing workflows

The files in `.claude/commands/` describe Riff's workflow. When Kyle asks for a step such as "letsriff", "new feature", "test", "sync", "PR check", "review", or "finish feature", read the corresponding file and carry out its intent with Codex's available tools. These are Claude Code commands, so their slash names and Claude-specific tool or UI steps do not automatically run in Codex. Keep the same branch, validation, and PR rules. Do not run `.claude/hooks/` as Codex hooks; Codex has its own hooks under `.codex/`.

At the start of a Riff work session, check the current branch and working tree. If resuming work, inspect commits relative to `develop` and any relevant plan in `.claude/plans/`. Use `ARCHITECTURE.md` when the task needs the system map. Ask Kyle for a product decision when needed, then continue with the authorized work.

Codex's project hooks add guards for migrations, schema edits, commits on protected branches, and staged sensitive files. They are an extra safeguard; still follow the rules above if hooks are unavailable or not yet trusted.
