// SPDX-License-Identifier: GPL-3.0-only
// Flat ESLint configuration: typescript-eslint recommended, React hooks, Convex rules for convex/.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import convexPlugin from '@convex-dev/eslint-plugin';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'vendor/',
      'convex/_generated/',
      'test-results/',
      '.cache/',
      'playwright-report/',
      '.playtest/',
      '.wrangler/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.es2023 } },
    rules: {
      // The codebase uses `_`-prefixed names for intentionally unused values.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // Existing code re-describes caught errors deliberately; attaching `cause` is a behavior change
      // outside S00. Enable when a slice touching those errors chooses to.
      'preserve-caught-error': 'off',
    },
  },
  {
    // GitHub's github-script loader and node:test helper use CommonJS.
    files: ['.github/scripts/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // The retained 2026-09-10 engine experiment validates untyped JSON with `any`; it is historical.
    files: ['src/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    files: ['web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  ...convexPlugin.configs.recommended,
  {
    files: ['**/convex/**/*.ts'],
    rules: {
      // convex/ predates the plugin and uses the single-argument db.get/patch form throughout.
      // Turning this on is a code migration for a slice that owns convex/, not for S00.
      '@convex-dev/explicit-table-ids': 'off',
    },
  },
);
