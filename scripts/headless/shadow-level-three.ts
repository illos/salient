// SPDX-License-Identifier: GPL-3.0-only
/** V98 full-build level editing and source-timed actions, through authenticated public operations. */
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
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v98-shadow-three-expected.json', 'utf8'),
) as {
  witnesses: {
    id: string;
    abilityDecision: string;
    newAbility: string;
    damageByTier?: number[];
    selections: EvaluationInput['selections'];
    expected: {
      staminaMaximum: number;
      recoveryValue: number;
      windedValue: number;
      abilities: string[];
      features: string[];
      perks: string[];
    };
  }[];
};
const targetFixture = JSON.parse(readFileSync('tests/fixtures/v25-bethell.json', 'utf8')) as {
  selections: EvaluationInput['selections'];
};
type Saved = {
  level: number;
  revision: number;
  authored: { name: string; appearance: string; biography: string; notes: string };
  selections: DraftSelection[];
  evaluation: EvaluationResult;
  liveState: {
    heroicResource: { current: number };
    stamina: number;
    conditions?: { restrained: boolean };
    conditionInstances?: {
      status: string;
      condition: string;
      sourceUseEventId: string;
      abilityName: string;
      duration: string;
      registrationId?: string;
    }[];
  } | null;
};
type Transition = { selections: DraftSelection[]; removed: string[]; evaluation: EvaluationResult };
const commandId = () => crypto.randomUUID();
export async function runShadowLevelThree({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'Shadow level three: four builds, level edits and six action uses persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 3 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: commandId(),
        name: `Shadow 3 ${runId}`,
      });
      const ids: string[] = [];
      for (const [index, witness] of ledger.witnesses.entries()) {
        const characterId = await director.mutation<string>('characters:create', {
          commandId: commandId(),
          targetLevel: 3,
          wizardDraft: index === 0,
          authored: {
            name: index === 0 ? '' : `${witness.id} ${runId}`,
            appearance: '',
            biography: '',
            notes: '',
          },
          selections: draftSelectionsFrom(witness.selections, definitions),
        });
        ids.push(characterId);
        let saved = await director.query<Saved>('characters:get', { characterId });
        assert.equal(saved.level, 3);
        assert.equal(saved.evaluation.status, 'complete');
        if (index === 0) {
          assert.equal(await director.query('characters:wizardDraft', {}), characterId);
          const resumed = await director.query<{ targetLevel: number }>(
            'characterWizard:discover',
            { characterId },
          );
          assert.equal(resumed.targetLevel, 3);
          await director.mutation('characters:save', {
            commandId: commandId(),
            characterId,
            expectedRevision: saved.revision,
            targetLevel: 3,
            authored: { ...saved.authored, name: `${witness.id} ${runId}` },
            selections: saved.selections,
            list: true,
          });
          saved = await director.query<Saved>('characters:get', { characterId });
          assert.equal(await director.query('characters:wizardDraft', {}), null);
          assert.equal(saved.level, 3);
        }
        await director.mutation('characters:submit', {
          commandId: commandId(),
          campaignId,
          characterId,
        });
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId });
        const baseline = sheet.build?.baseline;
        assert.ok(baseline);
        for (const key of ['staminaMaximum', 'recoveryValue', 'windedValue'] as const)
          assert.equal(baseline[key].value, witness.expected[key]);
        assert.equal(baseline.recoveriesMaximum.value, 8);
        assert.equal(baseline.level.value, 3);
        for (const name of witness.expected.abilities)
          assert.ok(
            sheet.abilities.some(a => a.name === name),
            `${witness.id} ability ${name}`,
          );
        for (const name of witness.expected.features)
          assert.ok(
            sheet.features.some(f => f.name === name),
            `${witness.id} feature ${name}`,
          );
        assert.deepEqual(sheet.abilities.find(a => a.name === witness.newAbility)?.cost, {
          resource: 'insight',
          amount: 7,
        });
        assert.ok(sheet.abilities.find(a => a.name === witness.newAbility)?.content?.text);
      }
      // Lowering a full-edit target revokes later choices; raising it asks again, not a replay of grants.
      const characterId = ids[0]!;
      let saved = await director.query<Saved>('characters:get', { characterId });
      await assert.rejects(
        peer.query('characterWizard:transitionLevel', {
          characterId,
          fromLevel: 3,
          targetLevel: 2,
          selections: saved.selections,
        }),
        /owner/i,
      );
      await assert.rejects(
        director.query('characterWizard:transitionLevel', {
          characterId,
          fromLevel: 3,
          targetLevel: 7,
          selections: saved.selections,
        }),
        /Unsupported/,
      );
      const down = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId,
        fromLevel: 3,
        targetLevel: 2,
        selections: saved.selections,
      });
      assert.ok(down.removed.includes(ledger.witnesses[0]!.abilityDecision));
      const persist = async (level: number, selections: DraftSelection[]) => {
        const current = await director.query<Saved>('characters:get', { characterId });
        await director.mutation('characters:save', {
          commandId: commandId(),
          characterId,
          expectedRevision: current.revision,
          targetLevel: level,
          authored: current.authored,
          selections,
        });
        return director.query<Saved>('characters:get', { characterId });
      };
      saved = await persist(2, down.selections);
      assert.equal(saved.level, 2);
      assert.equal(saved.evaluation.baseline?.staminaMaximum.value, 27);
      assert.ok(!saved.selections.some(s => s.decisionId.startsWith('class.shadow.level-3.')));
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
      assert.ok(!draftSheet.abilities.some(a => a.name === 'Dancer'));
      // Draft level edits never replace the admitted effective build without submission.
      const effective = await director.query<HeroSheet>('characters:sheet', { characterId });
      assert.equal(effective.build?.baseline?.level.value, 3);
      assert.ok(effective.abilities.some(a => a.name === 'Dancer'));

      // Source: Elementalist Basics permits 2,1,1,-1 in non-Reason scores. Swap fixture M/A.
      // A-1 is below Shadow's weak0/average1/strong2 in every possible random tier.
      const { definitions: targetDefinitions } = await director.query<{
        definitions: DecisionDefinitions;
      }>('characterWizard:discover', { targetLevel: 1 });
      const conditionTarget = await director.mutation<string>('characters:create', {
        commandId: commandId(),
        targetLevel: 1,
        authored: {
          name: `V98 condition target ${runId}`,
          appearance: '',
          biography: '',
          notes: '',
        },
        selections: draftSelectionsFrom(
          {
            ...targetFixture.selections,
            'class.elementalist.array-assignment': {
              Might: 1,
              Agility: -1,
              Intuition: 2,
              Presence: 1,
            },
          },
          targetDefinitions,
        ),
      });
      await director.mutation('characters:submit', {
        commandId: commandId(),
        campaignId,
        characterId: conditionTarget,
      });
      const targetSheet = await director.query<HeroSheet>('characters:sheet', {
        characterId: conditionTarget,
      });
      assert.equal(targetSheet.build?.baseline?.characteristics.A.value, -1);
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: commandId(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (id: string, operation: string, args: Record<string, unknown> = {}) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: commandId(),
          operation,
          actor: { refKind: 'character', id },
          arguments: args,
        });
      const event = async (eventId: string) =>
        (
          await director.query<{
            events: {
              id: string;
              kind: string;
              payload?: {
                data?: {
                  manual?: boolean;
                  ability?: { name?: string };
                  result?: AbilityRollResult;
                };
              };
            }[];
          }>('events:list', { campaignId })
        ).events.find(e => e.id === eventId);
      try {
        for (const operation of ['combat.start', 'combat.commit'])
          await director.mutation('commands:invoke', {
            campaignId,
            commandId: commandId(),
            operation,
            arguments: {},
          });
        const target = { refKind: 'character', id: ids[0]! };
        for (const [index, witness] of ledger.witnesses.entries()) {
          const id = ids[index]!;
          await invoke(id, 'adjust.heroic-resource', { value: 7 });
          const beforeTarget = await director.query<Saved>('characters:get', {
            characterId: target.id,
          });
          const used = await invoke(id, 'ability.use', {
            ability: witness.newAbility,
            targets: [target],
          });
          const persisted = await event(used.eventId);
          const afterTarget = await director.query<Saved>('characters:get', {
            characterId: target.id,
          });
          assert.equal(
            (await director.query<Saved>('characters:get', { characterId: id })).liveState
              ?.heroicResource.current,
            0,
          );
          if (witness.damageByTier) {
            assert.equal(persisted?.kind, 'ability.use');
            const roll = persisted?.payload?.data?.result;
            assert.ok(roll);
            const outcome = roll.targets[0]!;
            const damage = witness.damageByTier[outcome.tier - 1]!;
            assert.equal(outcome.damage?.rolledDamage, damage);
            assert.equal(afterTarget.liveState?.stamina, beforeTarget.liveState!.stamina - damage);
            if (witness.newAbility === 'Pinning Shot') {
              // Target A2 is never < weak0/average1/strong2. The persisted condition event must resist.
              const log = await director.query<{
                events: {
                  kind: string;
                  payload?: { sourceUseEventId?: string; status?: string; condition?: string };
                }[];
              }>('events:list', { campaignId });
              const condition = log.events.find(
                e => e.kind === 'condition.potency' && e.payload?.sourceUseEventId === used.eventId,
              );
              assert.equal(condition?.payload?.condition, 'restrained');
              assert.equal(condition?.payload?.status, 'resisted');
            } else {
              assert.match(
                JSON.stringify([outcome.unresolvedClauses, roll.manualResolutions]),
                witness.newAbility === 'Misdirecting Strike' ? /taunted/ : /slowed|can't stand/,
              );
            }
          } else {
            assert.equal(persisted?.kind, 'ability.recorded');
            assert.equal(persisted?.payload?.data?.manual, true);
            assert.equal(afterTarget.liveState?.stamina, beforeTarget.liveState?.stamina);
          }
          const blocked = await invoke(id, 'ability.use', {
            ability: witness.newAbility,
            targets: [target],
          });
          assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked');
        }
        // R2: prove Pinning Shot's applied writes, not only the resisted outcome above.
        const pinner = ids[1]!;
        await invoke(pinner, 'adjust.heroic-resource', { value: 7 });
        const beforePinned = await director.query<Saved>('characters:get', {
          characterId: conditionTarget,
        });
        const pinned = await invoke(pinner, 'ability.use', {
          ability: 'Pinning Shot',
          targets: [{ refKind: 'character', id: conditionTarget }],
        });
        const pinnedEvent = await event(pinned.eventId);
        assert.equal(pinnedEvent?.kind, 'ability.use');
        const pinRoll = pinnedEvent?.payload?.data?.result;
        assert.ok(pinRoll);
        const pinDamage = [10, 14, 22][pinRoll.targets[0]!.tier - 1]!;
        const pinnedState = await director.query<Saved>('characters:get', {
          characterId: conditionTarget,
        });
        assert.equal(pinnedState.liveState?.stamina, beforePinned.liveState!.stamina - pinDamage);
        assert.equal(pinnedState.liveState?.conditions?.restrained, true);
        const instance = pinnedState.liveState?.conditionInstances?.find(
          i => i.sourceUseEventId === pinned.eventId && i.status === 'active',
        );
        assert.ok(instance);
        assert.equal(instance.abilityName, 'Pinning Shot');
        assert.equal(instance.condition, 'restrained');
        assert.equal(instance.duration, 'save-ends');
        assert.ok(instance.registrationId, 'Committed combat must register the automatic save');
        assert.equal(
          (await director.query<Saved>('characters:get', { characterId: pinner })).liveState
            ?.heroicResource.current,
          0,
        );
        // Free maneuvers/embedded actions keep their source timing and do not spend the restricted surge.
        for (const name of ['Careful Observation', 'Dancer: Disengage']) {
          const id = ids[0]!;
          const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
          const action = sheet.abilities.find(a => a.name === name);
          assert.ok(action);
          if (name === 'Dancer: Disengage')
            assert.match(action.activationCondition ?? '', /after using Dancer.*encounter ends/);
          const before = await director.query<Saved>('characters:get', { characterId: id });
          const used = await invoke(id, 'ability.use', { ability: name, targets: [target] });
          const persisted = await event(used.eventId);
          assert.equal(persisted?.kind, 'ability.recorded');
          assert.equal(persisted?.payload?.data?.manual, true);
          assert.equal(persisted?.payload?.data?.ability?.name, name);
          const after = await director.query<Saved>('characters:get', { characterId: id });
          assert.deepEqual(after.liveState, before.liveState);
        }
        const nonDancer = await director.query<HeroSheet>('characters:sheet', {
          characterId: ids[1]!,
        });
        assert.ok(!nonDancer.abilities.some(a => a.name === 'Dancer: Disengage'));
      } finally {
        const session = await director.query<{ revision: number }>('sessions:get', { sessionId });
        await director.mutation('sessions:transition', {
          sessionId,
          expectedRevision: session.revision,
          action: 'close',
          voidMode: 'keep',
          commandId: commandId(),
        });
      }
    },
  );
}
