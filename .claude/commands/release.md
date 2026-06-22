Release the latest develop straight to production in one shot: `develop → staging → main` chained with a single confirmation. This command is for Kyle only.

This is the **fast-path** for situations where develop has been baking on staging long enough OR the change is small enough to skip the "test on staging first" step.

If you want to stop at staging (and test before prod), use `/promote` instead.

## Steps

1. **Verify this is Kyle**:
   - Run `git config user.email`
   - If the email is NOT `kyle.cabigon@gmail.com`, STOP: "This command is for Kyle only — he handles releases. Let him know when your PR is merged and ready to go."

2. **Check for uncommitted changes**:
   - Run `git status`
   - If there are uncommitted changes, warn and ask to commit or stash first

3. **Show what's being released**:
   - Run `git fetch origin develop staging main`
   - Run `git log --oneline origin/main..origin/develop` to show everything new that'll go to production
   - If nothing new: "Nothing to release — main is already in sync with develop."
   - Show the list and ask **once**: "⚠️ This will run develop → staging → main back-to-back. Everything above goes live on letsriff.app. No intermediate stop. Ready?"
   - If the user says no, stop. If yes, proceed without further confirmation.

4. **Promote develop → staging**:
   - Create a PR using `mcp__github__create_pull_request`:
     - `head`: `develop`
     - `base`: `staging`
     - `title`: "Promote develop → staging"
     - `body`: the commit list from step 3
   - Merge immediately using `mcp__github__merge_pull_request` with `merge_method: "merge"`
   - Note the PR number for the final report

5. **Promote staging → main**:
   - Create a PR using `mcp__github__create_pull_request`:
     - `head`: `staging`
     - `base`: `main`
     - `title`: "Promote staging → main"
     - `body`: the commit list from step 3
   - Merge immediately using `mcp__github__merge_pull_request` with `merge_method: "merge"`
   - Note the PR number for the final report

6. **Update docs (once, at the end)**:
   - Read `ARCHITECTURE.md` and scan the commits being released for changes that affect it:
     - New pages or routes added?
     - New components created?
     - New API endpoints?
     - New hooks or lib files?
     - Features completed that are listed under "What's Incomplete"?
     - New features that should be added to "What's Working"?
   - If anything needs updating, show Kyle what you'd change and ask: "Want me to update ARCHITECTURE.md with these changes?"
   - If yes:
     - Save current branch: `git branch --show-current`
     - Create a temp branch from `main`: `git fetch origin main && git checkout -b docs/update-architecture-release origin/main`
     - Make the edits and commit with `docs: update ARCHITECTURE.md`
     - Push the temp branch: `git push -u origin docs/update-architecture-release`
     - Create a PR (head: `docs/update-architecture-release`, base: `main`)
     - Merge the PR
     - Return to original branch and clean up the temp branch
   - If nothing needs updating, skip silently

7. **Sync local branches**:
   - Run `git fetch origin main` to pull down the merged result
   - Return to the branch the user was on before the release started

8. **Report**:
   - "Released. Staging and production are both updated:
     - Staging promote: PR #[N]
     - Production promote: PR #[M]
     - letsriff.app is live with the latest changes"
   - If there was an ARCHITECTURE.md update, mention that too

## Important
- Always show the full commit list before doing anything
- One confirmation gate, then no more stops — match `/release`'s "fast-path" promise
- If staging → main fails (e.g., merge conflict), stop and report. Don't try to revert the staging promote — it's better to leave staging ahead of main than to mess with two branches under pressure.
- Never force-push
- If merge conflicts occur on either promote PR, follow the same conflict resolution as `/promote`:
  1. `git checkout -b promote/SOURCE-to-TARGET origin/TARGET`
  2. `git merge origin/SOURCE` and resolve conflicts
  3. Push the merge branch and PR it to TARGET
  4. Merge the PR
