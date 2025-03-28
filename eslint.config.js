/* eslint-disable import-x/no-named-as-default-member, import-x/no-extraneous-dependencies, import-x/no-default-export */

import pluginJs from "@eslint/js";
import eslintPrettier from "eslint-config-prettier";
import * as depend from "eslint-plugin-depend";
import eslintPluginImportX from "eslint-plugin-import-x";
import noSecrets from "eslint-plugin-no-secrets";
import eslintPluginNoUseExtendNative from "eslint-plugin-no-use-extend-native";
import perfectionist from "eslint-plugin-perfectionist";
import pluginPromise from "eslint-plugin-promise";
import * as regexpPlugin from "eslint-plugin-regexp";
import security from "eslint-plugin-security";
import { configs as sonarJsConfigs } from "eslint-plugin-sonarjs";
import tsdoc from "eslint-plugin-tsdoc";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["src/**/*.{js,mjs,cjs,ts}"],
  },
  {
    ignores: ["dist", "old"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  eslintPluginNoUseExtendNative.configs.recommended,
  pluginPromise.configs["flat/recommended"],
  eslintPrettier,
  depend.configs["flat/recommended"],
  perfectionist.configs["recommended-alphabetical"],
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  sonarJsConfigs.recommended,
  eslintPluginUnicorn.configs.all,
  security.configs.recommended,
  regexpPlugin.configs["flat/recommended"],
  {
    plugins: {
      "no-secrets": noSecrets,
      tsdoc,
    },
    rules: {
      "no-secrets/no-secrets": "error",
      "tsdoc/syntax": "warn",
    },
  },
  {
    rules: {
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "import-x/extensions": [
        "error",
        "always",
        { checkTypeImports: true, ignorePackages: true },
      ],
      "import-x/first": "error",
      "import-x/no-absolute-path": "error",
      "import-x/no-amd": "error",
      "import-x/no-commonjs": "error",
      "import-x/no-default-export": "error",
      "import-x/no-dynamic-require": "warn",
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: false,
          optionalDependencies: false,
          peerDependencies: false,
        },
      ],
      "import-x/no-import-module-exports": "error",
      "import-x/no-mutable-exports": "error",
      "import-x/no-self-import": "error",
      "import-x/no-unassigned-import": "error",
      "import-x/no-useless-path-segments": "error",
      "import-x/unambiguous": "error",
      "perfectionist/sort-classes": [
        "error",
        {
          fallbackSort: { type: "unsorted" },
          groups: [
            "index-signature",
            ["static-property", "static-accessor-property"],
            ["static-get-method", "static-set-method"],
            ["private-static-property", "private-static-accessor-property"],
            ["private-static-get-method", "private-static-set-method"],
            ["protected-static-property", "protected-static-accessor-property"],
            ["protected-static-get-method", "protected-static-set-method"],
            "static-block",
            { newlinesBetween: "always" },
            ["private-property", "private-accessor-property"],
            ["protected-property", "protected-accessor-property"],
            ["property", "accessor-property"],
            { newlinesBetween: "always" },
            "constructor",
            { newlinesBetween: "always" },
            [
              "private-get-method",
              "private-set-method",
              "protected-get-method",
              "protected-set-method",
              "get-method",
              "set-method",
            ],
            { newlinesBetween: "always" },
            ["private-static-method", "private-static-function-property"],
            ["protected-static-method", "protected-static-function-property"],
            ["static-method", "static-function-property"],
            { newlinesBetween: "always" },
            ["method", "function-property"],
            ["protected-method", "protected-function-property"],
            ["private-method", "private-function-property"],
            { newlinesBetween: "always" },
            "unknown",
          ],
          ignoreCase: true,
          newlinesBetween: "always",
          type: "unsorted",
        },
      ],
      "perfectionist/sort-decorators": "off",
      "perfectionist/sort-imports": [
        "error",
        {
          customGroups: { type: {}, value: {} },
          environment: "node",
          groups: [
            "type",
            "builtin",
            "external",
            "internal-type",
            "internal",
            ["parent-type", "sibling-type", "index-type"],
            ["parent", "sibling", "index"],
            "object",
            "unknown",
          ],
          ignoreCase: true,
          newlinesBetween: "always",
          order: "asc",
          partitionByComment: false,
          partitionByNewLine: false,
          type: "alphabetical",
        },
      ],
    },
  },
);
