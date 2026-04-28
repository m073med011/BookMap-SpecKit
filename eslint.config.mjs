import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    "node_modules/**",
    ".corepack/**",
    ".localappdata/**",
    ".appdata/**",
    ".pnpm-home/**",
    ".pnpm-store/**",
    ".bin/**",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "dist/**",
    "*.min.js",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);

export default eslintConfig;
