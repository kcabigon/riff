Promote code from one branch to the next in the deployment pipeline. This command is for Kyle only.

The pipeline is: `develop → staging → main`

Branch protection rules block direct pushes to `develop`, `staging`, and `main`. All promotions go through pull requests using the GitHub MCP tools.

## Steps

1. **Verify this is Kyle**:
   - Run `git config user.email`
   - If the email is NOT `kyle.cabigon@gmail.com`, STOP: "This command is for Kyle only — he handles promotions to staging and production. Let him know when your PR is merged and ready to go."

2. **Ask what to promote**:
   - "Promote develop to staging" (most common — makes latest work available to testers)
   - "Promote staging to main" (release to production)
   - If the user didn't specify, ask which one they want
   - Set `SOURCE` and `TARGET` accordingly (e.g., SOURCE=develop, TARGET=staging)

3. **Check for uncommitted changes**:
   - Run `git status`
   - If there are uncommitted changes, warn and ask to commit or stash first

4. **Show what's being promoted**:
   - Run `git fetch origin SOURCE TARGET` to get latest remote state
   - Run `git log --oneline origin/TARGET..origin/SOURCE` to show what's new
   - If nothing new: "Nothing to promote — branches are already in sync."
   - Show the list and ask: "These changes will go live on [staging.letsriff.app / letsriff.app]. Ready to promote?"

5. **Promote via pull request**:
   - Create a PR using `mcp__github__create_pull_request`:
     - `owner`: kcabigon
     - `repo`: riff
     - `head`: SOURCE (e.g., `develop`)
     - `base`: TARGET (e.g., `staging`)
     - `title`: "Promote SOURCE → TARGET" (e.g., "Promote develop → staging")
     - `body`: Include the commit list from step 4
   - Merge the PR immediately using `mcp__github__merge_pull_request`:
     - `merge_method`: merge
   - Report: "Promoted SOURCE → TARGET via PR #[number]."

6. **Update docs**:
   - Read `ARCHITECTURE.md` and scan the commits being promoted for changes that affect it:
     - New pages or routes added?
     - New components created?
     - New API endpoints?
     - New hooks or lib files?
     - Features completed that are listed under "What's Incomplete"?
     - New features that should be added to "What's Working"?
   - If anything needs updating, show Kyle what you'd change and ask: "Want me to update ARCHITECTURE.md with these changes?"
   - If yes:
     - Save current branch: `git branch --show-current`
     - Create a temp branch from TARGET: `git fetch origin TARGET && git checkout -b docs/update-architecture-TARGET origin/TARGET`
     - Make the edits and commit with `docs: update ARCHITECTURE.md`
     - Push the temp branch: `git push -u origin docs/update-architecture-TARGET`
     - Create a PR using `mcp__github__create_pull_request` (head: `docs/update-architecture-TARGET`, base: TARGET)
     - Merge the PR using `mcp__github__merge_pull_request`
     - Return to original branch and clean up: `git checkout ORIGINAL_BRANCH && git branch -d docs/update-architecture-TARGET`
   - If nothing needs updating, skip silently

7. **Sync local branches**:
   - Run `git fetch origin TARGET` to pull down the merged result
   - Return to the branch the user was on before the promote started

8. **Report**:
   - For develop → staging: "Staging is updated — your friends can test the latest changes at staging.letsriff.app"
   - For staging → main: "Production is updated — letsriff.app is live with the latest changes"
   - If there was an ARCHITECTURE.md update, mention that too

## Important
- Always show what's being promoted before doing it
- Never force-push
- If merge conflicts occur in the PR, help resolve them by creating a local merge branch:
  1. `git checkout -b promote/SOURCE-to-TARGET origin/TARGET`
  2. `git merge origin/SOURCE` and resolve conflicts
  3. Push the merge branch and PR it to TARGET
  4. Merge the PR
- All pushes to protected branches MUST go through pull requests — never attempt `git push origin staging` or `git push origin main` directly
