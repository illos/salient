// SPDX-License-Identifier: GPL-3.0-only
/**
 * V154 tiers without damage and tier table work through the shared public operations with real
 * campaign dice: Power Chord pushes each area target by its own tier and deals no damage; Battle
 * Cry records one surge instruction per ally and a one-target correction keeps the others'; In a
 * Puff of Ash, Fade and Inspiring Strike record one instruction after their damage. Instructions
 * change no state. Expected values come from tests/fixtures/v154-tier-expected.json (pinned
 * Compendium arithmetic), never the engine.
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
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { TargetRollOutcome } from '../../shared/contracts/rollResolution.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type SourceLedger from '../../tests/fixtures/v154-tier-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v154-tier-expected.json', 'utf8'),
) as typeof SourceLedger;
// The V109 foe keeps both sides populated, so combat stays in the opening roll (round 0).
const v109 = JSON.parse(readFileSync('tests/fixtures/v109-riders-expected.json', 'utf8')) as {
  foe: { definition: string };
};
const cid = () => crypto.randomUUID();
type Live = { stamina: number; surges: number; heroicResource: { current: number } };
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = {
  dice: { d10a: number; d10b: number };
  compiled: PublicCompiledResult;
  targets: { target: { id: string }; outcome: TargetRollOutcome }[];
};
type Event = { id: string; kind: string; causeEventId: string | null };
type Action = {
  name: string;
  use: 'area-push' | 'ally-surges' | 'damage-instruction';
  cost: number;
  source: string;
  rollScore: number;
  mode?: string;
  pushByTier?: number[];
  damageByTier?: number[];
  shape?: string;
  clauseByTier?: string[];
};
const withoutResource = ({ heroicResource: _resource, ...rest }: Live) => rest;
/** Display markup only: [text](scc link) → text, bold/italic markers, whitespace runs. */
const plain = (text: string) =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
/**
 * rule/dice/natural-roll.md: a natural 19 or 20 is always tier 3; rule/dice/tier-outcome.md:
 * ≤11 / 12–16 / 17+; rule/dice/bane.md and edge.md: a double bane or edge moves one tier (1–3).
 */
const expectedTier = (
  dice: { d10a: number; d10b: number },
  score: number,
  edges: number,
  banes: number,
) => {
  const natural = dice.d10a + dice.d10b;
  if (natural >= 19) return 3;
  const net = Math.min(edges, 2) - Math.min(banes, 2);
  const total = natural + score + (Math.abs(net) === 1 ? 2 * net : 0);
  const tier = total <= 11 ? 1 : total <= 16 ? 2 : 3;
  return Math.max(1, Math.min(3, tier + (net === 2 ? 1 : net === -2 ? -1 : 0)));
};

export async function runTierInstructions({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    'V154 tiers without damage and per-target tier instructions persist with real dice',
    async () => {
      const definitions = new Map<number, DecisionDefinitions>();
      for (const level of new Set([1, ...ledger.witnesses.map(w => w.level)]))
        definitions.set(
          level,
          (
            await director.query<{ definitions: DecisionDefinitions }>('characterWizard:discover', {
              targetLevel: level,
            })
          ).definitions,
        );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Tier instructions ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const scores = (sheet: HeroSheet) =>
        Object.fromEntries(
          Object.entries(sheet.build!.baseline!.characteristics).map(([key, v]) => [key, v.value]),
        );
      const admit = async (name: string, level: number, selections: unknown, expected: object) => {
        const id = await director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: level,
          authored: { name: `${name} ${runId}`, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(
            selections as EvaluationInput['selections'],
            definitions.get(level)!,
          ),
        });
        assert.equal((await get(id)).evaluation.status, 'complete', `${name} legal build`);
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
        assert.equal(sheet.build!.baseline!.level.value, level, `${name} level`);
        assert.deepEqual(scores(sheet), expected, `${name} source scores`);
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        return { id, sheet };
      };
      const actors = new Map<string, string>();
      for (const w of ledger.witnesses) {
        const { id, sheet } = await admit(w.id, w.level, w.selections, w.characteristics);
        for (const action of w.actions)
          assert.ok(
            sheet.abilities.some(a => a.name === action.name),
            `${w.id} has ${action.name}`,
          );
        actors.set(w.id, id);
      }
      const t = ledger.target;
      const { id: targetA } = await admit('Tier Target A', 1, t.selections, t.characteristics);
      const { id: targetB } = await admit('Tier Target B', 1, t.selections, t.characteristics);
      await director.mutation<string>('foes:add', {
        commandId: cid(),
        campaignId,
        definitionId: v109.foe.definition,
      });
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
      const read = async (eventId: string) =>
        (
          await director.query<Result[]>('abilities:results', { campaignId, eventIds: [eventId] })
        )[0]!;
      const ref = (id: string) => ({ refKind: 'character', id });
      const lives = async (ids: string[]) =>
        Promise.all(ids.map(async id => (await get(id)).liveState));
      const action = (witness: string, name: string) => {
        const w = ledger.witnesses.find(x => x.id === witness)!;
        return {
          actorId: actors.get(witness)!,
          action: w.actions.find(a => a.name === name)! as Action,
        };
      };
      /** One use with real dice; asserts source, payment, per-target tiers from the dice. */
      const use = async (actorId: string, a: Action, targets: string[]) => {
        await invoke('adjust.heroic-resource', { value: a.cost }, actorId);
        const actorBefore = (await get(actorId)).liveState;
        const used = await invoke(
          'ability.use',
          { ability: a.name, targets: targets.map(ref), ...(a.mode ? { mode: a.mode } : {}) },
          actorId,
        );
        const saved = await read(used.eventId);
        assert.equal(saved.compiled.definition.execution, 'supported', a.name);
        assert.equal(saved.compiled.definition.source.revision, ledger.sourceRevision);
        assert.ok(saved.compiled.definition.source.path.endsWith(a.source), a.name);
        assert.deepEqual(
          saved.targets.map(x => x.target.id),
          targets,
          `${a.name} persisted every target in order`,
        );
        for (const [i, x] of saved.targets.entries())
          assert.equal(
            x.outcome.tier,
            expectedTier(saved.dice, a.rollScore, 0, 0),
            `${a.name} target ${i} tier from dice`,
          );
        const actorAfter = (await get(actorId)).liveState;
        assert.equal(actorAfter.heroicResource.current, 0, `${a.name} cost`);
        assert.deepEqual(
          withoutResource(actorAfter),
          withoutResource(actorBefore),
          `${a.name} actor otherwise unchanged`,
        );
        return { used, saved };
      };
      /** A tier instruction occurrence: its node, shape, printed clause and readiness. */
      const assertInstruction = (
        saved: Result,
        occurrence: PublicCompiledResult['effects'][number],
        a: Action,
        tier: number,
        targetId: string,
        after: string[],
        label: string,
      ) => {
        const e = occurrence.effect;
        if (e.kind !== 'rider') throw new Error(`${label} instruction missing`);
        assert.equal(e.targetId, targetId, `${label} target`);
        assert.equal(e.tier, true, `${label} tier instruction`);
        assert.equal(e.shape, a.shape, `${label} shape`);
        assert.equal(e.status, 'manual', `${label} status`);
        assert.equal(e.dependency, after.length ? 'after-damage' : 'independent', label);
        assert.deepEqual(e.after, after, `${label} waits for this target's damage only`);
        assert.equal(plain(e.clause), a.clauseByTier![tier - 1], `${label} printed tier clause`);
        const node = saved.compiled.definition.tiers[tier - 1]!.find(n => n.id === e.nodeId);
        assert.ok(node, `${label} node in tier ${tier}`);
        assert.equal(node.kind, 'instruction', label);
        assert.equal(node.clause, e.clause, label);
      };
      try {
        await invoke('combat.start');
        await invoke('combat.commit');

        // 1. Power Chord: Push 1/2/3 on each target by its tier; no damage, nothing else.
        {
          const { actorId, action: a } = action('troubadour-virtuoso-sniper', 'Power Chord');
          const targets = [targetA, targetB];
          const before = await lives(targets);
          const { saved } = await use(actorId, a, targets);
          const effects = saved.compiled.effects;
          assert.deepEqual(
            effects.map(o => [o.effect.kind, o.effect.targetId]),
            targets.map(id => ['push', id]),
            'Power Chord: exactly one push per target',
          );
          for (const [i, o] of effects.entries()) {
            const push = o.effect;
            if (push.kind !== 'push') throw new Error('Power Chord push missing');
            const tier = saved.targets[i]!.outcome.tier;
            assert.equal(push.printed, a.pushByTier![tier - 1], `Power Chord target ${i} push`);
            assert.equal(push.movement, undefined, 'ordinary push');
            assert.equal(push.vertical, undefined, 'not vertical');
            // Live movement facts leave trait and modifier coverage unknown (V72), so the push may
            // be fact-needed; with no damage in the tier it never waits on damage.
            assert.ok(['instruction', 'fact-needed'].includes(push.status), 'push status');
            assert.ok(
              !push.requirements.some(r => r.startsWith('damage:')),
              'a damage-free push waits on no damage',
            );
            assert.equal(saved.targets[i]!.outcome.damage?.rolledDamage ?? 0, 0, 'no damage');
          }
          assert.deepEqual(await lives(targets), before, 'Power Chord changes no target state');
        }

        // 2. Battle Cry: one surge instruction per ally, ready at once; no state changes.
        {
          const { actorId, action: a } = action('tactician-insurgent', 'Battle Cry');
          const allies = [targetA, targetB, actors.get('shadow-black-ash-l2')!];
          const before = await lives(allies);
          const { used, saved } = await use(actorId, a, allies);
          const riders = saved.compiled.effects;
          assert.equal(riders.length, 3, 'Battle Cry: three instructions and nothing else');
          for (const [i, o] of riders.entries()) {
            assertInstruction(
              saved,
              o,
              a,
              saved.targets[i]!.outcome.tier,
              allies[i]!,
              [],
              `Battle Cry ally ${i}`,
            );
            assert.equal(o.useEventId, used.eventId);
          }
          const after = await lives(allies);
          assert.deepEqual(after, before, 'Battle Cry changes no ally state (surges stay manual)');

          // One ally's correction replaces only that ally's instruction (V110, V154).
          const index = 1;
          const original = saved.targets[index]!.outcome.tier;
          const correction = original === 1 ? { edges: 2, banes: 0 } : { edges: 0, banes: 2 };
          await invoke('ability.correct', {
            event: used.eventId,
            target: ref(allies[index]!),
            ...correction,
          });
          const corrected = await read(used.eventId);
          assert.deepEqual(corrected.dice, saved.dice, 'correction keeps the dice');
          const tier = corrected.targets[index]!.outcome.tier;
          assert.equal(
            tier,
            expectedTier(saved.dice, a.rollScore, correction.edges, correction.banes),
            'corrected tier from the same dice',
          );
          const now = corrected.compiled.effects;
          assert.equal(now.length, 3, 'still one instruction per ally');
          for (const [i, o] of now.entries()) {
            if (i === index) {
              assert.notEqual(o.id, riders[i]!.id, 'corrected ally instruction replaced');
              assertInstruction(corrected, o, a, tier, allies[i]!, [], 'corrected ally');
            } else {
              assert.equal(o.id, riders[i]!.id, `ally ${i} keeps its instruction identity`);
              assert.deepEqual(o.effect, riders[i]!.effect, `ally ${i} instruction unchanged`);
            }
          }
          const events = (await director.query<{ events: Event[] }>('events:list', { campaignId }))
            .events;
          assert.ok(
            events.some(e => e.kind === 'correction.ability' && e.causeEventId === used.eventId),
            'correction recorded against the use',
          );
          assert.deepEqual(await lives(allies), after, 'correction changes no ally state');

          // A disposition on one kept instruction reads back and changes nothing.
          const note = 'V154 surge gained at the table';
          await invoke('ability.resolved', { event: used.eventId, occurrence: now[0]!.id, note });
          const disposed = await read(used.eventId);
          assert.equal(
            disposed.compiled.effects.find(o => o.id === now[0]!.id)!.disposition!.note,
            note,
          );
          assert.equal(
            disposed.compiled.effects.filter(o => o.disposition).length,
            1,
            'one disposition',
          );
          assert.deepEqual(await lives(allies), after, 'disposition changes no ally state');
        }

        // 3–4. Damage then one instruction for this target, manual once the damage is applied.
        for (const [witness, name] of [
          ['shadow-black-ash-l2', 'In a Puff of Ash'],
          ['shadow-black-ash-l2', 'Fade'],
          ['tactician-vanguard', 'Inspiring Strike'],
        ] as const) {
          const { actorId, action: a } = action(witness, name);
          await invoke('adjust.stamina', { value: t.stamina }, targetA);
          const before = (await get(targetA)).liveState;
          const { used, saved } = await use(actorId, a, [targetA]);
          const tier = saved.targets[0]!.outcome.tier;
          const damage = a.damageByTier![tier - 1]!;
          assert.equal(saved.targets[0]!.outcome.damage!.rolledDamage, damage, `${name} damage`);
          const effects = saved.compiled.effects;
          assert.deepEqual(
            effects.map(o => o.effect.kind),
            ['damage', 'rider'],
            `${name}: the damage, then one instruction`,
          );
          const [dealt, instruction] = effects;
          assert.equal(dealt!.effect.status, 'calculated', `${name} damage applied`);
          assertInstruction(saved, instruction!, a, tier, targetA, [dealt!.effect.nodeId], name);
          const after = (await get(targetA)).liveState;
          assert.deepEqual(
            after,
            { ...before, stamina: t.stamina - damage },
            `${name}: only the damage changes the target`,
          );
          const note = `V154 ${name} instruction adjudicated at table`;
          await invoke('ability.resolved', {
            event: used.eventId,
            occurrence: instruction!.id,
            note,
          });
          const disposed = await read(used.eventId);
          assert.equal(
            disposed.compiled.effects.find(o => o.id === instruction!.id)!.disposition!.note,
            note,
          );
          assert.deepEqual((await get(targetA)).liveState, after, `${name} disposition`);
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
    },
  );
}
