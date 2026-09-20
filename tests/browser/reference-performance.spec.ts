// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';

test('public navigation keeps its document and fetches only requested reference content', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(new URL(request.url()).pathname));
  await page.goto('/foes');
  await expect(page.locator('.foes-result').first()).toBeVisible();
  const origin = await page.evaluate(() => performance.timeOrigin);
  expect(requests.filter(p => /foes-data.*(details|search-index)/.test(p))).toEqual([]);
  expect(requests.filter(p => p.startsWith('/rules-data/'))).toEqual([]);
  let release!: () => void;
  const delayed = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route('**/foes-data/*/details/*', async route => {
    await delayed;
    await route.continue();
  });
  await page.locator('.foes-result').first().click();
  await expect(page.getByRole('dialog')).toContainText('Opening reference…');
  release();
  await expect(page.getByRole('dialog').locator('.ds-content').first()).toBeVisible();
  expect(requests.filter(p => /foes-data.*details/.test(p))).toHaveLength(1);
  await page.keyboard.press('Escape');
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Rules', exact: true })
    .click();
  await expect(page.getByRole('textbox', { name: 'Search rules' })).toBeVisible();
  expect(requests.filter(p => /rules-data.*(articles|excerpts|search-index)/.test(p))).toEqual([]);
  await page.getByRole('textbox', { name: 'Search rules' }).fill('winded');
  await expect(page.locator('.rules-result').first()).toContainText('Winded');
  await expect(page.locator('.rules-list-count')).not.toContainText('Searching');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.locator('.rules-result').first().click();
  await expect(page.locator('.rules-prose')).toContainText('Stamina');
  expect(requests.filter(p => /rules-data.*articles/.test(p))).toHaveLength(1);
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Foes', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Search foes' }).fill('Ghost');
  await expect(page.getByRole('button', { name: 'Open Ghost', exact: true })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Rules', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Search rules' }).fill('goblin warior');
  await expect(page.locator('.rules-result').first()).toContainText('Goblin Warrior');
  expect(requests.filter(p => /rules-data.*search-index/.test(p))).toHaveLength(1);
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Foes', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Search foes' }).fill('Skeleton');
  await expect(page.getByRole('button', { name: 'Open Skeleton', exact: true })).toBeVisible();
  expect(requests.filter(p => /foes-data.*search-index/.test(p))).toHaveLength(1);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
});

test('failed detail downloads retry without losing the list or navigation', async ({ page }) => {
  await page.route('**/foes-data/*/details/*', route =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/foes');
  await page.locator('.foes-result').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.unroute('**/foes-data/*/details/*');
  await dialog.getByRole('button', { name: 'Try again' }).click();
  await expect(dialog.locator('.ds-content').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.foes-result').first()).toBeFocused();
});

test('catalog failure preserves shared navigation and supports retry', async ({ page }) => {
  await page.route('**/rules-data/catalog.json', route =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/rules');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.unroute('**/rules-data/catalog.json');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('textbox', { name: 'Search rules' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const primary = await page.locator('.site-nav').boundingBox();
  const search = await page.locator('.rules-topbar').boundingBox();
  expect(search!.y).toBeGreaterThanOrEqual(primary!.y + primary!.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('article failure is local and section links stay below the shared headers', async ({
  page,
}) => {
  await page.route('**/rules-data/*/articles/*', route =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/rules/heroes/chapter/making-a-hero#1-think');
  await expect(page.getByRole('heading', { level: 1, name: 'Making a Hero' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.unroute('**/rules-data/*/articles/*');
  await page.getByRole('button', { name: 'Try again' }).click();
  const target = page.locator('.rules-prose [id="1-think"]');
  await expect(target).toBeInViewport();
  await expect.poll(async () => (await target.boundingBox())!.y).toBeGreaterThan(133);
  const bar = await page.locator('.rules-topbar').boundingBox();
  const toc = await page.locator('.rules-toc').boundingBox();
  expect(toc!.y).toBeGreaterThan(bar!.y + bar!.height);
});

test('a cleared search cannot resurrect delayed results', async ({ page, context }) => {
  let release!: () => void;
  let requested!: () => void;
  const seen = new Promise<void>(resolve => {
    requested = resolve;
  });
  const delayed = new Promise<void>(resolve => {
    release = resolve;
  });
  await context.route('**/rules-data/*/search-index.json', async route => {
    requested();
    await delayed;
    await route.continue();
  });
  await page.goto('/rules');
  await page.getByLabel('Search rules').fill('Winded');
  await seen;
  await page.getByRole('button', { name: 'Clear search' }).click();
  const response = page.waitForResponse(r => r.url().includes('/search-index.json'));
  release();
  await response;
  await expect(page.getByRole('heading', { level: 1, name: 'Rules', exact: true })).toBeVisible();
  await expect(page.locator('.rules-result')).toHaveCount(0);
  await page.getByLabel('Search rules').fill('Surges');
  await expect(page.locator('.rules-result').first()).toContainText('Surges');
  await expect(page.locator('.rules-list-count')).not.toContainText('Searching');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a failed search index retries', async ({ page, context }) => {
  await context.route('**/rules-data/*/search-index.json', route =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/rules');
  await page.getByLabel('Search rules').fill('Winded');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await context.unroute('**/rules-data/*/search-index.json');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.rules-result').first()).toContainText('Winded');
  await expect(page.locator('.rules-list-count')).not.toContainText('Searching');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('large chapter opening stays usable while later sections are delayed and retryable', async ({
  page,
}) => {
  let release!: () => void;
  let requested!: () => void;
  const seen = new Promise<void>(resolve => {
    requested = resolve;
  });
  const delayed = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route(/\/rules-data\/[^/]+\/articles\/[^/]+-\d+\.json$/, async route => {
    requested();
    await delayed;
    await route.fulfill({ status: 503, body: 'Unavailable' });
  });
  await page.goto('/rules/monsters/chapter/monsters');
  await seen;
  await expect(page.locator('.rules-article-part').first()).not.toHaveText('');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.locator('.rules-part-status')).toContainText('Loading remaining sections');
  release();
  await expect(
    page.locator('.rules-part-status').getByRole('button', { name: 'Try again' }),
  ).toBeVisible();
  await page.unroute(/\/rules-data\/[^/]+\/articles\/[^/]+-\d+\.json$/);
  await page.locator('.rules-part-status').getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.rules-part-status')).toHaveCount(0);
});
