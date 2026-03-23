# Contributing to Riff

Welcome! This guide covers everything you need to know to contribute code to Riff.

## Quick Start

1. Follow `SETUP.md` to get the project running locally
2. Run `/letsriff` in Claude Code at the start of every session
3. Use `/new-feature` to start building

## Git Workflow

### Branch Strategy

```
feature/your-feature  →  develop  →  staging  →  main
```

- **`main`**: Production. Never commit directly. Only receives PRs from `staging`.
- **`staging`**: Pre-production testing. Only receives merges from `develop`.
- **`develop`**: Integration branch. Merge your feature branches here via PR.
- **Feature branches**: Where you work. One branch per feature/fix.

### Starting a Feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/short-description
```

Branch naming: `feature/what-it-does` or `fix/what-it-fixes`

### Making Commits

Use **conventional commits** (lowercase):

```bash
git commit -m "feat: add notification click-through navigation"
git commit -m "fix: resolve auth redirect loop on mobile"
git commit -m "refactor: extract share modal into reusable component"
git commit -m "chore: upgrade prisma to 7.3.0"
git commit -m "style: format files with prettier"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Keep commits atomic** — one logical change per commit. Don't bundle unrelated changes.

### Opening a PR

Use `/finish-feature` in Claude Code, or manually:

```bash
git push -u origin feature/your-branch
gh pr create --base develop
```

Every PR needs:
- Clear title describing the change
- Summary of what and why
- Testing checklist (see PR template)
- Screenshots for UI changes

### After Your PR is Merged

Kyle will review and merge your PR. After it's merged:

```bash
git checkout develop
git pull origin develop
git branch -d feature/your-branch
```

## Code Quality

### Before Committing

These run automatically via pre-commit hooks, but you can run them manually:

```bash
npm run lint          # ESLint
npm run format        # Prettier
npx tsc --noEmit      # TypeScript check
npm run build         # Full build
```

Or use `/pr-check` in Claude Code to run all checks at once.

### Code Style

- TypeScript strict mode — avoid `any`
- Double quotes, semicolons, 2-space indent, 80-char line width (Prettier handles this)
- Follow existing patterns in the area you're modifying

## What NOT to Commit

- `.env` files (secrets — share offline only)
- `docs/` session notes (personal notes, git-ignored)
- Debug code or `console.log` statements
- Large binary files

## Database Changes

**Coordinate with Kyle before changing `prisma/schema.prisma`.**

We share a single dev database, so:
- Only one person should create a migration at a time
- After someone creates a migration, others pull and run `npm run db:migrate:dev`
- Never run `prisma migrate reset` on the shared database without checking with Kyle

## Slash Commands Reference

| Command | When to use |
|---------|------------|
| `/letsriff` | Start of every session |
| `/new-feature` | Starting a new feature |
| `/sync` | Pull latest develop into your branch (do this often!) |
| `/pr-check` | Before opening a PR |
| `/finish-feature` | Push and create a PR |
| `/setup` | First-time project setup |

## Getting Help

If you're stuck, message Kyle. He's awesome and knows everything.
