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
 *     --served-from "pinned vendor tree exported with git archive into scratch" \
 *     --forge-commit 5a846aadb623a9855a023e9403bb887a956c341f --forge-version 14.197.0
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

/** Read the served version from the About modal; returns null rather than guessing. */
async function readAboutVersion(page) {
  const opener = page.getByRole('button', { name: /^about$/i }).first();
  if ((await opener.count()) === 0) return null;
  await opener.click();
  const tag = page.getByText(/^Version\s+\S+/i).first();
  const text = (await tag.count()) > 0 ? (await tag.innerText()).trim() : null;
  await page.keyboard.press('Escape');
  return text;
}

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

/**
 * Verify the export by reading ACTIVE SELECTIONS, never by substring search.
 *
 * Repaired 2026-09-19: the previous version used JSON.stringify(hero).includes(name), which proves
 * nothing — a .ds-hero embeds unselected options, every subclass branch and later-level definitions,
 * so an unchosen trait's name is present in a correct export and in a wrong one alike.
 *
 * This traversal mirrors tests/helpers/v45-reference.ts projectForgeReference, which is the
 * authoritative projection: selected subclasses only, features filtered to the hero's level,
 * data.selected for choices, data.selectedIDs resolved against the owning ability pool. It stays
 * narrow on purpose — it answers "were these specific selections made?", not "what is this hero?" —
 * and it fails on a container type it does not understand rather than reporting a clean result.
 */
function activeSelections(hero) {
  const chosen = [];
  const abilities = [];
  const unsupported = [];
  const subclasses = (hero.class?.subclasses ?? []).filter(branch => branch.selected);
  const abilityPool = [
    ...(hero.class?.abilities ?? []),
    ...subclasses.flatMap(branch => branch.abilities ?? []),
  ];
  const visit = feature => {
    if (!feature || typeof feature !== 'object') return;
    const data = feature.data ?? null;
    switch (feature.type) {
      case 'Choice':
      case 'Perk':
      case 'Kit':
        for (const row of data?.selected ?? []) {
          chosen.push(typeof row === 'string' ? row : row.name);
          if (typeof row === 'object') (row.features ?? []).forEach(visit);
        }
        return;
      case 'Multiple Features':
        (data?.features ?? []).forEach(visit);
        return;
      case 'Ability':
        if (data?.ability) abilities.push(data.ability.name);
        return;
      case 'Class Ability':
        for (const id of data?.selectedIDs ?? []) {
          const match = abilityPool.find(entry => entry.id === id);
          if (!match) unsupported.push(`unresolved selected ability id ${id}`);
          else {
            abilities.push(match.name);
            chosen.push(match.name);
          }
        }
        return;
      case 'Skill Choice':
      case 'Language Choice':
        for (const row of data?.selected ?? []) chosen.push(typeof row === 'string' ? row : row.name);
        return;
      default:
        // Passive feature types carry no selection; anything genuinely unknown is reported.
        if (data?.selected || data?.selectedIDs)
          unsupported.push(`unhandled selection container type "${feature.type}"`);
    }
  };
  (hero.ancestry?.features ?? []).forEach(visit);
  const culture = hero.culture ?? {};
  [culture.language, culture.environment, culture.organization, culture.upbringing].forEach(visit);
  (hero.career?.features ?? []).forEach(visit);
  for (const branch of [hero.class, ...subclasses])
    (branch?.featuresByLevel ?? [])
      .filter(row => row.level <= (hero.class?.level ?? 1))
      .flatMap(row => row.features ?? [])
      .forEach(visit);
  (hero.features ?? []).forEach(visit);
  const norm = name => String(name).replaceAll('’', "'");
  return {
    chosen: chosen.map(norm),
    abilities: abilities.map(norm),
    unsupported,
    culture: {
      environment: culture.environment?.data?.selected?.[0]?.name ?? culture.environment?.name ?? null,
      organization:
        culture.organization?.data?.selected?.[0]?.name ?? culture.organization?.name ?? null,
      upbringing: culture.upbringing?.data?.selected?.[0]?.name ?? culture.upbringing?.name ?? null,
    },
  };
}

/** One editor interaction, with a readable failure that names what it was trying to choose. */
async function choose(page, tab, label, what) {
  if (label === undefined || label === null) fail(`On ${tab}, no value was supplied for ${what}.`);
  const panel = page.locator('.ant-segmented + *, [role="tabpanel"]').last();
  const scope = (await panel.count()) > 0 ? panel : page;
  const locator = scope.getByRole(UI.option(label).role, { name: UI.option(label).name });
  const count = await locator.count();
  if (count === 0) fail(`On the ${tab} tab, no control matched ${what} "${label}".`);
  if (count > 1)
    fail(
      `On the ${tab} tab, ${count} controls matched ${what} "${label}". Refusing to guess; labels ` +
        `repeat across mounted panels, so scope the selector and record the correction.`,
    );
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

  // The editor holds changes until saved; exporting from a dirty editor can capture a hero that is
  // not the one the sheet shows.
  const save = page.getByRole('button', { name: /^save changes$/i }).first();
  if ((await save.count()) === 0) fail('The editor has no Save Changes control.');
  if (await save.isDisabled()) fail('Save Changes is disabled, so the editor recorded no changes.');
  await save.click();

  // Export through the application's own control and keep the bytes exactly as delivered.
  await page.getByRole(UI.exportMenu.role, { name: UI.exportMenu.name }).first().click();
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole(UI.exportAsData.role, { name: UI.exportAsData.name }).first().click(),
  ]).then(([d]) => d);

  const exportPath = join(outDir, 'export.ds-hero');
  await download.saveAs(exportPath);

  // Verify by ACTIVE SELECTIONS, never substring search: an export embeds unselected options and
  // every subclass branch, so a name being present proves nothing.
  const hero = JSON.parse(await readFile(exportPath, 'utf8'));
  const active = activeSelections(hero);
  const mismatches = [...active.unsupported];
  const check = (what, actual, wanted) => {
    if (actual !== wanted)
      mismatches.push(`${what}: export has ${actual ?? 'nothing'}, expected ${wanted}`);
  };
  const selected = (what, wanted) => {
    if (!active.chosen.includes(wanted))
      mismatches.push(`${what} "${wanted}" is not an active selection`);
  };
  check('ancestry', hero.ancestry?.name, s['ancestry.choice']);
  check('career', hero.career?.name, s['career.choice']);
  check('class', hero.class?.name, s['class.choice']);
  check('level', hero.class?.level, 1);
  check('name', hero.name, s['details.name']);
  check(
    'subclass',
    (hero.class?.subclasses ?? []).filter(b => b.selected).map(b => b.name).join(', '),
    s['class.fury.aspect'],
  );
  check('culture environment', active.culture.environment, s['culture.environment']);
  check('culture organization', active.culture.organization, s['culture.organization']);
  check('culture upbringing', active.culture.upbringing, s['culture.upbringing']);
  for (const trait of s['ancestry.devil.purchased-traits'] ??
    s['ancestry.polder.purchased-traits'] ??
    [])
    selected('purchased trait', trait);
  for (const skill of s['class.fury.skills']) selected('class skill', skill);
  for (const ability of [
    s['class.fury.signature-ability'],
    s['class.fury.ability-3'],
    s['class.fury.ability-5'],
  ])
    selected('ability', ability);
  selected('kit', s['kit.choice']);
  selected('career perk', s['career.soldier.perk']);
  if (mismatches.length)
    fail(`The export does not match the choice map:\n  - ${mismatches.join('\n  - ')}`);

  // Every sheet page, not just the first.
  const pages = page.locator(UI.heroSheet);
  const pageCount = await pages.count();
  if (pageCount === 0) fail('The hero sheet was not rendered, so no sheet evidence exists.');
  const texts = [];
  for (let i = 0; i < pageCount; i += 1) {
    const sheetPage = pages.nth(i);
    await sheetPage.screenshot({ path: join(outDir, `sheet-page-${i + 1}.png`) });
    texts.push((await sheetPage.innerText()).trim());
  }
  await writeFile(join(outDir, 'sheet.txt'), texts.join('\n\n'), 'utf8');

  return { exportPath, sheetPageCount: pageCount };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = ['build', 'base-url', 'served-from', 'forge-commit', 'forge-version'];
  const missing = required.filter(key => !args[key] || args[key] === 'true');
  if (missing.length) {
    console.error(
      `Missing required argument(s): ${missing.join(', ')}.\n` +
        'Usage: node forge-capture.mjs --build <id> --base-url <url> ' +
        '--served-from "<how the app was served>" --forge-commit <sha> --forge-version <semver> ' +
        '[--serving-command "<exact command used>"] [--out ../forge]\n' +
        'Provenance arguments are never defaulted: a wrong provenance is worse than no capture.',
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
    const { exportPath, sheetPageCount } = await captureBuild(page, build, data.shared, outDir);
    const observedVersion = await readAboutVersion(page);
    const bytes = await readFile(exportPath);

    await writeFile(
      join(outDir, 'capture.json'),
      `${JSON.stringify(
        {
          buildId: build.id,
          capturedAtUTC: new Date().toISOString(),
          // Declared and observed are recorded SEPARATELY; collapsing them is how a public-site
          // capture ends up labelled as pinned source.
          declared: {
            servedFrom: args['served-from'],
            forgeCommit: args['forge-commit'],
            forgeVersion: args['forge-version'],
            servingCommand: args['serving-command'] ?? null,
          },
          observed: {
            baseUrl: args['base-url'],
            aboutVersion: observedVersion,
            sheetPageCount,
          },
          compendiumRevision: data.compendiumRevision,
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

    if (consoleErrors.length) {
      console.error(
        `The page logged ${consoleErrors.length} console error(s); they are recorded in ` +
          'capture.json. Treat this capture as failed until they are explained.',
      );
      process.exitCode = 1;
    }
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
