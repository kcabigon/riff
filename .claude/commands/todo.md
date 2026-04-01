View and manage the shared TODO list. This is how the team tracks what's available, what's in progress, and what's done.

## Steps

1. **Read TODO.md** in the project root and display it to the user, formatted cleanly:
   - Group items by section (Immediate, Soon, Backlog, Tech Debt)
   - Show status clearly:
     - `- [ ]` → Available
     - `- [ ] 🔨 @name` → In progress (show who's working on it)
     - `- [x]` → Done
   - Skip sections that are entirely done (all items checked off)

2. **Ask what they want to do**:
   - **Claim an item** — "Which one do you want to work on?" Let them pick by describing it or pointing to it. Mark it as in-progress with their name (`🔨 @name`), commit the change (`chore: claim TODO item`), then **automatically start the `/new-feature` flow** with the TODO item description as the feature description (skip the "what do you want to build?" question — you already know).
   - **Add an item** — Ask what they want to add and which section it belongs in. Add it as `- [ ]` (unclaimed). Commit: `chore: add TODO item`
   - **Mark something done** — Ask which item. Change it to `- [x]`. Commit: `chore: complete TODO item`
   - **Remove an item** — Ask which item. Delete the line. Commit: `chore: remove TODO item`
   - **Just looking** — That's fine too. No action needed.

3. **Get their name**: When claiming an item, run `git config user.name` and use their first name lowercase for the `@name` tag.

## Important
- If the user is on a feature branch, commit TODO changes to that branch
- If the user is on `develop`, create a `chore/update-todo` branch for the change, commit, push, and switch back to develop. Never commit directly to develop.
- When claiming an item, the TODO update gets committed as part of the `/new-feature` flow (which creates a feature branch first)
- Keep the TODO format consistent — don't restructure or reformat existing items
- When claiming and starting `/new-feature`, the complexity assessment still applies — simple TODO items get fast-tracked, complex ones get plan mode
