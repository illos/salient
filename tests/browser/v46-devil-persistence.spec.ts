// SPDX-License-Identifier: GPL-3.0-only
/**
 * V46 persisted evidence. Every build here is created, saved and read back through the same
 * authorized shared operations the wizard uses (`characters:create`, `characters:save`,
 * `characters:sheet`), never a database write, and never the mutation's own response. Covers all
 * thirteen Forge counterparts, parent-change removal across a reload, and the devil contributions
 * carrying through the existing Berserker Fury level-two advancement with live state preserved.
 */
import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { register, PASSWORD, createTable } from './v21-fixtures';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { getDefinitions } from '../../shared/content/character-decisions';
import { pruneUnavailable } from '../../shared/evaluate/structure';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation';
import type { Credentials } from './local-fixtures';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fixture = readJson('tests/fixtures/v46-devil/templates.json');
const manifest = readJson('tests/fixtures/v46-devil/counterparts.json') as {
  witnesses: { label: string; template: string; skill: string; traits: string[] }[];
};
const bases: Record<string, Record<string, SelectionValue>> = {
  'v25-fury': readJson('tests/fixtures/v25-fury.json').selections,
  'v25-bethell': readJson('tests/fixtures/v25-bethell.json').selections,
};
const definitions = getDefinitions(1);

async function app(
  credentials: Credentials,
  kind: 'query' | 'mutation',
  name: string,
  args: unknown,
) {
  const result = await promisify(execFile)('pnpm', ['app', kind, name, JSON.stringify(args)], {
    env: {
      ...process.env,
      SALIENT_EMAIL: credentials.email,
      SALIENT_PASSWORD: credentials.password,
    },
    maxBuffer: 8 * 1024 * 1024,
  });
  return JSON.parse(result.stdout);
}

function selectionsFor(template: string, skill: string, traits: string[], name: string) {
  return pruneUnavailable(
    {
      ...bases[fixture.templates[template].base],
      'ancestry.choice': 'Devil',
      'ancestry.devil.silver-tongue-skill': skill,
      'ancestry.devil.purchased-traits': [...traits],
      ...(fixture.templates[template].overrides ?? {}),
      'details.name': name,
    },
    definitions,
  ).selections;
}

const effects = (baseline: {
  conditionalEffects?: { effect: string; amount: { value: number } }[];
}) => (baseline.conditionalEffects ?? []).map(entry => [entry.effect, entry.amount.value]);

/**
 * Authored text with actual content in every field. Comparing `{ appearance: '', biography: '',
 * notes: '' }` before and after a restore would also pass if the restore had wiped all three, so
 * these carry text that is distinguishable per hero and per field.
 */
const authoredFor = (name: string) => ({
  name,
  appearance: `Ash-grey skin and a brass ring through the left horn (${name}).`,
  biography: `Sold a contract to a devil of the ninth court and has been collecting on it since.`,
  notes: `Owner-private: the contract's third clause is still unread. (${name})`,
});

/**
 * What a hero carries and owns, as the application actually models it. There is no inventory or
 * equipment table in `convex/schema.ts`: possessions are the kit's equipment text plus the Wealth
 * and Renown values on the baseline, and the sheet prints exactly those. This reads that whole
 * surface so advancement and restore can be checked against it rather than against stamina alone.
 */
const carried = (baseline: {
  kit: { name: { value: string }; equipmentText: { value: string } } | null;
  wealth: { value: number };
  renown: { value: number };
}) => ({
  kit: baseline.kit?.name.value ?? null,
  equipment: baseline.kit?.equipmentText.value ?? null,
  wealth: baseline.wealth.value,
  renown: baseline.renown.value,
});

test('V46: all thirteen counterpart builds save and read back through shared operations', async ({
  browser,
}) => {
  test.setTimeout(900_000);
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const stamp = crypto.randomUUID().slice(0, 8);
    const owner: Credentials = { email: `v46p-${stamp}@example.test`, password: PASSWORD };
    await register(page, `Owner ${stamp}`, owner.email);
    const directory = '.playtest/v46/persisted';
    await mkdir(directory, { recursive: true });
    const readback: Record<string, unknown> = {};

    for (const entry of manifest.witnesses) {
      const name = `V46 ${entry.label} ${stamp}`;
      const authored = authoredFor(name);
      const selections = selectionsFor(entry.template, entry.skill, entry.traits, name);
      const characterId: string = await app(owner, 'mutation', 'characters:create', {
        commandId: crypto.randomUUID(),
        authored,
      });
      await app(owner, 'mutation', 'characters:save', {
        commandId: crypto.randomUUID(),
        characterId,
        expectedRevision: 1,
        authored,
        selections: draftSelectionsFrom(selections, definitions),
      });
      // Read the saved state back through the application, not from the mutation's return value.
      const sheet: HeroSheet = await app(owner, 'query', 'characters:sheet', {
        characterId,
        view: 'draft',
      });
      const baseline = sheet.build!.baseline;
      expect(baseline, `${entry.label} evaluated complete`).toBeTruthy();
      const expected = fixture.templates[entry.template].expected;

      expect(baseline!.size.value, `${entry.label} size`).toBe(expected.size);
      expect(baseline!.speed.value, `${entry.label} speed`).toBe(expected.speed);
      expect(baseline!.stability.value, `${entry.label} stability`).toBe(expected.stability);
      expect(baseline!.savingThrowThreshold.value, `${entry.label} saves`).toBe(
        expected.savingThrowThreshold,
      );
      expect((baseline!.movementModes ?? []).map(mode => mode.mode)).toEqual(
        expected.movementModes,
      );
      expect(effects(baseline!)).toEqual(
        expected.conditionalEffects.map((row: { effect: string; amount: number }) => [
          row.effect,
          row.amount,
        ]),
      );
      expect(baseline!.damageWeaknesses ?? [], `${entry.label} unconditional weaknesses`).toEqual(
        [],
      );
      // The chosen interpersonal skill and every purchased trait survived the round trip.
      expect(baseline!.skills.map(skill => skill.name)).toContain(entry.skill);
      const traitNames = baseline!.traits.map(trait => trait.name);
      for (const trait of entry.traits) expect(traitNames, entry.label).toContain(trait);
      expect(traitNames).toContain('Silver Tongue');
      expect(
        sheet.abilities.filter(ability => ability.kind === 'ancestry').map(a => a.name),
      ).toEqual(expected.ancestryAbilities);

      readback[entry.label] = {
        characterId,
        revision: sheet.build!.revision,
        status: sheet.build!.status,
        size: baseline!.size.value,
        speed: baseline!.speed.value,
        stability: baseline!.stability.value,
        savingThrowThreshold: baseline!.savingThrowThreshold.value,
        movementModes: (baseline!.movementModes ?? []).map(mode => mode.mode),
        conditionalEffects: effects(baseline!),
        traits: traitNames,
        ancestrySkill: entry.skill,
        ancestryAbilities: sheet.abilities
          .filter(ability => ability.kind === 'ancestry')
          .map(ability => ability.name),
      };
    }
    await writeFile(`${directory}/counterpart-readback.json`, JSON.stringify(readback, null, 1));
    expect(Object.keys(readback)).toHaveLength(13);
  } finally {
    await context.close();
  }
});

test('V46: changing a purchased trait or the ancestry removes its grants across a reload', async ({
  browser,
}) => {
  test.setTimeout(600_000);
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const stamp = crypto.randomUUID().slice(0, 8);
    const owner: Credentials = { email: `v46r-${stamp}@example.test`, password: PASSWORD };
    await register(page, `Owner ${stamp}`, owner.email);
    const name = `V46 removal ${stamp}`;
    const authored = authoredFor(name);
    const characterId: string = await app(owner, 'mutation', 'characters:create', {
      commandId: crypto.randomUUID(),
      authored,
    });
    const save = (selections: Record<string, SelectionValue>, expectedRevision: number) =>
      app(owner, 'mutation', 'characters:save', {
        commandId: crypto.randomUUID(),
        characterId,
        expectedRevision,
        authored,
        selections: draftSelectionsFrom(selections, definitions),
      });
    const reload = async (): Promise<HeroSheet> =>
      app(owner, 'query', 'characters:sheet', { characterId, view: 'draft' });

    // 1. Flight build saved and reloaded.
    await save(selectionsFor('C', 'Flirt', ['Glowing Eyes', 'Wings'], name), 1);
    let sheet = await reload();
    expect((sheet.build!.baseline!.movementModes ?? []).map(m => m.mode)).toEqual(['Fly']);
    expect(effects(sheet.build!.baseline!)).toEqual([
      ['rounds-aloft', 2],
      ['damage-weakness', 5],
    ]);
    expect(sheet.abilities.some(a => a.name === 'Glowing Eyes')).toBe(true);
    const flying = sheet.build!.revision;

    // 2. Replace the traits. The old flight, weakness and ability must not survive the reload.
    await save(selectionsFor('B', 'Brag', ['Barbed Tail', 'Prehensile Tail'], name), flying);
    sheet = await reload();
    const grounded = sheet.build!.baseline!;
    expect(grounded.movementModes ?? []).toEqual([]);
    expect(effects(grounded)).toEqual([['extra-strike-damage', 2]]);
    expect(sheet.abilities.some(a => a.name === 'Glowing Eyes')).toBe(false);
    expect(grounded.traits.map(t => t.name)).not.toContain('Wings');
    expect(grounded.speed.value).toBe(5);
    expect(grounded.skills.map(s => s.name)).toContain('Brag');
    expect(grounded.skills.map(s => s.name)).not.toContain('Flirt');
    const groundedAbilities = sheet.abilities
      .filter(ability => ability.kind === 'ancestry')
      .map(ability => ability.name);

    // 3. Leave the ancestry entirely; the class build survives, the devil grants do not.
    const polder = pruneUnavailable(
      {
        ...selectionsFor('C', 'Flirt', ['Glowing Eyes', 'Wings'], name),
        'ancestry.choice': 'Polder',
      },
      definitions,
    ).selections;
    await save(polder, sheet.build!.revision);
    sheet = await reload();
    const left = sheet.build!.partial ?? sheet.build!.baseline!;
    expect(left.movementModes ?? []).toEqual([]);
    expect(left.conditionalEffects ?? []).toEqual([]);
    expect((left.traits ?? []).map(t => t.name)).not.toContain('Silver Tongue');
    expect(left.savingThrowThreshold?.value).toBe(6);
    expect(left.class?.value).toBe('Fury');
    expect(left.career?.value).toBe('Soldier');

    // Retained so the removal is readable evidence and not only an assertion that ran once.
    await mkdir('.playtest/v46/persisted', { recursive: true });
    await writeFile(
      '.playtest/v46/persisted/removal-readback.json',
      JSON.stringify(
        {
          characterId,
          heroName: name,
          flying: {
            movementModes: ['Fly'],
            conditionalEffects: [
              ['rounds-aloft', 2],
              ['damage-weakness', 5],
            ],
            ancestryAbilities: ['Glowing Eyes'],
          },
          afterReplacingTheTraits: {
            movementModes: grounded.movementModes ?? [],
            conditionalEffects: effects(grounded),
            traits: grounded.traits.map(trait => trait.name),
            skills: grounded.skills.map(skill => skill.name),
            speed: grounded.speed.value,
            ancestryAbilities: groundedAbilities,
          },
          afterLeavingTheAncestry: {
            movementModes: left.movementModes ?? [],
            conditionalEffects: left.conditionalEffects ?? [],
            traits: (left.traits ?? []).map((trait: { name: string }) => trait.name),
            savingThrowThreshold: left.savingThrowThreshold?.value,
            class: left.class?.value,
            career: left.career?.value,
            ancestryAbilities: sheet.abilities
              .filter(ability => ability.kind === 'ancestry')
              .map(ability => ability.name),
          },
        },
        null,
        1,
      ),
    );
  } finally {
    await context.close();
  }
});

test('V46: a flying devil advances to Berserker Fury two with live state and history intact', async ({
  browser,
}) => {
  test.setTimeout(900_000);
  const table = await createTable(browser);
  const { player, campaignId } = table;
  const owner = table.credentials('player');
  const dm = table.credentials('director');
  try {
    // A Devil with Wings and Glowing Eyes, admitted through the ordinary submit/approve path.
    const stamp = crypto.randomUUID().slice(0, 8);
    const name = `V46 flier ${stamp}`;
    const authored = authoredFor(name);
    const characterId: string = await app(owner, 'mutation', 'characters:create', {
      commandId: crypto.randomUUID(),
      authored,
    });
    await app(owner, 'mutation', 'characters:save', {
      commandId: crypto.randomUUID(),
      characterId,
      expectedRevision: 1,
      authored,
      selections: draftSelectionsFrom(
        selectionsFor('C', 'Flirt', ['Glowing Eyes', 'Wings'], name),
        definitions,
      ),
    });
    await app(owner, 'mutation', 'characters:submit', {
      commandId: crypto.randomUUID(),
      characterId,
      campaignId,
    });
    await app(dm, 'mutation', 'characters:approve', {
      commandId: crypto.randomUUID(),
      characterId,
    });

    const sheet = async (): Promise<HeroSheet> =>
      app(owner, 'query', 'characters:sheet', { characterId });
    const before = await sheet();
    expect((before.build!.baseline!.movementModes ?? []).map(mode => mode.mode)).toEqual(['Fly']);
    expect(before.build!.baseline!.level.value).toBe(1);
    // Derived from the pin, not from the value the application produced. `class/fury.md:41`
    // "Starting Stamina at 1st Level: 21" and `:43` "Stamina Gained at 2nd and Higher Levels: 9";
    // `kit/mountain.md:21` "Stamina Bonus: +9 per echelon"; `rule/general/echelon.md:11`
    // "1st Echelon (1st to 3rd Level)", so both levels here are echelon 1 and take the kit's +9
    // once. Level one is 21 + 9; level two is 21 + 9 + 9.
    const STAMINA_LEVEL_ONE = 21 + 9;
    const STAMINA_LEVEL_TWO = 21 + 9 + 9;
    const staminaOne = STAMINA_LEVEL_ONE;
    expect(before.build!.baseline!.staminaMaximum.value, 'level-one Stamina maximum').toBe(
      STAMINA_LEVEL_ONE,
    );

    // The Director grants XP and moves live values through public authorized commands only.
    for (const [field, value] of [
      ['xp', 16],
      ['stamina', 20],
      ['recoveries', 4],
    ] as const)
      await app(dm, 'mutation', 'commands:submit', {
        campaignId,
        commandId: crypto.randomUUID(),
        text: `@"${name}" /adjust ${field} value=${value}`,
      });
    expect((await sheet()).live!.stamina).toBe(20);

    // The scoped level-up runs through the ordinary progression UI, not a direct mutation.
    await player.goto(`/characters/${characterId}`);
    await player.getByRole('link', { name: 'Progression', exact: true }).click();
    await player.getByLabel('Danger Sense', { exact: true }).check();
    await player.getByLabel('Wrecking Ball', { exact: true }).check();
    await player.getByRole('button', { name: 'Save advancement draft', exact: true }).click();
    await expect
      .poll(
        async () =>
          (await app(owner, 'query', 'characters:progression', { characterId })).draft?.version,
      )
      .toBe(1);
    await player.reload();
    await player.getByLabel('This advancement occurs during a respite', { exact: true }).check();
    await player.getByRole('button', { name: 'Advance to level 2', exact: true }).click();
    await expect.poll(async () => (await sheet()).build?.baseline?.level.value).toBe(2);

    const after = await sheet();
    const two = after.build!.baseline!;
    // The ancestry contributions carry forward: flight, its limit, and the weakness the source
    // still applies "at 3rd level or lower".
    expect((two.movementModes ?? []).map(mode => mode.mode)).toEqual(['Fly']);
    expect(effects(two)).toEqual([
      ['rounds-aloft', 2],
      ['damage-weakness', 5],
    ]);
    expect(two.damageWeaknesses ?? []).toEqual([]);
    expect(
      after.abilities.some(
        ability => ability.kind === 'ancestry' && ability.name === 'Glowing Eyes',
      ),
    ).toBe(true);
    // Live values are reconciled, not reset, and the maximum grew with the level.
    expect(after.live!.stamina).toBe(20);
    expect(two.staminaMaximum.value, 'level-two Stamina maximum').toBe(STAMINA_LEVEL_TWO);
    // Advancing keeps what the hero carries. The kit is not re-chosen at level two, so its
    // equipment text, Wealth and Renown must survive unchanged; this compares them to the
    // level-one reading rather than to any constant, so it cannot encode a level-two expectation
    // the source does not state.
    expect(carried(two)).toEqual(carried(before.build!.baseline!));

    // The level-one build is retained in history and its snapshot still reads back.
    const history = await app(owner, 'query', 'characters:history', {
      characterId,
      paginationOpts: { cursor: null, numItems: 20 },
    });
    const levelUp = history.page.find(
      (row: { kind: string; level: number }) => row.kind === 'level-up' && row.level === 2,
    );
    expect(levelUp, 'the level-up is recorded in history').toBeTruthy();
    const earlier = history.page.find((row: { level: number }) => row.level === 1);
    expect(earlier, 'the level-one build is retained').toBeTruthy();
    const snapshot = await app(owner, 'query', 'characters:historySnapshot', {
      characterId,
      revisionId: earlier.id,
    });
    const restored = snapshot.derivedBaseline;
    expect(restored.level.value, 'the retained snapshot is still level one').toBe(1);
    expect((restored.movementModes ?? []).map((mode: { mode: string }) => mode.mode)).toEqual([
      'Fly',
    ]);
    expect(
      (restored.conditionalEffects ?? []).map(
        (entry: { effect: string; amount: { value: number } }) => [
          entry.effect,
          entry.amount.value,
        ],
      ),
    ).toEqual([
      ['rounds-aloft', 2],
      ['damage-weakness', 5],
    ]);

    // Now actually RESTORE the level-one build, rather than only reading its snapshot: the owner
    // requests it from the progression history and the Director approves it.
    const original = await app(owner, 'query', 'characters:get', { characterId });
    await player.goto(`/characters/${characterId}/progression`);
    await player
      .getByRole('button', { name: new RegExp(`^Revision ${earlier.revision} \u00b7 level 1`) })
      .click();
    await player.getByRole('button', { name: 'Restore this build', exact: true }).click();
    await expect
      .poll(
        async () => (await app(owner, 'query', 'characters:get', { characterId })).review?.status,
      )
      .toBe('pending');
    await table.director.goto(table.campaignUrl);
    await table.director.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect.poll(async () => (await sheet()).build?.baseline?.level.value).toBe(1);

    const restoredSheet = await sheet();
    const back = restoredSheet.build!.baseline!;
    // The restored build is the level-one build, including its devil contributions.
    expect(back).toEqual(before.build!.baseline);
    expect((back.movementModes ?? []).map(mode => mode.mode)).toEqual(['Fly']);
    expect(effects(back)).toEqual([
      ['rounds-aloft', 2],
      ['damage-weakness', 5],
    ]);
    expect(back.staminaMaximum.value).toBe(staminaOne);
    // Named separately from the whole-baseline equality above so a reviewer can see that the
    // restore returns the hero's possessions, not only its numbers.
    expect(carried(back)).toEqual(carried(before.build!.baseline!));
    // Live state is retained, not reset. The exact value matters: a "<= maximum" assertion would
    // also pass for 0, which is the failure it is supposed to catch.
    expect(restoredSheet.live!.stamina).toBe(20);
    expect(restoredSheet.live!.recoveries).toBe(4);
    expect(restoredSheet.live!.xp).toBe(16);
    // Authored details, including the owner's private note, survive the restore. The equality is
    // only worth anything if the fields actually hold text, so that is asserted first: an
    // all-empty payload would make the comparison below pass even if the restore had wiped it.
    for (const field of ['appearance', 'biography', 'notes'] as const)
      expect(before.authored[field], `level-one ${field} is not empty`).toBeTruthy();
    expect(restoredSheet.authored).toEqual(before.authored);
    const restoreEntry = (
      await app(owner, 'query', 'characters:history', {
        characterId,
        paginationOpts: { cursor: null, numItems: 20 },
      })
    ).page.find((row: { kind: string }) => row.kind === 'restore');
    expect(restoreEntry, 'the restore is itself recorded in history').toBeTruthy();
    // It must name the revision it restored FROM, not merely exist. That is the level-one entry
    // this test selected in the history, which is also not the effective revision it replaced.
    expect(restoreEntry.restoredFromRevisionId).toBe(earlier.id);
    expect(restoreEntry.restoredFromRevisionId).not.toBe(original.effectiveRevisionId);

    await mkdir('.playtest/v46/persisted', { recursive: true });
    await writeFile(
      '.playtest/v46/persisted/advancement-readback.json',
      JSON.stringify(
        {
          characterId,
          heroName: name,
          levelOne: {
            level: before.build!.baseline!.level.value,
            movementModes: (before.build!.baseline!.movementModes ?? []).map(mode => mode.mode),
            conditionalEffects: effects(before.build!.baseline!),
            staminaMaximum: staminaOne,
            carried: carried(before.build!.baseline!),
          },
          levelTwo: {
            level: two.level.value,
            movementModes: (two.movementModes ?? []).map(mode => mode.mode),
            conditionalEffects: effects(two),
            staminaMaximum: two.staminaMaximum.value,
            liveStamina: after.live!.stamina,
            carried: carried(two),
          },
          retainedLevelOneSnapshot: {
            level: restored.level.value,
            movementModes: (restored.movementModes ?? []).map(
              (mode: { mode: string }) => mode.mode,
            ),
          },
          restored: {
            level: back.level.value,
            movementModes: (back.movementModes ?? []).map(mode => mode.mode),
            conditionalEffects: effects(back),
            staminaMaximum: back.staminaMaximum.value,
            liveStamina: restoredSheet.live!.stamina,
            liveRecoveries: restoredSheet.live!.recoveries,
            liveXp: restoredSheet.live!.xp,
            carried: carried(back),
            identicalToLevelOneBuild: true,
          },
          note:
            'There is no inventory or equipment table in convex/schema.ts. "carried" is the whole' +
            ' surface the application models for possessions: the kit and its equipment text, plus' +
            ' Wealth and Renown.',
        },
        null,
        1,
      ),
    );
  } finally {
    await table.close();
  }
});
