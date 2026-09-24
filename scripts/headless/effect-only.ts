// SPDX-License-Identifier: GPL-3.0-only
/**
 * V157 abilities without a power roll through the shared public operations: each use pays its
 * printed cost, applies its gains to the hero's live state (temporary Stamina keeps the greater
 * amount; surges add) and records every other sentence as ordered table work with no state change.
 * Expected values come from tests/fixtures/v157-effect-only-expected.json (pinned Compendium),
 * never the engine.
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
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type SourceLedger from '../../tests/fixtures/v157-effect-only-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v157-effect-only-expected.json', 'utf8'),
) as typeof SourceLedger;
// The V109 foe keeps both sides populated, so combat stays in the opening roll (round 0).
const v109 = JSON.parse(readFileSync('tests/fixtures/v109-riders-expected.json', 'utf8')) as {
  foe: { definition: string };
};
const cid = () => crypto.randomUUID();
type Live = {
  stamina: number;
  temporaryStamina: number;
  surges: number;
  heroicResource: { name: string; current: number };
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = {
  effectOnly?: true;
  dice?: unknown;
  compiled: PublicCompiledResult;
  targets: { target: { id: string } }[];
};
type Event = { id: string; kind: string; causeEventId: string | null };
type Ability = (typeof SourceLedger)['abilities'][number];
type Expected = {
  kind: string;
  subject: string;
  clause: string;
  temporaryStamina?: number;
  surges?: number;
  shape?: string;
};
const withoutResource = ({ heroicResource: _resource, ...rest }: Live) => rest;

export async function runEffectOnly({ actors: { director }, run, runId }: ScenarioContext) {
  await run('V157 abilities without a power roll pay, gain and record table work', async () => {
    const definitions = new Map<number, DecisionDefinitions>();
    for (const level of new Set(ledger.witnesses.map(w => w.level)))
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
      name: `Effect only ${runId}`,
    });
    const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
    const heroes = new Map<string, string>();
    for (const w of ledger.witnesses) {
      const id = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: w.level,
        authored: { name: `${w.id} ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(
          w.selections as unknown as EvaluationInput['selections'],
          definitions.get(w.level)!,
        ),
      });
      assert.equal((await get(id)).evaluation.status, 'complete', `${w.id} legal build`);
      const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
      for (const a of ledger.abilities.filter(x => x.witness === w.id))
        assert.ok(
          sheet.abilities.some(x => x.name === a.name),
          `${w.id} has ${a.name}`,
        );
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: id,
      });
      heroes.set(w.id, id);
    }
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
    const events = async () =>
      (await director.query<{ events: Event[] }>('events:list', { campaignId })).events;
    const ref = (id: string) => ({ refKind: 'character', id });
    const hero = (witness: string) => heroes.get(witness)!;
    const ability = (name: string) => ledger.abilities.find(a => a.name === name)! as Ability;
    const lives = (ids: string[]) => Promise.all(ids.map(async id => (await get(id)).liveState));

    /** One use: cost paid, the persisted definition and the event, then the saved occurrences. */
    const use = async (a: Ability, targets: string[] | undefined) => {
      const actorId = hero(a.witness);
      await invoke('adjust.heroic-resource', { value: a.cost.amount }, actorId);
      const before = (await get(actorId)).liveState;
      assert.equal(before.heroicResource.name.toLowerCase(), a.cost.resource, `${a.name} resource`);
      const used = await invoke(
        'ability.use',
        { ability: a.name, ...(targets ? { targets: targets.map(ref) } : {}) },
        actorId,
      );
      assert.equal(
        (await events()).find(e => e.id === used.eventId)?.kind,
        'ability.use',
        `${a.name} is a use`,
      );
      const saved = await read(used.eventId);
      assert.equal(saved.effectOnly, true, `${a.name} effect-only`);
      assert.equal(saved.dice, undefined, `${a.name} has no dice`);
      const definition = saved.compiled.definition;
      assert.equal(definition.execution, 'supported', a.name);
      assert.equal(definition.effectOnly, true, a.name);
      assert.equal(definition.source.revision, ledger.sourceRevision, a.name);
      assert.ok(definition.source.path.endsWith(a.source), a.name);
      assert.equal(definition.activation?.actionType, a.actionType, a.name);
      assert.deepEqual(definition.activation?.fixedCost, a.cost, a.name);
      assert.equal(
        (await get(actorId)).liveState.heroicResource.current,
        0,
        `${a.name} paid ${a.cost.amount} ${a.cost.resource}`,
      );
      return { actorId, used, saved, before };
    };
    /** Each printed sentence once per recipient, in printed then target order. */
    const assertEffects = (a: Ability, saved: Result, actorId: string, targets: string[]) => {
      const expected = (a.effects as Expected[]).flatMap(e =>
        (e.subject === 'actor' ? [actorId] : targets).map(id => ({ ...e, id })),
      );
      const effects = saved.compiled.effects;
      assert.equal(effects.length, expected.length, `${a.name} occurrences`);
      for (const [i, o] of effects.entries()) {
        const want = expected[i]!;
        const e = o.effect;
        assert.equal(e.targetId, want.id, `${a.name} occurrence ${i} recipient`);
        assert.equal(e.clause, want.clause, `${a.name} occurrence ${i} printed clause`);
        if (want.kind === 'gain') {
          if (e.kind !== 'gain') throw new Error(`${a.name} gain missing`);
          assert.equal(e.status, 'applied', a.name);
          assert.equal(e.temporaryStamina, want.temporaryStamina, a.name);
          assert.equal(e.surges, want.surges, a.name);
        } else {
          if (e.kind !== 'rider') throw new Error(`${a.name} instruction missing`);
          assert.equal(e.status, 'manual', a.name);
          assert.equal(e.shape, want.shape, a.name);
          assert.equal(e.tier, want.subject === 'target' ? true : undefined, a.name);
        }
      }
      return effects;
    };
    try {
      await invoke('combat.start');
      await invoke('combat.commit');

      // 1. Steelbreaker: 7 Ferocity, the Fury's temporary Stamina 0 → 20; with 25, it stays 25.
      {
        const a = ability('Steelbreaker');
        const fury = hero(a.witness);
        await invoke('adjust.temporary-stamina', { value: 0 }, fury);
        const { used, saved, before } = await use(a, undefined);
        assertEffects(a, saved, fury, []);
        const after = (await get(fury)).liveState;
        assert.deepEqual(
          withoutResource(after),
          { ...withoutResource(before), temporaryStamina: 20 },
          'Steelbreaker: only the temporary Stamina changes',
        );
        await assert.rejects(
          invoke('ability.correct', { event: used.eventId, target: ref(fury), edges: 1, banes: 0 }),
          /no roll to correct/,
        );
        await invoke('adjust.temporary-stamina', { value: 25 }, fury);
        await use(a, undefined);
        assert.equal((await get(fury)).liveState.temporaryStamina, 25, 'the greater amount stays');
      }

      // 2. Saint's Raiment on the Fury: temporary Stamina to 20 and surges 1 → 4.
      {
        const a = ability("Saint's Raiment");
        const fury = hero('fury-steelbreaker');
        await invoke('adjust.temporary-stamina', { value: 0 }, fury);
        await invoke('adjust.surges', { value: 1 }, fury);
        const [was] = await lives([fury]);
        const { actorId, saved } = await use(a, [fury]);
        const [gain] = assertEffects(a, saved, actorId, [fury]);
        const [now] = await lives([fury]);
        assert.deepEqual(
          now,
          { ...was!, temporaryStamina: 20, surges: 4 },
          "Saint's Raiment: the greater temporary Stamina and three more surges",
        );
        if (gain?.effect.kind !== 'gain') throw new Error('gain missing');
        assert.deepEqual(gain.effect.application, {
          temporaryStaminaBefore: 0,
          temporaryStaminaAfter: 20,
          surgesBefore: 1,
          surgesAfter: 4,
        });
      }

      // 3–6. Table work: one ordered instruction per recipient, and no state changes.
      const allies = [hero('tactician-now'), hero('tactician-squad')];
      for (const [name, targetsOf] of [
        ['Sermon of Grace', () => allies],
        ['Now!', () => [hero('fury-steelbreaker'), hero('conduit-saints-raiment'), allies[1]!]],
        ['Squad! Forward!', (self: string) => [self, allies[0]!, hero('shadow-shadowstrike')]],
        ['Shadowstrike', undefined],
        ['Blur', undefined],
      ] as const) {
        const a = ability(name);
        const actorId = hero(a.witness);
        const targets = targetsOf ? targetsOf(actorId) : undefined;
        const watched = [...new Set([actorId, ...(targets ?? [])])];
        const before = await lives(watched);
        const { used, saved } = await use(a, targets);
        const effects = assertEffects(a, saved, actorId, targets ?? [actorId]);
        const after = await lives(watched);
        assert.deepEqual(
          after.map(withoutResource),
          before.map(withoutResource),
          `${name}: table work changes no state`,
        );
        // A disposition on the last occurrence reads back and changes nothing.
        const last = effects.at(-1)!;
        const note = `V157 ${name} resolved at the table`;
        await invoke('ability.resolved', { event: used.eventId, occurrence: last.id, note });
        const disposed = await read(used.eventId);
        assert.equal(
          disposed.compiled.effects.find(o => o.id === last.id)?.disposition?.note,
          note,
        );
        assert.equal(disposed.compiled.effects.filter(o => o.disposition).length, 1, name);
        assert.deepEqual((await lives(watched)).map(withoutResource), after.map(withoutResource));
        assert.ok(
          (await events()).some(
            e => e.kind === 'ability.resolved-at-table' && e.causeEventId === used.eventId,
          ),
          `${name} disposition recorded against the use`,
        );
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
