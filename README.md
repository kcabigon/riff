# Riff

![CI](https://github.com/kcabigon/riff/actions/workflows/ci.yml/badge.svg?branch=develop)

A private essay-sharing platform for creative communities — a bit of a text editor, some sharing and showcase features, a sprinkle of feed and notifications. Like a book club but with our own writing.

## Who's building this

A small group of friends (Kyle, Jarric, Derek, Chris) shipping with Claude Code. The workflow is AI-augmented end-to-end — we use slash commands like `/letsriff`, `/new-feature`, and `/finish-feature` to start sessions, create branches, validate code, and open PRs. The harness enforces the rules (`.claude/settings.json` hooks + permission gates) so we can focus on what to build.

If you're a collaborator, run `/letsriff` in Claude Code to get oriented. If you're new to the repo, start with `SETUP.md`.

## Tech

Next.js • Prisma • Postgres • Tiptap • Tailwind • Vercel • Supabase Storage

## Pipeline

`feature/* → develop → staging → main`

- **`develop`** — integration branch, all PRs land here
- **`staging`** — pre-production at `staging.letsriff.app`, Kyle promotes when ready for friends to test
- **`main`** — production at `letsriff.app`

See `CONTRIBUTING.md` for the full git workflow and `ARCHITECTURE.md` for the file map and current state.

## License

All rights reserved.
