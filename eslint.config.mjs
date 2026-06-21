import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "warn",
      // Block stray debug logs but keep audit/warning channels usable.
      // `info` is allowed for our existing email/audit logs in resend.ts.
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
      // Catches dynamic-list `key={index}` bugs (re-ordering / deletion
      // breaks React reconciliation). Static lists can opt out per-line.
      "react/no-array-index-key": "error",
    },
  },
];

export default eslintConfig;
