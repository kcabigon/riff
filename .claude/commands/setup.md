Help a new collaborator set up the Riff project for local development. Walk through each step interactively — check for problems and explain what each step does.

## Steps

1. **Check git identity**:
   - Run `git config user.name` and `git config user.email`
   - If either is empty, generic (e.g., "macbook-user"), or doesn't look like a real name/email, ask: "What's your full name and email? I need to set these so your commits are attributed to you."
   - Set them: `git config user.name "Their Name"` and `git config user.email "their@email.com"`
   - If they look correct, confirm and move on

2. **Check Node.js version**:
   - Run `node --version`
   - Verify it's v20 or higher. If not, tell the user to install Node.js 20+ (recommend using nvm: `nvm install 20`)

3. **Check for .env.development**:
   - Check if `.env.development` exists in the project root
   - If it does NOT exist:
     - Tell the user: "You need a `.env.development` file with the project's environment variables. Hit up Kyle. He's awesome and knows everything."
     - Show them the template from `.env.example` so they know what to expect
     - Tell them to create the file and paste in the values Kyle gives them
     - Wait for them to confirm before proceeding
   - If it exists, confirm and move on

4. **Install dependencies**:
   - Check if `node_modules/` exists
   - If not, run `npm install`
   - If it exists, ask if they want to reinstall (`npm ci` for clean install)

5. **Generate Prisma client**:
   - Run `npx prisma generate`
   - Explain: "This generates the TypeScript client for database access based on the schema"

6. **Run database migrations**:
   - Run `npm run db:migrate:dev`
   - If this fails, it's likely a DATABASE_URL issue — help debug
   - Explain: "This ensures your database schema matches the project's migration files"

7. **Verify build**:
   - Run `npm run build`
   - If it fails, help diagnose. Common issues: missing env vars, Node version, TypeScript errors
   - If it passes, congratulations!

8. **Start dev server**:
   - Suggest: "Run `npm run dev` to start the development server at http://localhost:3000"
   - Don't actually run it (it's long-running), just tell them the command

9. **Explain the workflow**:
   - Tell them about the available slash commands:
     - `/letsriff` — run this at the start of every session to get oriented
     - `/new-feature` — start a new feature (creates branch, explores codebase)
     - `/sync` — pull latest develop into your feature branch
     - `/pr-check` — validate your work before opening a PR
     - `/finish-feature` — push and create a PR
   - Point them to `CONTRIBUTING.md` for the full git workflow
   - Remind them: "Never commit directly to `main`, `develop`, or `staging`"

## Important
- Be patient and explanatory — this user may not be very technical
- If something fails, help diagnose rather than just reporting the error
- Never share or display the contents of `.env.development` — it contains secrets
- If they seem stuck, suggest they message Kyle for help
