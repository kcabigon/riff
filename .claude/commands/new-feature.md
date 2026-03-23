Help the user start a new feature safely. Ask questions when anything is unclear — never guess.

## Steps

1. **Ask what they're building**: If the user didn't provide a description, ask: "Alright what do you want to build? You can give me a brief description or a super detailed plan. Whatever it is, make sure it's dope."

2. **Check current state**:
   - Run `git status` to check for uncommitted changes
   - If there are uncommitted changes, warn the user and ask: "You have uncommitted changes. Would you like to stash them, commit them, or abort?"
   - Handle their choice before proceeding

3. **Switch to develop and update**:
   - Run `git checkout develop && git pull origin develop`
   - If this fails (e.g., due to uncommitted changes), report the error and ask how to proceed

4. **Create branch name**:
   - Generate a branch name from the description using the format `feature/short-kebab-description`
   - Show the proposed branch name and ask the user to confirm: "I'll create branch `feature/your-name-here`. Does that look right?"
   - Wait for confirmation before creating

5. **Create and checkout branch**:
   - Run `git checkout -b feature/the-branch-name`
   - Confirm success

6. **Understand the codebase context**:
   - Read `CLAUDE.md` and `ARCHITECTURE.md` for project context if you haven't already this session
   - Ask: "Which area of the codebase will this touch?" and offer common areas:
     - Frontend components (`src/components/`)
     - Pages (`src/app/`)
     - API routes (`src/app/api/`)
     - Database schema (`prisma/schema.prisma`)
     - Hooks/utilities (`src/hooks/`, `src/lib/`)
   - Explore the relevant files to understand the current state

7. **Propose approach**:
   - Based on the feature description and codebase exploration, suggest an implementation approach
   - Ask for confirmation before writing any code
   - If you're unsure about anything, ask rather than guessing

## Important
- Never create a branch without user confirmation of the name
- Never write code without understanding the existing patterns in the area you're modifying
- If the feature seems large, suggest breaking it into smaller pieces
- Remind the user they can run `/sync` to stay up to date with develop while working
