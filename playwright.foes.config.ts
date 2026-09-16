// SPDX-License-Identifier: GPL-3.0-only
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'foes.spec.ts',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5187',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 5187',
    url: 'http://127.0.0.1:5187/foes',
    reuseExistingServer: false,
  },
});
