// SPDX-License-Identifier: GPL-3.0-only
/**
 * V50 Dwarf level-one Forge Steel counterpart capture.
 *
 * STATUS: AUTHORED, NOT EXECUTED. No capture has been performed with this script, no export
 * exists under `tests/fixtures/v50-dwarf/`, and nothing it produces has been verified. It is
 * committed as preparation so the capture is reviewable and reproducible before it is run.
 *
 * Capture mode follows the one V46 established and the integration lead directed, permitted by
 * `docs/build/character-verification.md#2-build-and-capture-the-reference`: the **pinned** Forge
 * Steel application, cloned on CT114 at `5a846aadb623a9855a023e9403bb887a956c341f`, built with its
 * own lockfile and served from `dist` on a loopback port in a disposable container. The
 * repository's `vendor/forge-steel` checkout is never built, installed into or modified; run
 * `pnpm check-vendor` afterwards to confirm both submodules remain at their pinned commits.
 *
 * This is NOT a claim of parity with the current public website, which is ahead of the pin.
 * Using the pin removes website drift as an explanation for a mismatch, at the cost of saying
 * nothing about the live site.
 *
 * Every hero is built by driving the real editor — each chooser opened and its option clicked —
 * then saved and exported through the application's own `Export as Data` path. No export is
 * constructed programmatically and no selection is written into storage behind the editor.
 *
 * COMPLETION STATE IS NOT DETECTED AUTOMATICALLY. An earlier draft scraped three CSS/ARIA selectors
 * for outstanding-choice warnings and claimed a partial capture therefore could not look complete.
 * An independent review found that none of those selectors matches anything in Forge, so the check
 * was vacuous: every witness, including an incomplete one, would have been recorded clean with a
 * zero exit. The guard is removed rather than left looking like protection. Every witness is
 * written with `completionVerified: false` and MUST be confirmed by hand against the rendered sheet
 * before it is treated as a counterpart, per
 * `docs/build/character-verification.md#per-option-delivery-gate`, which requires a legal COMPLETED
 * counterpart.
 *
 * LOCATORS ARE UNVALIDATED. They were authored against the editor's component structure, not a
 * running instance, and some are known wrong — Forge's ancestry and culture pickers are clickable
 * cards rather than ARIA options, and "Export as Data" is a button rather than a menu item. They
 * fail loudly rather than silently, but this script has never been run and its selectors must be
 * corrected against the real UI on first execution.
 *
 * Run only through the approved remote workflow, never on Presidium:
 *   presidium-dev --env <named> run browser -- pnpm exec tsx scripts/capture-v50-forge.ts \
 *     --base-url http://127.0.0.1:<port> --out tests/fixtures/v50-dwarf
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';

/** The three builds, read from the reviewed preparation rather than restated here. */
interface ChoiceMaps {
  compendiumRevision: string;
  forgeRevision: string;
  constantSelections: Record<string, unknown>;
  builds: { id: string; selections: Record<string, unknown>; covers: string[] }[];
}

interface Witness {
  label: string;
  heroName: string;
  traits: string[];
  export: string;
  sheet: string;
  bytes: number;
  sha256: string;
  sheetSha256: string;
  sourcebookIDs: string[];
  /** Always false until completion is derived from Forge's own model; confirm by hand. */
  completionVerified: false;
  /** Source-backed differences between what the editor produced and what the source requires. */
  corrections: string[];
}

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

function arg(name: string, fallback?: string): string {
  const hit = process.argv.find(value => value.startsWith(`--${name}=`));
  const indexed = process.argv.indexOf(`--${name}`);
  const value = hit ? hit.slice(name.length + 3) : indexed >= 0 ? process.argv[indexed + 1] : undefined;
  if (value === undefined && fallback === undefined) throw new Error(`missing --${name}`);
  return value ?? fallback!;
}

/**
 * Open a named chooser and click one option. Kept deliberately explicit: the point of driving the
 * real editor is that a selection the UI would refuse must fail here too, so there is no
 * force-click and no direct state write.
 */
async function choose(page: Page, chooser: string, option: string): Promise<void> {
  await page.getByRole('button', { name: chooser, exact: false }).first().click();
  await page.getByRole('option', { name: option, exact: true }).click();
  await page.getByRole('button', { name: /close|done/i }).first().click();
}

/** Ancestry points are spent by selecting each purchased trait in turn. */
async function selectPurchasedTraits(page: Page, traits: string[]): Promise<void> {
  for (const trait of traits) await choose(page, 'Dwarf Traits', trait);
}

/**
 * Runic Carving is not selected, and in the pinned application it cannot be: Forge marks the
 * feature `selectAt: 'play'`, so its build editor offers no rune chooser at all. An earlier draft
 * of this comment said Forge modelled it as a build-time choice; that was wrong about Forge. The
 * omission is simply what the editor does. Q-CHAR-18 remains open on the source, and rune coverage
 * stays INCOMPLETE regardless: observing this editor does not decide Salient's rules.
 */
async function captureBuild(
  page: Page,
  baseUrl: string,
  build: ChoiceMaps['builds'][number],
  constants: Record<string, unknown>,
  outDir: string,
): Promise<Witness> {
  const heroName = `V50 ${build.id}`;
  await page.goto(`${baseUrl}/#/hero/create`);

  await choose(page, 'Ancestry', 'Dwarf');
  await selectPurchasedTraits(page, build.selections['ancestry.dwarf.purchased-traits'] as string[]);

  // Background and class are held constant so the ancestry contribution is isolated.
  await choose(page, 'Culture', String(constants['culture.name']));
  await choose(page, 'Language', String(constants['culture.language']));
  await choose(page, 'Environment', String(constants['culture.environment']));
  await choose(page, 'Environment Skill', String(constants['culture.environment.skill']));
  await choose(page, 'Organization', String(constants['culture.organization']));
  await choose(page, 'Organization Skill', String(constants['culture.organization.skill']));
  await choose(page, 'Upbringing', String(constants['culture.upbringing']));
  await choose(page, 'Upbringing Skill', String(constants['culture.upbringing.skill']));

  await choose(page, 'Career', String(constants['career.choice']));
  for (const skill of constants['career.mages-apprentice.skills'] as string[])
    await choose(page, 'Career Skills', skill);
  for (const language of constants['career.mages-apprentice.languages'] as string[])
    await choose(page, 'Career Languages', language);
  await choose(page, 'Perk', String(constants['career.mages-apprentice.perk']));
  await choose(page, 'Inciting Incident', String(constants['career.mages-apprentice.inciting-incident']));

  await choose(page, 'Class', String(constants['class.choice']));
  await choose(page, 'Characteristics', String(constants['class.elementalist.characteristic-array']));
  const assignment = constants['class.elementalist.array-assignment'] as Record<string, number>;
  for (const [characteristic, value] of Object.entries(assignment))
    await choose(page, characteristic, String(value));
  for (const skill of constants['class.elementalist.skills'] as string[])
    await choose(page, 'Crafting / Lore Skills', skill);
  await choose(page, 'Magic', String(constants['class.elementalist.magic-replacement']));
  await choose(page, 'Elemental Specialization', String(constants['class.elementalist.specialization']));
  await choose(page, 'Enchantment', String(constants['class.elementalist.enchantment']));
  await choose(page, 'Elementalist Ward', String(constants['class.elementalist.ward']));
  for (const ability of constants['class.elementalist.signature-abilities'] as string[])
    await choose(page, 'Signature Ability', ability);
  await choose(page, '3pt Ability', String(constants['class.elementalist.ability-3']));
  await choose(page, '5pt Ability', String(constants['class.elementalist.ability-5']));

  await page.getByLabel('Name').fill(heroName);
  await page.getByRole('button', { name: 'Save Changes' }).click();

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click().then(() =>
      page.getByRole('menuitem', { name: 'Export as Data' }).click(),
    ),
  ]).then(([event]) => event);

  const exportName = `${build.id}.ds-hero`;
  const exportPath = join(outDir, exportName);
  await download.saveAs(exportPath);
  const bytes = await readFile(exportPath);

  const sheetName = `${build.id}-sheet.txt`;
  const sheetText = await page.locator('main').innerText();
  await writeFile(join(outDir, sheetName), sheetText, 'utf8');
  await page.screenshot({ path: join(outDir, `${build.id}-sheet.png`), fullPage: true });

  const exported = JSON.parse(bytes.toString('utf8')) as { sourcebookIDs?: string[] };

  return {
    label: build.id,
    heroName,
    traits: build.selections['ancestry.dwarf.purchased-traits'] as string[],
    export: exportName,
    sheet: sheetName,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    sheetSha256: sha256(sheetText),
    sourcebookIDs: exported.sourcebookIDs ?? [],
    completionVerified: false,
    corrections: [],
  };
}

async function main(): Promise<void> {
  const baseUrl = arg('base-url');
  const outDir = arg('out', 'tests/fixtures/v50-dwarf');
  await mkdir(outDir, { recursive: true });
  const maps = JSON.parse(
    await readFile(join(outDir, 'choice-maps.json'), 'utf8'),
  ) as ChoiceMaps;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const witnesses: Witness[] = [];
  try {
    for (const build of maps.builds)
      witnesses.push(await captureBuild(page, baseUrl, build, maps.constantSelections, outDir));
  } finally {
    await browser.close();
  }

  await writeFile(
    join(outDir, 'counterparts.json'),
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString().slice(0, 10),
        capturedFrom: 'the pinned Forge Steel application built and served on CT114',
        forgeRevision: maps.forgeRevision,
        compendiumRevision: maps.compendiumRevision,
        note: 'Built by driving the real editor and exported through its own Export as Data path. Not a claim of parity with the current public website.',
        completionDetection:
          'NOT AUTOMATED. Every witness is completionVerified: false and must be confirmed by hand against the rendered sheet before it is treated as a counterpart.',
        runicCarvingCoverage:
          'INCOMPLETE — Q-CHAR-18 open. Forge marks the rune selectAt: play, so its build editor offers no rune chooser; observing that does not decide Salient rules.',
        witnesses,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  // No witness is a counterpart until its completion is confirmed by hand. Say so on every run
  // rather than exiting 0 and letting the manifest imply otherwise.
  console.error(
    `Captured ${witnesses.length} witnesses with completionVerified: false. ` +
      'Confirm each against its rendered sheet before treating it as a counterpart.',
  );
  process.exitCode = 1;
}

await main();
