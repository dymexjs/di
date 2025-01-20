import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPrettier from "eslint-config-prettier";
import security from "eslint-plugin-security";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
  },
  {
    ignores: ["dist"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  security.configs.recommended,
  eslintPrettier,
  {
    rules: {
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
    },
  },
];
