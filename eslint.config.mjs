import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Palette extracted from DESIGN-SYSTEM.md. Update both when adding a color.
const PALETTE = new Set([
  // Core
  "#000000", "#FFFFFF",
  // Accents
  "#00FF66", "#01EFFC", "#EECF01", "#FF6B35", "#C01582", "#955CB5",
  // Grays
  "#E6E6E6", "#CCCCCC", "#808080", "#9C9C9C", "#F5F5F5",
  // Semantic
  "#DC2626",
]);

const HEX_RE = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

function normalizeHex(hex) {
  hex = hex.toUpperCase();
  if (hex.length === 4) {
    // Expand #RGB -> #RRGGBB
    return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

const noNonPaletteColors = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hex colors that aren't in DESIGN-SYSTEM.md's palette.",
    },
    messages: {
      offPalette:
        "Hex color {{ color }} is not in DESIGN-SYSTEM.md palette. Use a palette color, or add this one to the design system first.",
    },
    schema: [],
  },
  create(context) {
    function check(node, raw) {
      if (typeof raw !== "string") return;
      const matches = raw.match(HEX_RE);
      if (!matches) return;
      for (const m of matches) {
        if (!PALETTE.has(normalizeHex(m))) {
          context.report({
            node,
            messageId: "offPalette",
            data: { color: m },
          });
        }
      }
    }
    return {
      Literal(node) {
        check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked);
      },
    };
  },
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      riff: {
        rules: {
          "no-non-palette-colors": noNonPaletteColors,
        },
      },
    },
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
      // Custom rule: catches hardcoded hex colors not in the design system.
      "riff/no-non-palette-colors": "error",
    },
  },
  // Intentional non-palette use. These files don't follow the brand design
  // system because their purpose requires it:
  //   - test-*/page.tsx and dev-signin: dev sandbox pages, not shipped to users
  //   - resend.ts: email HTML templates (email clients require inline hex)
  //   - leaderboard: intentional dark theme distinct from the rest of the app
  {
    files: [
      "src/app/test-editor/**",
      "src/app/test-editor-v2/**",
      "src/app/test-editor-v3/**",
      "src/app/test-auth/**",
      "src/app/test-avatar-stack/**",
      "src/app/test-club-view/**",
      "src/app/test-clubs-api/**",
      "src/app/dev-signin/**",
      "src/lib/resend.ts",
      "src/components/leaderboard/**",
    ],
    rules: {
      "riff/no-non-palette-colors": "off",
    },
  },
  // Self-contained immersive read experience for a single piece. Intentionally
  // uses a bespoke cinematic palette/gradients (not the brand system) plus
  // array-index keys for the hand-built kinetic typography.
  {
    files: ["src/components/read/StrangeCaseExperience.tsx"],
    rules: {
      "riff/no-non-palette-colors": "off",
      "react/no-array-index-key": "off",
    },
  },
];

export default eslintConfig;
