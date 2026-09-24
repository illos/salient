// SPDX-License-Identifier: GPL-3.0-only
/**
 * V113 tier forced movement, EoT and prone conditions: real campaign dice, shared public operations,
 * persisted readback. Expected values come from the pinned sources cited below, never the engine.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult.ts';
import type { TargetRollOutcome } from '../../shared/contracts/rollResolution.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type SourceLedger from '../../tests/fixtures/v109-riders-expected.json';

// Legal builds reviewed for V109; ability and kit swaps below are ordinary wizard choices.
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v109-riders-expected.json', 'utf8'),
) as typeof SourceLedger;
const cid = () => crypto.randomUUID();
type Instance = {
  id: string;
  status: string;
  condition: string;
  duration: string;
  sourceUseEventId: string;
  registrationId?: string;
  endedReason?: string;
};
type Live = {
  stamina: number;
  conditions?: Record<string, boolean>;
  conditionInstances?: Instance[];
  heroicResource: { current: number };
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = { compiled: PublicCompiledResult; targets: { outcome: TargetRollOutcome }[] };

/**
 * Tier damage and effects (pinned en/unified/md; kit signatures print their kit bonus already):
 * - feature/ability/conduit/level-1/holy-lash.md: 3/5/8 + I holy; vertical pull 2/3/4.
 * - feature/ability/conduit/level-1/staggering-curse.md: 3/5/8 + I holy; slide 1/2/3.
 * - feature/ability/null/level-1/magnetic-strike.md: 5/8/11 + A psychic; vertical pull 1/2/3.
 * - kit/retiarius.md Net and Stab: 4/6/8 + M or A; A < WEAK/AVERAGE slowed (EoT),
 *   A < STRONG restrained (EoT).
 * - kit/vuken.md Unbalancing Attack: 4/7/9 + M; A < WEAK/AVERAGE/STRONG prone.
 * Characteristics come from the V109 witness builds: Conduit I 2, Null A 2, Fury M 2 / A 2.
 */
const tiers = {
  holyLash: { damage: [5, 7, 10], movement: 'pull', vertical: true, distance: [2, 3, 4] },
  staggeringCurse: { damage: [5, 7, 10], movement: 'slide', vertical: false, distance: [1, 2, 3] },
  magneticStrike: { damage: [7, 10, 13], movement: 'pull', vertical: true, distance: [1, 2, 3] },
};

export async function runTierEffects({ actors: { director }, run, runId }: ScenarioContext) {
  await run('V113 forced movement, EoT expiry and prone persist with real dice', async () => {
    const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
      'characterWizard:discover',
      { targetLevel: 1 },
    );
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Tier effects ${runId}`,
    });
    const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
    const witness = (id: string) =>
      structuredClone(
        ledger.witnesses.find(w => w.id === id)!.selections,
      ) as unknown as EvaluationInput['selections'];
    const admit = async (name: string, selections: EvaluationInput['selections']) => {
      const id = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `${name} ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(selections, definitions),
      });
      assert.equal((await get(id)).evaluation.status, 'complete', `${name} legal build`);
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: id,
      });
      return id;
    };
    const conduitSelections = witness('v100-creation');
    conduitSelections['class.conduit.signature-abilities'] = ['Holy Lash', 'Staggering Curse'];
    const conduit = await admit('Conduit', conduitSelections);
    const nullSelections = witness('v103-2');
    nullSelections['class.null.signature-abilities'] = ['Inertial Step', 'Magnetic Strike'];
    const nullHero = await admit('Null', nullSelections);
    const netSelections = witness('kit-ranger');
    netSelections['kit.choice'] = 'Retiarius';
    const netter = await admit('Retiarius', netSelections);
    const vukenSelections = witness('kit-ranger');
    vukenSelections['kit.choice'] = 'Vuken';
    const vuken = await admit('Vuken', vukenSelections);
    // Target: the V109 Elementalist array with A-1 (fixed R2; M2, I2, P-1), below every
    // Agility potency of a highest-characteristic-2 hero (0/1/2, rule/character/potency.md).
    const low = witness('v104-4');
    low['class.elementalist.characteristic-array'] = '2, 2, −1, −1';
    low['class.elementalist.array-assignment'] = {
      Might: 2,
      Agility: -1,
      Intuition: 2,
      Presence: -1,
    };
    const target = await admit('Low Agility', low);
    const score = async (id: string, letter: string) =>
      ((await get(id)).evaluation.baseline!.characteristics as Record<string, { value: number }>)[
        letter
      ]!.value;
    assert.equal(await score(conduit, 'I'), 2);
    assert.equal(await score(nullHero, 'A'), 2);
    assert.equal(await score(netter, 'M'), 2);
    assert.equal(await score(target, 'A'), -1);
    const sessionId = await director.mutation<string>('sessions:start', {
      commandId: cid(),
      campaignId,
      selectedPlayerIds: [],
    });
    const invoke = (operation: string, args: Record<string, unknown> = {}, actorId?: string) =>
      director.mutation<{ eventId: string }>('commands:invoke', {
        commandId: cid(),
        campaignId,
        operation,
        arguments: args,
        ...(actorId ? { actor: { refKind: 'character', id: actorId } } : {}),
      });
    const submit = (text: string) =>
      director.mutation('commands:submit', { campaignId, text, commandId: cid() });
    const read = async (eventId: string) =>
      (
        await director.query<Result[]>('abilities:results', { campaignId, eventIds: [eventId] })
      )[0]!;
    const ref = { refKind: 'character', id: target };
    const use = async (actorId: string, ability: string) => {
      await invoke('adjust.stamina', { value: 30 }, target);
      const used = await invoke('ability.use', { ability, targets: [ref] }, actorId);
      const saved = await read(used.eventId);
      assert.equal(saved.compiled.definition.execution, 'supported', ability);
      assert.equal(saved.compiled.definition.source.revision, ledger.sourceRevision);
      return { used, saved, tier: saved.targets[0]!.outcome.tier };
    };
    try {
      await invoke('combat.start');
      await invoke('combat.commit');

      // Forced movement: one instruction per target at the printed distance; nothing moves.
      for (const [actorId, ability, expected] of [
        [conduit, 'Holy Lash', tiers.holyLash],
        [conduit, 'Staggering Curse', tiers.staggeringCurse],
        [nullHero, 'Magnetic Strike', tiers.magneticStrike],
      ] as const) {
        const { saved, tier } = await use(actorId, ability);
        assert.equal(saved.targets[0]!.outcome.damage!.rolledDamage, expected.damage[tier - 1]);
        assert.equal((await get(target)).liveState.stamina, 30 - expected.damage[tier - 1]!);
        const push = saved.compiled.effects.find(o => o.effect.kind === 'push')!.effect;
        if (push.kind !== 'push') throw new Error(`${ability} movement missing`);
        assert.equal(push.movement, expected.movement, ability);
        assert.equal(push.vertical === true, expected.vertical, ability);
        assert.equal(push.printed, expected.distance[tier - 1], ability);
      }

      // Prone has no printed duration: applied, unscheduled, and it outlasts the turn.
      const bash = await use(vuken, 'Unbalancing Attack');
      assert.equal(bash.saved.targets[0]!.outcome.damage!.rolledDamage, [6, 9, 11][bash.tier - 1]);
      const prone = bash.saved.compiled.effects.find(o => o.effect.kind === 'condition')!;
      assert.equal(prone.effect.kind === 'condition' && prone.effect.status, 'applied');
      const proneInstance = (await get(target)).liveState.conditionInstances!.find(
        i => i.id === prone.id,
      )!;
      assert.equal(proneInstance.duration, 'none');
      assert.equal(proneInstance.registrationId, undefined);

      // EoT imposed during the target's own turn ends at the end of that turn.
      await invoke('combat.roll');
      await invoke('combat.first', { side: 'heroes' });
      await submit(`@{character:${target}} /turn take`);
      const net = await use(netter, 'Net and Stab');
      assert.equal(net.saved.targets[0]!.outcome.damage!.rolledDamage, [6, 8, 10][net.tier - 1]);
      const netCondition = net.saved.compiled.effects.find(o => o.effect.kind === 'condition')!;
      const condition = net.tier === 3 ? 'restrained' : 'slowed';
      assert.equal(
        netCondition.effect.kind === 'condition' && netCondition.effect.status,
        'applied',
      );
      const during = (await get(target)).liveState;
      assert.equal(during.conditions?.[condition], true);
      const eot = during.conditionInstances!.find(i => i.id === netCondition.id)!;
      assert.equal(eot.duration, 'eot');
      assert.ok(eot.registrationId, 'EoT expiry scheduled in the committed encounter');
      await submit(`@{character:${target}} /turn end`);
      const after = (await get(target)).liveState;
      assert.equal(after.conditions?.[condition], false);
      assert.equal(
        after.conditionInstances!.find(i => i.id === netCondition.id)!.endedReason,
        'end of turn (EoT)',
      );
      assert.equal(after.conditions?.prone, true, 'prone outlasts the turn end');
      await invoke('condition.off', { name: 'prone' }, target);
      assert.equal((await get(target)).liveState.conditions?.prone, false);
    } finally {
      const session = await director.query<{ revision: number }>('sessions:get', { sessionId });
      await director.mutation('sessions:transition', {
        commandId: cid(),
        sessionId,
        expectedRevision: session.revision,
        action: 'close',
        voidMode: 'keep',
      });
    }
  });
}
