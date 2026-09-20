// SPDX-License-Identifier: GPL-3.0-only
/** Live public-operation proof. Expected mechanics come from the pinned V25/V60/V61/V70/V71 witnesses. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext, Actor } from './character-client.ts';
import { runRemainingAncestries } from './remaining-ancestries.ts';
import { runTraitAbilities } from './trait-abilities.ts';
import { runLifecycle } from './character-lifecycle.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationResult,
  SelectionValue,
} from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';

type Discovery = {
  definitions: DecisionDefinitions;
  selections: DraftSelection[];
  evaluation: EvaluationResult;
};
type Transition = { selections: DraftSelection[]; removed: string[]; evaluation: EvaluationResult };
type Saved = {
  revision: number;
  authored: typeof authored;
  selections: DraftSelection[];
  status: string;
  effectiveRevisionId: string | null;
  evaluation: EvaluationResult;
};
const authored = {
  name: '',
  appearance: 'Blue cloak',
  biography: 'Headless proof',
  notes: 'Owner only',
};
const readFixture = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/${name}.json`, 'utf8')) as {
    selections: Record<string, SelectionValue>;
    expected: Record<string, unknown>;
  };
const values = (selections: DraftSelection[]) =>
  Object.fromEntries(selections.map(s => [s.decisionId, s.value]));
const commandId = () => crypto.randomUUID();

/** Build input provenance from remotely discovered definitions, not bundled wizard knowledge. */
function input(discovery: Discovery, choices: Record<string, SelectionValue>): DraftSelection[] {
  return Object.entries(choices)
    .filter(([id]) => !id.startsWith('details.'))
    .map(([decisionId, value]) => {
      const step = discovery.definitions.steps.find(step =>
        step.decisions.some(d => d.id === decisionId),
      );
      const decision = step?.decisions.find(d => d.id === decisionId);
      assert.ok(step && decision, `Discovery missing ${decisionId}`);
      return {
        decisionId,
        value,
        ownerBranchId: step.id,
        sources: [
          {
            id: decisionId,
            path: decision.source,
            revision: discovery.definitions.compendiumRevision,
          },
        ],
      };
    });
}
async function saved(actor: Actor, characterId: string) {
  return actor.query<Saved>('characters:get', { characterId });
}

export async function runScenarios(context: ScenarioContext) {
  const {
    actors: { player, peer },
    run,
    skip,
    runId,
  } = context;
  let discovery: Discovery | undefined;
  const discovered = await run(
    'discover decisions and preview without creating a character',
    async () => {
      const before = await player.query<unknown[]>('characters:listMine', {});
      discovery = await player.query<Discovery>('characterWizard:discover', {});
      assert.equal(discovery.definitions.steps.length, 10);
      for (const id of [
        'ancestry.choice',
        'class.choice',
        'career.choice',
        'complication.choice',
        'connections.notes',
      ])
        assert.ok(
          discovery.definitions.steps.some(step => step.decisions.some(d => d.id === id)),
          id,
        );
      assert.notEqual(discovery.evaluation.status, 'complete');
      assert.deepEqual(await player.query('characters:listMine', {}), before);
    },
  );
  if (!discovered || !discovery) {
    skip('wizard choices and saved-state cases', 'Decision discovery prerequisite failed.');
    await runLifecycle(context);
    await runTraitAbilities(context);
    return;
  }
  const definitions = discovery;
  const fury = readFixture('v25-fury');
  const elementalist = readFixture('v25-bethell');
  let baseId: string | undefined;
  let baseChoices: DraftSelection[] = [];
  for (const ancestry of ['Devil', 'Polder', 'Dwarf', 'Human', 'Hakaan', 'Orc']) {
    await run(
      `${ancestry}: complete creation, exact first-save retry and fresh persisted sheet`,
      async () => {
        const fixture = ancestry === 'Polder' || ancestry === 'Human' ? elementalist : fury;
        const choices: Record<string, SelectionValue> = {
          ...fixture.selections,
          'connections.notes': 'Met the other heroes at a bridge.',
        };
        if (['Dwarf', 'Human', 'Hakaan', 'Orc'].includes(ancestry)) {
          for (const key of Object.keys(choices))
            if (key.startsWith('ancestry.')) delete choices[key];
          choices['ancestry.choice'] = ancestry;
          choices[`ancestry.${ancestry.toLowerCase()}.purchased-traits`] = (
            {
              Dwarf: ['Grounded', 'Spark Off Your Skin'],
              Human: ['Perseverance', 'Staying Power'],
              Hakaan: ['Great Fortitude', 'Stand Tough'],
              Orc: ['Grounded', 'Nonstop'],
            } as Record<string, string[]>
          )[ancestry]!;
        }
        const selections = input(definitions, choices);
        const preview = await player.query<Discovery>('characterWizard:discover', { selections });
        assert.equal(preview.evaluation.status, 'complete');
        const payload = {
          commandId: commandId(),
          authored: { ...authored, name: `${ancestry} ${runId}` },
          selections: preview.selections,
        };
        const id = await player.mutation<string>('characters:create', payload);
        assert.equal(await player.mutation('characters:create', payload), id);
        const readback = await saved(player, id);
        assert.equal(readback.status, 'complete');
        assert.deepEqual(values(readback.selections), values(preview.selections));
        assert.deepEqual(readback.authored, payload.authored);
        const sheet = await player.query<HeroSheet>('characters:sheet', { characterId: id });
        assert.equal(sheet.details.connections, choices['connections.notes']);
        assert.equal(sheet.authored.notes, authored.notes);
        assert.ok(sheet.build?.baseline);
        const expected =
          ancestry === 'Dwarf'
            ? { staminaMaximum: 36, recoveryValue: 12, windedValue: 18, stability: 3 }
            : ancestry === 'Human'
              ? { staminaMaximum: 18, recoveriesMaximum: 10, recoveryValue: 6, windedValue: 9 }
              : ancestry === 'Hakaan' || ancestry === 'Orc'
                ? {
                    staminaMaximum: 30,
                    recoveryValue: 10,
                    windedValue: 15,
                    speed: 5,
                    size: ancestry === 'Hakaan' ? '1L' : '1M',
                    stability: ancestry === 'Orc' ? 3 : 2,
                  }
                : Object.fromEntries(
                    ['staminaMaximum', 'recoveriesMaximum', 'recoveryValue', 'speed'].map(key => [
                      key,
                      fixture.expected[key],
                    ]),
                  );
        for (const [key, value] of Object.entries(expected)) {
          const actual: unknown = sheet.build.baseline[key as keyof typeof sheet.build.baseline];
          assert.equal((actual as { value: unknown }).value, value, `${ancestry} ${key}`);
        }
        for (const trait of choices[
          `ancestry.${ancestry.toLowerCase()}.purchased-traits`
        ] as string[]) {
          const feature = sheet.features.find(item => item.name === trait);
          const content = feature?.content;
          assert.ok(content, `Missing source-bearing trait ${trait}`);
          assert.ok(content.text.trim(), `Empty source-bearing trait ${trait}`);
          assert.ok(content.sourcePath.includes(`/feature/trait/${ancestry.toLowerCase()}/`));
        }
        if (ancestry === 'Hakaan' || ancestry === 'Orc') {
          // Catches missing permanent immunity and signature source in the deployed projection.
          assert.deepEqual(
            sheet.build.baseline.conditionImmunities?.map(item => item.condition),
            [ancestry === 'Hakaan' ? 'weakened' : 'slowed'],
          );
          const signature = sheet.features.find(
            feature => feature.name === (ancestry === 'Hakaan' ? 'Big!' : 'Relentless'),
          );
          assert.ok(signature?.content?.text.trim(), `${ancestry} signature source missing`);
        }
        assert.ok(sheet.abilities.some(a => a.name === 'Melee Weapon Free Strike'));
        assert.ok(sheet.abilities.some(a => a.name === 'Ranged Weapon Free Strike'));
        for (const ability of sheet.abilities)
          assert.ok(ability.content, `Missing source ${ability.name}`);
        if (ancestry === 'Hakaan') {
          // Proves saved parent replacement removes Big! and immunity, not just an in-memory preview.
          let changed = await player.query<Transition>('characterWizard:transition', {
            characterId: id,
            selections: readback.selections,
            decisionId: 'ancestry.choice',
            value: 'Polder',
          });
          assert.ok(changed.removed.includes('ancestry.hakaan.purchased-traits'));
          changed = await player.query<Transition>('characterWizard:transition', {
            characterId: id,
            selections: changed.selections,
            decisionId: 'ancestry.polder.purchased-traits',
            value: ['Corruption Immunity', 'Fearless', 'Graceful Retreat'],
          });
          await player.mutation('characters:save', {
            characterId: id,
            commandId: commandId(),
            expectedRevision: readback.revision,
            authored: readback.authored,
            selections: changed.selections,
          });
          const after = await saved(player, id);
          assert.equal(after.status, 'complete');
          assert.ok(
            !after.selections.some(selection =>
              selection.decisionId.startsWith('ancestry.hakaan.'),
            ),
          );
          assert.deepEqual(after.authored, readback.authored);
          const updated = await player.query<HeroSheet>('characters:sheet', { characterId: id });
          assert.equal(updated.build?.baseline?.size.value, '1S');
          assert.ok(
            !updated.build?.baseline?.conditionImmunities?.some(
              item => item.condition === 'weakened',
            ),
          );
          assert.ok(!updated.features.some(feature => feature.name === 'Big!'));
        }
        if (ancestry === 'Devil') {
          baseId = id;
          baseChoices = readback.selections;
        }
      },
    );
  }
  const extraTraits: [string, string[][]][] = [
    [
      'Hakaan',
      [
        ['Doomsight', 'Forceful'],
        ['All Is a Feather', 'Forceful', 'Stand Tough'],
      ],
    ],
    [
      'Orc',
      [
        ['Bloodfire Rush', 'Glowing Recovery'],
        ['Bloodfire Rush', 'Grounded', 'Passionate Artisan'],
      ],
    ],
    [
      'Devil',
      [['Wings'], ['Prehensile Tail', 'Beast Legs'], ['Barbed Tail', 'Glowing Eyes', 'Hellsight']],
    ],
    ['Polder', [['Nimblestep', 'Polder Geist', 'Reactive Tumble']]],
    [
      'Dwarf',
      [
        ['Great Fortitude', 'Stand Tough'],
        ['Grounded', 'Stand Tough', 'Stone Singer'],
      ],
    ],
    [
      'Human',
      [
        ['Determination', "Can't Take Hold"],
        ['Perseverance', 'Resist the Unnatural', "Can't Take Hold"],
      ],
    ],
  ];
  for (const [ancestry, bundles] of extraTraits) {
    await run(
      `${ancestry}: remaining purchase witnesses persist through the public route`,
      async () => {
        for (const [index, traits] of bundles.entries()) {
          const fixture = ancestry === 'Polder' || ancestry === 'Human' ? elementalist : fury;
          const choices = { ...fixture.selections };
          for (const key of Object.keys(choices))
            if (key.startsWith('ancestry.')) delete choices[key];
          choices['ancestry.choice'] = ancestry;
          if (ancestry === 'Devil') choices['ancestry.devil.silver-tongue-skill'] = 'Persuade';
          const key = `ancestry.${ancestry.toLowerCase()}.purchased-traits`;
          choices[key] = traits;
          if (traits.includes('Passionate Artisan'))
            choices['ancestry.orc.passionate-artisan.skills'] = ['Blacksmithing', 'Tailoring'];
          const result = await player.query<Discovery>('characterWizard:discover', {
            selections: input(definitions, choices),
          });
          assert.equal(result.evaluation.status, 'complete');
          const id = await player.mutation<string>('characters:create', {
            commandId: commandId(),
            authored: { ...authored, name: `${ancestry} options ${index} ${runId}` },
            selections: result.selections,
          });
          const readback = await saved(player, id);
          assert.equal(readback.status, 'complete');
          assert.deepEqual(values(readback.selections)[key], traits);
          const sheet = await player.query<HeroSheet>('characters:sheet', { characterId: id });
          for (const trait of traits) {
            const feature = sheet.features.find(feature => feature.name === trait);
            assert.ok(feature?.content?.text.trim(), `Missing source-bearing trait ${trait}`);
          }
          if (ancestry === 'Hakaan' || ancestry === 'Orc') {
            assert.ok(sheet.build?.baseline);
            assert.equal(sheet.build.baseline.speed.value, 5, 'Conditional speed stays manual');
            assert.deepEqual(sheet.build.baseline.conditionImmunities ?? [], []);
          }
          if (traits.includes('Passionate Artisan')) {
            // These are project targets, not free skill grants. Save then remove their parent
            // through the same transition operation used by the wizard and read back again.
            const targetId = 'ancestry.orc.passionate-artisan.skills';
            assert.deepEqual(values(readback.selections)[targetId], ['Blacksmithing', 'Tailoring']);
            assert.equal(
              sheet.build!.baseline!.skills.filter(skill => skill.name === 'Blacksmithing').length,
              1,
            );
            assert.ok(!sheet.build!.baseline!.skills.some(skill => skill.name === 'Tailoring'));
            const changed = await player.query<Transition>('characterWizard:transition', {
              characterId: id,
              selections: readback.selections,
              decisionId: key,
              value: ['Grounded', 'Nonstop'],
            });
            assert.ok(changed.removed.includes(targetId));
            await player.mutation('characters:save', {
              characterId: id,
              commandId: commandId(),
              expectedRevision: readback.revision,
              authored: readback.authored,
              selections: changed.selections,
            });
            const after = await saved(player, id);
            assert.equal(values(after.selections)[targetId], undefined);
            const updatedSheet = await player.query<HeroSheet>('characters:sheet', {
              characterId: id,
            });
            assert.ok(
              !updatedSheet.features.some(feature => feature.name === 'Passionate Artisan'),
            );
            assert.equal(updatedSheet.build?.baseline?.stability.value, 3);
          }
        }
      },
    );
  }
  if (baseId) {
    const characterId = baseId;
    await run('private draft, source discovery and transition reject another owner', async () => {
      for (const name of ['characters:get', 'characterWizard:discover'])
        await assert.rejects(
          peer.query(name, { characterId }),
          /unavailable|only the character owner/i,
        );
      await assert.rejects(
        peer.query('characterWizard:transition', {
          characterId,
          selections: baseChoices,
          decisionId: 'class.choice',
          value: 'Elementalist',
        }),
        /unavailable|only the character owner/i,
      );
    });
    await run(
      'parent replacement clears dependent choices and persists unrelated details',
      async () => {
        let selections = baseChoices;
        for (const [decisionId, value, removedPrefix] of [
          ['class.choice', 'Elementalist', 'class.fury.'],
          ['ancestry.choice', 'Human', 'ancestry.devil.'],
          ['career.choice', "Mage's Apprentice", 'career.soldier.'],
        ]) {
          const result = await player.query<Transition>('characterWizard:transition', {
            characterId,
            selections,
            decisionId,
            value,
          });
          assert.ok(result.removed.some(id => id.startsWith(removedPrefix!)));
          assert.ok(!result.selections.some(s => s.decisionId.startsWith(removedPrefix!)));
          assert.equal(
            values(result.selections)['connections.notes'],
            'Met the other heroes at a bridge.',
          );
          selections = result.selections;
        }
        const before = await saved(player, characterId);
        await player.mutation('characters:save', {
          commandId: commandId(),
          characterId,
          expectedRevision: before.revision,
          authored: before.authored,
          selections,
        });
        assert.deepEqual(values((await saved(player, characterId)).selections), values(selections));
      },
    );
    await run(
      'culture, kit and complication transitions preserve saved authored fields',
      async () => {
        let selections = baseChoices;
        for (const [decisionId, value] of [
          ['culture.environment', 'Urban'],
          ['kit.choice', 'Panther'],
          ['complication.choice', 'Strange Inheritance'],
        ] as const) {
          const result = await player.query<Transition>('characterWizard:transition', {
            characterId,
            selections,
            decisionId,
            value,
          });
          assert.equal(values(result.selections)[decisionId], value);
          selections = result.selections;
        }
        const none = await player.query<Transition>('characterWizard:transition', {
          characterId,
          selections,
          decisionId: 'complication.choice',
        });
        assert.equal(values(none.selections)['complication.choice'], undefined);
        const before = await saved(player, characterId);
        await player.mutation('characters:save', {
          characterId,
          commandId: commandId(),
          expectedRevision: before.revision,
          authored: before.authored,
          selections: none.selections,
        });
        const after = await saved(player, characterId);
        assert.deepEqual(values(after.selections), values(none.selections));
        assert.deepEqual(after.authored, before.authored);
      },
    );
    await run(
      'incomplete and over-budget previews cannot be mistaken for complete builds',
      async () => {
        const missingKit = baseChoices.filter(s => s.decisionId !== 'kit.choice');
        const incomplete = await player.query<Discovery>('characterWizard:discover', {
          selections: missingKit,
        });
        assert.equal(incomplete.evaluation.status, 'incomplete');
        const over = input(definitions, {
          ...fury.selections,
          'ancestry.devil.purchased-traits': ['Wings', 'Beast Legs', 'Impressive Horns'],
        });
        const invalid = await player.query<Discovery>('characterWizard:discover', {
          selections: over,
        });
        assert.equal(invalid.evaluation.status, 'invalid');
      },
    );
    await run(
      'array replacement clears assignment; named assignment and stale-save guards use public operations',
      async () => {
        const reset = await player.query<Transition>('characterWizard:transition', {
          selections: baseChoices,
          decisionId: 'class.fury.characteristic-array',
          value: '1, 1, −1',
        });
        assert.ok(!reset.selections.some(s => s.decisionId === 'class.fury.array-assignment'));
        const before = await saved(player, characterId);
        const args = {
          commandId: commandId(),
          characterId,
          expectedRevision: before.revision,
          authored: before.authored,
          selections: reset.selections,
          assignment: { target: 'Intuition', value: 1 },
        };
        const revision = await player.mutation('characters:save', args);
        assert.equal(await player.mutation('characters:save', args), revision);
        const current = await saved(player, characterId);
        assert.equal(current.revision, revision);
        assert.equal(
          (values(current.selections)['class.fury.array-assignment'] as Record<string, number>)
            .Intuition,
          1,
        );
        await assert.rejects(
          player.mutation('characters:save', { ...args, commandId: commandId() }),
          /changed|reload/i,
        );
        await assert.rejects(
          player.mutation('characters:save', {
            ...args,
            commandId: commandId(),
            expectedRevision: current.revision,
            assignment: { target: 'Might', value: 1 },
          }),
          /fixed/i,
        );
        assert.equal((await saved(player, characterId)).revision, current.revision);
      },
    );
  } else skip('wizard saved-state boundaries', 'Devil creation prerequisite failed.');
  await runLifecycle(context);
  await runTraitAbilities(context);
  await runRemainingAncestries(context);
}
