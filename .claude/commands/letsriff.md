You are starting a new session on the Riff project. This is the entry point — do everything the user needs to get oriented and productive.

## Step 1: Restore context

Check if `.claude/session-state.md` exists. If it does, read it — the user may be resuming after a compaction or new session. If session state exists and they're mid-track (on a feature branch, in the middle of building/testing), tell them where they left off and suggest the next step:
- "Looks like you were building [description] on `feature/xyz`. Want to keep going, or start fresh?"
- If the build was complete: "Your build on `feature/xyz` is done. Ready to test with `/test` or submit with `/finish-feature`?"

**If session state doesn't exist**, reconstruct from git:
- Run `git branch --show-current` — if on a feature branch, the branch name tells you what they were building
- Run `git log --oneline develop..HEAD` — shows their progress on the branch
- Check if any plan files exist: look in `.claude/plans/` for `.md` files. If one exists, read it to understand the plan.
- Use this info to tell them where they are: "You're on `feature/xyz` with N commits. Want to keep going?"

## Step 2: Load project context

Read `ARCHITECTURE.md` and `DESIGN-SYSTEM.md` in the project root. ARCHITECTURE.md gives you the tech stack, file map, schema, and current state. DESIGN-SYSTEM.md gives you the visual design system, colors, typography, spacing, and shared component catalog. Do NOT summarize them back to the user — just internalize them silently.

## Step 3: Check their environment

Run these checks silently (don't narrate each one unless there's a problem):
- `git branch --show-current` — what branch are they on?
- `git status` — any uncommitted changes?
- Check if `.env.development` exists — if not, they need to set up first (route to `/setup`)
- Check if `node_modules/` exists — if not, they need to run `npm install`
- `lsof -i :3000 2>/dev/null | grep LISTEN` — is a dev server already running? If so, mention it: "Heads up — the dev server is already running on port 3000. Want me to restart it, kill it, or leave it?"

If there are problems (no env file, no node_modules, wrong branch), address them before continuing.

## Step 4: Understand their state

If they're on a feature branch (not `develop`/`main`/`staging`):
- Show what branch they're on
- Run `git log --oneline develop..HEAD` to show their progress
- Ask: "Looks like you were working on `feature/xyz`. Want to keep going, or start something new?"

If they're on `develop`:
- They're ready to start something new
- Read `TODO.md` in the project root and show 3-5 unclaimed items from the highest-priority section: "Here are some things on the TODO list if you're looking for ideas:" — but don't force it, they can always describe their own idea
- Mention they can run `/todo` to see the full list

## Step 5: Ask what they want to do

Present these options naturally (not as a numbered list — keep it conversational):

- **Build something new** — "Alright what do you want to build? You can give me a brief description or a super detailed plan. Whatever it is, make sure it's dope." Then follow the `/new-feature` flow.
- **Continue where they left off** — Pick up on their current feature branch, read the relevant files, and get back to work.
- **Fix a bug** — Ask what's broken, create a `fix/` branch, and investigate.
- **Explore / understand the code** — Ask what they're curious about and walk them through it. Be patient and clear — they may not be very technical.
- **Review or finish up** — If they have work ready, route to `/finish-feature`.

## Step 6: Get to work

Once you know what they want to do, execute. Don't over-explain or ask too many questions upfront. Get moving and check in as you go.

## Important
- Your user may not be very technical. Be clear, friendly, and avoid jargon unless they use it first.
- Never guess at what they want — ask if you're unsure.
- If something goes wrong (build fails, merge conflict, etc.), explain what happened in plain language and help fix it.
- Proactively suggest relevant slash commands when they'd help (e.g., "want me to run `/sync` to grab the latest changes?")
- Never commit to `main`, `develop`, or `staging` directly.
- Never commit `.env` files or anything in `docs/`.
- Always follow the project's git workflow: feature branches, conventional commits, PRs to develop.
