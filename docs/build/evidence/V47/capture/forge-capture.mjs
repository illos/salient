// SPDX-License-Identifier: GPL-3.0-only
/**
 * V47 Forge Steel counterpart capture.
 *
 * STATUS: NEVER EXECUTED. Written during preparation, with no CT114 window and no browser run.
 * Every selector below was derived by reading the pinned Forge Steel source, not by observing the
 * running application, so each is UNVERIFIED until the first real run. The script is deliberately
 * strict: any selector that does not resolve aborts the build with a readable error rather than
 * continuing, because a partially-driven editor produces an export that looks real and is not.
 *
 * What this script may do: drive the served editor the way a person would, and export through the
 * application's own export control.
 * What it must never do: write a .ds-hero itself, inject selections into storage, patch Forge, or
 * substitute a previous export for performing the change in the editor.
 *
 * Usage, once a CT114 window is available (see ../capture-plan.md):
 *   node forge-capture.mjs --build A-devil-reaver-panther --base-url http://127.0.0.1:5173 \
 *     --out ../forge --forge-commit 5a846aadb623a9855a023e9403bb887a956c341f
 *
 * Playwright must come from the remote browser container, never a local install.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Selectors derived from the pinned Forge source. Each entry names the file it came from so the
 * first real run can correct it against the actual DOM rather than guessing again.
 */
const UI = {
  // components/pages/heroes/hero-list/hero-list-page.tsx — the list page's create control.
  createHero: { role: 'button', name: /new hero|create hero|add hero/i },
  // components/pages/heroes/hero-edit/hero-edit-page.tsx:462-489 — antd Segmented, capitalized tabs.
  tab: name => ({ role: 'tab', name: new RegExp(`^${name}$`, 'i') }),
  tabFallback: name => `.ant-segmented-item:has-text("${name}")`,
  // Section panels expose each option as a selectable panel; the accessible name is the option name.
  option: name => ({ role: 'button', name: new RegExp(`^${escapeRe(name)}$`, 'i') }),
  // components/pages/heroes/hero-view/hero-view-page.tsx:171,199 — Export button, then "Export as Data".
  exportMenu: { role: 'button', name: /^export$/i },
  exportAsData: { role: 'button', name: /^export as data$/i },
  heroSheet: '[id^=hero-sheet-]',
};

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : 'true';
    args[key] = value;
  }
  return args;
}

function fail(message) {
  throw new Error(
    `${message}\nThe capture is aborted. Do not hand-edit an export or continue past a ` +
      `selector failure: fix the selector, record the correction, and rerun.`,
  );
}

/** One editor interaction, with a readable failure that names what it was trying to choose. */
async function choose(page, tab, label, what) {
  const locator = page.getByRole(UI.option(label).role, { name: UI.option(label).name }).first();
  if ((await locator.count()) === 0)
    fail(`On the ${tab} tab, no control matched ${what} "${label}".`);
  await locator.click();
}

async function openTab(page, name) {
  const byRole = page.getByRole(UI.tab(name).role, { name: UI.tab(name).name }).first();
  if ((await byRole.count()) > 0) {
    await byRole.click();
    return;
  }
  const fallback = page.locator(UI.tabFallback(name)).first();
  if ((await fallback.count()) === 0) fail(`The "${name}" tab was not found in the editor.`);
  await fallback.click();
}

async function captureBuild(page, build, shared, outDir) {
  const s = build.salient;

  await page.getByRole(UI.createHero.role, { name: UI.createHero.name }).first().click();

  await openTab(page, 'Ancestry');
  await choose(page, 'Ancestry', s['ancestry.choice'], 'the ancestry');
  for (const trait of s['ancestry.devil.purchased-traits'] ?? s['ancestry.polder.purchased-traits'] ?? [])
    await choose(page, 'Ancestry', trait, 'a purchased trait');
  if (s['ancestry.devil.silver-tongue-skill'])
    await choose(page, 'Ancestry', s['ancestry.devil.silver-tongue-skill'], 'the Silver Tongue skill');

  await openTab(page, 'Culture');
  for (const [label, value] of [
    ['the culture language', s['culture.language']],
    ['the environment', s['culture.environment']],
    ['the environment skill', s['culture.environment.skill']],
    ['the organization', s['culture.organization']],
    ['the organization skill', s['culture.organization.skill']],
    ['the upbringing', s['culture.upbringing']],
    ['the upbringing skill', s['culture.upbringing.skill']],
  ])
    await choose(page, 'Culture', value, label);

  await openTab(page, 'Career');
  await choose(page, 'Career', s['career.choice'], 'the career');
  await choose(page, 'Career', s['career.soldier.skill.exploration'], 'the career exploration skill');
  await choose(page, 'Career', s['career.soldier.skill.intrigue'], 'the career intrigue skill');
  for (const language of s['career.soldier.languages'])
    await choose(page, 'Career', language, 'a career language');
  await choose(page, 'Career', s['career.soldier.perk'], 'the career perk');
  await choose(page, 'Career', s['career.soldier.inciting-incident'], 'the inciting incident');

  await openTab(page, 'Class');
  await choose(page, 'Class', s['class.choice'], 'the class');
  await choose(page, 'Class', s['class.fury.aspect'], 'the primordial aspect');
  await choose(page, 'Class', s['class.fury.characteristic-array'], 'the characteristic array');
  for (const [name, value] of Object.entries(s['class.fury.array-assignment']))
    await choose(page, 'Class', `${name} ${value}`, 'a characteristic assignment');
  for (const skill of s['class.fury.skills']) await choose(page, 'Class', skill, 'a class skill');
  await choose(page, 'Class', s['class.fury.signature-ability'], 'the signature ability');
  await choose(page, 'Class', s['class.fury.ability-3'], 'the 3-ferocity ability');
  await choose(page, 'Class', s['class.fury.ability-5'], 'the 5-ferocity ability');
  await choose(page, 'Class', s['kit.choice'], 'the kit');

  if (shared.complication !== null)
    fail('This build set expects no complication; the shared data says otherwise.');

  await openTab(page, 'Details');
  const nameField = page.getByLabel(/name/i).first();
  if ((await nameField.count()) === 0) fail('The Details tab has no name field.');
  await nameField.fill(s['details.name']);

  // Export through the application's own control and keep the bytes exactly as delivered.
  await page.getByRole(UI.exportMenu.role, { name: UI.exportMenu.name }).first().click();
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole(UI.exportAsData.role, { name: UI.exportAsData.name }).first().click(),
  ]).then(([d]) => d);

  const exportPath = join(outDir, 'export.ds-hero');
  await download.saveAs(exportPath);

  const sheet = page.locator(UI.heroSheet).first();
  if ((await sheet.count()) === 0) fail('The hero sheet was not rendered, so no sheet evidence exists.');
  await sheet.screenshot({ path: join(outDir, 'sheet.png') });
  await writeFile(join(outDir, 'sheet.txt'), (await sheet.innerText()).trim(), 'utf8');

  return exportPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.build || !args['base-url']) {
    console.error(
      'Usage: node forge-capture.mjs --build <id> --base-url <url> [--out ../forge] ' +
        '[--forge-commit <sha>] [--forge-version <semver>]',
    );
    process.exitCode = 2;
    return;
  }

  const data = JSON.parse(await readFile(join(HERE, 'builds.json'), 'utf8'));
  const build = data.builds.find(entry => entry.id === args.build);
  if (!build) fail(`No build "${args.build}" in builds.json.`);

  const outDir = resolve(HERE, args.out ?? '../forge', build.id);
  await mkdir(outDir, { recursive: true });

  // Imported here so a usage error does not require Playwright to be present.
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  try {
    await page.goto(args['base-url'], { waitUntil: 'domcontentloaded' });
    const exportPath = await captureBuild(page, build, data.shared, outDir);
    const bytes = await readFile(exportPath);

    await writeFile(
      join(outDir, 'capture.json'),
      `${JSON.stringify(
        {
          buildId: build.id,
          capturedAtUTC: new Date().toISOString(),
          servedFrom: 'pinned vendor source exported with git archive; NOT the public website',
          forgeCommit: args['forge-commit'] ?? null,
          forgeVersion: args['forge-version'] ?? data.forgePackageVersion,
          compendiumRevision: data.compendiumRevision,
          baseUrl: args['base-url'],
          selections: build.salient,
          artifacts: {
            'export.ds-hero': {
              bytes: bytes.length,
              sha256: createHash('sha256').update(bytes).digest('hex'),
            },
          },
          consoleErrors,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    if (consoleErrors.length)
      console.warn(`Captured with ${consoleErrors.length} console error(s); they are recorded.`);
    console.log(`Captured ${build.id} into ${outDir}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
