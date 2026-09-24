// SPDX-License-Identifier: GPL-3.0-only
/** V135 Elementalist levels two and three for every specialization, through authenticated public operations. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { AbilityRollResult } from '../../shared/contracts/rollResolution.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type levelOneLedger from '../../tests/fixtures/v104-elementalist-expected.json';
import type sourceLedger from '../../tests/fixtures/v135-elementalist-three-expected.json';
const levelOne = JSON.parse(
  readFileSync('tests/fixtures/v104-elementalist-expected.json', 'utf8'),
) as typeof levelOneLedger;
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v135-elementalist-three-expected.json', 'utf8'),
) as typeof sourceLedger;
type Saved = {
  level: number;
  revision: number;
  selections: DraftSelection[];
  authored: { name: string; appearance: string; biography: string; notes: string };
  evaluation: EvaluationResult;
  liveState: { heroicResource: { current: number }; stamina: number } | null;
};
type Log = {
  id: string;
  kind: string;
  payload?: {
    data?: { manual?: boolean; ability?: { name?: string }; result?: AbilityRollResult };
  };
};
type Transition = { selections: DraftSelection[]; removed: string[]; evaluation: EvaluationResult };
const cid = () => crypto.randomUUID();
/** Source clauses granted as separate uses (feature/elementalist/level-2/3, level-2/3 abilities). */
const embedded: Record<string, string[]> = {
  'Disciple of Fire': ['Disciple of Fire: Encounter Surges'],
  'Disciple of the Green': ['Disciple of the Green: Animal Form', 'Disciple of the Green: Revert'],
  'A Conversation With Fire': ['A Conversation With Fire: Speak'],
  'Distance Is Only Memory': ['Distance Is Only Memory: Open Portal'],
  'O Flower Aid, O Earth Defend': ['O Flower Aid, O Earth Defend: Persistent Effect'],
  'Swarm of Spirits': ['Swarm of Spirits: Persistent Effect'],
  'Wall of Fire': ['Wall of Fire: Persistent Effect'],
  // Level-1 persistent upkeep carried by the level-1 alternative (V104).
  Conflagration: ['Conflagration: Persistent Effect'],
};
const features = [
  'Disciple of Earth',
  'Disciple of Fire',
  'Disciple of the Green',
  'There Is No Space Between',
  'Earth Accepts Me',
  'A Conversation With Fire',
  'Remember Growth and Sun and Rain',
  'Distance Is Only Memory',
];
/** Printed Self or self-or-ally targets record against the Elementalist, never a separate target. */
const selfTargets = ['Earth Accepts Me', 'Translated Through Flame'];
/** Abilities the table rolls; Volcano's Embrace is compiled with a potency condition. */
const rolledRemainder: Record<string, RegExp | null> = {
  "Volcano's Embrace": null,
  'Maw of Earth': null,
  'Swarm of Spirits': null,
  Conflagration: null,
};
const compiled = new Set(["Volcano's Embrace"]);
type CompiledRead = {
  compiled: {
    definition: { execution: string };
    effects: {
      effect: {
        kind: string;
        movement?: string;
        vertical?: boolean;
        printed?: number;
        condition?: string;
        status?: string;
      };
    }[];
  };
};

export async function runElementalistLevelThree({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'Elementalist levels 2–3: five builds, level edits and twenty-one new uses persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 3 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Elementalist 3 ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const builds = Object.entries(ledger.witnesses).map(([id, w]) => ({
        id,
        w,
        base: levelOne.witnesses.find(b => b.id === w.base)!,
        second: w.levelTwo.addedSelections.ability5,
        seventh: w.levelThree.addedSelections.ability7,
        perk: w.levelTwo.addedSelections.perk,
      }));
      const ids: string[] = [];
      const sheets: HeroSheet[] = [];
      for (const [index, b] of builds.entries()) {
        const selections = {
          ...(b.base.selections as unknown as EvaluationInput['selections']),
          'class.elementalist.level-2.perk': b.perk,
          'class.elementalist.level-2.ability-5': b.w.levelTwo.addedSelections.ability5,
          'class.elementalist.level-3.ability-7': b.seventh,
        };
        const name = `${b.id} ${runId}`;
        const characterId = await director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: 3,
          wizardDraft: index === 0,
          authored: { name: index === 0 ? '' : name, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(selections, definitions),
        });
        ids.push(characterId);
        let saved = await get(characterId);
        assert.equal(saved.level, 3);
        assert.equal(saved.evaluation.status, 'complete', name);
        if (index === 0) {
          assert.equal(await director.query('characters:wizardDraft', {}), characterId);
          const resumed = await director.query<{ targetLevel: number }>(
            'characterWizard:discover',
            {
              characterId,
            },
          );
          assert.equal(resumed.targetLevel, 3);
          await director.mutation('characters:save', {
            commandId: cid(),
            characterId,
            expectedRevision: saved.revision,
            targetLevel: 3,
            authored: { ...saved.authored, name },
            selections: saved.selections,
            list: true,
          });
          saved = await get(characterId);
          assert.equal(await director.query('characters:wizardDraft', {}), null);
          assert.equal(saved.level, 3);
        }
        await director.mutation('characters:submit', { commandId: cid(), campaignId, characterId });
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId });
        sheets.push(sheet);
        const hero = sheet.build!.baseline!;
        const expected = b.w.levelThree;
        for (const key of [
          'level',
          'staminaMaximum',
          'recoveriesMaximum',
          'recoveryValue',
          'windedValue',
          'speed',
          'stability',
          'disengage',
        ] as const)
          assert.equal(hero[key].value, expected[key], `${name} ${key}`);
        for (const feature of [...b.w.levelTwo.addedFeatures, ...expected.addedFeatures, b.perk])
          if (features.includes(feature) || feature === b.perk)
            assert.ok(
              sheet.features.some(f => f.name === feature),
              `${name} feature ${feature}`,
            );
        for (const [ability, amount] of [
          [b.second, 5],
          [b.seventh, 7],
        ] as const) {
          const granted = sheet.abilities.find(a => a.name === ability);
          assert.ok(granted?.content?.text, `${name} ${ability} source`);
          assert.deepEqual(granted.cost, { resource: 'essence', amount }, `${name} ${ability}`);
        }
      }

      // Full-edit level changes: lowering revokes level-3 grants, raising asks for the choice again.
      const characterId = ids[0]!;
      const first = builds[0]!;
      let saved = await get(characterId);
      await assert.rejects(
        peer.query('characterWizard:transitionLevel', {
          characterId,
          fromLevel: 3,
          targetLevel: 2,
          selections: saved.selections,
        }),
        /owner/i,
      );
      const persist = async (level: number, selections: DraftSelection[]) => {
        const current = await get(characterId);
        await director.mutation('characters:save', {
          commandId: cid(),
          characterId,
          expectedRevision: current.revision,
          targetLevel: level,
          authored: current.authored,
          selections,
        });
        return get(characterId);
      };
      const down = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId,
        fromLevel: 3,
        targetLevel: 2,
        selections: saved.selections,
      });
      assert.ok(down.removed.includes('class.elementalist.level-3.ability-7'));
      saved = await persist(2, down.selections);
      assert.equal(saved.level, 2);
      assert.equal(saved.evaluation.status, 'complete');
      for (const key of ['staminaMaximum', 'recoveryValue', 'windedValue'] as const)
        assert.equal(saved.evaluation.baseline?.[key].value, first.w.levelTwo[key], key);
      const up = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId,
        fromLevel: 2,
        targetLevel: 3,
        selections: saved.selections,
      });
      saved = await persist(3, up.selections);
      assert.equal(saved.evaluation.status, 'incomplete');
      const draftSheet = await director.query<HeroSheet>('characters:sheet', {
        characterId,
        view: 'draft',
      });
      assert.ok(!draftSheet.abilities.some(a => a.name === first.seventh));
      const effective = await director.query<HeroSheet>('characters:sheet', { characterId });
      assert.equal(effective.build?.baseline?.level.value, 3);
      assert.ok(effective.abilities.some(a => a.name === first.seventh));

      // Every new source ability and embedded use, once, with payment and persisted readback.
      const targetId = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: {
          name: `Elementalist 3 target ${runId}`,
          appearance: '',
          biography: '',
          notes: '',
        },
        selections: draftSelectionsFrom(
          levelOne.witnesses[0]!.selections as unknown as EvaluationInput['selections'],
          (
            await director.query<{ definitions: DecisionDefinitions }>('characterWizard:discover', {
              targetLevel: 1,
            })
          ).definitions,
        ),
      });
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: targetId,
      });
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: cid(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (id: string, operation: string, args: Record<string, unknown> = {}) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation,
          actor: { refKind: 'character', id },
          arguments: args,
        });
      // Effect riders, compound conditions and tier instructions compile into occurrences
      // (V152-V154); the remainder may appear there.
      const compiledClauses = async (eventId: string) =>
        (
          (
            await director.query<{ compiled?: { effects: { effect: { clause?: string } }[] } }[]>(
              'abilities:results',
              { campaignId, eventIds: [eventId] },
            )
          )[0]?.compiled?.effects ?? []
        ).map(o => o.effect.clause ?? '');
      const event = async (id: string) =>
        (await director.query<{ events: Log[] }>('events:list', { campaignId })).events.find(
          e => e.id === id,
        );
      const used = new Set<string>();
      try {
        for (const operation of ['combat.start', 'combat.commit'])
          await director.mutation('commands:invoke', {
            campaignId,
            commandId: cid(),
            operation,
            arguments: {},
          });
        for (const [index, b] of builds.entries()) {
          const id = ids[index]!;
          const parents = [
            ...[...b.w.levelTwo.addedFeatures, ...b.w.levelThree.addedFeatures].filter(f =>
              features.includes(f),
            ),
            b.second,
            b.seventh,
          ];
          const names = [
            ...new Set([
              ...b.w.levelTwo.addedAbilities,
              ...b.w.levelThree.addedAbilities,
              ...parents.flatMap(parent => embedded[parent] ?? []),
            ]),
          ];
          for (const name of names) {
            if (used.has(name)) continue;
            used.add(name);
            // Every use is listed with its source; embedded uses ("Parent: Use") carry activation text.
            const listed = sheets[index]!.abilities.find(a => a.name === name);
            assert.ok(listed?.content?.text, `${b.id} ${name} listed with its source`);
            if (name.includes(':'))
              assert.ok(listed.activationCondition, `${b.id} ${name} listed with its condition`);
            const cost =
              name === b.second
                ? 5
                : name === b.seventh
                  ? 7
                  : (sheets[index]!.abilities.find(a => a.name === name)?.cost?.amount ?? 0);
            // A printed target of exactly "Self" is self-only on the table (targetShapeOf).
            const printedTarget = (listed.metadata.target ?? '').replace(
              /\[([^\]]*)\]\([^)]*\)/g,
              '$1',
            );
            const affectedId =
              selfTargets.includes(name) || printedTarget.trim().toLowerCase() === 'self'
                ? id
                : targetId;
            const target = { refKind: 'character', id: affectedId };
            await invoke(id, 'adjust.heroic-resource', { value: cost });
            await invoke(affectedId, 'adjust.stamina', { value: 30 });
            const before = await get(affectedId);
            const use = await invoke(id, 'ability.use', { ability: name, targets: [target] });
            const persisted = await event(use.eventId);
            const after = await get(affectedId);
            assert.equal((await get(id)).liveState?.heroicResource.current, 0, `${name} Essence`);
            const remainder = rolledRemainder[name];
            const rolled = name in rolledRemainder;
            if (rolled) {
              assert.equal(persisted?.kind, 'ability.use', name);
              const result = persisted?.payload?.data?.result;
              assert.ok(result, name);
              const outcome = result.targets[0]!;
              const rows = (
                ledger.abilities as Record<
                  string,
                  { damageByWitness?: { witness: string; tiers: number[] }[] }
                >
              )[name]!.damageByWitness;
              const row = rows?.find(r => r.witness === b.id);
              const damage = row ? row.tiers[outcome.tier - 1]! : 0;
              assert.equal(outcome.damage?.rolledDamage ?? 0, damage, name);
              assert.equal(after.liveState?.stamina, before.liveState!.stamina - damage, name);
              // Only tier clauses the resolver leaves manual are checked; Effect paragraphs are text.
              if (remainder)
                assert.match(
                  JSON.stringify([
                    outcome.unresolvedClauses,
                    result.manualResolutions,
                    await compiledClauses(use.eventId),
                  ]),
                  remainder,
                  name,
                );
              if (compiled.has(name)) {
                // Compiled route: movement is an instruction and potency conditions are adjudicated.
                const read = (
                  await director.query<CompiledRead[]>('abilities:results', {
                    campaignId,
                    eventIds: [use.eventId],
                  })
                )[0]!;
                assert.equal(read.compiled.definition.execution, 'supported', name);
                const move = (
                  ledger.abilities as Record<
                    string,
                    { forcedMovementPerTier?: { kind: string; distance: number }[] | null }
                  >
                )[name]!.forcedMovementPerTier?.[outcome.tier - 1];
                if (move) {
                  const effect = read.compiled.effects.find(o => o.effect.kind === 'push')!.effect;
                  assert.equal(effect.movement, move.kind.replace('vertical ', ''), name);
                  assert.equal(effect.vertical === true, move.kind.startsWith('vertical'), name);
                  assert.equal(effect.printed, move.distance, name);
                }
                if (name === "Volcano's Embrace") {
                  // The target (v104-1) has Agility 2, never below the Elementalist's 0/1/2 potencies.
                  const held = read.compiled.effects.find(
                    o => o.effect.kind === 'condition',
                  )!.effect;
                  assert.equal(held.condition, 'restrained', name);
                  assert.equal(held.status, 'resisted', name);
                }
              }
            } else {
              assert.equal(persisted?.kind, 'ability.recorded', name);
              assert.equal(persisted?.payload?.data?.manual, true, name);
              assert.equal(persisted?.payload?.data?.ability?.name, name);
              assert.equal(
                after.liveState?.stamina,
                before.liveState?.stamina,
                `${name} no damage`,
              );
            }
            if (cost) {
              const blocked = await invoke(id, 'ability.use', { ability: name, targets: [target] });
              assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', name);
            }
          }
        }
        assert.equal(
          used.size,
          21,
          'nine chosen and three feature abilities plus nine embedded uses',
        );
      } finally {
        const session = await director.query<{ revision: number }>('sessions:get', { sessionId });
        await director.mutation('sessions:transition', {
          sessionId,
          expectedRevision: session.revision,
          action: 'close',
          voidMode: 'keep',
          commandId: cid(),
        });
      }
    },
  );
}
