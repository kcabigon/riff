Run a pre-PR validation checklist. Do each step sequentially — stop and report if any step fails. Do NOT skip steps or make assumptions.

## Steps

1. **Check branch**: Run `git branch --show-current`. If the branch is `main`, `develop`, or `staging`, STOP and tell the user they need to be on a feature branch. Do not proceed.

2. **Check for uncommitted changes**: Run `git status`. If there are uncommitted changes, warn the user and ask if they want to commit them first before continuing.

3. **Check for sensitive files**: Run `git diff --cached --name-only` and `git diff --name-only` to check if any `.env` files or files in `docs/` are staged or modified. If found, STOP and warn — these should never be committed.

4. **Lint**: Run `npm run lint`. Report any errors found. If lint fails, show the errors and ask the user if they want to fix them before continuing.

5. **Type check**: Run `npx tsc --noEmit`. Report any type errors. If it fails, show errors and ask if the user wants to fix them.

6. **Build**: Run `npm run build`. If it fails, show the error and stop.

7. **Commit message check**: Run `git log --oneline develop..HEAD` to show all commits on this branch. Check that each commit message follows conventional commit format (`feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `docs:`, `perf:`, `test:`). Flag any that don't follow the format.

8. **Summary**: Show a summary:
   - Branch name
   - Number of commits ahead of develop
   - Files changed (from `git diff --stat develop..HEAD`)
   - All checks passed / which failed

9. **Offer to create PR**: If all checks pass, ask the user if they want to create a PR targeting `develop`. If yes, ask for a title and description, then use `gh pr create --base develop` with the PR template format from `.github/pull_request_template.md`.

## Important
- Never guess at fixes — report what's wrong and let the user decide
- If you're unsure about something, ask
- Do not modify any files during this check unless the user explicitly asks
