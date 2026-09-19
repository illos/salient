// SPDX-License-Identifier: GPL-3.0-only
/**
 * V49 Forge Steel counterpart capture — the single new Polder witness.
 *
 * STATUS: NEVER EXECUTED. Written during preparation with no CT114 window and no browser run. Every
 * selector was derived by reading the pinned Forge Steel source, not by observing the running
 * application, so each is UNVERIFIED until the first real run corrects it.
 *
 * Self-contained by design: it imports nothing from another unit, so V49 stays runnable whether or
 * not any peer branch has merged.
 *
 * What it may do: drive the served editor the way a person would, and export through the
 * application's own export control.
 * What it must never do: write a .ds-hero itself, inject selections into storage, patch Forge, or
 * substitute a previous export for performing the change in the editor.
 *
 *   node forge-capture.mjs --build P1-polder-new-traits --base-url http://127.0.0.1:5173 \
 *     --out ../forge --forge-commit 5a846aadb623a9855a023e9403bb887a956c341f
 *
 * Serve the editor from an export of the pinned tree in scratch space; never install inside
 * vendor/forge-steel, because check-vendor fails on any untracked file there and the remote
 * installer rejects dirty vendor state:
 *
 *   git -C vendor/forge-steel archive 5a846aadb623a9855a023e9403bb887a956c341f \
 *     | tar -x -C "$SCRATCH/forge-5a846aad"
 *   cd "$SCRATCH/forge-5a846aad" && npm ci --ignore-scripts && npm start
 *
 * Playwright must come from the remote browser container, never a local install.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Derived from the pinned Forge source; the file each came from is named so a real run can fix it. */
const UI = {
  // components/pages/heroes/hero-list/hero-list-page.tsx
  createHero: /new hero|create hero|add hero/i,
  // components/pages/heroes/hero-edit/hero-edit-page.tsx — antd Segmented, capitalized tab labels.
  tabFallback: name => `.ant-segmented-item:has-text("${name}")`,
  // components/pages/heroes/hero-view/hero-view-page.tsx — Export, then "Export as Data",
  // which Utils.saveFile writes as "<name>.ds-hero".
  exportMenu: /^export$/i,
  exportAsData: /^export as data$/i,
  heroSheet: '[id^=hero-sheet-]',
};

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function fail(message) {
  throw new Error(
    `${message}\nCapture aborted. Do not hand-edit an export or continue past a selector failure: ` +
      `fix the selector, record the correction in the slice work log, and rerun.`,
  );
}

async function openTab(page, name) {
  const byRole = page.getByRole('tab', { name: new RegExp(`^${name}$`, 'i') }).first();
  if ((await byRole.count()) > 0) return byRole.click();
  const fallback = page.locator(UI.tabFallback(name)).first();
  if ((await fallback.count()) === 0) fail(`The "${name}" tab was not found in the editor.`);
  return fallback.click();
}

async function choose(page, tab, label, what) {
  if (label === undefined || label === null) fail(`On ${tab}, no value was supplied for ${what}.`);
  const locator = page
    .getByRole('button', { name: new RegExp(`^${escapeRe(String(label))}$`, 'i') })
    .first();
  if ((await locator.count()) === 0)
    fail(`On the ${tab} tab, no control matched ${what} "${label}".`);
  await locator.click();
}

async function captureBuild(page, build, outDir) {
  const s = build.salient;

  await page.getByRole('button', { name: UI.createHero }).first().click();

  await openTab(page, 'Ancestry');
  await choose(page, 'Ancestry', s['ancestry.choice'], 'the ancestry');
  // Polder spends exactly its 4-point budget across these three traits.
  for (const trait of s['ancestry.polder.purchased-traits'])
    await choose(page, 'Ancestry', trait, 'a purchased trait');

  await openTab(page, 'Culture');
  for (const [what, value] of [
    ['the culture language', s['culture.language']],
    ['the environment', s['culture.environment']],
    ['the environment skill', s['culture.environment.skill']],
    ['the organization', s['culture.organization']],
    ['the organization skill', s['culture.organization.skill']],
    ['the upbringing', s['culture.upbringing']],
    ['the upbringing skill', s['culture.upbringing.skill']],
  ])
    await choose(page, 'Culture', value, what);

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

  await openTab(page, 'Details');
  const nameField = page.getByLabel(/name/i).first();
  if ((await nameField.count()) === 0) fail('The Details tab has no name field.');
  await nameField.fill(s['details.name']);

  await page.getByRole('button', { name: UI.exportMenu }).first().click();
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: UI.exportAsData }).first().click(),
  ]).then(([d]) => d);

  const exportPath = join(outDir, 'export.ds-hero');
  await download.saveAs(exportPath);

  const sheet = page.locator(UI.heroSheet).first();
  if ((await sheet.count()) === 0) fail('The hero sheet did not render, so no sheet evidence exists.');
  await sheet.screenshot({ path: join(outDir, 'sheet.png') });
  const text = (await sheet.innerText()).trim();
  await writeFile(join(outDir, 'sheet.txt'), text, 'utf8');

  // Recorded, not asserted: Forge may not surface a conditional speed bonus as its own field. If it
  // does not, that is a structural limitation to record, never a silent pass.
  const mentionsGeist = /polder geist/i.test(text);
  return { exportPath, mentionsGeist };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : 'true';
  }
  return args;
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
  if (build.role !== 'counterpart')
    fail(`Build "${build.id}" is a ${build.role}; only counterpart builds are captured.`);

  const outDir = resolve(HERE, args.out ?? '../forge', build.id);
  await mkdir(outDir, { recursive: true });

  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  try {
    await page.goto(args['base-url'], { waitUntil: 'domcontentloaded' });
    const { exportPath, mentionsGeist } = await captureBuild(page, build, outDir);
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
          sheetMentionsPolderGeist: mentionsGeist,
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

    if (!mentionsGeist)
      console.warn(
        'The captured sheet does not mention Polder Geist. Record this as a Forge presentation ' +
          'limitation with the closest comparison; it is not an exact-match pass.',
      );
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
