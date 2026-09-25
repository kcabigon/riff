"""Focused checks for the Codex guards around Riff's shared resources."""

import unittest
from unittest.mock import patch

import pre_tool_use


class PreToolUseTests(unittest.TestCase):
    def test_blocks_migrations_and_database_resets(self):
        for command in (
            "npx prisma migrate dev",
            "npm run db:migrate:dev",
            "prisma db push --force-reset",
            "npm run db:reset:e2e",
        ):
            with self.subTest(command=command):
                self.assertIsNotNone(pre_tool_use.check_command(command))

    def test_allows_read_only_and_normal_checks(self):
        for command in (
            "npx prisma generate",
            "cat prisma/schema.prisma",
            "npm run lint",
            "git status --short",
        ):
            with self.subTest(command=command):
                self.assertIsNone(pre_tool_use.check_command(command))

    def test_blocks_protected_branch_commit(self):
        with patch.object(pre_tool_use, "git", return_value="develop"):
            self.assertIsNotNone(pre_tool_use.check_command('git commit -m "docs: test"'))

    def test_blocks_sensitive_staged_files(self):
        def fake_git(*args):
            if args[0] == "branch":
                return "feature/example"
            return "src/app/page.tsx\0.env.development\0"

        with patch.object(pre_tool_use, "git", side_effect=fake_git):
            self.assertIsNotNone(pre_tool_use.check_command('git commit -m "docs: test"'))

    def test_allows_clean_feature_branch_commit(self):
        def fake_git(*args):
            return "feature/example" if args[0] == "branch" else "src/app/page.tsx\0"

        with patch.object(pre_tool_use, "git", side_effect=fake_git):
            self.assertIsNone(pre_tool_use.check_command('git commit -m "docs: test"'))

    def test_blocks_schema_patch_without_blocking_other_patches(self):
        self.assertIsNotNone(
            pre_tool_use.check_patch("*** Begin Patch\n*** Update File: prisma/schema.prisma\n")
        )
        self.assertIsNone(
            pre_tool_use.check_patch("*** Begin Patch\n*** Update File: src/app/page.tsx\n")
        )


if __name__ == "__main__":
    unittest.main()
