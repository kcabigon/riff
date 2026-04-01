Complete the current feature branch: validate, push, and create a PR targeting develop. You don't need to run `/pr-check` first — this command does everything including validation.

## Steps

1. **Check current branch**:
   - Run `git branch --show-current`
   - If on `main`, `develop`, or `staging`, STOP: "You're on a protected branch. Switch to your feature branch first."

2. **Check for uncommitted changes**:
   - Run `git status`
   - If there are uncommitted changes, ask: "You have uncommitted changes. Would you like to commit them before finishing, or discard them?"

3. **Sync with develop** (mandatory — do this before validation):
   - Run `git fetch origin && git log --oneline HEAD..origin/develop`
   - If develop has new commits, merge them: `git merge origin/develop`
   - If there are conflicts, help resolve them before proceeding
   - If no new commits, continue

4. **Run validation** (same as `/pr-check`):
   - Run `npm run lint` — report errors
   - Run `npx tsc --noEmit` — report type errors
   - Run `npm run build` — verify build succeeds
   - Check no `.env` files or `docs/` files are staged
   - Check commit messages follow conventional format
   - If ANY check fails, report it and ask: "Would you like to fix these issues before creating the PR, or proceed anyway?"

5. **Update TODO.md**:
   - Read `TODO.md` and check if any in-progress items (marked with 🔨) relate to the work done on this branch
   - If found, mark them as done: change `- [ ] 🔨 @name — task description` to `- [x] task description`
   - Commit the TODO update: `chore: mark TODO items complete`

6. **Push to remote**:
   - Run `git push -u origin <branch-name>`
   - If push fails (e.g., rejected), help diagnose

7. **Create PR**:
   - Ask the user for a PR title (suggest one based on the branch name and commits)
   - Ask for a brief description of what changed and why
   - Create the PR using:
     ```
     gh pr create --base develop --title "title" --body "body"
     ```
   - Use the PR template format from `.github/pull_request_template.md`

8. **Clean up local branch only**:
   - Switch back to develop: `git checkout develop && git pull origin develop`
   - Delete the local feature branch: `git branch -d <branch-name>`
   - Do NOT delete the remote branch — it needs to stay alive for the PR. GitHub will auto-delete it when the PR is merged.

9. **Clean up session state**: Delete `.claude/session-state.md` if it exists — the feature is done.

10. **Report**:
    - Show the PR URL
    - Tell the user: "Sick! Kyle's gonna review this PR and decide if it's dope enough. Want to start something new? Run `/letsriff`."

## Important
- Never force-push unless the user explicitly asks
- Always suggest syncing with develop before creating the PR
- If the feature branch has only one commit, suggest squashing isn't needed
- Include the testing checklist in the PR body
