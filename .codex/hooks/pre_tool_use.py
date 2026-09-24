"""Codex-specific guards for Riff's shared repo and development database."""

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PROTECTED_BRANCHES = {"main", "develop", "staging"}


def git(*args):
    result = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout.strip() if result.returncode == 0 else None


def check_command(command):
    if re.search(r"\bprisma\s+(?:--\S+\s+)*migrate\b", command) or re.search(
        r"\bnpm\s+run\s+db:migrate(?::\w+)?\b", command
    ):
        return "Prisma migrations need Kyle's coordination because the dev database is shared."

    if re.search(r"\bprisma\s+(?:--\S+\s+)*db\s+push\b", command) or re.search(
        r"\bnpm\s+run\s+db:reset\b", command
    ):
        return "Database push and reset commands are blocked for the shared dev database."

    if re.search(r"\bgit\s+commit\b", command):
        branch = git("branch", "--show-current")
        if branch in PROTECTED_BRANCHES:
            return f"Do not commit on the protected {branch} branch; use a feature or fix branch."

        staged = git("diff", "--cached", "--name-only", "-z")
        if staged is not None:
            sensitive = [
                name
                for name in staged.split("\0")
                if name and (Path(name).name.startswith(".env") or name.startswith("docs/"))
            ]
            if sensitive:
                return "Do not commit .env files or docs/ session notes: " + ", ".join(sensitive)

    return None


def check_patch(patch):
    if re.search(
        r"^\*\*\* (?:Add|Update|Delete) File: (?:.*/)?prisma/schema\.prisma\s*$"
        r"|^\*\*\* Move to: (?:.*/)?prisma/schema\.prisma\s*$",
        patch,
        re.MULTILINE,
    ):
        return "Schema edits need Kyle's explicit coordination because the dev database is shared."
    return None


def main():
    try:
        event = json.load(sys.stdin)
    except (ValueError, OSError):
        return

    tool_input = event.get("tool_input") or {}
    command = tool_input.get("command", "")
    if not isinstance(command, str):
        return

    tool_name = event.get("tool_name")
    reason = (
        check_command(command)
        if tool_name == "Bash"
        else check_patch(command) if tool_name == "apply_patch" else None
    )
    if reason:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": reason,
                    }
                }
            )
        )


if __name__ == "__main__":
    main()
