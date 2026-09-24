// SPDX-License-Identifier: GPL-3.0-only
/**
 * V110 counted and area envelopes: real campaign dice, shared public operations and persisted
 * per-target readback. Expected values come from the pinned sources cited below, never the engine.
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

// Legal builds already reviewed for V109; kit swaps below are ordinary wizard choices.
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v109-riders-expected.json', 'utf8'),
) as typeof SourceLedger;
const cid = () => crypto.randomUUID();
type Instance = { id: string; status: string; condition: string; sourceUseEventId: string };
type Live = {
  stamina: number;
  conditions?: Record<string, boolean>;
  conditionInstances?: Instance[];
  heroicResource: { current: number };
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = {
  dice: { d10a: number; d10b: number };
  compiled: PublicCompiledResult;
  targets: { target: { id: string }; outcome: TargetRollOutcome }[];
};

/**
 * Tier damage after the actor's kit bonus (chapter/kits.md, Damage Bonuses: Melee+Weapon or
 * Ranged+Weapon keywords only; kit signatures print their kit bonus already).
 * - feature/ability/censor/level-1/back-blasphemer.md: Area, Magic, Melee, Weapon; 2/4/6 holy;
 *   push 1/2/3. kit/cloak-and-dagger.md melee +1/+1/+1.
 * - feature/ability/fury/level-1/back.md (3 Ferocity): Area, Melee, Weapon; 5/8/11; push -/1/3.
 *   kit/panther.md melee +0/+0/+4.
 * - feature/ability/troubadour/level-1/quick-rewrite.md (3 Drama): Area, Magic, Ranged; 4/5/6;
 *   P < WEAK/AVERAGE slowed, P < STRONG restrained (save ends); the area is difficult terrain.
 * - kit/rapid-fire.md Two Shot: Ranged, Strike, Weapon; two creatures or objects; 4/6/8.
 * - monster/goblin/statblock/goblin-assassin.md Shadow Chains (3 Malice): three creatures;
 *   2/4/5 corruption; A < 0/1/2 restrained (save ends).
 */
const expected = {
  backBlasphemer: [3, 5, 7],
  back: [5, 8, 15],
  quickRewrite: [4, 5, 6],
  twoShot: [4, 6, 8],
  shadowChains: [2, 4, 5],
};

export async function runMultiTarget({ actors: { director }, run, runId }: ScenarioContext) {
  await run('V110 counted and area abilities resolve per target with real dice', async () => {
    const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
      'characterWizard:discover',
      { targetLevel: 1 },
    );
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Targets ${runId}`,
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
    const censor = await admit('Censor', witness('v99-creation'));
    const fury = await admit('Fury', witness('v101-panther'));
    const troubadour = await admit('Troubadour', witness('v102-3'));
    const rapid = witness('kit-ranger');
    rapid['kit.choice'] = 'Rapid-Fire';
    const archer = await admit('Archer', rapid);
    // Targets: Conduit P-1/A2 (v100-creation), Censor P2/A2 (v99-creation), and the V109
    // Elementalist array with A-1 (fixed R2; M2, I2, P-1).
    const low = witness('v104-4');
    low['class.elementalist.characteristic-array'] = '2, 2, −1, −1';
    low['class.elementalist.array-assignment'] = {
      Might: 2,
      Agility: -1,
      Intuition: 2,
      Presence: -1,
    };
    const weak = await admit('Weak Presence', witness('v100-creation'));
    const strong = await admit('Strong Presence', witness('v99-creation'));
    const clumsy = await admit('Low Agility', low);
    const scores = async (id: string) =>
      (await get(id)).evaluation.baseline!.characteristics as Record<string, { value: number }>;
    assert.equal((await scores(weak)).P.value, -1);
    assert.equal((await scores(weak)).A.value, 2);
    assert.equal((await scores(strong)).P.value, 2);
    assert.equal((await scores(clumsy)).A.value, -1);
    assert.equal((await scores(troubadour)).P.value, 2);
    const assassin = await director.mutation<string>('foes:add', {
      commandId: cid(),
      campaignId,
      definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-assassin',
    });
    const sessionId = await director.mutation<string>('sessions:start', {
      commandId: cid(),
      campaignId,
      selectedPlayerIds: [],
    });
    const invoke = (
      operation: string,
      args: Record<string, unknown> = {},
      actorId?: string,
      kind = 'character',
    ) =>
      director.mutation<{ eventId: string }>('commands:invoke', {
        commandId: cid(),
        campaignId,
        operation,
        arguments: args,
        ...(actorId ? { actor: { refKind: kind, id: actorId } } : {}),
      });
    const read = async (eventId: string) =>
      (
        await director.query<Result[]>('abilities:results', { campaignId, eventIds: [eventId] })
      )[0]!;
    const ref = (id: string) => ({ refKind: 'character', id });
    const reset = async (ids: string[]) => {
      for (const id of ids) {
        await invoke('adjust.stamina', { value: 24 }, id);
        for (const condition of ['slowed', 'restrained'])
          if ((await get(id)).liveState.conditions?.[condition])
            await invoke('condition.off', { name: condition }, id);
      }
    };
    // One roll; each target's own tier (no edges/banes here, so one shared tier) and damage.
    const use = async (
      actorId: string,
      ability: string,
      targets: string[],
      damage: number[],
      cost?: number,
      kind = 'character',
    ) => {
      await reset(targets);
      if (cost !== undefined) await invoke('adjust.heroic-resource', { value: cost }, actorId);
      const used = await invoke(
        'ability.use',
        { ability, targets: targets.map(ref) },
        actorId,
        kind,
      );
      const saved = await read(used.eventId);
      assert.equal(saved.compiled.definition.execution, 'supported', ability);
      assert.equal(saved.compiled.definition.source.revision, ledger.sourceRevision);
      assert.deepEqual(
        saved.targets.map(t => t.target.id),
        targets,
        `${ability} persisted every target in order`,
      );
      const tier = saved.targets[0]!.outcome.tier;
      for (const [index, id] of targets.entries()) {
        assert.equal(saved.targets[index]!.outcome.tier, tier, ability);
        assert.equal(saved.targets[index]!.outcome.damage!.rolledDamage, damage[tier - 1], ability);
        assert.equal((await get(id)).liveState.stamina, 24 - damage[tier - 1]!, ability);
      }
      if (cost !== undefined)
        assert.equal((await get(actorId)).liveState.heroicResource.current, 0, `${ability} cost`);
      return { used, saved, tier };
    };
    try {
      await invoke('combat.start');
      await invoke('combat.commit');

      // Area push: one damage and one push occurrence per target; no movement is executed.
      const blasphemer = await use(
        censor,
        'Back Blasphemer!',
        [weak, strong],
        expected.backBlasphemer,
      );
      const pushes = blasphemer.saved.compiled.effects.filter(o => o.effect.kind === 'push');
      assert.deepEqual(
        pushes.map(o => o.effect.targetId),
        [weak, strong],
      );
      for (const push of pushes)
        if (push.effect.kind === 'push') assert.equal(push.effect.printed, blasphemer.tier);

      const back = await use(fury, 'Back!', [weak, strong, clumsy], expected.back, 3);
      assert.equal(
        back.saved.compiled.effects.filter(o => o.effect.kind === 'push').length,
        back.tier === 1 ? 0 : 3,
      );

      // Potency per target: WEAK/AVERAGE/STRONG for P2 are 0/1/2 (rule/character/potency.md).
      // P-1 is below every threshold; P2 is below none.
      const rewrite = await use(
        troubadour,
        'Quick Rewrite',
        [weak, strong],
        expected.quickRewrite,
        3,
      );
      const conditions = rewrite.saved.compiled.effects.filter(o => o.effect.kind === 'condition');
      assert.deepEqual(
        conditions.map(o => [o.effect.targetId, o.effect.kind === 'condition' && o.effect.status]),
        [
          [weak, 'applied'],
          [strong, 'resisted'],
        ],
      );
      const condition = rewrite.tier === 3 ? 'restrained' : 'slowed';
      const weakLive = (await get(weak)).liveState;
      assert.equal(weakLive.conditions?.[condition], true);
      const instance = weakLive.conditionInstances!.find(i => i.id === conditions[0]!.id)!;
      assert.equal(instance.status, 'active');
      assert.equal(instance.sourceUseEventId, rewrite.used.eventId);
      assert.equal((await get(strong)).liveState.conditions?.[condition], false);
      const riders = rewrite.saved.compiled.effects.filter(o => o.effect.kind === 'rider');
      assert.equal(riders.length, 1, 'area Effect occurs once per use');
      // Correcting one target leaves the other's occurrence identity and instance intact.
      await invoke('ability.correct', {
        event: rewrite.used.eventId,
        target: ref(strong),
        edges: 0,
        banes: 2,
      });
      const corrected = await read(rewrite.used.eventId);
      assert.deepEqual(corrected.dice, rewrite.saved.dice);
      const kept = corrected.compiled.effects.find(o => o.id === conditions[0]!.id);
      assert.ok(kept, 'untouched target keeps its occurrence identity');
      const redone = corrected.compiled.effects.find(
        o => o.effect.kind === 'condition' && o.effect.targetId === strong,
      )!;
      assert.notEqual(redone.id, conditions[1]!.id);
      assert.equal(
        (await get(weak)).liveState.conditionInstances!.find(i => i.id === conditions[0]!.id)!
          .status,
        'active',
      );
      const rider = corrected.compiled.effects.filter(o => o.effect.kind === 'rider');
      assert.equal(rider.length, 1);
      await invoke('ability.resolved', {
        event: rewrite.used.eventId,
        occurrence: rider[0]!.id,
        note: 'Difficult terrain marked on the map',
      });
      assert.ok(
        (await read(rewrite.used.eventId)).compiled.effects.find(o => o.id === rider[0]!.id)!
          .disposition,
      );

      // A counted envelope accepts its printed maximum and refuses more.
      await assert.rejects(
        invoke(
          'ability.use',
          { ability: 'Two Shot', targets: [weak, strong, clumsy].map(ref) },
          archer,
        ),
        /targets up to 2; give at most 2 targets/,
      );
      await use(archer, 'Two Shot', [weak, strong], expected.twoShot);

      // Foe: printed thresholds; A-1 is below every threshold, A2 below none.
      await invoke('adjust.malice', { value: 3 });
      const chains = await use(
        assassin,
        'Shadow Chains',
        [clumsy, weak],
        expected.shadowChains,
        undefined,
        'foe',
      );
      assert.deepEqual(
        chains.saved.compiled.effects
          .filter(o => o.effect.kind === 'condition')
          .map(o => [o.effect.targetId, o.effect.kind === 'condition' && o.effect.status]),
        [
          [clumsy, 'applied'],
          [weak, 'resisted'],
        ],
      );
      assert.equal((await get(clumsy)).liveState.conditions?.restrained, true);
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
