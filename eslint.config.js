// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config({ ignores: ["dist", "**/.next/**", "apps/wigg-admin/.next/**", "apps/**/storybook-static/**"] }, {
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-require-imports": "warn",
    "storybook/no-renderer-packages": "off",
    "react-hooks/exhaustive-deps": "warn",
  },
}, {
  files: [
    "src/components/**/*.{ts,tsx}",
    "src/pages/**/*.{ts,tsx}",
    "src/App.tsx",
  ],
  rules: {
    "no-restricted-globals": [
      "error",
      {
        name: "fetch",
        message: "Use the shared data layer hooks from '@/data' instead of direct fetch calls in UI components.",
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["axios", "node-fetch"],
            message: "HTTP clients must live in '@/data'; expose hooks/services there for UI consumption.",
          },
        ],
      },
    ],
  },
}, {
  files: ["src/data/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-globals": "off",
  },
}, {
  files: ["**/*.stories.{ts,tsx}", "**/*.stories.ts"],
  rules: {
    "storybook/no-renderer-packages": "off",
  },
}, storybook.configs["flat/recommended"]);
