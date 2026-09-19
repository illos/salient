// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';
// DOM tracing this 600,000px chapter exhausts the 2 GiB browser container. Keep real
// browser/layout assertions and failure screenshots without recording full DOM snapshots.
test.use({ trace: 'off' });
for (const readerScrolls of [false, true]) {
  test(`late chapter anchors ${readerScrolls ? 'respect reader scrolling' : 'stay visible'} as preceding content streams in`, async ({
    page,
    request,
  }) => {
    const catalog = await (await request.get('/rules-data/catalog.json')).json();
    const entry = catalog.entries.find(
      (e: { path: string }) => e.path === 'monsters/chapter/monsters',
    );
    const [article] = await (
      await request.get(`/rules-data/${catalog.version}/${entry.file}`)
    ).json();
    const part = article.parts.at(-1);
    const id = part.ids[0];
    let release!: () => void;
    const delayed = new Promise<void>(resolve => {
      release = resolve;
    });
    await page.route(/\/rules-data\/[^/]+\/articles\/[^/]+-\d+\.json$/, async route => {
      if (!route.request().url().endsWith(part.file)) await delayed;
      await route.continue();
    });
    await page.goto(`/rules/${entry.path}#${encodeURIComponent(id)}`);
    const target = page.locator('.rules-prose').locator(`[id="${id}"]`);
    await expect(target).toBeInViewport();
    await expect(page.locator('.rules-part-status')).toContainText('Loading remaining sections');
    if (readerScrolls) {
      await page.mouse.move(800, 400);
      await page.mouse.wheel(0, -900);
      await expect(target).not.toBeInViewport();
    }
    release();
    await expect(page.locator('.rules-part-status')).toHaveCount(0);
    if (readerScrolls) await expect(target).not.toBeInViewport();
    else await expect(target).toBeInViewport();
  });
}
