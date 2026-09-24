// SPDX-License-Identifier: GPL-3.0-only
/**
 * V115: melee-or-ranged mode, Field Arsenal signature bonuses and a known slowed immunity through
 * the shared public operations, with real campaign dice and persisted readback. Expected values
 * come from the pinned sources cited below, never from the engine.
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

type Witness = { id: string; selections: Record<string, unknown> };
const read = (path: string) =>
  (JSON.parse(readFileSync(path, 'utf8')) as { witnesses: Witness[] }).witnesses;
const riders = read('tests/fixtures/v109-riders-expected.json');
const shadows = read('tests/fixtures/v92-shadow-expected.json');
const tacticians = read('tests/fixtures/v94-tactician-expected.json');
const cid = () => crypto.randomUUID();
type Live = {
  stamina: number;
  conditions?: Record<string, boolean>;
  conditionInstances?: { id: string; condition: string; status: string }[];
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = { compiled?: PublicCompiledResult; targets: { outcome: TargetRollOutcome }[] };

export async function runKitBonus({ actors: { director }, run, runId }: ScenarioContext) {
  await run('V115 mode, Field Arsenal and slowed immunity persist with real dice', async () => {
    const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
      'characterWizard:discover',
      { targetLevel: 1 },
    );
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Kit bonus ${runId}`,
    });
    const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
    const pick = (list: Witness[], id: string) =>
      structuredClone(list.find(w => w.id === id)!.selections) as EvaluationInput['selections'];
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
    // kit/panther.md: melee +0/+0/+4, no ranged bonus. Two Throats at Once is a Shadow 3-Insight
    // choice (feature/ability/shadow/level-1/two-throats-at-once.md: Melee, Ranged, Strike, Weapon;
    // two creatures or objects; 4/6/10).
    const shadowSelections = pick(shadows, 'v92-shadow-4');
    shadowSelections['class.shadow.ability-3'] = 'Two Throats at Once';
    const shadow = await admit('Panther', shadowSelections);
    // feature/tactician/level-1/field-arsenal.md with kit/rapid-fire.md (Two Shot 4/6/8 including
    // ranged +2/+2/+2) and kit/sniper.md (ranged +0/+0/+4 chosen): Two Shot deals 2/4/10.
    const archerSelections = pick(tacticians, 'v94-tactician-1');
    Object.assign(archerSelections, {
      'kit.choice': 'Rapid-Fire',
      'class.tactician.second-kit': 'Sniper',
      'class.tactician.arsenal.rangedDamage': 'Sniper',
      'class.tactician.arsenal.rangedDistance': 'Sniper',
    });
    const archer = await admit('Arsenal', archerSelections);
    // kit/ranger.md Hamstring Shot: slowed (save ends) at A < WEAK/AVERAGE/STRONG. The Ranger
    // witness's highest characteristic is 2, so potencies are 0/1/2 (rule/character/potency.md).
    const ranger = await admit('Ranger', pick(riders, 'kit-ranger'));
    // Targets use the V109 Elementalist A −1 array: below every threshold. The Orc buys Nonstop
    // (feature/trait/orc/nonstop.md: "You can't be made slowed.").
    const lowAgility = () => {
      const selections = pick(riders, 'v104-4');
      selections['class.elementalist.characteristic-array'] = '2, 2, −1, −1';
      selections['class.elementalist.array-assignment'] = {
        Might: 2,
        Agility: -1,
        Intuition: 2,
        Presence: -1,
      };
      return selections;
    };
    const control = await admit('Susceptible', lowAgility());
    const orcSelections = lowAgility();
    for (const key of Object.keys(orcSelections))
      if (key.startsWith('ancestry.')) delete orcSelections[key];
    orcSelections['ancestry.choice'] = 'Orc';
    orcSelections['ancestry.orc.purchased-traits'] = ['Nonstop', 'Bloodfire Rush'];
    const orc = await admit('Nonstop', orcSelections);
    for (const id of [control, orc])
      assert.equal((await get(id)).evaluation.baseline!.characteristics.A.value, -1);
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
    const result = async (eventId: string) =>
      (
        await director.query<Result[]>('abilities:results', { campaignId, eventIds: [eventId] })
      )[0]!;
    const ref = (id: string) => ({ refKind: 'character', id });
    const use = async (actorId: string, args: Record<string, unknown>, target: string) => {
      await invoke('adjust.stamina', { value: 30 }, target);
      await invoke('adjust.heroic-resource', { value: 3 }, actorId);
      const used = await invoke('ability.use', { ...args, targets: [ref(target)] }, actorId);
      const saved = await result(used.eventId);
      const tier = saved.targets[0]!.outcome.tier;
      return { used, saved, tier, stamina: (await get(target)).liveState.stamina };
    };
    try {
      await invoke('combat.start');
      await invoke('combat.commit');

      // Mode: refused without a choice (with the Insight cost funded, so the refusal is the mode's,
      // not an unaffordable-cost record); ranged ignores Panther's melee bonus.
      await invoke('adjust.heroic-resource', { value: 3 }, shadow);
      await assert.rejects(
        invoke('ability.use', { ability: 'Two Throats at Once', targets: [ref(control)] }, shadow),
        /give mode=melee or mode=ranged/,
      );
      for (const [mode, damage] of [
        ['ranged', [4, 6, 10]],
        ['melee', [4, 6, 14]],
      ] as const) {
        const hit = await use(shadow, { ability: 'Two Throats at Once', mode }, control);
        assert.equal(
          hit.saved.targets[0]!.outcome.damage!.rolledDamage,
          damage[hit.tier - 1],
          mode,
        );
        assert.equal(hit.stamina, 30 - damage[hit.tier - 1]!, mode);
      }

      // Field Arsenal: the printed Rapid-Fire bonus is replaced by Sniper's.
      const shot = await use(archer, { ability: 'Two Shot' }, control);
      assert.equal(shot.saved.targets[0]!.outcome.damage!.rolledDamage, [2, 4, 10][shot.tier - 1]);
      assert.equal(shot.stamina, 30 - [2, 4, 10][shot.tier - 1]!);

      // Immunity: damage applies to both, slowed only to the susceptible control.
      for (const [target, status] of [
        [control, 'applied'],
        [orc, 'immune'],
      ] as const) {
        const before = (await get(target)).liveState;
        if (before.conditions?.slowed) await invoke('condition.off', { name: 'slowed' }, target);
        const hit = await use(ranger, { ability: 'Hamstring Shot' }, target);
        assert.equal(hit.stamina, 30 - hit.saved.targets[0]!.outcome.damage!.rolledDamage);
        const effect = hit.saved.compiled!.effects.find(o => o.effect.kind === 'condition')!;
        assert.equal(effect.effect.kind === 'condition' && effect.effect.status, status);
        const live = (await get(target)).liveState;
        assert.equal(live.conditions?.slowed, status === 'applied');
        if (status === 'immune') {
          assert.equal(live.conditionInstances?.some(i => i.id === effect.id) ?? false, false);
          await invoke('ability.correct', {
            event: hit.used.eventId,
            target: ref(orc),
            edges: 1,
            banes: 0,
          });
          const corrected = (await result(hit.used.eventId)).compiled!.effects.find(
            o => o.effect.kind === 'condition',
          )!;
          assert.equal(corrected.effect.kind === 'condition' && corrected.effect.status, 'immune');
          assert.equal((await get(orc)).liveState.conditions?.slowed, false);
        }
      }
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
