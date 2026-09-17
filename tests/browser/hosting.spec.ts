import { expect, test } from '@playwright/test';

test('direct SPA routes and reloads load their assets without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/login', '/rules', '/foes']) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    const ready =
      route === '/login'
        ? page.getByRole('button', { name: 'Sign in', exact: true })
        : route === '/rules'
          ? page.getByRole('heading', { name: 'Rules', exact: true })
          : page.getByRole('textbox', { name: 'Search foes', exact: true });
    await expect(ready).toBeVisible();
    await page.reload();
    await expect(ready).toBeVisible();
  }
  expect(errors).toEqual([]);
});
