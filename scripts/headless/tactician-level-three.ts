// SPDX-License-Identifier: GPL-3.0-only
/** V116 Tactician levels two and three for every doctrine, through authenticated public operations. */
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
import type levelOneLedger from '../../tests/fixtures/v94-tactician-expected.json';
import type sourceLedger from '../../tests/fixtures/v116-tactician-three-expected.json';
const levelOne = JSON.parse(
  readFileSync('tests/fixtures/v94-tactician-expected.json', 'utf8'),
) as typeof levelOneLedger;
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v116-tactician-three-expected.json', 'utf8'),
) as typeof sourceLedger;
type Saved = {
  level: number;
  revision: number;
  selections: DraftSelection[];
  authored: { name: string; appearance: string; biography: string; notes: string };
  evaluation: EvaluationResult;
  liveState: {
    heroicResource: { current: number };
    stamina: number;
    surges: number;
    effectInstances?: { sourceUseEventId: string; payload: unknown }[];
  } | null;
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
/** Source clauses granted as separate uses (feature/tactician/level-2/3, level-2 mark benefits). */
const embedded: Record<string, string[]> = {
  'Infiltration Tactics': ['Infiltration Tactics: Surge'],
  Goaded: ['Goaded: Redirect Strike'],
  'Melee Superiority': ['Melee Superiority: Halt', 'Melee Superiority: Mark Free Strike'],
  'Out of Position': ['Out of Position: Mark and Slide'],
  'Fog of War': ['Fog of War: Forced Free Strike'],
  'Targets of Opportunity': ['Targets of Opportunity: Extra Target'],
};
const features = ['Infiltration Tactics', 'Goaded', 'Melee Superiority', 'Out of Position'];
/** Printed "Self" targets record against the Tactician, never a separate target. */
const selfTargets = [
  'Try Me Instead',
  'Squad! On Me!',
  'Frontal Assault',
  "Hit 'Em Hard!",
  'Rout',
  'Stay Strong and Focus!',
];
const paid: Record<string, number> = {
  'Melee Superiority: Mark Free Strike': 2,
  'Fog of War: Forced Free Strike': 2,
  'Targets of Opportunity: Extra Target': 2,
};

export async function runTacticianLevelThree({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'Tactician levels 2–3: six builds, level edits and seventeen new uses persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 3 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Tactician 3 ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const builds = Object.entries(ledger.witnesses).map(([id, w]) => ({
        id,
        w,
        base: levelOne.witnesses.find(b => b.id === w.base)!,
        second: w.levelTwo.addedSelections.doctrineAbility,
        seventh: w.levelThree.addedSelections.ability7,
        perk: w.levelTwo.addedSelections.perk,
      }));
      const ids: string[] = [];
      const sheets: HeroSheet[] = [];
      for (const [index, b] of builds.entries()) {
        const selections = {
          ...(b.base.selections as unknown as EvaluationInput['selections']),
          'class.tactician.level-2.perk': b.perk,
          [`class.tactician.level-2.${b.w.doctrine.toLowerCase()}-ability`]: b.second,
          'class.tactician.level-3.ability-7': b.seventh,
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
          assert.deepEqual(granted.cost, { resource: 'focus', amount }, `${name} ${ability}`);
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
      assert.ok(down.removed.includes('class.tactician.level-3.ability-7'));
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
        authored: { name: `Tactician 3 target ${runId}`, appearance: '', biography: '', notes: '' },
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
      // Effect riders compile into occurrences (V109/V152); a manual remainder may appear there.
      const compiledClauses = async (id: string) =>
        (
          (
            await director.query<{ compiled?: { effects: { effect: { clause?: string } }[] } }[]>(
              'abilities:results',
              { campaignId, eventIds: [id] },
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
          const names = [b.second, b.seventh, ...parents.flatMap(parent => embedded[parent] ?? [])];
          for (const name of names) {
            if (used.has(name)) continue;
            used.add(name);
            assert.ok(
              sheets[index]!.abilities.find(a => a.name === name)?.activationCondition,
              `${b.id} ${name} listed with its condition`,
            );
            const cost = name === b.second ? 5 : name === b.seventh ? 7 : (paid[name] ?? 0);
            const affectedId = selfTargets.includes(name) ? id : targetId;
            const target = { refKind: 'character', id: affectedId };
            await invoke(id, 'adjust.heroic-resource', { value: cost });
            await invoke(affectedId, 'adjust.stamina', { value: 30 });
            const before = await get(affectedId);
            const use = await invoke(id, 'ability.use', { ability: name, targets: [target] });
            const persisted = await event(use.eventId);
            const after = await get(affectedId);
            assert.equal((await get(id)).liveState?.heroicResource.current, 0, `${name} Focus`);
            if (name === "I've Got Your Back") {
              assert.equal(persisted?.kind, 'ability.use', name);
              const result = persisted?.payload?.data?.result;
              assert.ok(result, name);
              const outcome = result.targets[0]!;
              const printed = ledger.abilities[name].damageByWitness.find(r => r.witness === b.id)!;
              const damage = printed.tiers[outcome.tier - 1]!;
              assert.equal(outcome.damage?.rolledDamage, damage, name);
              assert.equal(after.liveState?.stamina, before.liveState!.stamina - damage, name);
              assert.match(
                JSON.stringify([
                  outcome.unresolvedClauses,
                  result.manualResolutions,
                  await compiledClauses(use.eventId),
                ]),
                /taunted/i,
                name,
              );
            } else if (name === 'Squad! On Me!') {
              // V159 (feature/ability/tactician/level-2/squad-on-me.md): compiled without a power
              // roll; 2 surges and a stability bonus equal to the Tactician's Might, both applied.
              assert.equal(persisted?.kind, 'ability.use', name);
              assert.equal(after.liveState?.surges, before.liveState!.surges + 2, name);
              const bonus = after.liveState?.effectInstances?.find(
                i => i.sourceUseEventId === use.eventId,
              );
              assert.deepEqual(
                bonus?.payload,
                {
                  kind: 'modifier',
                  text: 'Until the start of your next turn, each target has a bonus to stability equal to your Might score.',
                  modifier: {
                    kind: 'stat',
                    stat: 'stability',
                    amount: b.w.levelTwo.characteristics.M,
                  },
                },
                name,
              );
              assert.equal(
                after.liveState?.stamina,
                before.liveState?.stamina,
                `${name} no damage`,
              );
            } else if (name === "Hit 'Em Hard!" || name === 'Stay Strong and Focus!') {
              // V175 (feature/ability/tactician/level-3/hit-em-hard.md, stay-strong-and-focus.md):
              // compiled without a power roll; the Tactician holds a watcher of damage to creatures
              // they marked, until the end of the encounter or until they are dying.
              assert.equal(persisted?.kind, 'ability.use', name);
              const watcher = after.liveState?.effectInstances?.find(
                i => i.sourceUseEventId === use.eventId,
              )?.payload as { kind?: string; watcher?: { event?: string } } | undefined;
              assert.equal(watcher?.kind, 'watcher', name);
              assert.equal(watcher?.watcher?.event, 'marked-damaged', name);
              assert.equal(
                after.liveState?.stamina,
                before.liveState?.stamina,
                `${name} no damage`,
              );
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
          17,
          'six level-2 and four level-3 abilities plus seven embedded uses',
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
