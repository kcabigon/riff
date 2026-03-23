Promote code from one branch to the next in the deployment pipeline. This command is for Kyle only.

The pipeline is: `develop → staging → main`

## Steps

1. **Ask what to promote**:
   - "Promote develop to staging" (most common — makes latest work available to testers)
   - "Promote staging to main" (release to production)
   - If the user didn't specify, ask which one they want

2. **Check for uncommitted changes**:
   - Run `git status`
   - If there are uncommitted changes, warn and ask to commit or stash first

3. **Show what's being promoted**:
   - For develop → staging: run `git log --oneline staging..develop` to show what's new
   - For staging → main: run `git log --oneline main..staging` to show what's new
   - If nothing new: "Nothing to promote — branches are already in sync."
   - Show the list and ask: "These changes will go live on [staging.letsriff.app / letsriff.app]. Ready to promote?"

4. **Promote**:
   - Save current branch: `git branch --show-current`
   - For develop → staging:
     ```
     git checkout staging
     git merge develop
     git push origin staging
     ```
   - For staging → main:
     ```
     git checkout main
     git merge staging
     git push origin main
     ```
   - Return to the original branch

5. **Update docs**:
   - Read `ARCHITECTURE.md` and scan the commits being promoted for changes that affect it:
     - New pages or routes added?
     - New components created?
     - New API endpoints?
     - New hooks or lib files?
     - Features completed that are listed under "What's Incomplete"?
     - New features that should be added to "What's Working"?
   - If anything needs updating, show Kyle what you'd change and ask: "Want me to update ARCHITECTURE.md with these changes?"
   - If yes, make the edits, commit with `docs: update ARCHITECTURE.md`, and push to the target branch
   - If nothing needs updating, skip silently

6. **Report**:
   - Confirm the merge and push succeeded
   - "Staging is updated — your friends can test the latest changes at staging.letsriff.app"
   - Or "Production is updated — letsriff.app is live with the latest changes"

## Important
- Always show what's being promoted before doing it
- Never force-push
- If merge conflicts occur, help resolve them
