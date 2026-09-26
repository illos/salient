// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { selectedFoes, foeDiscoveryReport } from '../foe-discovery-report.ts';
import type { ScenarioContext } from './character-client.ts';
type Ability = {
  id: string;
  name: string;
  manualFeature: boolean;
  text: string | null;
  actionType: string | null;
};
type Row = { id: string; name: string; stamina?: number };
type Result = { eventId: string; dice?: unknown; manualDispositions: { clause: string }[] };
export async function runFoeDiscovery({
  actors: { director, player },
  run,
  runId,
}: ScenarioContext) {
  await run('V212 selected foe discovery and source-only manual operation', async () => {
    const cid = () => crypto.randomUUID();
    const report = foeDiscoveryReport();
    assert.equal(report.namedRecords, 189);
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Foe discovery ${runId}`,
    });
    const campaign = await director.query<{ shareCode: string }>('campaigns:get', { campaignId });
    await player.mutation('campaigns:requestJoin', {
      commandId: cid(),
      shareCode: campaign.shareCode,
    });
    const pending = await director.query<{ pendingRequests: { id: string }[] }>('campaigns:get', {
      campaignId,
    });
    await director.mutation('campaigns:approveRequest', {
      commandId: cid(),
      requestId: pending.pendingRequests[0]!.id,
    });
    const playerProfile = await player.query<{ userId: string }>('auth:viewer', {});
    const sessionId = await director.mutation<string>('sessions:start', {
      commandId: cid(),
      campaignId,
      selectedPlayerIds: [playerProfile.userId],
      title: `Foe discovery ${runId}`,
    });
    let dragon = '';
    for (const source of selectedFoes) {
      const before = new Set(
        (await director.query<{ rows: Row[] }>('foes:list', { campaignId })).rows.map(r => r.id),
      );
      await director.mutation('commands:submit', {
        campaignId,
        commandId: cid(),
        text: `/${source.structured.organization === 'Minion' ? 'squad' : 'foe'} add definition="${source.id}"${source.structured.organization === 'Minion' ? ' count=1' : ''}`,
      });
      const added = (
        await director.query<{ rows: Row[] }>('foes:list', { campaignId })
      ).rows.filter(r => !before.has(r.id));
      assert.equal(added.length, 1, 'Each source loads one persisted actor');
      const actor = { kind: 'foe', id: added[0]!.id, name: added[0]!.name };
      const sheet = await director.query<{ abilities: Ability[] }>('abilities:sheet', {
        campaignId,
        actor,
      });
      // Expected inventory comes directly from printed structured sources, not runtime discovery.
      for (const feature of source.features ?? []) {
        if (
          !feature ||
          typeof feature !== 'object' ||
          Array.isArray(feature) ||
          typeof feature.name !== 'string'
        )
          continue;
        assert.ok(
          sheet.abilities.some(a => a.name === feature.name),
          `${source.name}: ${feature.name}`,
        );
      }
      assert.ok(
        sheet.abilities.some(a => a.name === 'Free Strike'),
        'Creature free strike remains available',
      );
      assert.deepEqual(
        (await player.query<{ abilities: Ability[] }>('abilities:sheet', { campaignId, actor }))
          .abilities,
        [],
      );
      if (source.name === 'Thorn Dragon') dragon = actor.id;
    }
    assert.ok(dragon);
    const actor = { kind: 'foe', id: dragon, name: 'Thorn Dragon' };
    const sheet = await director.query<{ abilities: Ability[] }>('abilities:sheet', {
      campaignId,
      actor,
    });
    for (const name of [
      'Provoking Nettles',
      'Withering Wyrmscale Aura',
      'End Effect',
      'Cage of Thorns',
      "Thorn Dragon's Domain",
    ])
      assert.ok(sheet.abilities.some(a => a.name === name && a.manualFeature));
    const nettles = sheet.abilities.find(a => a.name === 'Provoking Nettles')!;
    assert.equal(nettles.actionType, null);
    const args = {
      campaignId,
      commandId: cid(),
      operation: 'ability.use',
      actor,
      arguments: { ability: nettles.id },
    };
    await assert.rejects(player.mutation('commands:invoke', { ...args, commandId: cid() }));
    const before = await director.query('foes:list', { campaignId });
    const used = await director.mutation<{ eventId: string }>('commands:invoke', args);
    assert.equal(
      (await director.mutation<{ eventId: string }>('commands:invoke', args)).eventId,
      used.eventId,
    );
    assert.deepEqual(await director.query('foes:list', { campaignId }), before);
    const events = await player.query<{
      events: {
        id: string;
        payload: {
          data?: { feature?: { clauses: { text: string }[] }; source?: { text: string } };
        };
      }[];
    }>('events:list', { campaignId });
    const event = events.events.find(e => e.id === used.eventId)!;
    assert.ok(event);
    assert.ok(event.payload.data?.source?.text.includes('Once per turn'));
    assert.ok(!JSON.stringify(event).includes('Withering Wyrmscale Aura'));
    const clause = event.payload.data!.feature!.clauses[0]!.text;
    await director.mutation('commands:invoke', {
      campaignId,
      commandId: cid(),
      operation: 'ability.resolved',
      arguments: { event: used.eventId, clause, note: 'resolved at table' },
    });
    const results = await director.query<Result[]>('abilities:results', {
      campaignId,
      eventIds: [used.eventId],
    });
    assert.equal(results[0]!.manualDispositions.length, 1);
    assert.equal(results[0]!.dice, undefined);
    assert.deepEqual(await director.query('foes:list', { campaignId }), before);
    const history = (operation: string) =>
      director.mutation('commands:invoke', {
        campaignId,
        commandId: cid(),
        operation,
        arguments: {},
      });
    await history('history.undo');
    const undone = await director.query<Result[]>('abilities:results', {
      campaignId,
      eventIds: [used.eventId],
    });
    assert.equal(undone[0]!.manualDispositions.length, 0);
    await history('history.redo');
    const redone = await director.query<Result[]>('abilities:results', {
      campaignId,
      eventIds: [used.eventId],
    });
    assert.equal(redone[0]!.manualDispositions.length, 1);
    await director.mutation('sessions:transition', {
      sessionId,
      commandId: cid(),
      expectedRevision: 0,
      action: 'pause',
    });
    await assert.rejects(director.mutation('commands:invoke', { ...args, commandId: cid() }));
    await director.mutation('sessions:transition', {
      sessionId,
      commandId: cid(),
      expectedRevision: 1,
      action: 'resume',
    });
    await director.mutation('sessions:transition', {
      sessionId,
      commandId: cid(),
      expectedRevision: 2,
      action: 'close',
    });
    await assert.rejects(director.mutation('commands:invoke', { ...args, commandId: cid() }));
  });
}
