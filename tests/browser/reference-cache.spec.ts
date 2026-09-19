// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
test('Workers serves immutable versioned content and revalidates current manifests', async ({
  request,
}) => {
  test.skip(
    !process.env.SALIENT_REFERENCE_PREVIEW,
    'Requires the actual Workers static-assets preview',
  );
  const html = await request.get('/rules');
  expect(html.headers()['cache-control']).toMatch(/max-age=0|no-cache|no-store/);
  const asset = (await html.text()).match(/src="(\/assets\/[^"]+\.js)"/)![1];
  expect((await request.get(asset)).headers()['cache-control']).toBe(
    'public, max-age=31536000, immutable',
  );
  for (const library of ['rules', 'foes']) {
    const response = await request.get(`/${library}-data/catalog.json`);
    expect(response.headers()['cache-control']).toBe('public, max-age=0, must-revalidate');
    const catalog = await response.json();
    const entry = catalog.entries[0];
    for (const file of ['search-index.json', entry.file ?? entry.detailFile]) {
      const detail = await request.get(`/${library}-data/${catalog.version}/${file}`);
      expect(detail.ok()).toBe(true);
      expect(detail.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
    }
  }
});
