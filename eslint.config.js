// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config({ ignores: ["dist"] }, {
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
    // Data layer architecture enforcement
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["**/lib/api/services/*"],
            "importNames": ["*"],
            "message": "Direct service imports are deprecated. Use src/data/ layer instead."
          }
        ],
        "paths": [
          {
            "name": "axios",
            "message": "Use the centralized API client in src/data/clients/ instead of direct axios."
          }
        ]
      }
    ],
  },
}, storybook.configs["flat/recommended"]);
