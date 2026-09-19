// SPDX-License-Identifier: GPL-3.0-only
/** Actual Workers static-assets runtime, isolated on CT114; no deployment or credentials. */
import { defineConfig } from '@playwright/test';
process.env.SALIENT_REFERENCE_PREVIEW = '1';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: [
    'rules.spec.ts',
    'foes.spec.ts',
    'reference-performance.spec.ts',
    'reference-streaming.spec.ts',
    'reference-cache.spec.ts',
  ],
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command:
      'pnpm dlx wrangler@4.134.0 dev --local --config wrangler.jsonc --ip 127.0.0.1 --port 4173 --inspector-port 0',
    url: 'http://127.0.0.1:4173',
    timeout: 120_000,
    reuseExistingServer: false,
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
});
