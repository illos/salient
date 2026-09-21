// SPDX-License-Identifier: GPL-3.0-only
/** Source-ledger witnesses and every new Conduit action through authenticated public operations. */
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
import type sourceLedger from '../../tests/fixtures/v100-conduit-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v100-conduit-expected.json', 'utf8'),
) as typeof sourceLedger;
// Human Censor arrays provide legal I−1 / I2 targets without fear immunity.
const targetFixture = JSON.parse(
  readFileSync('tests/fixtures/v99-censor-expected.json', 'utf8'),
) as {
  witnesses: { selections: EvaluationInput['selections'] }[];
};
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
const cid = () => crypto.randomUUID();
export async function runConduit({ actors: { director, peer }, run, runId }: ScenarioContext) {
  await run(
    'Conduit: twelve domains, deity transitions and every granted action persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Conduit ${runId}`,
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
      // Public transition + save + readback proves portfolio pruning without replacing the admitted build.
      const characterId = ids[0]!;
      let saved = await get(characterId);
      await assert.rejects(
        peer.query('characterWizard:transition', {
          characterId,
          selections: saved.selections,
          decisionId: 'class.conduit.deity',
          value: 'Adûn',
        }),
        /owner/i,
      );
      const transition = async (decisionId: string, value: unknown) => {
        const current = await get(characterId);
        const changed = await director.query<{ selections: DraftSelection[] }>(
          'characterWizard:transition',
          { characterId, selections: current.selections, decisionId, value },
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
      await transition('class.conduit.domain-feature', 'Life');
      const draft = await director.query<HeroSheet>('characters:sheet', {
        characterId,
        view: 'draft',
      });
      assert.ok(!draft.abilities.some(a => a.name === 'Hands of the Maker'));
      for (const name of ['Creation: Domain Prayer', 'Life: Domain Prayer'])
        assert.ok(draft.abilities.some(a => a.name === name));
      await transition('class.conduit.domains', ['Life', 'Protection']);
      await transition('class.conduit.domain-feature', 'Protection');
      saved = await transition('class.conduit.domain-skill', 'Navigate');
      assert.equal(saved.evaluation.status, 'complete');
      saved = await transition('class.conduit.domains', ['Creation', 'Life']);
      assert.ok(!saved.selections.some(s => s.decisionId === 'class.conduit.domain-feature'));
      assert.ok(!saved.selections.some(s => s.decisionId === 'class.conduit.domain-skill'));
      assert.equal(saved.evaluation.status, 'incomplete');
      assert.ok(
        (await director.query<HeroSheet>('characters:sheet', { characterId })).abilities.some(
          a => a.name === 'Hands of the Maker',
        ),
      );
      // These legal Human targets bound every Intuition potency tier, without fear immunity.
      const targetIds: string[] = [];
      for (const low of [true, false]) {
        const id = await create(
          {
            ...targetFixture.witnesses[0]!.selections,
            'class.censor.characteristic-array': '2, −1, −1',
            'class.censor.array-assignment': low
              ? { Agility: 2, Reason: -1, Intuition: -1 }
              : { Agility: -1, Reason: -1, Intuition: 2 },
          },
          `Conduit ${low ? 'low' : 'high'} target ${runId}`,
        );
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        targetIds.push(id);
        const hero = (await director.query<HeroSheet>('characters:sheet', { characterId: id }))
          .build!.baseline!;
        assert.equal(hero.characteristics.I.value, low ? -1 : 2);
      }
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
      const usedNames = new Set<string>();
      try {
        // Paid optional trigger outside combat uses the shared waiver, retaining a zero pool.
        await invoke(ids[0]!, 'adjust.heroic-resource', { value: 0 });
        const waived = await invoke(ids[0]!, 'ability.use', {
          ability: 'Word of Guidance: Enhance',
          targets: [{ refKind: 'character', id: targetIds[0]! }],
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
              (ledger.embeddedPietyCosts as Record<string, number>)[name] ??
              0;
            assert.deepEqual(
              action.cost,
              cost ? { resource: 'piety', amount: cost } : undefined,
              `${name} source cost`,
            );
            const targetId = ['Hands of the Maker', 'Faithful Friend'].includes(name)
              ? id
              : targetIds[0]!;
            const target = { refKind: 'character', id: targetId };
            await invoke(id, 'adjust.heroic-resource', { value: cost });
            await invoke(targetId, 'adjust.stamina', { value: 24 });
            const before = await get(targetId);
            const used = await invoke(id, 'ability.use', { ability: name, targets: [target] });
            const persisted = await event(used.eventId);
            const after = await get(targetId);
            assert.equal((await get(id)).liveState?.heroicResource.current, 0, `${name} Piety`);
            if (rolled) {
              assert.equal(persisted?.kind, 'ability.use', name);
              const result = persisted?.payload?.data?.result;
              assert.ok(result, name);
              const outcome = result.targets[0]!;
              if (rolled.damageByTier) {
                const damage = rolled.damageByTier[outcome.tier - 1]!;
                assert.equal(outcome.damage?.rolledDamage, damage, name);
                assert.equal(after.liveState?.stamina, before.liveState!.stamina - damage, name);
              } else {
                // Faith Is Our Armor retains its temporary-Stamina tier as manual source text.
                assert.equal(outcome.damage, undefined);
                assert.deepEqual(after.liveState, before.liveState);
              }
              if (name === 'Curse of Terror') {
                const condition = 'frightened';
                assert.equal(after.liveState?.conditions?.[condition], true);
                const instance = after.liveState?.conditionInstances?.find(
                  c => c.sourceUseEventId === used.eventId && c.status === 'active',
                );
                assert.equal(instance?.condition, condition);
                assert.ok(instance?.registrationId);
                // A second use targets I2: equality with strong2 must resist at every possible tier.
                await invoke(id, 'adjust.heroic-resource', { value: cost });
                const highId = targetIds[1]!;
                await invoke(highId, 'adjust.stamina', { value: 24 });
                const highBefore = await get(highId);
                const resisted = await invoke(id, 'ability.use', {
                  ability: name,
                  targets: [{ refKind: 'character', id: highId }],
                });
                const highEvent = await event(resisted.eventId);
                const highRoll = highEvent?.payload?.data?.result;
                assert.ok(highRoll);
                assert.equal(
                  (await get(highId)).liveState?.stamina,
                  highBefore.liveState!.stamina -
                    rolled.damageByTier![highRoll.targets[0]!.tier - 1]!,
                );
                const conditionEvent = (await log()).events.find(
                  e =>
                    e.kind === 'condition.potency' &&
                    e.payload?.sourceUseEventId === resisted.eventId,
                );
                assert.equal(conditionEvent?.payload?.status, 'resisted');
                assert.equal(conditionEvent?.payload?.condition, condition);
              } else {
                // Source clauses remain explicit where the bounded compiler cannot automate them.
                assert.match(
                  JSON.stringify([outcome.unresolvedClauses, result.manualResolutions]),
                  new RegExp(rolled.manualRemainder!, 'i'),
                  name,
                );
              }
            } else {
              assert.equal(persisted?.kind, 'ability.recorded', name);
              assert.equal(persisted?.payload?.data?.manual, true, name);
              assert.equal(persisted?.payload?.data?.ability?.name, name);
              assert.deepEqual(
                after.liveState,
                before.liveState,
                `${name} manual target unchanged`,
              );
            }
            if (cost) {
              const blocked = await invoke(id, 'ability.use', { ability: name, targets: [target] });
              assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', name);
            }
          }
        }
        assert.equal(usedNames.size, 64, '23 source abilities plus 41 embedded actions');
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
