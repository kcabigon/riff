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

4. **Check TODO.md for a match**:
   - Read `TODO.md` and check if the user's description matches an existing TODO item
   - If it matches, note which item — you'll mark it as in-progress after creating the branch
   - If it doesn't match, ask: "Want me to add this to the TODO list so everyone knows you're working on it?" — if yes, you'll add it after creating the branch

5. **Switch to develop and update**:
   - Run `git checkout develop && git pull origin develop`
   - If this fails, report the error and ask how to proceed

6. **Create branch name**:
   - Generate a branch name from the description using the format `feature/short-kebab-description` (or `fix/short-kebab-description` for bug fixes)
   - Show the proposed branch name and ask the user to confirm: "I'll create branch `feature/your-name-here`. Does that look right?"
   - Wait for confirmation before creating

7. **Create and checkout branch**:
   - Run `git checkout -b feature/the-branch-name`
   - Confirm success

8. **Update TODO.md**:
   - If the user's work matches a TODO item, mark it as in-progress: `- [ ] 🔨 @name — task description`
   - If the user said yes to adding it, add a new in-progress item to the appropriate section
   - To get the user's name, run `git config user.name` and use their first name lowercase
   - Commit the TODO update: `chore: claim TODO item`

---

## If SIMPLE: Fast-track it

9. **Check design system and reusable components**: Before writing any code, read `DESIGN-SYSTEM.md`. If the change involves UI, use the correct colors, spacing, borders, and shadows from the design system. Check the Shared Component Catalog for existing components you can use. Never rebuild something that already exists.

10. **Read the relevant file(s)**: Identify which file(s) need to change and read them to understand the current patterns. Keep it to the minimum needed.

11. **Make the change**: Just do it. No proposal step, no asking which area of the codebase — you already know from their description.

12. **Validate**:
    - Run `npm run lint` and `npx tsc --noEmit`
    - If either fails, fix the issues

13. **Commit**: Create a conventional commit (e.g., `fix: update button color on club page`)

14. **Done**: Tell the user what you changed in one or two sentences. Offer: "Want me to run `/finish-feature` to push this and create a PR?"

---

## If COMPLEX: Plan first, then build

9. **Enter plan mode**: Call the `EnterPlanMode` tool. This locks you into read-only mode — you cannot write any code until the plan is approved. This is intentional.

10. **Explore the codebase, design system, and existing components**: Read `DESIGN-SYSTEM.md` and `ARCHITECTURE.md` if you haven't this session. Then explore the specific files and areas the feature will touch. Check the Shared Component Catalog in `DESIGN-SYSTEM.md` for existing components you can reuse. Use Explore agents to search broadly if needed.

11. **Q&A mode — fill in the gaps**: Before writing the plan, use the `AskUserQuestion` tool to ask 2-5 multiple choice questions about the build. This is how you fill in gaps in your understanding and make sure the plan is right before writing it. Guidelines:
    - Use `AskUserQuestion` with 2-4 options per question — the tool automatically adds an "Other" option so the user can provide a custom answer
    - When you feel strongly about an approach, mark your recommended option with "(Recommended)" at the end of the label
    - Focus on questions that would change how you build it: scope decisions, UX choices, where things should live, which patterns to follow
    - Don't ask obvious questions you can answer from the codebase or design system
    - Keep questions non-technical — remember your user may not be an engineer
    - You can ask all questions in a single `AskUserQuestion` call (multiple questions at once) or spread them across rounds if later questions depend on earlier answers
    - Examples of good questions:
      - "Where should this new section appear on the page?" (with layout options)
      - "Should this work on mobile too, or desktop only for now?"
      - "When the user clicks X, what should happen?" (with behavior options)

12. **Write your plan**: Write a clear, non-technical plan to the plan file. Use plain language. Structure it as:
    - **What you're building** — one sentence summary
    - **Existing components I'll reuse** — list which shared components from `DESIGN-SYSTEM.md` will be used (e.g., "Modal for the dialog, PrimaryButton for the CTA, Avatar for user display")
    - **Design system elements** — which colors, typography, spacing, border/shadow patterns from `DESIGN-SYSTEM.md` will be used
    - **Am I rebuilding something?** — if any part of the plan involves creating a new component that's similar to an existing one, flag it explicitly and ask: "This looks similar to [existing component]. Should I reuse/extend that instead of building from scratch?" Always get confirmation before creating new UI components.
    - **Steps** — numbered list in terms the user understands ("I'll add a new section to the club page" not "I'll create a new React component with a useEffect hook")
    - **What it won't do** — call out anything you're intentionally leaving out to keep scope tight
    - End the plan with a note: any concerns or things you want their input on

13. **Exit plan mode**: Call `ExitPlanMode`. The user will review and approve the plan.

14. **Guide them into accept-edits mode**: After the plan is approved, tell the user: "Alright I'm about to go crazy on this. **Press `A` or `Shift+Tab` to turn on accept-edits mode** so I can build this without stopping for every file change. Then just sit back and watch."

15. **Execute the plan**: Build the feature. If it's a large change, check in at natural breakpoints ("Got the UI built — moving on to the API next."). Don't ask for permission at every step — the plan is approved, keep moving.

16. **Validate**:
    - Run `npm run lint` and `npx tsc --noEmit`
    - If either fails, fix the issues

17. **Commit**: Create one or more conventional commits (one per logical change if the feature is large)

18. **Done**: Summarize what you built. Offer: "Want me to run `/finish-feature` to push this and create a PR?"

---

## Important
- Never create a branch without user confirmation of the name
- Never write code without understanding the existing patterns in the area you're modifying
- **Never create a new component if a reusable one already exists.** Always check `DESIGN-SYSTEM.md` for the Shared Component Catalog before building anything new. If you need a button, use PrimaryButton or SecondaryButton. If you need a modal, use Modal. If you need an input, use TextInput. If you need image upload, use ImageUploadModal.
- **Always follow `DESIGN-SYSTEM.md` for colors, spacing, borders, and shadows.** Never hardcode a color that isn't in the design system. If you need a new color, ask the user first.
- The complexity assessment is for YOUR decision-making — never expose it to the user. They should feel like the flow is natural, not that they've been categorized.
- If you initially assess something as simple but realize mid-execution it's actually complex, STOP, explain what you found, and switch to the complex flow (call `EnterPlanMode`)
- If the feature seems very large even for complex, suggest breaking it into smaller pieces
- Remind the user they can run `/sync` to stay up to date with develop while working
