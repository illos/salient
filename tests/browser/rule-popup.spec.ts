// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from '@playwright/test';

test('rule cards preserve the wizard, navigate references, scroll and dismiss accessibly', async ({
  page,
  context,
}) => {
  const stamp = crypto.randomUUID().slice(0, 8);
  await page.goto('/login');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Display name').fill(`Reader ${stamp}`);
  await page.getByLabel('Email', { exact: true }).fill(`reader-${stamp}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill('Test-only-salient-password-42');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.getByRole('link', { name: 'Characters', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill(`Reader hero ${stamp}`);
  await page.getByRole('button', { name: 'Create and open the wizard' }).click();
  await expect(page.getByRole('heading', { name: 'Imagine your hero' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('think.prompts');
  await expect(page.locator('body')).not.toContainText('en/unified');
  const url = page.url();
  // The step's reference appears both beside the step title and in the hero summary's source
  // callout (V21), so the trigger is taken from the step region.
  const trigger = page
    .getByRole('region', { name: 'Current step' })
    .getByRole('button', { name: 'Read 1. Think in the rules', exact: true });
  await trigger.click();
  const card = page.getByRole('dialog');
  await expect(card.getByRole('heading', { name: 'Making a Hero', exact: true })).toBeVisible();
  await expect(card.locator('[id="1-think"]')).toBeInViewport();
  expect(context.pages()).toHaveLength(1);
  await expect(page).toHaveURL(url);
  await expect(card).not.toContainText('scc.v1:');
  expect(
    await page
      .locator('.rule-preview-backdrop')
      .evaluate(el => getComputedStyle(el).backdropFilter),
  ).toContain('blur');
  const dimensions = await page
    .locator('.rule-preview-scroll')
    .evaluate(el => ({ height: el.clientHeight, content: el.scrollHeight }));
  expect(dimensions.content).toBeGreaterThan(dimensions.height);
  await page.screenshot({ path: '/tmp/salient-rule-popup.png' });
  const linked = card.locator('.rules-prose a[href^="/rules/"]').first();
  await linked.click();
  await expect(card.getByRole('button', { name: 'Back to previous rule' })).toBeVisible();
  await expect(card.locator('.rules-prose')).toBeVisible();
  await card.getByRole('button', { name: 'Back to previous rule' }).click();
  await expect(card.locator('[id="1-think"]')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: /^9\. Determine Details/ }).click();
  await page
    .getByRole('textbox', { name: 'Appearance', exact: true })
    .fill('A blue travelling cloak');
  const appearance = page.getByRole('button', {
    name: 'Read Appearance in the rules',
    exact: true,
  });
  await appearance.click();
  await expect(card.locator('[id="9-determine-details"]')).toBeInViewport();
  // Focus stays in the card, and clicking its contents does not dismiss it.
  await card.getByRole('heading', { name: 'Making a Hero', exact: true }).click();
  await page.keyboard.press('Tab');
  expect(await card.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.mouse.click(5, 5);
  await expect(card).toHaveCount(0);
  await expect(appearance).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Appearance', exact: true })).toHaveValue(
    'A blue travelling cloak',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await appearance.click();
  await expect(card).toBeVisible();
  const box = await card.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.height).toBeLessThan(844);
  await card.getByRole('button', { name: 'Close rule' }).click();
});
