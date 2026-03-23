Complete the current feature branch: validate, push, and create a PR targeting develop.

## Steps

1. **Check current branch**:
   - Run `git branch --show-current`
   - If on `main`, `develop`, or `staging`, STOP: "You're on a protected branch. Switch to your feature branch first."

2. **Check for uncommitted changes**:
   - Run `git status`
   - If there are uncommitted changes, ask: "You have uncommitted changes. Would you like to commit them before finishing, or discard them?"

3. **Run validation** (same as `/pr-check`):
   - Run `npm run lint` — report errors
   - Run `npx tsc --noEmit` — report type errors
   - Run `npm run build` — verify build succeeds
   - Check no `.env` files or `docs/` files are staged
   - Check commit messages follow conventional format
   - If ANY check fails, report it and ask: "Would you like to fix these issues before creating the PR, or proceed anyway?"

4. **Sync with develop**:
   - Run `git fetch origin && git log --oneline HEAD..origin/develop`
   - If develop has new commits, ask: "Develop has new commits. Would you like to sync first (recommended) or proceed?"
   - If they want to sync, run the sync flow from `/sync`

5. **Push to remote**:
   - Run `git push -u origin <branch-name>`
   - If push fails (e.g., rejected), help diagnose

6. **Create PR**:
   - Ask the user for a PR title (suggest one based on the branch name and commits)
   - Ask for a brief description of what changed and why
   - Create the PR using:
     ```
     gh pr create --base develop --title "title" --body "body"
     ```
   - Use the PR template format from `.github/pull_request_template.md`

7. **Clean up branch**:
   - Switch back to develop: `git checkout develop && git pull origin develop`
   - Delete the local feature branch: `git branch -d <branch-name>`
   - Delete the remote feature branch: `git push origin --delete <branch-name>`

8. **Report**:
   - Show the PR URL
   - Tell the user: "Sick! Kyle's gonna review this PR and decide if it's dope enough. You can continue working on other features in the meantime."

## Important
- Never force-push unless the user explicitly asks
- Always suggest syncing with develop before creating the PR
- If the feature branch has only one commit, suggest squashing isn't needed
- Include the testing checklist in the PR body
