Help the user test their changes locally. This is the easiest way to see what they've built.

## Steps

1. **Check if the dev server is already running**:
   - Run `lsof -i :3000 2>/dev/null | grep LISTEN` to check if port 3000 is in use
   - If it's already running: "The dev server is already running! Open http://localhost:3000 in your browser."
   - If not, continue

2. **Quick validation before starting**:
   - Run `npx tsc --noEmit` silently — if there are type errors, show them and offer to fix before starting
   - If clean, proceed

3. **Start the dev server**:
   - Tell the user: "Starting the dev server — this will open in a new process. **Open http://localhost:3000 in your browser to see your changes.**"
   - Run `npm run dev` in the background
   - Tell them: "The server is running! Any changes you save will auto-refresh in the browser. When you're done testing, come back here and I can help you with next steps."

4. **Offer next steps**:
   - "Happy with your changes? Run `/finish-feature` to create a PR."
   - "Found a bug? Describe it and I'll help fix it."
   - "Want to keep building? Just tell me what's next."

## Important
- If `npm run dev` fails, help diagnose. Common issues:
  - Port 3000 already in use → suggest killing the process or using a different port
  - Missing dependencies → run `npm install`
  - Missing env vars → check `.env.development` exists
- Don't run the server in the foreground — use background mode so the user can keep chatting
- If the user says "stop the server" or "kill it", run `kill $(lsof -t -i:3000)` to stop it
