// SPDX-License-Identifier: GPL-3.0-only
/** Source-ledger witnesses and every new Troubadour action through authenticated public operations. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { AbilityRollResult } from '../../shared/contracts/rollResolution.ts';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type sourceLedger from '../../tests/fixtures/v102-troubadour-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v102-troubadour-expected.json', 'utf8'),
) as typeof sourceLedger;
type Saved = {
  revision: number;
  selections: DraftSelection[];
  authored: { name: string; appearance: string; biography: string; notes: string };
  evaluation: EvaluationResult;
  liveState: {
    heroicResource: { current: number };
    stamina: number;
    conditions?: Record<string, boolean>;
    conditionInstances?: {
      status: string;
      condition: string;
      sourceUseEventId: string;
      registrationId?: string;
    }[];
  } | null;
};
type Log = {
  id: string;
  kind: string;
  payload?: {
    sourceUseEventId?: string;
    condition?: string;
    status?: string;
    data?: { manual?: boolean; ability?: { name?: string }; result?: AbilityRollResult };
  };
};
const withoutResource = (state: Saved['liveState']) => {
  if (!state) return state;
  const { heroicResource: _resource, ...rest } = state;
  return rest;
};
const cid = () => crypto.randomUUID();
/** V200: performances compiled as areas (feature/ability/troubadour/level-1/*.md). */
const areaPerformances = new Set(['Revitalizing Limerick', '"Ballad of the Beast"']);
export async function runTroubadour({ actors: { director, peer }, run, runId }: ScenarioContext) {
  await run(
    'Troubadour: four class-act builds, pruning and forty-four actions persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Troubadour ${runId}`,
      });
      const ids: string[] = [];
      const sheets: HeroSheet[] = [];
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const create = async (selections: EvaluationInput['selections'], name: string) =>
        director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: 1,
          authored: { name, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(selections, definitions),
        });
      for (const w of ledger.witnesses) {
        const id = await create(
          w.selections as unknown as EvaluationInput['selections'],
          `${w.id} ${runId}`,
        );
        ids.push(id);
        assert.equal((await get(id)).evaluation.status, 'complete', w.id);
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
        sheets.push(sheet);
        const hero = sheet.build!.baseline!;
        assert.equal(hero.subclass.value, w.expected.subclass);
        assert.equal(hero.kit?.name.value, w.expected.kit);
        for (const key of ['M', 'A', 'R', 'I', 'P'] as const)
          assert.equal(hero.characteristics[key].value, w.expected.characteristics[key]);
        for (const key of ['weak', 'average', 'strong'] as const)
          assert.equal(hero.potency[key].value, w.expected.potency[key]);
        for (const key of [
          'level',
          'staminaMaximum',
          'recoveriesMaximum',
          'recoveryValue',
          'windedValue',
          'speed',
          'stability',
          'disengage',
          'savingThrowThreshold',
        ] as const)
          assert.equal(hero[key].value, w.expected[key], `${w.id} ${key}`);
        for (const key of ['skills', 'features', 'abilities'] as const)
          assert.deepEqual(
            hero[key].map(x => x.name).sort(),
            [...w.expected[key]].sort(),
            `${w.id} ${key}`,
          );
        for (const name of w.classActions) {
          const a = sheet.abilities.find(x => x.name === name);
          assert.ok(a?.content?.text, `${w.id} ${name} source`);
          if (name.includes(':')) assert.ok(a.activationCondition);
        }
      }
      // Editing the draft must prune old kit grants without replacing its admitted build.
      const characterId = ids[0]!;
      let saved = await get(characterId);
      await assert.rejects(
        peer.query('characterWizard:transition', {
          characterId,
          selections: saved.selections,
          decisionId: 'class.troubadour.class-act',
          value: 'Duelist',
        }),
        /owner/i,
      );
      const transition = async (decisionId: string, value: unknown) => {
        const current = await get(characterId);
        const changed = await director.query<{ selections: DraftSelection[] }>(
          'characterWizard:transition',
          {
            characterId,
            selections: current.selections,
            decisionId,
            value,
          },
        );
        await director.mutation('characters:save', {
          commandId: cid(),
          characterId,
          expectedRevision: current.revision,
          authored: current.authored,
          selections: changed.selections,
        });
        return get(characterId);
      };
      saved = await transition('class.troubadour.class-act', 'Duelist');
      assert.equal(saved.evaluation.status, 'complete');
      const draft = await director.query<HeroSheet>('characters:sheet', {
        characterId,
        view: 'draft',
      });
      assert.ok(draft.abilities.some(a => a.name === 'Star Power: Greater Speed'));
      assert.ok(
        !draft.abilities.some(
          a => a.name.startsWith('Dramatic Monologue') || a.name.startsWith('Turnabout'),
        ),
      );
      const admitted = await director.query<HeroSheet>('characters:sheet', { characterId });
      assert.equal(admitted.build!.baseline!.subclass.value, 'Auteur');
      assert.ok(admitted.abilities.some(a => a.name === 'Dramatic Monologue'));
      // Separate target avoids conflating manual self-use with combat damage and resource debits.
      const targetId = await create(
        ledger.witnesses[0]!.selections as unknown as EvaluationInput['selections'],
        `Troubadour target ${runId}`,
      );
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: targetId,
      });
      // Source-derived Fury target has Presence -1; below every Troubadour potency threshold.
      const lowId = await create(
        ledger.lowPresenceTarget as unknown as EvaluationInput['selections'],
        `Low Presence ${runId}`,
      );
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: lowId,
      });
      assert.equal((await get(lowId)).evaluation.baseline!.characteristics.P.value, -1);
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
      const log = () => director.query<{ events: Log[] }>('events:list', { campaignId });
      const event = async (id: string) => (await log()).events.find(e => e.id === id);
      // Effect riders compile into occurrences (V109/V113); a manual remainder may appear there.
      const compiledEffects = async (id: string) =>
        (
          await director.query<{ compiled?: { effects: { effect: { clause?: string } }[] } }[]>(
            'abilities:results',
            { campaignId, eventIds: [id] },
          )
        )[0]?.compiled?.effects ?? [];
      const usedNames = new Set<string>();
      try {
        // Paid optional trigger outside combat uses the shared waiver, retaining a zero pool.
        await invoke(ids[0]!, 'adjust.heroic-resource', { value: 0 });
        const waived = await invoke(ids[0]!, 'ability.use', {
          ability: 'Dramatic Monologue: Two Targets',
          targets: [{ refKind: 'character', id: targetId }],
        });
        assert.equal((await event(waived.eventId))?.kind, 'ability.recorded');
        assert.equal((await get(ids[0]!)).liveState?.heroicResource.current, 0);
        for (const operation of ['combat.start', 'combat.commit'])
          await director.mutation('commands:invoke', {
            campaignId,
            commandId: cid(),
            operation,
            arguments: {},
          });
        for (const [i, w] of ledger.witnesses.entries()) {
          const id = ids[i]!;
          for (const name of w.classActions) {
            if (usedNames.has(name)) continue;
            usedNames.add(name);
            const action = sheets[i]!.abilities.find(a => a.name === name)!;
            const rolled = w.rolledActions.find(a => a.name === name);
            const cost =
              (ledger.paidSourceCosts as Record<string, number>)[name] ??
              (ledger.embeddedDramaCosts as Record<string, number>)[name] ??
              0;
            assert.deepEqual(
              action.cost,
              cost ? { resource: 'drama', amount: cost } : undefined,
              `${name} source cost`,
            );
            const affectedId = ledger.selfTargets.includes(name) ? id : targetId;
            const target = { refKind: 'character', id: affectedId };
            // V200: a compiled performance names its user ("Self and each ally in the area").
            const performance = areaPerformances.has(name);
            await invoke(id, 'adjust.heroic-resource', { value: cost });
            await invoke(affectedId, 'adjust.stamina', {
              value: name === 'Drama: Return to Life' ? -w.expected.staminaMaximum : 24,
            });
            const before = await get(affectedId);
            const actorBefore =
              name === 'Method Acting: Bleeding Exchange' ? await get(id) : undefined;
            if (name === 'Artful Flourish') await invoke(lowId, 'adjust.stamina', { value: 24 });
            const used = await invoke(id, 'ability.use', {
              ability: name,
              targets:
                name === 'Artful Flourish'
                  ? [target, { refKind: 'character', id: lowId }]
                  : performance
                    ? [{ refKind: 'character', id }, target]
                    : [target],
            });
            const persisted = await event(used.eventId);
            const after = await get(affectedId);
            assert.equal((await get(id)).liveState?.heroicResource.current, 0, `${name} Drama`);
            if (rolled) {
              assert.equal(persisted?.kind, 'ability.use', name);
              const result = persisted?.payload?.data?.result;
              assert.ok(result, name);
              const outcome = result.targets[0]!;
              const damage = rolled.damageByTier[outcome.tier - 1]!;
              assert.equal(outcome.damage?.rolledDamage ?? 0, damage, name);
              assert.equal(after.liveState?.stamina, before.liveState!.stamina - damage, name);
              if (rolled.compiledCondition) {
                const readback = await director.query<{ compiled?: PublicCompiledResult }[]>(
                  'abilities:results',
                  { campaignId, eventIds: [used.eventId] },
                );
                const condition = readback[0]?.compiled?.effects.find(
                  e => e.effect.kind === 'condition',
                );
                assert.ok(condition, name);
                assert.equal(condition.effect.status, 'resisted', name);
                assert.ok(
                  !after.liveState?.conditions?.bleeding,
                  'Presence 2 resists all P2 potency tiers',
                );
              } else
                assert.match(
                  JSON.stringify([
                    outcome.unresolvedClauses,
                    result.manualResolutions,
                    // Clause text only, so a compiled occurrence's kind can't stand in for the remainder.
                    (await compiledEffects(used.eventId)).map(o => o.effect.clause ?? ''),
                  ]),
                  new RegExp(rolled.manualRemainder, 'i'),
                  name,
                );
              if (name === 'Artful Flourish') {
                assert.equal(result.targets.length, 2);
                const second = result.targets[1]!;
                assert.equal(
                  (await get(lowId)).liveState!.stamina,
                  24 - rolled.damageByTier[second.tier - 1]!,
                );
              }
            } else if (performance) {
              // V200: a performance compiled as an aura the table keeps the members of
              // (feature/troubadour/level-1/routines.md). The Troubadour holds the area with itself
              // and the ally as members; each member's riders fire later (Ballad of the Beast at a
              // member's turn start, Revitalizing Limerick at the Troubadour's turn end), so nothing
              // changes on the ally at the use.
              assert.equal(persisted?.kind, 'ability.use', name);
              type Held = {
                effectInstances?: {
                  id: string;
                  kind: string;
                  status: string;
                  sourceUseEventId: string;
                  members?: { party: { id: string } }[];
                }[];
              };
              const area = ((await get(id)).liveState as unknown as Held).effectInstances?.find(
                e => e.sourceUseEventId === used.eventId && e.kind === 'area',
              );
              assert.equal(area?.status, 'active', name);
              assert.deepEqual(
                area?.members?.map(m => m.party.id),
                [id, targetId],
                `${name} members`,
              );
              assert.deepEqual(
                (after.liveState as unknown as { stamina: number; surges?: number }).stamina,
                (before.liveState as unknown as { stamina: number }).stamina,
                `${name} nothing at the use`,
              );
            } else if (name === 'Riposte') {
              // V173: a compiled triggered action persists as ability.use. Used by hand there is no
              // observed trigger, so its effect is left to the table and the target is unchanged.
              assert.equal(persisted?.kind, 'ability.use', name);
              assert.deepEqual(
                withoutResource(after.liveState),
                withoutResource(before.liveState),
                `${name} target unchanged without a trigger`,
              );
            } else {
              assert.equal(persisted?.kind, 'ability.recorded', name);
              assert.equal(persisted?.payload?.data?.manual, true, name);
              assert.equal(persisted?.payload?.data?.ability?.name, name);
              assert.deepEqual(
                withoutResource(after.liveState),
                withoutResource(before.liveState),
                `${name} manual target unchanged`,
              );
            }
            if (actorBefore)
              assert.deepEqual(
                withoutResource((await get(id)).liveState),
                withoutResource(actorBefore.liveState),
                'Manual exchange must not silently bleed its actor',
              );
            if (cost) {
              const blocked = await invoke(id, 'ability.use', { ability: name, targets: [target] });
              assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', name);
            }
          }
        }
        assert.equal(
          usedNames.size,
          44,
          '24 Troubadour source abilities, four kit signatures and 16 embedded uses',
        );
        // Cutting Sarcasm: below weak P0 guarantees bleeding on every possible random tier.
        await invoke(lowId, 'adjust.stamina', { value: 24 });
        const applied = await invoke(ids[1]!, 'ability.use', {
          ability: 'Cutting Sarcasm',
          targets: [{ refKind: 'character', id: lowId }],
        });
        const appliedEvent = await event(applied.eventId);
        assert.equal(appliedEvent?.kind, 'ability.use');
        const roll = appliedEvent!.payload!.data!.result!;
        const after = await get(lowId);
        assert.equal(after.liveState!.stamina, 24 - [5, 8, 10][roll.targets[0]!.tier - 1]!);
        assert.equal(after.liveState?.conditions?.bleeding, true);
        const instance = after.liveState?.conditionInstances?.find(
          i => i.sourceUseEventId === applied.eventId && i.status === 'active',
        );
        assert.ok(instance);
        assert.equal(instance.condition, 'bleeding');
        assert.ok(instance.registrationId, 'save-ends registration');
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
