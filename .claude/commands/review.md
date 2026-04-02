Review a PR for design system adherence, component reuse, code quality, and overall readiness to merge. This catches issues before Kyle manually reviews.

## Arguments

If the user provides a PR number or URL, review that PR. If no argument is given, check if there's a current branch with an open PR and review that. If neither, ask which PR to review.

## Steps

1. **Get the PR diff**:
   - Run `gh pr diff <number>` to get the full diff
   - Run `gh pr view <number> --json title,body,changedFiles` to get context

2. **Read the design system**: Read `DESIGN-SYSTEM.md` to understand the current colors, spacing, borders, shadows, and shared component catalog.

3. **Check for design system violations**:
   - **Hardcoded colors**: Flag any hex color in the diff that isn't in the design system palette. List the offending color and suggest the correct design system color.
   - **Wrong borders**: Flag any `1px solid #000` (should be `2px solid #000` for primary, or `1px solid #E6E6E6` for dividers). Flag any `border-radius` other than `0px` or `64px`.
   - **Wrong shadows**: Flag any `box-shadow` that doesn't match a shadow from the design system.
   - **Wrong fonts**: Flag any `fontFamily` that doesn't use the CSS variables (`--font-dm-sans`, `--font-dm-serif-text`, `--font-playfair`, `--font-over-the-rainbow`).
   - **Wrong spacing**: Flag padding/margin values that aren't multiples of 4px.

4. **Check for component reuse**:
   - Is there a new button that should use PrimaryButton or SecondaryButton?
   - Is there a new modal that should use Modal?
   - Is there a new input that should use TextInput?
   - Is there a new dropdown that should use Dropdown?
   - Is there a new image upload that should use ImageUploadModal?
   - Is there a new avatar that should use Avatar?
   - Is there a new close/back button that should use CloseButton/BackButton?
   - Flag each case with: "This looks like it could use [component] from the shared catalog instead of building a new one."

5. **Check for code quality**:
   - Any `console.log` statements left in?
   - Any `// TODO` or `// FIXME` comments?
   - Any `as any` TypeScript casts?
   - Any `eslint-disable` comments?
   - Any hardcoded API URLs (should use relative paths)?
   - Any missing `requireAuth()` on new API routes?

6. **Check scope and breaking changes**:
   - **Scope creep**: Are there files changed that seem unrelated to the PR title/description? Flag them.
   - **Shared component changes**: Does the PR modify shared components (Modal, Avatar, PrimaryButton, Dropdown, etc.) in ways that could break other pages? If so, flag which other files import the changed component.
   - **API changes**: Does the PR change API response shapes that other components depend on? Flag the consumers.
   - **Database changes**: Does the PR touch `prisma/schema.prisma`? If so, flag immediately — schema changes need Kyle's coordination.

7. **Check edge cases and robustness**:
   - Does a new API route handle errors properly (try/catch, appropriate status codes)?
   - Are there missing empty states (what happens when the list has zero items)?
   - Are there missing loading states?
   - Does it handle the case where data is null/undefined?

8. **Check accessibility**:
   - Missing `alt` text on `<img>` tags?
   - Click handlers on `<div>` instead of `<button>`?
   - Missing `aria-label` on icon-only buttons?
   - Interactive elements that aren't keyboard-accessible?

9. **Check mobile responsiveness**:
   - New UI using fixed pixel widths that would break on small screens?
   - Missing responsive patterns (flex-col on mobile, padding changes)?
   - Does the area being modified already have responsive styles it should follow?

10. **Report findings**:
    Present a clean summary organized by severity:

    **Must Fix** — design system violations, missing component reuse, breaking changes, security issues, schema changes without coordination
    **Should Fix** — code quality issues, missing error handling, accessibility problems, scope creep
    **Consider** — mobile responsiveness gaps, missing edge cases, minor suggestions

    For each finding, include:
    - File and line reference
    - What's wrong
    - How to fix it (specific suggestion)

    If no issues found: "This PR looks clean — no design system violations, good component reuse, code quality checks pass. Ship it."

11. **Offer to post as PR comment**:
    Ask: "Want me to post this review as a comment on the PR?"
    If yes, use `gh pr comment <number> --body "..."` to post it.

## Important
- Be constructive, not nitpicky. Focus on real issues that affect consistency or quality.
- Don't flag things that are intentionally different (e.g., the leaderboard page has its own dark theme — that's fine).
- If a PR introduces a genuinely new pattern that doesn't exist yet, don't flag it as a violation — suggest adding it to the design system instead.
- Only flag colors in actual component styling, not in data/config (e.g., the leaderboard's COLORS array is fine).
- Keep the review concise. Reviewers should be able to scan it in under a minute.
