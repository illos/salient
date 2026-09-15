// SPDX-License-Identifier: GPL-3.0-only
/**
 * V21 item 10: the wizard's full-viewport frame. The header replaces the site nav; the rail
 * lists the presented steps with the current one marked; a class chosen through a ChoiceRow
 * persists through `characters.save` and reads back after a reload; check marks and the
 * progress bar follow completed steps; SAVE DRAFT still saves; the centre column scrolls while
 * the rail stays put. Captures the Class step, the characteristic assignment and the last step
 * in both themes at 1440×900 and 1920×1080 under .playtest/v21/wizard/.
 */
import { expect, test, type Page } from '@playwright/test';
import { register, shoot, THEMES, VIEWPORTS } from './v21-fixtures';

const step = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name.replace('.', '\\.')}`) });

test('wizard frame: header, rail, choice rows, persistence, independent scrolling', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ viewport: VIEWPORTS[0] });
  try {
    const page = await context.newPage();
    const stamp = crypto.randomUUID().slice(0, 8);
    await register(page, `Player ${stamp}`, `v21-wizard-${stamp}@example.test`);
    await page.getByRole('link', { name: 'Characters', exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill(`Ember ${stamp}`);
    await page.getByRole('button', { name: 'Create and open the wizard' }).click();
    await expect(page.getByRole('heading', { name: `Ember ${stamp}` })).toBeVisible();
    const wizardUrl = page.url();

    // Header: no site nav; NEW HERO context, SAVE DRAFT and EXIT, the user menu disc.
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Salient', exact: true })).toBeVisible();
    await expect(page.getByText('New hero', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save draft', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exit', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /account menu/ })).toBeVisible();
    const header = await page.locator('header').boundingBox();
    expect(header!.height).toBe(70);

    // Rail: the presented steps in source order (never a fixed seven), the current one marked.
    const rail = page.getByRole('navigation', { name: 'Steps' });
    const rows = rail.getByRole('button');
    const names = await rows.evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')));
    expect(names).toEqual([
      '1. Think',
      '2. Ancestry',
      '3. Culture',
      '4. Career',
      '5. Class',
      '6. Kit',
      '7. Add Free Strikes',
      '9. Determine Details',
      '10. Make Connections',
    ]);
    // The eyebrow counts the source's steps, not the presented ones: 8. Complication is not
    // offered in v0.01, so the rail skips it and the numbering still matches the book.
    await expect(rail.getByText('Step 1 of 10')).toBeVisible();
    await expect(rows.nth(0)).toHaveAttribute('aria-current', 'step');
    const progress = page.getByRole('progressbar', { name: 'Steps completed' });
    await expect(progress).toHaveAttribute('aria-valuemax', String(names.length));
    // Creating the hero records its name, so Determine Details can already be done here; the
    // count is read rather than assumed, and the movement below is what this checks.
    const doneAtStart = Number(await progress.getAttribute('aria-valuenow'));
    expect(doneAtStart).toBeGreaterThanOrEqual(0);

    // Layout: the document never scrolls; three columns at 280 / flex / 330.
    const metrics = await page.evaluate(() => ({
      inner: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
    }));
    expect(metrics.documentHeight).toBe(metrics.inner);
    const railBox = (await rail.boundingBox())!;
    const summaryBox = (await page.getByLabel('Hero so far').boundingBox())!;
    // ±1 for the 1px rule between the columns.
    expect(Math.abs(railBox.width - 280)).toBeLessThanOrEqual(1);
    expect(Math.abs(summaryBox.width - 330)).toBeLessThanOrEqual(1);

    // Ancestry completed through choice rows: the step gets its check mark and the bar moves.
    await step(page, '2. Ancestry').click();
    await expect(page.getByRole('heading', { name: 'Ancestry', exact: true })).toBeVisible();
    await expect(page.getByLabel('Dwarf', { exact: true })).toBeDisabled();
    await expect(page.getByText('Not offered in v0.01').first()).toBeVisible();
    await page.getByLabel('Devil', { exact: true }).check();
    await page.getByLabel('Silver Tongue skill', { exact: true }).selectOption('Persuade');
    await page.getByLabel('Beast Legs', { exact: true }).check();
    await page.getByLabel('Impressive Horns', { exact: true }).check();
    // The current step keeps its number (mockup: the active step is the red numbered disc); the
    // check mark appears on steps you have left.
    await expect(step(page, '2. Ancestry')).toContainText('Devil');
    await expect(step(page, '1. Think')).toContainText('✓');
    // Ancestry is now recorded and Think (nothing to decide) is behind us: two more.
    await expect(progress).toHaveAttribute('aria-valuenow', String(doneAtStart + 2));

    // Class through a ChoiceRow, then SAVE DRAFT and read the revision back.
    await step(page, '5. Class').click();
    await expect(step(page, '2. Ancestry')).toContainText('✓');
    await expect(page.getByRole('heading', { name: 'Class', exact: true })).toBeVisible();
    await expect(page.getByText(/^Step 5 of/)).toBeVisible();
    await page.getByLabel('Fury', { exact: true }).check();
    await expect(page.getByLabel('Censor', { exact: true })).toBeDisabled();
    await expect(step(page, '5. Class')).toContainText('Fury');
    await expect(page.getByLabel('Hero so far')).toContainText('Devil · Fury · Level 1');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByText(/^Draft saved \(revision \d+\)/)).toBeVisible();

    // The centre column scrolls on its own; the rail and the page stay put.
    const centre = page.locator('[data-wizard-pane="centre"]');
    const before = await centre.evaluate(node => ({
      client: node.clientHeight,
      scroll: node.scrollHeight,
      overflowY: getComputedStyle(node).overflowY,
    }));
    expect(before.overflowY).toBe('auto');
    expect(before.scroll).toBeGreaterThan(before.client);
    await centre.evaluate(node => (node.scrollTop = 300));
    const after = await page.evaluate(() => ({
      scrollY: window.scrollY,
      centre: document.querySelector('[data-wizard-pane="centre"]')!.scrollTop,
    }));
    expect(after.scrollY).toBe(0);
    expect(after.centre).toBeGreaterThan(0);
    expect((await rail.boundingBox())!.y).toBe(railBox.y);
    // The step navigation stays pinned at the bottom of the centre column.
    const next = page.getByRole('button', { name: 'Continue to Kit →', exact: true });
    await expect(next).toBeVisible();
    const nextBox = (await next.boundingBox())!;
    expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(metrics.inner);
    expect(nextBox.y + nextBox.height).toBeGreaterThan(metrics.inner - 80);
    await expect(page.getByRole('button', { name: '← Career', exact: true })).toBeVisible();

    // Reload: the class selection and the rail's chosen values persisted.
    await page.reload();
    await expect(page.getByRole('heading', { name: `Ember ${stamp}` })).toBeVisible();
    await expect(step(page, '5. Class')).toContainText('Fury');
    await step(page, '5. Class').click();
    await expect(page.getByLabel('Fury', { exact: true })).toBeChecked();

    // Screenshots: Class step, characteristic assignment, last step; both themes and viewports.
    await page.getByLabel('1, 0, 0', { exact: true }).check();
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const theme of THEMES) {
        await step(page, '5. Class').click();
        await centre.evaluate(node => (node.scrollTop = 0));
        await shoot(page, 'wizard', 'class-step', { theme, viewport });
        await page.getByText('Remaining values', { exact: true }).scrollIntoViewIfNeeded();
        await centre.evaluate(node => (node.scrollTop = node.scrollTop - 40));
        await shoot(page, 'wizard', 'assignment', { theme, viewport });
        await step(page, '10. Make Connections').click();
        await shoot(page, 'wizard', 'last-step', { theme, viewport });
      }
    }
    await expect(page.getByRole('button', { name: 'Save and close', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Continue to/ })).toHaveCount(0);
    expect(page.url()).toBe(wizardUrl);
  } finally {
    await context.close();
  }
});
