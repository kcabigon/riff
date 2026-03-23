You are starting a new session on the Riff project. This is the entry point — do everything the user needs to get oriented and productive.

## Step 1: Load project context

Read the file `ARCHITECTURE.md` in the project root. This gives you the full project context: tech stack, file map, design system, current state, and what's working. Do NOT summarize it back to the user — just internalize it silently.

## Step 2: Check their environment

Run these checks silently (don't narrate each one unless there's a problem):
- `git branch --show-current` — what branch are they on?
- `git status` — any uncommitted changes?
- Check if `.env.development` exists — if not, they need to set up first (route to `/setup`)
- Check if `node_modules/` exists — if not, they need to run `npm install`

If there are problems (no env file, no node_modules, wrong branch), address them before continuing.

## Step 3: Understand their state

If they're on a feature branch (not `develop`/`main`/`staging`):
- Show what branch they're on
- Run `git log --oneline develop..HEAD` to show their progress
- Ask: "Looks like you were working on `feature/xyz`. Want to keep going, or start something new?"

If they're on `develop`:
- They're ready to start something new
- Read `TODO.md` in the project root and show 3-5 unclaimed items from the highest-priority section: "Here are some things on the TODO list if you're looking for ideas:" — but don't force it, they can always describe their own idea
- Mention they can run `/todo` to see the full list

## Step 4: Ask what they want to do

Present these options naturally (not as a numbered list — keep it conversational):

- **Build something new** — "Alright what do you want to build? You can give me a brief description or a super detailed plan. Whatever it is, make sure it's dope." Then follow the `/new-feature` flow.
- **Continue where they left off** — Pick up on their current feature branch, read the relevant files, and get back to work.
- **Fix a bug** — Ask what's broken, create a `fix/` branch, and investigate.
- **Explore / understand the code** — Ask what they're curious about and walk them through it. Be patient and clear — they may not be very technical.
- **Review or finish up** — If they have work ready, route to `/pr-check` or `/finish-feature`.

## Step 5: Get to work

Once you know what they want to do, execute. Don't over-explain or ask too many questions upfront. Get moving and check in as you go.

## Important
- Your user may not be very technical. Be clear, friendly, and avoid jargon unless they use it first.
- Never guess at what they want — ask if you're unsure.
- If something goes wrong (build fails, merge conflict, etc.), explain what happened in plain language and help fix it.
- Proactively suggest relevant slash commands when they'd help (e.g., "want me to run `/sync` to grab the latest changes?")
- Never commit to `main`, `develop`, or `staging` directly.
- Never commit `.env` files or anything in `docs/`.
- Always follow the project's git workflow: feature branches, conventional commits, PRs to develop.
