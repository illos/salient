// SPDX-License-Identifier: GPL-3.0-only
/** Source-ledger witnesses and every new Censor action through authenticated public operations. */
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
import type sourceLedger from '../../tests/fixtures/v99-censor-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v99-censor-expected.json', 'utf8'),
) as typeof sourceLedger;
const targetFixture = JSON.parse(readFileSync('tests/fixtures/v25-bethell.json', 'utf8')) as {
  selections: EvaluationInput['selections'];
};
type Saved = {
  revision: number;
  selections: DraftSelection[];
  authored: { name: string; appearance: string; biography: string; notes: string };
  evaluation: EvaluationResult;
  liveState: {
    heroicResource: { current: number };
    stamina: number;
    recoveries: number;
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

const MELEE_OR_RANGED = new Set(['Behold the Face of Justice!', 'Purifying Fire']);
export async function runCensor({ actors: { director, peer }, run, runId }: ScenarioContext) {
  await run(
    'Censor: twelve domains, deity transitions and every granted action persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Censor ${runId}`,
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
          decisionId: 'class.censor.deity',
          value: 'Custom deity',
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
      saved = await transition('class.censor.deity', 'Custom deity');
      assert.ok(!saved.selections.some(s => s.decisionId === 'class.censor.domain'));
      for (const [key, value] of Object.entries({
        'class.censor.custom-deity-name': 'The Witness',
        'class.censor.custom-portfolio': ['Creation', 'Life', 'Love', 'Protection'],
        'class.censor.custom-domain': 'Creation',
        'class.censor.domain-skill': 'Tailoring',
      }))
        saved = await transition(key, value);
      assert.equal(saved.evaluation.status, 'complete');
      saved = await transition('class.censor.custom-portfolio', [
        'War',
        'Life',
        'Love',
        'Protection',
      ]);
      assert.ok(!saved.selections.some(s => s.decisionId === 'class.censor.custom-domain'));
      assert.equal(saved.evaluation.status, 'incomplete');
      assert.ok(
        !(
          await director.query<HeroSheet>('characters:sheet', { characterId, view: 'draft' })
        ).abilities.some(a => a.name === 'Hands of the Maker'),
      );
      assert.ok(
        (await director.query<HeroSheet>('characters:sheet', { characterId })).abilities.some(
          a => a.name === 'Hands of the Maker',
        ),
      );
      // Elementalist Basics permits 2,2,-1,-1. These legal targets bound both Censor thresholds.
      const targetIds: string[] = [];
      for (const low of [true, false]) {
        const id = await create(
          {
            ...targetFixture.selections,
            'class.elementalist.characteristic-array': '2, 2, −1, −1',
            'class.elementalist.array-assignment': low
              ? { Might: 2, Agility: 2, Intuition: -1, Presence: -1 }
              : { Might: -1, Agility: -1, Intuition: 2, Presence: 2 },
          },
          `Censor ${low ? 'low' : 'high'} target ${runId}`,
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
        assert.equal(hero.characteristics.P.value, low ? -1 : 2);
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
      const compiledEffects = async (id: string) =>
        (
          await director.query<
            { compiled?: { effects: { effect: { kind: string; clause: string } }[] } }[]
          >('abilities:results', { campaignId, eventIds: [id] })
        )[0]?.compiled?.effects ?? [];
      const usedNames = new Set<string>();
      try {
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
              rolled?.cost ?? (ledger.embeddedWrathCosts as Record<string, number>)[name] ?? 0;
            assert.deepEqual(
              action.cost,
              cost ? { resource: 'wrath', amount: cost } : undefined,
              `${name} source cost`,
            );
            const targetId = ['Hands of the Maker', 'Faithful Friend'].includes(name)
              ? id
              : targetIds[0]!;
            const target = { refKind: 'character', id: targetId };
            await invoke(id, 'adjust.heroic-resource', { value: cost });
            // V202: My Life for Yours heals; 5 leaves room for the recovery value below the maximum.
            await invoke(targetId, 'adjust.stamina', {
              value: name === 'Grave Speech' ? 0 : name === 'My Life for Yours' ? 5 : 18,
            });
            const before = await get(targetId);
            const censorBefore = await get(id);
            // V115 (rule/combat/distance.md): these Melee-and-Ranged strikes are used in melee, the
            // mode the source ledger's damage assumes; their kits' melee and ranged bonuses differ.
            const mode = MELEE_OR_RANGED.has(name) ? { mode: 'melee' } : {};
            const used = await invoke(id, 'ability.use', {
              ability: name,
              targets: [target],
              ...mode,
            });
            const persisted = await event(used.eventId);
            const after = await get(targetId);
            assert.equal((await get(id)).liveState?.heroicResource.current, 0, `${name} Wrath`);
            if (rolled) {
              assert.equal(persisted?.kind, 'ability.use', name);
              const result = persisted?.payload?.data?.result;
              assert.ok(result, name);
              const outcome = result.targets[0]!;
              const damage = rolled.damageByTier[outcome.tier - 1]!;
              assert.equal(outcome.damage?.rolledDamage, damage, name);
              assert.equal(after.liveState?.stamina, before.liveState!.stamina - damage, name);
              if (['Halt Miscreant!', 'Repent!'].includes(name)) {
                const condition = name === 'Repent!' ? 'dazed' : 'slowed';
                assert.equal(after.liveState?.conditions?.[condition], true);
                const instance = after.liveState?.conditionInstances?.find(
                  c => c.sourceUseEventId === used.eventId && c.status === 'active',
                );
                assert.equal(instance?.condition, condition);
                assert.ok(instance?.registrationId);
                // A second use targets I/P2: equality with strong2 must resist at every possible tier.
                await invoke(id, 'adjust.heroic-resource', { value: cost });
                const highId = targetIds[1]!;
                await invoke(highId, 'adjust.stamina', { value: 18 });
                const highBefore = await get(highId);
                const resisted = await invoke(id, 'ability.use', {
                  ability: name,
                  targets: [{ refKind: 'character', id: highId }],
                  ...mode,
                });
                const highEvent = await event(resisted.eventId);
                const highRoll = highEvent?.payload?.data?.result;
                assert.ok(highRoll);
                assert.equal(
                  (await get(highId)).liveState?.stamina,
                  highBefore.liveState!.stamina -
                    rolled.damageByTier[highRoll.targets[0]!.tier - 1]!,
                );
                const conditionEvent = (await log()).events.find(
                  e =>
                    e.kind === 'condition.potency' &&
                    e.payload?.sourceUseEventId === resisted.eventId,
                );
                assert.equal(conditionEvent?.payload?.status, 'resisted');
                assert.equal(conditionEvent?.payload?.condition, condition);
              } else {
                // All remaining Censor rolls retain clauses the bounded compiler does not automate.
                const remainder: Record<string, string> = {
                  Arrest: 'grab',
                  // Compiled work is matched by its printed clause: V109 riders (bane, shift,
                  // Recovery) and V110 push instructions are occurrences, not manual clauses.
                  'Back Blasphemer!': 'push',
                  'Behold a Shield of Faith!': 'bane',
                  'Behold the Face of Justice!': 'frightened',
                  Censored: 'winded',
                  'Driving Assault': 'shift',
                  'Every Step... Death!': 'willing',
                  'Purifying Fire': 'weakness',
                  'The Gods Punish and Defend': 'Recovery',
                  'Your Allies Cannot Save You!': 'push',
                };
                assert.match(
                  JSON.stringify([
                    outcome.unresolvedClauses,
                    result.manualResolutions,
                    (await compiledEffects(used.eventId)).map(
                      o => `${o.effect.kind}: ${o.effect.clause}`,
                    ),
                  ]),
                  new RegExp(remainder[name]!, 'i'),
                  name,
                );
              }
            } else if (name === 'My Life for Yours') {
              // V202: a compiled turn-start and damage response persists as ability.use. "You spend
              // a Recovery and the target regains Stamina equal to your recovery value."
              // (feature/ability/censor/level-1/my-life-for-yours.md) is applied: the Censor's
              // Recoveries drop by 1 and the target regains the ledger's recovery value.
              assert.equal(persisted?.kind, 'ability.use', name);
              assert.equal(persisted?.payload?.data?.ability?.name, name);
              assert.equal(
                (await get(id)).liveState?.recoveries,
                censorBefore.liveState!.recoveries - 1,
                `${name} Recovery spent`,
              );
              assert.equal(
                after.liveState?.stamina,
                before.liveState!.stamina + w.expected.recoveryValue,
                `${name} healing`,
              );
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
              const blocked = await invoke(id, 'ability.use', {
                ability: name,
                targets: [target],
                ...mode,
              });
              assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', name);
            }
          }
        }
        assert.equal(usedNames.size, 42, '17 source abilities plus 25 embedded actions');
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
