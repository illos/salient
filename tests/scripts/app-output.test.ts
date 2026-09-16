// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('headless JSON stays parseable when a successful Convex query includes diagnostics', async () => {
  const value = [{ id: 'verified-result', total: 12 }];
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify({
        status: 'success',
        value,
        logLines: ['[WARN] Verification diagnostic'],
      }),
    );
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
    const url = `http://127.0.0.1:${address.port}`;
    const output = await promisify(execFile)(
      process.execPath,
      ['scripts/app.ts', 'query', 'verification:results', '{}'],
      {
        env: {
          ...process.env,
          VITE_CONVEX_URL: url,
          VITE_CONVEX_SITE_URL: url,
          SALIENT_AUTH_TOKEN: 'test-only-token',
        },
      },
    );
    expect(JSON.parse(output.stdout)).toEqual(value);
    expect(output.stderr).toContain('Verification diagnostic');
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    );
  }
}, 30_000);
