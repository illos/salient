// SPDX-License-Identifier: GPL-3.0-only
/** V97 full-build level editing and source-timed actions, through authenticated public operations. */
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
const ledger = JSON.parse(readFileSync('tests/fixtures/v97-shadow-two-expected.json', 'utf8')) as {
  witnesses: {
    id: string;
    abilityDecision: string;
    newAbility: string;
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
type Saved = {
  level: number;
  revision: number;
  authored: { name: string; appearance: string; biography: string; notes: string };
  selections: DraftSelection[];
  evaluation: EvaluationResult;
  liveState: { heroicResource: { current: number }; stamina: number } | null;
};
type Transition = { selections: DraftSelection[]; removed: string[]; evaluation: EvaluationResult };
const commandId = () => crypto.randomUUID();
export async function runShadowLevelTwo({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'Shadow level two: six builds, target-level edits and conditional manual actions persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 2 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: commandId(),
        name: `Shadow 2 ${runId}`,
      });
      const ids: string[] = [];
      for (const [index, witness] of ledger.witnesses.entries()) {
        const characterId = await director.mutation<string>('characters:create', {
          commandId: commandId(),
          targetLevel: 2,
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
        assert.equal(saved.level, 2);
        assert.equal(saved.evaluation.status, 'complete');
        if (index === 0) {
          assert.equal(await director.query('characters:wizardDraft', {}), characterId);
          const resumed = await director.query<{ targetLevel: number }>(
            'characterWizard:discover',
            { characterId },
          );
          assert.equal(resumed.targetLevel, 2);
          await director.mutation('characters:save', {
            commandId: commandId(),
            characterId,
            expectedRevision: saved.revision,
            targetLevel: 2,
            authored: { ...saved.authored, name: `${witness.id} ${runId}` },
            selections: saved.selections,
            list: true,
          });
          saved = await director.query<Saved>('characters:get', { characterId });
          assert.equal(await director.query('characters:wizardDraft', {}), null);
          assert.equal(saved.level, 2);
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
        assert.equal(baseline.level.value, 2);
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
          amount: 5,
        });
        assert.ok(sheet.abilities.find(a => a.name === witness.newAbility)?.content?.text);
      }
      // Lowering a full-edit target revokes later choices; raising it asks again, not a replay of grants.
      const characterId = ids[0]!;
      let saved = await director.query<Saved>('characters:get', { characterId });
      await assert.rejects(
        peer.query('characterWizard:transitionLevel', {
          characterId,
          fromLevel: 2,
          targetLevel: 1,
          selections: saved.selections,
        }),
        /owner/i,
      );
      await assert.rejects(
        director.query('characterWizard:transitionLevel', {
          characterId,
          fromLevel: 2,
          targetLevel: 3,
          selections: saved.selections,
        }),
        /Unsupported/,
      );
      const down = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId,
        fromLevel: 2,
        targetLevel: 1,
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
      saved = await persist(1, down.selections);
      assert.equal(saved.level, 1);
      assert.equal(saved.evaluation.baseline?.staminaMaximum.value, 21);
      assert.ok(!saved.selections.some(s => s.decisionId.startsWith('class.shadow.level-2.')));
      const up = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId,
        fromLevel: 1,
        targetLevel: 2,
        selections: saved.selections,
      });
      saved = await persist(2, up.selections);
      assert.equal(saved.evaluation.status, 'incomplete');
      const college = await director.query<Transition>('characterWizard:transition', {
        characterId,
        targetLevel: 2,
        selections: draftSelectionsFrom(ledger.witnesses[0]!.selections, definitions),
        decisionId: 'class.shadow.college',
        value: 'Caustic Alchemy',
      });
      assert.ok(college.removed.includes(ledger.witnesses[0]!.abilityDecision));
      const replacement = await director.query<Transition>('characterWizard:transition', {
        characterId,
        targetLevel: 2,
        selections: college.selections,
        decisionId: 'class.shadow.level-2.trained-assassin-ability',
        value: 'Sticky Bomb',
      });
      saved = await persist(2, replacement.selections);
      assert.equal(saved.evaluation.status, 'complete');
      assert.ok(saved.evaluation.baseline?.features.some(f => f.name === 'Trained Assassin'));
      assert.ok(!saved.evaluation.baseline?.features.some(f => f.name === 'Burning Ash'));
      // Attached editing remains a draft; level selection does not activate it or bypass review.
      const effective = await director.query<HeroSheet>('characters:sheet', { characterId });
      assert.ok(effective.build?.baseline?.features.some(f => f.name === 'Burning Ash'));

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
        // Sticky Bomb pays at attachment and records full source for delayed/manual detonation.
        const bomber = ids[2]!;
        const target = { refKind: 'character', id: ids[1]! };
        const before = await director.query<Saved>('characters:get', { characterId: ids[1]! });
        await invoke(bomber, 'adjust.heroic-resource', { value: 5 });
        const used = await invoke(bomber, 'ability.use', {
          ability: 'Sticky Bomb',
          targets: [target],
        });
        assert.equal((await event(used.eventId))?.kind, 'ability.recorded');
        assert.equal((await event(used.eventId))?.payload?.data?.manual, true);
        assert.equal(
          (await director.query<Saved>('characters:get', { characterId: bomber })).liveState
            ?.heroicResource.current,
          0,
        );
        assert.deepEqual(
          (await director.query<Saved>('characters:get', { characterId: ids[1]! })).liveState
            ?.stamina,
          before.liveState?.stamina,
        );
        const blocked = await invoke(bomber, 'ability.use', {
          ability: 'Sticky Bomb',
          targets: [target],
        });
        assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked');
        // Source rows: In a Puff of Ash 6/10/14 + A2 + Cloak and Dagger 1;
        // Stink Bomb 2/5/7 poison (no characteristic or kit bonus); Machinations only moves.
        for (const [index, name, damageByTier, manual] of [
          [0, 'In a Puff of Ash', [9, 13, 17], /teleport/i],
          [3, 'Stink Bomb', [2, 5, 7], /gas remains/i],
          [4, 'Machinations of Sound', [0, 0, 0], /slide/i],
        ] as const) {
          const id = ids[index]!;
          await invoke(id, 'adjust.heroic-resource', { value: 5 });
          const beforeTarget = await director.query<Saved>('characters:get', {
            characterId: target.id,
          });
          const result = await invoke(id, 'ability.use', { ability: name, targets: [target] });
          const persisted = await event(result.eventId);
          assert.equal(persisted?.kind, 'ability.use');
          const roll = persisted?.payload?.data?.result;
          assert.ok(roll);
          const outcome = roll.targets[0]!;
          const expectedDamage = damageByTier[outcome.tier - 1]!;
          assert.equal(outcome.damage?.rolledDamage ?? 0, expectedDamage);
          assert.match(JSON.stringify([outcome.unresolvedClauses, roll.manualResolutions]), manual);
          if (name === 'Machinations of Sound')
            assert.match(JSON.stringify(roll.manualResolutions), /Intuition/);
          assert.equal(
            (await director.query<Saved>('characters:get', { characterId: id })).liveState
              ?.heroicResource.current,
            0,
          );
          const afterTarget = await director.query<Saved>('characters:get', {
            characterId: target.id,
          });
          assert.equal(
            afterTarget.liveState?.stamina,
            beforeTarget.liveState!.stamina - expectedDamage,
          );
        }
        for (const id of [ids[1]!, ids[5]!]) {
          const name = id === ids[1] ? 'Too Slow' : 'So Gullible';
          await invoke(id, 'adjust.heroic-resource', { value: 5 });
          const result = await invoke(id, 'ability.use', {
            ability: name,
            targets: [{ refKind: 'character', id }],
          });
          assert.equal((await event(result.eventId))?.kind, 'ability.recorded');
          assert.equal(
            (await director.query<Saved>('characters:get', { characterId: id })).liveState
              ?.heroicResource.current,
            0,
          );
        }
        for (const name of ['Friend!: Join an Effect', 'Friend!: Disengage']) {
          const id = ids[4]!;
          const available = await director.query<{ abilities: { name: string }[] }>(
            'abilities:sheet',
            { campaignId, actor: { kind: 'character', id, name: 'Shadow' } },
          );
          assert.ok(available.abilities.some(a => a.name === name));
          const result = await invoke(id, 'ability.use', {
            ability: name,
            targets: [{ refKind: 'character', id }],
          });
          const persisted = await event(result.eventId);
          assert.equal(persisted?.kind, 'ability.recorded');
          assert.equal(persisted?.payload?.data?.manual, true);
          assert.equal(persisted?.payload?.data?.ability?.name, name);
        }
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
