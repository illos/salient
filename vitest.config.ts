import { defineConfig } from 'vitest/config';

// One runner for every suite. The engine project keeps the former `node --test` files unchanged apart
// from their imports; the app project holds the convex-test suites; scripts covers the process tooling.
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'engine', include: ['tests/*.test.ts'], environment: 'node' } },
      {
        test: {
          name: 'app',
          include: ['tests/app/**/*.test.ts'],
          // convex-test suites that drive whole encounters take 10-25 s per file under load.
          testTimeout: 60_000,
          server: { deps: { inline: ['convex-test'] } },
        },
      },
      { test: { name: 'scripts', include: ['tests/scripts/**/*.test.ts'], environment: 'node' } },
    ],
  },
});
