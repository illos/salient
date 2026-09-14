import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const modules = import.meta.glob('../../convex/**/*.ts');
function backend() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  return t;
}
async function account(t: ReturnType<typeof backend>, name: string) {
  const now = Date.now();
  const auth = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name,
        email: `${name}@private.example`,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: auth._id,
        token: `${name}-token`,
        expiresAt: now + 3600000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const client = t.withIdentity({ subject: auth._id, sessionId: session._id });
  const profile = await client.mutation(api.auth.ensureProfile, {});
  return { client, profile, authId: auth._id, sessionId: session._id };
}
async function campaign(t: ReturnType<typeof backend>) {
  const owner = await account(t, 'Director');
  const player = await account(t, 'Player');
  const outsider = await account(t, 'Outsider');
  const campaignId = await owner.client.mutation(api.campaigns.create, {
    name: 'The Salient',
    commandId: 'create-campaign',
  });
  const details = await owner.client.query(api.campaigns.get, { campaignId });
  await player.client.mutation(api.campaigns.requestJoin, {
    shareCode: details.shareCode!,
    commandId: 'join-player',
  });
  const requestId = (await owner.client.query(api.campaigns.get, { campaignId }))
    .pendingRequests[0]!.id;
  await owner.client.mutation(api.campaigns.approveRequest, {
    requestId,
    commandId: 'approve-player',
  });
  return { owner, player, outsider, campaignId };
}
/** Development fixture: a committed encounter run on the session, the record that replaced combatActive. */
async function commitEncounter(
  t: ReturnType<typeof backend>,
  campaignId: Id<'campaigns'>,
  sessionId: Id<'sessions'>,
) {
  return t.run(async ctx => {
    const encounterId = await ctx.db.insert('encounters', {
      campaignId,
      sessionId,
      status: 'committed',
      precombatSnapshotId: null,
      createdAt: Date.now(),
      archivedAt: null,
    });
    await ctx.db.patch(sessionId, { encounterId });
    return encounterId;
  });
}

describe('authenticated campaign and session operations', () => {
  test('verified sessions map to stable profiles and anonymous/expired sessions cannot operate', async () => {
    const t = backend();
    expect(await t.query(api.auth.viewer, {})).toBeNull();
    await expect(
      t.mutation(api.campaigns.create, { name: 'Forbidden', commandId: 'anonymous-create' }),
    ).rejects.toThrow('Sign in');
    const user = await account(t, 'Player');
    expect(await user.client.mutation(api.auth.ensureProfile, {})).toEqual(user.profile);
    expect(await user.client.query(api.auth.viewer, {})).toEqual(user.profile);
    const expired = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'session',
        data: {
          userId: user.authId,
          token: 'expired-token',
          expiresAt: Date.now() - 1,
          createdAt: 0,
          updatedAt: 0,
        },
      },
    });
    const denied = t.withIdentity({ subject: user.authId, sessionId: expired._id });
    expect(await denied.query(api.auth.viewer, {})).toBeNull();
    await expect(denied.query(api.campaigns.list, {})).rejects.toThrow('Sign in');
  });
  test('code possession gives preview only, rotation preserves requests, owner approval is atomic and idempotent', async () => {
    const t = backend();
    const owner = await account(t, 'Director');
    const applicant = await account(t, 'Applicant');
    const args = { name: 'Campaign', commandId: 'create-unique' };
    const campaignId = await owner.client.mutation(api.campaigns.create, args);
    expect(await owner.client.mutation(api.campaigns.create, args)).toEqual(campaignId);
    await expect(
      owner.client.mutation(api.campaigns.create, { ...args, name: 'Changed' }),
    ).rejects.toThrow('different request');
    const original = await owner.client.query(api.campaigns.get, { campaignId });
    const preview = await t.query(api.campaigns.preview, { shareCode: original.shareCode! });
    expect(preview).toEqual({ id: campaignId, name: 'Campaign', ownerName: 'Director' });
    expect(JSON.stringify(preview)).not.toContain('private.example');
    await expect(applicant.client.query(api.campaigns.get, { campaignId })).rejects.toThrow(
      'unavailable',
    );
    await expect(applicant.client.query(api.events.list, { campaignId })).rejects.toThrow(
      'unavailable',
    );
    const joinArgs = { shareCode: original.shareCode!, commandId: 'join-command' };
    await applicant.client.mutation(api.campaigns.requestJoin, joinArgs);
    await applicant.client.mutation(api.campaigns.requestJoin, {
      ...joinArgs,
      commandId: 'join-command-two',
    });
    const pending = (await owner.client.query(api.campaigns.get, { campaignId })).pendingRequests;
    expect(pending).toHaveLength(1);
    const requestId = pending[0]!.id;
    await expect(
      applicant.client.mutation(api.campaigns.approveRequest, {
        requestId,
        commandId: 'self-approve',
      }),
    ).rejects.toThrow();
    await owner.client.mutation(api.campaigns.regenerateShareCode, {
      campaignId,
      commandId: 'rotate-code',
    });
    expect(await t.query(api.campaigns.preview, { shareCode: original.shareCode! })).toBeNull();
    const approval = { requestId, commandId: 'approve-command' };
    await owner.client.mutation(api.campaigns.approveRequest, approval);
    await owner.client.mutation(api.campaigns.approveRequest, approval);
    await owner.client.mutation(api.campaigns.approveRequest, {
      ...approval,
      commandId: 'approve-again',
    });
    const joined = await applicant.client.query(api.campaigns.get, { campaignId });
    expect(joined.members).toHaveLength(2);
    expect(joined.shareCode).toBeNull();
    expect(joined.pendingRequests).toEqual([]);
    expect(JSON.stringify(joined)).not.toContain('private.example');
    const log = await applicant.client.query(api.events.list, { campaignId });
    expect(log.events.map(e => e.kind)).toEqual(['membership.approved', 'campaign.created']);
  });
  test('only Director controls sessions, lifecycle survives reads, stale transitions fail and closure is permanent', async () => {
    const t = backend();
    const { owner, player, outsider, campaignId } = await campaign(t);
    const start = {
      campaignId,
      selectedPlayerIds: [player.profile.userId],
      commandId: 'session-start',
    };
    await expect(player.client.mutation(api.sessions.start, start)).rejects.toThrow('owner');
    await expect(
      owner.client.mutation(api.sessions.start, {
        ...start,
        selectedPlayerIds: [outsider.profile.userId],
      }),
    ).rejects.toThrow('unavailable');
    const sessionId = await owner.client.mutation(api.sessions.start, start);
    expect(await owner.client.mutation(api.sessions.start, start)).toEqual(sessionId);
    await expect(
      owner.client.mutation(api.sessions.start, { ...start, commandId: 'second-start' }),
    ).rejects.toThrow('already has');
    const pause = {
      sessionId,
      expectedRevision: 0,
      action: 'pause' as const,
      commandId: 'pause-session',
    };
    await expect(player.client.mutation(api.sessions.transition, pause)).rejects.toThrow('owner');
    await owner.client.mutation(api.sessions.transition, pause);
    await owner.client.mutation(api.sessions.transition, pause);
    expect((await player.client.query(api.sessions.get, { sessionId })).status).toBe('paused');
    await expect(outsider.client.query(api.sessions.get, { sessionId })).rejects.toThrow(
      'unavailable',
    );
    await expect(
      owner.client.mutation(api.sessions.transition, {
        ...pause,
        action: 'resume',
        commandId: 'stale-resume',
      }),
    ).rejects.toThrow('changed');
    await owner.client.mutation(api.sessions.setPlayers, {
      sessionId,
      expectedRevision: 1,
      selectedPlayerIds: [owner.profile.userId],
      commandId: 'select-during-pause',
    });
    await owner.client.mutation(api.sessions.transition, {
      sessionId,
      expectedRevision: 2,
      action: 'resume',
      commandId: 'resume-session',
    });
    const close = {
      sessionId,
      expectedRevision: 3,
      action: 'close' as const,
      commandId: 'close-session',
    };
    await owner.client.mutation(api.sessions.transition, close);
    await owner.client.mutation(api.sessions.transition, close);
    const closed = await player.client.query(api.sessions.get, { sessionId });
    expect(closed).toMatchObject({
      status: 'closed',
      revision: 4,
      selectedPlayerIds: [owner.profile.userId],
    });
    expect(
      (await owner.client.query(api.campaigns.get, { campaignId })).activeSessionId,
    ).toBeNull();
    await expect(
      owner.client.mutation(api.sessions.transition, {
        sessionId,
        expectedRevision: 4,
        action: 'resume',
        commandId: 'reopen-session',
      }),
    ).rejects.toThrow('read-only');
    await expect(
      owner.client.mutation(api.sessions.setPlayers, {
        sessionId,
        expectedRevision: 4,
        selectedPlayerIds: [],
        commandId: 'edit-closed-players',
      }),
    ).rejects.toThrow('read-only');
    const log = await player.client.query(api.events.list, { campaignId, sessionId });
    expect(log.events.map(e => e.kind)).toEqual([
      'session.closed',
      'session.running',
      'session.players',
      'session.paused',
      'session.started',
    ]);
    await owner.client.mutation(api.sessions.start, { ...start, commandId: 'new-session' });
    expect(await player.client.query(api.events.list, { campaignId, sessionId })).toEqual(log);
  });
  test('combat preserves pause but locks players and requires an explicit future closure contract', async () => {
    const t = backend();
    const { owner, player, campaignId } = await campaign(t);
    const sessionId = await owner.client.mutation(api.sessions.start, {
      campaignId,
      selectedPlayerIds: [player.profile.userId],
      commandId: 'combat-start-fixture',
    });
    const encounterId = await commitEncounter(t, campaignId, sessionId);
    await owner.client.mutation(api.sessions.transition, {
      sessionId,
      expectedRevision: 0,
      action: 'pause',
      commandId: 'combat-pause',
    });
    await expect(
      owner.client.mutation(api.sessions.setPlayers, {
        sessionId,
        expectedRevision: 1,
        selectedPlayerIds: [],
        commandId: 'combat-change',
      }),
    ).rejects.toThrow('locks');
    await expect(
      owner.client.mutation(api.sessions.transition, {
        sessionId,
        expectedRevision: 1,
        action: 'close',
        commandId: 'combat-close',
      }),
    ).rejects.toThrow('void keep/reset');
    expect((await owner.client.query(api.sessions.get, { sessionId })).encounter).toEqual({
      id: encounterId,
      status: 'committed',
    });
    // A draft (uncommitted setup) or an archived run does not lock the roster or block closure.
    for (const status of ['draft', 'closed-out', 'voided'] as const) {
      await t.run(ctx =>
        ctx.db.patch(encounterId, {
          status,
          archivedAt: status === 'draft' ? null : Date.now(),
        }),
      );
      const session = await owner.client.query(api.sessions.get, { sessionId });
      expect(session.encounter).toEqual(status === 'draft' ? { id: encounterId, status } : null);
      await owner.client.mutation(api.sessions.setPlayers, {
        sessionId,
        expectedRevision: session.revision,
        selectedPlayerIds: [],
        commandId: `unlocked-change-${status}`,
      });
    }
  });
  test('withdrawn and declined requests cannot later be approved; a new request has a new identity', async () => {
    const t = backend();
    const owner = await account(t, 'Director');
    const player = await account(t, 'Player');
    const campaignId = await owner.client.mutation(api.campaigns.create, {
      name: 'Campaign',
      commandId: 'create-request-test',
    });
    const shareCode = (await owner.client.query(api.campaigns.get, { campaignId })).shareCode!;
    await player.client.mutation(api.campaigns.requestJoin, {
      shareCode,
      commandId: 'join-request-test',
    });
    const first = (await player.client.query(api.campaigns.myRequests, {}))[0]!;
    await player.client.mutation(api.campaigns.withdrawRequest, {
      requestId: first.id,
      commandId: 'withdraw-request-test',
    });
    await expect(
      owner.client.mutation(api.campaigns.approveRequest, {
        requestId: first.id,
        commandId: 'stale-approval-one',
      }),
    ).rejects.toThrow('no longer pending');
    await player.client.mutation(api.campaigns.requestJoin, {
      shareCode,
      commandId: 'rejoin-request-test',
    });
    const second = (await player.client.query(api.campaigns.myRequests, {}))[0]!;
    expect(second.id).not.toBe(first.id);
    await owner.client.mutation(api.campaigns.declineRequest, {
      requestId: second.id,
      commandId: 'decline-request-test',
    });
    await expect(
      owner.client.mutation(api.campaigns.approveRequest, {
        requestId: second.id,
        commandId: 'stale-approval-two',
      }),
    ).rejects.toThrow('no longer pending');
  });
  test('history uses bounded stable pages and current membership, including past sessions', async () => {
    const t = backend();
    const { owner, player, outsider, campaignId } = await campaign(t);
    await t.run(async ctx => {
      for (let sequence = 3; sequence <= 63; sequence++)
        await ctx.db.insert('events', {
          campaignId,
          sessionId: null,
          encounterId: null,
          sequence,
          origin: 'user',
          actorId: owner.profile.userId,
          actorName: 'Director',
          commandId: `fixture-${sequence}`,
          causeEventId: null,
          disposition: 'applied',
          kind: 'fixture',
          description: `Event ${sequence}`,
          createdAt: sequence,
        });
      await ctx.db.patch(campaignId, { eventSequence: 63 });
    });
    const first = await player.client.query(api.events.list, { campaignId });
    expect(first.events).toHaveLength(50);
    const second = await player.client.query(api.events.list, {
      campaignId,
      before: first.nextBefore!,
    });
    expect(second.events).toHaveLength(13);
    expect(second.nextBefore).toBeNull();
    expect(new Set([...first.events, ...second.events].map(e => e.id)).size).toBe(63);
    const other = await outsider.client.mutation(api.campaigns.create, {
      name: 'Other',
      commandId: 'other-campaign',
    });
    const otherSession = await outsider.client.mutation(api.sessions.start, {
      campaignId: other,
      selectedPlayerIds: [],
      commandId: 'other-session',
    });
    await expect(
      player.client.query(api.events.list, { campaignId, sessionId: otherSession }),
    ).rejects.toThrow('unavailable');
    await t.run(async ctx => {
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_campaign_user', q =>
          q.eq('campaignId', campaignId).eq('userId', player.profile.userId),
        )
        .unique();
      await ctx.db.delete(membership!._id);
    });
    await expect(player.client.query(api.events.list, { campaignId })).rejects.toThrow(
      'unavailable',
    );
  });
});
