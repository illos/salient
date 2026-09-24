// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { StartingRewards } from '../../shared/contracts/startingRewards.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import { vendorPath } from '../lib/vendor.ts';
const base = JSON.parse(
  readFileSync(new URL('../../tests/fixtures/v25-fury.json', import.meta.url), 'utf8'),
);
// Printed active operations, independently enumerated from the item source ledger.
const active: Record<string, string[]> = {
  'Color Cloak (Blue)': ['Color Cloak (Blue): Cold Shift'],
  'Color Cloak (Red)': ['Color Cloak (Red): Negate Fire Damage'],
  'Color Cloak (Yellow)': ['Color Cloak (Yellow): Lightning Charge'],
  Deadweight: ['Deadweight: Falling Free Strike'],
  'Displacing Replacement Bracer': ['Displacing Replacement Bracer: Swap Objects'],
  'Divine Vine': ['Divine Vine: Distant Grab', 'Divine Vine: Release Target'],
  'Flameshade Gloves': [
    'Flameshade Gloves: Pass Through Object',
    'Flameshade Gloves: Free Stuck Hand',
  ],
  'Hellcharger Helm': ['Hellcharger Helm: Charge Knockback'],
  'Mask of the Many': ['Mask of the Many: Transform Appearance'],
  'Quantum Satchel': ['Quantum Satchel: Entangle Location', 'Quantum Satchel: Retrieve Object'],
  'Unbinder Boots': ['Unbinder Boots: Airborne Movement'],
  "Authority's End": ["Authority's End: End Imposed Effect"],
  'Blade of the Luxurious Fop': ['Blade of the Luxurious Fop: Shift After Damage'],
  Displacer: ['Displacer: Trade Places'],
  'Icemaker Maul': ['Icemaker Maul: Create Ice Field'],
  'Lance of the Sundered Star': ['Lance of the Sundered Star: Follow the Push'],
  Wetwork: ['Wetwork: Finishing Free Strike'],
};
export async function runStartingItems({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'starting items: every possessed treasure persists and exposes its source actions',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: crypto.randomUUID(),
        name: `Starting items ${runId}`,
      });
      const decisions = definitions.steps.flatMap(step => step.decisions);
      let maskId = '';
      const visited = new Set<string>();
      for (const [complication, decisionId, expectedCount] of [
        ['Amnesia', 'complication.amnesia.trinket', 12],
        ['Cursed Weapon', 'complication.cursed-weapon.weapon', 14],
      ] as const) {
        const options = decisions.find(d => d.id === decisionId)!.options!;
        assert.equal(options.length, expectedCount, 'Core source pool stays bounded');
        for (const option of options) {
          visited.add(option.value);
          const characterId = await director.mutation<string>('characters:create', {
            commandId: crypto.randomUUID(),
            authored: { name: `Item ${option.value}`, appearance: '', biography: '', notes: '' },
            selections: draftSelectionsFrom(
              {
                ...base.selections,
                'complication.choice': complication,
                [decisionId]: option.value,
              },
              definitions,
            ),
          });
          const draft = await director.query<HeroSheet>('characters:sheet', { characterId });
          assert.equal(draft.build?.status, 'complete', `Complete ${option.value} witness`);
          assert.equal(
            draft.abilities.filter(a => a.kind === 'item').length,
            0,
            'Draft item is not a possession',
          );
          await director.mutation('characters:submit', {
            characterId,
            campaignId,
            commandId: crypto.randomUUID(),
          });
          const { rewards } = await director.query<{ rewards: StartingRewards }>(
            'characterRewards:get',
            { characterId },
          );
          assert.deepEqual(
            rewards.items.map(i => [i.name, i.state]),
            [[option.value, 'possessed']],
          );
          const sheet = await director.query<HeroSheet>('characters:sheet', { characterId });
          const grants = sheet.abilities.filter(a => a.kind === 'item');
          assert.deepEqual(
            grants.map(a => a.name),
            active[option.value] ?? [],
            'Possessed item exposes exactly its level-one actions',
          );
          for (const grant of grants) {
            assert.ok(grant.content?.text, 'Item action has readable source');
            assert.ok(
              readFileSync(
                vendorPath(`vendor/steel-compendium/${grant.sourcePath}`),
                'utf8',
              ).includes(grant.content.text),
            );
            assert.ok(grant.metadata.actionType, 'Source timing survives projection');
          }
          if (option.value === 'Mask of the Many') maskId = characterId;
        }
      }
      for (const item of Object.keys(active))
        assert.ok(visited.has(item), `Active source item covered: ${item}`);
      assert.ok(maskId);
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: crypto.randomUUID(),
        campaignId,
        selectedPlayerIds: [],
      });
      const actor = { refKind: 'character', id: maskId };
      const table = await director.query<{ abilities: { name: string; kind: string }[] }>(
        'abilities:sheet',
        { campaignId, actor: { kind: 'character', id: maskId, name: 'Item Mask of the Many' } },
      );
      assert.equal(
        table.abilities.find(a => a.name === active['Mask of the Many']![0])?.kind,
        'recorded',
      );
      const before = await director.query<{ liveState: unknown }>('characters:get', {
        characterId: maskId,
      });
      const args = {
        campaignId,
        operation: 'ability.use',
        actor,
        arguments: { ability: active['Mask of the Many']![0], targets: [actor] },
      };
      await assert.rejects(
        peer.mutation('commands:invoke', { ...args, commandId: crypto.randomUUID() }),
      );
      const used = await director.mutation<{ eventId: string }>('commands:invoke', {
        ...args,
        commandId: crypto.randomUUID(),
      });
      const events = await director.query<{
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
      }>('events:list', { campaignId });
      const event = events.events.find(event => event.id === used.eventId);
      assert.equal(
        event?.kind,
        'ability.recorded',
        'Item invocation succeeds rather than silently blocking',
      );
      assert.equal(event?.payload?.data?.manual, true);
      assert.equal(event?.payload?.data?.ability?.name, active['Mask of the Many']![0]);
      assert.equal(
        event?.payload?.data?.source?.sourcePath,
        'en/unified/md/treasure/1st-echelon/trinket/mask-of-the-many.md',
      );
      assert.deepEqual(
        (await director.query<{ liveState: unknown }>('characters:get', { characterId: maskId }))
          .liveState,
        before.liveState,
        'Manual item use invents no resource or transformation effects',
      );
      const session = await director.query<{ revision: number }>('sessions:get', { sessionId });
      await director.mutation('sessions:transition', {
        sessionId,
        expectedRevision: session.revision,
        action: 'close',
        commandId: crypto.randomUUID(),
      });
    },
  );
}
