# Riff

**Riff** is a private essay-sharing platform for creative communities. Clubs, riffs (writing prompts), essays, comments, notifications — built with Next.js, Prisma, Tiptap, and Tailwind.

## Getting Started

**Run `/letsriff` at the start of every session.** It loads project context, checks your environment, and gets you building. You don't need to read anything else first.

If the user asks you to "regain context" or "catch up", run `/letsriff`.

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/letsriff` | Start of every session — loads context, checks state, asks what to build |
| `/new-feature` | Start a new feature — creates branch, explores codebase, proposes approach |
| `/todo` | View, claim, add, or complete items on the shared TODO list |
| `/test` | Start the dev server and test your changes locally |
| `/sync` | Pull latest develop into your feature branch — prevents merge conflicts |
| `/pr-check` | Pre-PR validation — lint, type-check, build, commit format |
| `/review` | Review a PR for design system, component reuse, code quality, and merge readiness |
| `/finish-feature` | Push branch and create a PR targeting develop |
| `/promote` | Kyle only — promote develop → staging or staging → main (stops between steps) |
| `/release` | Kyle only — fast-path: `develop → staging → main` chained with a single confirmation |
| `/setup` | First-time setup — walks through environment, deps, database |

## Rules

### Git (mandatory)
- **Never commit directly to `main`, `develop`, or `staging`**
- Always use feature branches: `feature/short-description` or `fix/short-description`
- Conventional commits (lowercase): `feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `docs:`
- Keep commits atomic — one logical change per commit
- See `CONTRIBUTING.md` for the full workflow

### Code
- TypeScript strict mode — no `any` unless absolutely necessary
- Use Prisma ORM exclusively — no raw SQL
- Use `requireAuth()` on all protected API routes
- Run `npm run lint` and `npm run format` before committing
- Follow existing patterns in the area you're modifying
- **Read `DESIGN-SYSTEM.md` before building any UI.** Follow existing design patterns exactly — colors, spacing, borders, shadows. Reuse shared components from the catalog before creating new ones.

### What NOT to commit
- `.env` files (secrets — already in `.gitignore`)
- `docs/` session notes (personal — already in `.gitignore`)
- Debug code, `console.log` statements

### Database changes
- If you need to change `prisma/schema.prisma`, coordinate with Kyle first
- Only one person should create migrations at a time
- Others apply migrations with `npm run db:migrate:dev`
- **NEVER accept a Prisma prompt to reset the database.** If `prisma migrate dev` says it needs to reset, STOP IMMEDIATELY and tell the user to contact Kyle. The dev database is shared by everyone — a reset destroys ALL test data for the entire team. This has happened before and it was catastrophic.

## Quick Reference

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run format           # Prettier
npx tsc --noEmit         # Type check
npm run db:migrate:dev   # Run database migrations
npm run db:studio:dev    # Visual database browser
npx prisma generate      # Regenerate Prisma client after schema changes
```

## Development Track

Collaborators (Jarric, Chris, Derek) follow this flow. Guide them through it — suggest the next step, don't make them guess. Let them explore or ask questions between steps, but always bring them back to the track.

```
/letsriff → /new-feature → build → /test → /finish-feature
```

1. **`/letsriff`** — start of every session. Loads context, checks state. → suggests `/new-feature` or `/todo`
2. **`/new-feature`** — syncs with develop, creates branch, builds the feature. → suggests `/test`
3. **`/test`** — starts dev server for local testing. → suggests `/finish-feature` or fix bugs
4. **`/finish-feature`** — syncs with develop, validates, pushes, creates PR. → done

After each step completes, proactively suggest the next one: "Ready to test? Run `/test`" or "Happy with it? Run `/finish-feature` to create a PR."

### Context persistence (compaction)

When context is compacted, always preserve these in the summary:
- What branch the user is on and what they're building
- Where they are in the development track (building, testing, finishing)
- The plan file path if one exists (in `.claude/plans/`)
- Any design decisions or scope choices the user confirmed

If context is lost, reconstruct from git: check the branch name, `git log --oneline develop..HEAD`, and plan files in `.claude/plans/`.

### Auto-sync

Always sync with develop at these points (don't ask, just do it):
- **Before creating a feature branch** (`/new-feature` step) — `git checkout develop && git pull origin develop`
- **Before finishing** (`/finish-feature` step) — merge latest develop into the feature branch
- **After long builds** — if the build took many commits, sync before testing to catch conflicts early

## Project Context

- **Architecture**: `ARCHITECTURE.md` — file map, schema, tech stack, current state
- **Design system**: `DESIGN-SYSTEM.md` — colors, typography, spacing, borders, shadows, shared component catalog

The `/letsriff` command reads these automatically — you shouldn't need to read them manually.
