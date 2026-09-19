// SPDX-License-Identifier: GPL-3.0-only
import { expect, type Page } from '@playwright/test';

/** Enter through the unsaved wizard and explicitly save a named draft for existing journeys. */
export async function startCharacter(page: Page, name: string) {
  await page.getByRole('link', { name: 'Open character wizard', exact: true }).click();
  await page.getByRole('button', { name: /^9\. Determine Details/ }).click();
  await page.getByLabel('Hero name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(/\/characters\/(?!new\/)[^/]+\/wizard$/);
}
