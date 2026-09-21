// SPDX-License-Identifier: GPL-3.0-only
/** V94 source-ledger readback and explicit manual-action proof through public operations. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';

const ledger = JSON.parse(readFileSync('tests/fixtures/v94-tactician-expected.json', 'utf8')) as {
  witnesses: {
    id: string;
    selections: EvaluationInput['selections'];
    expected: {
      staminaMaximum: number;
      recoveriesMaximum: number;
      recoveryValue: number;
      windedValue: number;
      speed: number;
      stability: number;
      disengage: number;
      kits: string[];
      skills: string[];
      characteristics: Record<string, number>;
      abilities: string[];
      mergedKitBonuses: { meleeDamage: number[]; rangedDamage: number[] };
    };
  }[];
};
type Saved = {
  revision: number;
  authored: { name: string; appearance: string; biography: string; notes: string };
  selections: DraftSelection[];
  evaluation: EvaluationResult;
  liveState: { heroicResource: { name: string; current: number } } | null;
};
const commandId = () => crypto.randomUUID();
export async function runTactician({ actors: { director, peer }, run, runId }: ScenarioContext) {
  await run(
    'Tactician: four source builds, arsenal choices, manual actions and doctrine replacement persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: commandId(),
        name: `Tactician ${runId}`,
      });
      const ids: string[] = [];
      for (const witness of ledger.witnesses) {
        const id = await director.mutation<string>('characters:create', {
          commandId: commandId(),
          authored: { name: `${witness.id} ${runId}`, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(witness.selections, definitions),
        });
        ids.push(id);
        await director.mutation('characters:submit', {
          commandId: commandId(),
          campaignId,
          characterId: id,
        });
        const saved = await director.query<Saved>('characters:get', { characterId: id });
        assert.equal(saved.evaluation.status, 'complete');
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
        const b = sheet.build?.baseline;
        assert.ok(b);
        for (const key of [
          'staminaMaximum',
          'recoveriesMaximum',
          'recoveryValue',
          'windedValue',
          'speed',
          'stability',
          'disengage',
        ] as const)
          assert.equal(b[key].value, witness.expected[key], `${witness.id} ${key}`);
        assert.deepEqual(
          Object.fromEntries(
            Object.entries(b.characteristics).map(([key, value]) => [key, value.value]),
          ),
          witness.expected.characteristics,
        );
        assert.deepEqual(
          b.kits?.map(kit => kit.name.value),
          witness.expected.kits,
        );
        assert.deepEqual(
          b.kit?.meleeDamageBonus.value,
          witness.expected.mergedKitBonuses.meleeDamage,
        );
        assert.deepEqual(
          b.kit?.rangedDamageBonus.value,
          witness.expected.mergedKitBonuses.rangedDamage,
        );
        assert.deepEqual(b.skills.map(s => s.name).sort(), [...witness.expected.skills].sort());
        assert.deepEqual(sheet.live?.heroicResource, { name: 'focus', current: 0 });
        const names = sheet.abilities.map(a => a.name);
        for (const name of [...witness.expected.abilities, 'Mark: Trigger', 'Mark: Retarget'])
          assert.ok(names.includes(name), `${witness.id} ability ${name}`);
        assert.equal(
          names.includes('Studied Commander: Prepare'),
          witness.selections['class.tactician.doctrine'] === 'Mastermind',
        );
        for (const [choice, amount] of [
          ['class.tactician.ability-3', 3],
          ['class.tactician.ability-5', 5],
        ] as const)
          assert.deepEqual(sheet.abilities.find(a => a.name === witness.selections[choice])?.cost, {
            resource: 'focus',
            amount,
          });
      }
      const characterId = ids[1]!; // Mastermind; independent ledger witness 2.
      const actor = { refKind: 'character', id: characterId };
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: commandId(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (operation: string, args: Record<string, unknown> = {}) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: commandId(),
          operation,
          actor,
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
                  source?: { sourcePath?: string };
                };
              };
            }[];
          }>('events:list', { campaignId })
        ).events.find(e => e.id === eventId);
      try {
        const available = await director.query<{
          abilities: { name: string; fixedCost: unknown }[];
        }>('abilities:sheet', {
          campaignId,
          actor: { kind: 'character', id: characterId, name: 'Tactician' },
        });
        assert.deepEqual(available.abilities.find(a => a.name === 'Mark: Trigger')?.fixedCost, {
          resource: 'focus',
          amount: 1,
        });
        await assert.rejects(
          peer.mutation('commands:invoke', {
            campaignId,
            commandId: commandId(),
            operation: 'ability.use',
            actor,
            arguments: { ability: 'Mark: Trigger', targets: [actor] },
          }),
        );
        // Source-timed preparation and retarget are recorded for manual adjudication, not automated.
        for (const name of ['Studied Commander: Prepare', 'Mark: Retarget']) {
          const used = await invoke('ability.use', { ability: name, targets: [actor] });
          const persisted = await event(used.eventId);
          assert.equal(persisted?.kind, 'ability.recorded');
          assert.equal(persisted?.payload?.data?.manual, true);
          assert.equal(persisted?.payload?.data?.ability?.name, name);
        }
        for (const operation of ['combat.start', 'combat.commit'])
          await director.mutation('commands:invoke', {
            campaignId,
            commandId: commandId(),
            operation,
            arguments: {},
          });
        await invoke('adjust.heroic-resource', { value: 1 });
        const used = await invoke('ability.use', { ability: 'Mark: Trigger', targets: [actor] });
        assert.equal((await event(used.eventId))?.kind, 'ability.recorded');
        assert.equal(
          (await event(used.eventId))?.payload?.data?.source?.sourcePath,
          'en/unified/md/feature/ability/tactician/level-1/mark.md',
        );
        assert.equal(
          (await director.query<Saved>('characters:get', { characterId })).liveState?.heroicResource
            .current,
          0,
        );
        const blocked = await invoke('ability.use', { ability: 'Mark: Trigger', targets: [actor] });
        assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked');
        await director.mutation('commands:invoke', {
          campaignId,
          commandId: commandId(),
          operation: 'combat.void',
          arguments: { mode: 'keep' },
        });
        const before = await director.query<Saved>('characters:get', { characterId });
        const doctrine = await director.query<{ selections: DraftSelection[]; removed: string[] }>(
          'characterWizard:transition',
          {
            characterId,
            selections: before.selections,
            decisionId: 'class.tactician.doctrine',
            value: 'Vanguard',
          },
        );
        assert.ok(doctrine.removed.includes('class.tactician.doctrine-skill'));
        const changed = await director.query<{ selections: DraftSelection[] }>(
          'characterWizard:transition',
          {
            characterId,
            selections: doctrine.selections,
            decisionId: 'class.tactician.doctrine-skill',
            value: 'Persuade',
          },
        );
        await director.mutation('characters:save', {
          characterId,
          commandId: commandId(),
          expectedRevision: before.revision,
          authored: before.authored,
          selections: changed.selections,
        });
        const updated = await director.query<HeroSheet>('characters:sheet', {
          characterId,
          view: 'draft',
        });
        assert.equal(updated.build?.status, 'complete');
        const names = updated.abilities.map(a => a.name);
        assert.ok(names.includes('Parry') && !names.includes('Overwatch'));
        assert.ok(!names.includes('Studied Commander: Prepare'));
        assert.deepEqual(
          updated.build?.baseline?.kits?.map(kit => kit.name.value),
          ledger.witnesses[1]!.expected.kits,
        );
        assert.ok(updated.build?.baseline?.skills.some(s => s.name === 'Persuade'));
        assert.ok(!updated.build?.baseline?.skills.some(s => s.name === 'Magic'));
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
