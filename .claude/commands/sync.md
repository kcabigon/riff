Safely sync the current feature branch with the latest changes from develop. This prevents merge conflicts from piling up.

## Steps

1. **Check current branch**:
   - Run `git branch --show-current`
   - If on `develop`: just run `git pull origin develop` and report what was pulled. No merge needed — you're already on develop.
   - If on `main` or `staging`, STOP: "This command is for syncing feature branches with develop. Switch to your feature branch first."

2. **Check for uncommitted changes**:
   - Run `git status`
   - If there are uncommitted changes, ask: "You have uncommitted changes. Would you like to commit them first, stash them, or abort the sync?"
   - Handle their choice before proceeding

3. **Fetch latest**:
   - Run `git fetch origin`

4. **Show what's changed**:
   - Run `git log --oneline HEAD..origin/develop` to show commits on develop that aren't in this branch
   - If no new commits: "Your branch is already up to date with develop. No sync needed."
   - If there are new commits, show them and say: "These commits have been added to develop since you branched off. I'll merge them in."

5. **Merge develop**:
   - Run `git merge origin/develop`
   - If merge succeeds cleanly: "Merge successful! No conflicts."
   - If there are conflicts: proceed to conflict resolution

6. **Conflict resolution** (if needed):
   - Run `git diff --name-only --diff-filter=U` to list conflicted files
   - For each conflicted file:
     - Read the file to understand the conflict
     - Explain what both sides changed
     - Ask the user how they'd like to resolve it (keep theirs, keep ours, combine)
     - Make the edit they choose
     - Run `git add <file>` to mark as resolved
   - After all conflicts resolved, run `git commit` to complete the merge

7. **Verify build**:
   - Run `npm run build` to make sure nothing broke
   - If build fails, help diagnose and fix

8. **Summary**:
   - Report how many commits were merged
   - Report if any conflicts were resolved
   - Confirm the build passes

## Important
- Never force-push or rebase without explicit user permission
- If conflicts are complex, explain both sides clearly and let the user decide
- Always verify the build after syncing — catching issues early is the whole point
- If the merge looks risky (many conflicting files), suggest the user review the diff before proceeding
