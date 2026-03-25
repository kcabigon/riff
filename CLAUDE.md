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
| `/finish-feature` | Push branch and create a PR targeting develop |
| `/promote` | Kyle only — promote develop → staging or staging → main |
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

### What NOT to commit
- `.env` files (secrets — already in `.gitignore`)
- `docs/` session notes (personal — already in `.gitignore`)
- Debug code, `console.log` statements

### Database changes
- If you need to change `prisma/schema.prisma`, coordinate with Kyle first
- Only one person should create migrations at a time
- Others apply migrations with `npm run db:migrate:dev`

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

## Project Context

For full architecture, file map, design system, and current state, read `ARCHITECTURE.md`. The `/letsriff` command does this automatically — you shouldn't need to read it manually.
