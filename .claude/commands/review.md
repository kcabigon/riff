Review open PRs, run code quality checks, test locally, and approve. This is the full PR review workflow.

## Arguments

- `/review` — no argument: show the PR dashboard, pick a PR to review
- `/review 44` — jump straight to reviewing PR #44

---

## Flow A — PR Dashboard (no argument)

### Step 1 — Show open PRs

Run:
```
gh pr list --base develop --json number,title,body,author,createdAt,headRefName
```

Display a clean list for each open PR:
```
#44 • feat: add comment notifications • jarric22 • 3 days ago
#41 • fix: club banner upload • cdpeders • 1 week ago
```

If no open PRs: "No open PRs right now — everyone's either building or done. Run `/letsriff` to start something new."

Ask: "Which one do you want to review?"

---

## Flow B — Single PR (argument provided or chosen from dashboard)

### Step 2 — PR summary

Run `gh pr view <number> --json title,body,changedFiles,author` and give a plain-English summary:
- What the PR does (one sentence)
- Which files it touches (grouped by area: components, API routes, schema, etc.)
- Who wrote it and when it was opened

### Step 3 — Automatic code quality check (no asking — always run this)

Run `gh pr diff <number>` and analyze the full diff. Check for:

**Design system violations**
- Hardcoded hex colors not in the design system palette — flag the color, suggest the correct one
- `border-radius` other than `0px` or `64px`
- `1px solid #000` borders (should be `2px solid #000` for primary, `1px solid #E6E6E6` for dividers)
- `box-shadow` values that don't match a design system shadow
- `fontFamily` not using CSS variables (`--font-dm-sans`, `--font-dm-serif-text`, `--font-playfair`, `--font-over-the-rainbow`)
- Padding/margin values that aren't multiples of 4px

**Component reuse**
- New button that should use `PrimaryButton`, `SecondaryButton`, or `CTAButton`
- New modal that should use `Modal`
- New input that should use `TextInput`
- New dropdown that should use `Dropdown`
- New image upload that should use `ImageUploadModal`
- New avatar that should use `Avatar`
- New close/back button that should use `CloseButton`/`BackButton`

**Code quality**
- `console.log` statements
- `as any` TypeScript casts
- `eslint-disable` comments
- `// TODO` or `// FIXME` comments
- Hardcoded API URLs (should use relative paths)

**Security**
- New API routes missing `requireAuth()`

**Scope and breaking changes**
- Files changed that don't match the PR title/description
- Shared component edits (Modal, Avatar, PrimaryButton, Dropdown, etc.) that could break other pages — flag which files import the changed component
- API response shape changes that other components depend on

**Database — loud warning if triggered**
- If `prisma/schema.prisma` is in the diff: "🚨 This PR changes the database schema. Schema changes need Kyle's coordination — do not approve without checking with him first."

**Edge cases and robustness**
- New API routes missing try/catch or appropriate status codes
- Missing empty states (what happens when a list has zero items)
- Missing loading states
- Null/undefined not handled

**Accessibility**
- Missing `alt` text on `<img>` tags
- Click handlers on `<div>` instead of `<button>`
- Missing `aria-label` on icon-only buttons

**Mobile responsiveness**
- Fixed pixel widths that would break on small screens
- Missing responsive patterns

**Present findings as:**

> **Must Fix** — design system violations, missing component reuse, missing auth, schema changes, breaking changes
> **Should Fix** — code quality, missing error handling, accessibility
> **Consider** — mobile gaps, missing edge cases, minor suggestions

For each finding: file + line reference, what's wrong, how to fix it.

If nothing found: "Code looks clean — no violations, good component reuse, quality checks pass."

### Step 4 — Offer to test locally

Ask: "Want to test this locally?"

**If yes:**

1. Save their current branch: run `git branch --show-current` and store it
2. Run `gh pr checkout <number>`
3. **Immediately print this warning — do not skip it:**
   > "⚠️ You are now on [author]'s branch (`feature/xyz`). This is their code, not yours.
   > **Do NOT make any commits here.** You're here to test, not build.
   > When you're done, just say so and I'll get you back to develop automatically."
4. Start the dev server: `npm run dev` in the background
5. Tell them: "Server is running at http://localhost:3000 — go test it. Come back here when you're done."

**While on someone else's branch:**
- If the user asks to commit, stage files, or make any code changes: **refuse every time**
  > "You're on [author]'s branch — I can't commit here. When you're done testing, say the word and I'll get you back to develop."
- If they ask to create a new feature or start something new: remind them to finish reviewing first

**When they say they're done testing** (any variation of "done", "looks good", "finished", "all good", etc.):
1. Stop the dev server: `kill $(lsof -t -i:3000)` if running
2. Run `git checkout develop` — no asking, do it automatically
3. Confirm: "Back on develop. You're safe to build."

### Step 5 — Approve, comment, or request changes

Ask: "Ready to approve, leave a comment, or request changes?"

**Approve:**
- Check for self-approval: run `gh pr view <number> --json author --jq '.author.login'` and `gh api user --jq '.login'`
- If they match: "You can't approve your own PR — you need someone else to review it."
- If clear: run `gh pr review <number> --approve --body "Looks good!"`
- Confirm: "Approved! PR #[number] is one vote closer to merging."

**Comment:**
- Ask what they want to say
- Post via `gh pr comment <number> --body "..."`

**Request changes:**
- Ask what needs to be fixed
- Post via `gh pr review <number> --request-changes --body "..."`

**Skip for now:**
- "No problem — the PR stays open. Come back when you're ready."

---

## Important

- Be constructive, not nitpicky. Focus on real issues that affect quality or consistency.
- Don't flag intentionally different patterns (e.g., the leaderboard has its own dark theme — that's fine).
- If a PR introduces a genuinely new pattern, don't flag it as a violation — suggest adding it to the design system instead.
- Only flag colors in component styling, not in data/config (e.g., a COLORS array in a chart component is fine).
- The branch safety rules are non-negotiable — always warn after checkout, always return to develop when done.
