// SPDX-License-Identifier: GPL-3.0-only
/** Source-ledger witnesses and every new Talent action through authenticated public operations. */
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
import type sourceLedger from '../../tests/fixtures/v105-talent-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v105-talent-expected.json', 'utf8'),
) as typeof sourceLedger;
type Saved = {
  revision: number;
  selections: DraftSelection[];
  authored: { name: string; appearance: string; biography: string; notes: string };
  evaluation: EvaluationResult;
  liveState: {
    heroicResource: { current: number };
    stamina: number;
    temporaryStamina: number;
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
export async function runTalent({ actors: { director, peer }, run, runId }: ScenarioContext) {
  await run(
    'Talent: five tradition builds, negative Clarity and fifty-eight actions persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Talent ${runId}`,
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
        assert.equal(hero.kit, null);
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
        for (const key of ['skills', 'languages', 'features', 'abilities'] as const)
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
      // Editing the draft must prune old tradition grants without replacing its admitted build.
      const characterId = ids[0]!;
      let saved = await get(characterId);
      await assert.rejects(
        peer.query('characterWizard:transition', {
          characterId,
          selections: saved.selections,
          decisionId: 'class.talent.tradition',
          value: 'Telekinesis',
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
      saved = await transition('class.talent.tradition', 'Telekinesis');
      assert.equal(saved.evaluation.status, 'complete');
      const draft = await director.query<HeroSheet>('characters:sheet', {
        characterId,
        view: 'draft',
      });
      assert.ok(draft.abilities.some(a => a.name === 'Minor Telekinesis: Vertical Slide'));
      assert.ok(!draft.abilities.some(a => a.name === 'Accelerate'));
      saved = await transition('class.talent.augmentation', 'Density Augmentation');
      assert.equal(saved.evaluation.baseline!.staminaMaximum.value, 24);
      const admitted = await director.query<HeroSheet>('characters:sheet', { characterId });
      assert.equal(admitted.build!.baseline!.subclass.value, 'Chronopathy');
      assert.equal(admitted.build!.baseline!.staminaMaximum.value, 18);
      // Separate target avoids conflating manual self-use with combat damage and resource debits.
      const targetId = await create(
        ledger.witnesses[0]!.selections as unknown as EvaluationInput['selections'],
        `Talent target ${runId}`,
      );
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
            await director.query<
              { compiled?: { effects: { effect: { kind?: string; clause?: string } }[] } }[]
            >('abilities:results', { campaignId, eventIds: [id] })
          )[0]?.compiled?.effects ?? []
        ).map(o => `${o.effect.kind ?? ''}: ${o.effect.clause ?? ''}`);
      const log = () => director.query<{ events: Log[] }>('events:list', { campaignId });
      const event = async (id: string) => (await log()).events.find(e => e.id === id);
      const usedNames = new Set<string>();
      try {
        // Paid optional trigger outside combat uses the shared waiver, retaining a zero pool.
        await invoke(ids[0]!, 'adjust.heroic-resource', { value: 0 });
        const waived = await invoke(ids[0]!, 'ability.use', {
          ability: 'Accelerate: Maneuver',
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
              (ledger.embeddedClarityCosts as Record<string, number>)[name] ??
              0;
            assert.deepEqual(
              action.cost,
              cost ? { resource: 'clarity', amount: cost } : undefined,
              `${name} source cost`,
            );
            const affectedId = ledger.selfTargets.includes(name) ? id : targetId;
            const target = { refKind: 'character', id: affectedId };
            await invoke(id, 'adjust.heroic-resource', { value: cost });
            await invoke(affectedId, 'adjust.stamina', {
              value: 24,
            });
            const before = await get(affectedId);
            const actorBefore = await get(id);
            const used = await invoke(id, 'ability.use', {
              ability: name,
              targets: [target],
            });
            const persisted = await event(used.eventId);
            const after = await get(affectedId);
            assert.equal((await get(id)).liveState?.heroicResource.current, 0, `${name} Clarity`);
            if (rolled) {
              assert.equal(persisted?.kind, 'ability.use', name);
              const result = persisted?.payload?.data?.result;
              assert.ok(result, name);
              const outcome = result.targets[0]!;
              const damage = rolled.damageByTier[outcome.tier - 1]!;
              assert.equal(outcome.damage?.rolledDamage ?? 0, damage, name);
              assert.equal(after.liveState?.stamina, before.liveState!.stamina - damage, name);
              assert.match(
                JSON.stringify([
                  outcome.unresolvedClauses,
                  result.manualResolutions,
                  await compiledClauses(used.eventId),
                ]),
                new RegExp(rolled.manualRemainder, 'i'),
                name,
              );
            } else if (name === 'Feedback Loop') {
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
            if (actorBefore && !rolled)
              assert.deepEqual(
                withoutResource((await get(id)).liveState),
                withoutResource(actorBefore.liveState),
                'Manual action must not silently alter its actor',
              );
            if (cost) {
              await invoke(id, 'adjust.heroic-resource', { value: -3 });
              const blocked = await invoke(id, 'ability.use', { ability: name, targets: [target] });
              assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', name);
            }
          }
        }
        assert.equal(usedNames.size, 58, '23 source abilities +35 embedded uses');
        // Source R2 permits clarity -3. Paid use crossing zero persists, then below-floor blocks.
        await invoke(ids[0]!, 'adjust.heroic-resource', { value: 0 });
        const before = await get(ids[0]!);
        const crossed = await invoke(ids[0]!, 'ability.use', {
          ability: 'Awe',
          targets: [{ refKind: 'character', id: targetId }],
        });
        assert.equal((await event(crossed.eventId))?.kind, 'ability.recorded');
        assert.equal((await get(ids[0]!)).liveState?.heroicResource.current, -3);
        assert.equal(
          (await get(ids[0]!)).liveState?.stamina,
          before.liveState?.stamina,
          'Strain/end-turn damage is source-explicit manual, not charged on spend',
        );
        await assert.rejects(
          invoke(ids[0]!, 'adjust.heroic-resource', { value: -4 }),
          /at least|-3|minimum/i,
        );
        assert.equal((await get(ids[0]!)).liveState?.heroicResource.current, -3);
        await invoke(ids[0]!, 'adjust.heroic-resource', { value: 2 });
        const five = await invoke(ids[0]!, 'ability.use', {
          ability: 'Flashback',
          targets: [{ refKind: 'character', id: targetId }],
        });
        assert.equal((await event(five.eventId))?.kind, 'ability.recorded');
        assert.equal((await get(ids[0]!)).liveState?.heroicResource.current, -3);
        // V170: a free signature while strained (clarity −3) applies its Strained section
        // (feature/ability/talent/level-1/mind-spike.md): the target takes an extra 2 psychic and
        // the caster 2 psychic that can't be reduced. The explicit strain record still changes nothing.
        await invoke(targetId, 'adjust.stamina', { value: 24 });
        const spikeCaster = (await get(ids[0]!)).liveState!;
        const spike = await invoke(ids[0]!, 'ability.use', {
          ability: 'Mind Spike',
          targets: [{ refKind: 'character', id: targetId }],
        });
        const rolledSpike = (await event(spike.eventId))!.payload!.data!.result!;
        assert.equal(
          (await get(targetId)).liveState!.stamina,
          24 - ([5, 7, 9][rolledSpike.targets[0]!.tier - 1]! + 2),
        );
        const spikeCasterAfter = (await get(ids[0]!)).liveState!;
        assert.equal(
          spikeCasterAfter.stamina + spikeCasterAfter.temporaryStamina,
          spikeCaster.stamina + spikeCaster.temporaryStamina - 2,
          'Mind Spike strained self-damage',
        );
        assert.equal(spikeCasterAfter.heroicResource.current, -3);
        const beforeStrain = await get(targetId),
          casterBefore = await get(ids[0]!);
        const strain = await invoke(ids[0]!, 'ability.use', {
          ability: 'Mind Spike: Strain',
          targets: [{ refKind: 'character', id: targetId }],
        });
        assert.equal((await event(strain.eventId))?.kind, 'ability.recorded');
        assert.deepEqual((await get(targetId)).liveState, beforeStrain.liveState);
        assert.deepEqual((await get(ids[0]!)).liveState, casterBefore.liveState);
        // Force does not modify ordinary non-Psionic free strikes (printed2/5/7+M at M2).
        await invoke(targetId, 'adjust.stamina', { value: 24 });
        const ordinary = await invoke(ids[0]!, 'ability.use', {
          ability: 'Melee Weapon Free Strike',
          targets: [{ refKind: 'character', id: targetId }],
        });
        const ordinaryResult = (await event(ordinary.eventId))!.payload!.data!.result!;
        assert.equal(
          ordinaryResult.targets[0]!.damage!.rolledDamage,
          ledger.ordinaryFreeStrike.damageByTier[ordinaryResult.targets[0]!.tier - 1],
        );
        assert.equal(
          (await get(targetId)).liveState!.stamina,
          24 - ledger.ordinaryFreeStrike.damageByTier[ordinaryResult.targets[0]!.tier - 1]!,
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
