import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Browser-derived initial state is synchronized after static hydration.
      // The optional React Compiler advisory remains visible as a warning.
      'react-hooks/set-state-in-effect': 'warn',
      // Native page loads intentionally reset the scroll animations on this export.
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  {
    files: ['scripts/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off', '@next/next/no-assign-module-variable': 'off' },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
