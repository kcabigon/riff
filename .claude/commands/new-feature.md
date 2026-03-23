Help the user start a new feature safely. Ask questions when anything is unclear — never guess.

## Steps

1. **Ask what they're building**: If the user didn't provide a description, ask: "Alright what do you want to build? You can give me a brief description or a super detailed plan. Whatever it is, make sure it's dope."

2. **Check current state**:
   - Run `git status` to check for uncommitted changes
   - If there are uncommitted changes, warn the user and ask: "You have uncommitted changes. Would you like to stash them, commit them, or abort?"
   - Handle their choice before proceeding

3. **Assess complexity** (do this silently — NEVER tell the user you're assessing complexity):

   Based on their description, decide if this is a **simple change** or a **complex change**.

   **Simple** — ALL of these are true:
   - Touches one file, or a tightly-coupled pair (component + its styles)
   - No new API routes, pages, or database changes
   - No new dependencies
   - Clearly scoped: copy change, color tweak, spacing fix, small UI adjustment, reordering elements, toggling visibility

   **Complex** — ANY of these are true:
   - Touches multiple files across different areas (component + API + schema, etc.)
   - New feature, new component, new page, or new API route
   - Database schema changes
   - Changes to auth, notifications, editor, or riff lifecycle
   - Description is vague or could be interpreted multiple ways
   - When in doubt, treat it as complex

4. **Switch to develop and update**:
   - Run `git checkout develop && git pull origin develop`
   - If this fails, report the error and ask how to proceed

5. **Create branch name**:
   - Generate a branch name from the description using the format `feature/short-kebab-description` (or `fix/short-kebab-description` for bug fixes)
   - Show the proposed branch name and ask the user to confirm: "I'll create branch `feature/your-name-here`. Does that look right?"
   - Wait for confirmation before creating

6. **Create and checkout branch**:
   - Run `git checkout -b feature/the-branch-name`
   - Confirm success

---

## If SIMPLE: Fast-track it

7. **Read the relevant file(s)**: Identify which file(s) need to change and read them to understand the current patterns. Keep it to the minimum needed.

8. **Make the change**: Just do it. No proposal step, no asking which area of the codebase — you already know from their description.

9. **Validate**:
   - Run `npm run lint` and `npx tsc --noEmit`
   - If either fails, fix the issues

10. **Commit**: Create a conventional commit (e.g., `fix: update button color on club page`)

11. **Done**: Tell the user what you changed in one or two sentences. Offer: "Want me to run `/finish-feature` to push this and create a PR?"

---

## If COMPLEX: Plan first, then build

7. **Enter plan mode**: Call the `EnterPlanMode` tool. This locks you into read-only mode — you cannot write any code until the plan is approved. This is intentional.

8. **Explore the codebase**: Read `ARCHITECTURE.md` if you haven't this session. Then explore the specific files and areas the feature will touch. Use Explore agents to search broadly if needed.

9. **Ask clarifying questions** (if needed): If their description is vague or could go multiple ways, ask ONE round of clarifying questions. Keep it conversational — don't interrogate. Examples:
   - "Just to make sure I build this right — when you say X, do you mean A or B?"
   - "Quick question before I dive in — should this also do Y, or just X for now?"

10. **Write your plan**: Write a clear, non-technical plan to the plan file. Use plain language. Structure it as:
    - **What you're building** — one sentence summary
    - **Steps** — numbered list in terms the user understands ("I'll add a new section to the club page" not "I'll create a new React component with a useEffect hook")
    - **What it won't do** — call out anything you're intentionally leaving out to keep scope tight
    - End the plan with a note: any concerns or things you want their input on

11. **Exit plan mode**: Call `ExitPlanMode`. The user will review and approve the plan.

12. **Guide them into accept-edits mode**: After the plan is approved, tell the user: "Alright I'm about to go crazy on this. **Press `A` or `Shift+Tab` to turn on accept-edits mode** so I can build this without stopping for every file change. Then just sit back and watch."

13. **Execute the plan**: Build the feature. If it's a large change, check in at natural breakpoints ("Got the UI built — moving on to the API next."). Don't ask for permission at every step — the plan is approved, keep moving.

14. **Validate**:
    - Run `npm run lint` and `npx tsc --noEmit`
    - If either fails, fix the issues

15. **Commit**: Create one or more conventional commits (one per logical change if the feature is large)

16. **Done**: Summarize what you built. Offer: "Want me to run `/finish-feature` to push this and create a PR?"

---

## Important
- Never create a branch without user confirmation of the name
- Never write code without understanding the existing patterns in the area you're modifying
- The complexity assessment is for YOUR decision-making — never expose it to the user. They should feel like the flow is natural, not that they've been categorized.
- If you initially assess something as simple but realize mid-execution it's actually complex, STOP, explain what you found, and switch to the complex flow (call `EnterPlanMode`)
- If the feature seems very large even for complex, suggest breaking it into smaller pieces
- Remind the user they can run `/sync` to stay up to date with develop while working
