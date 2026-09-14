// SPDX-License-Identifier: GPL-3.0-only
// Development fixture for A01 suites: a campaign with a Director (owner), a selected player and an
// observing member, a running session, and a character the player owns attached to the campaign.
// Characters cannot be attached through the API yet (A02); the row is inserted directly.
import { convexTest, type TestConvex } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../../convex/schema';
import { api, components } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

const modules = import.meta.glob('../../../convex/**/*.ts');
export type Backend = TestConvex<typeof schema>;
export function backend(): Backend {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  return t;
}
export async function account(t: Backend, name: string) {
  const now = Date.now();
  const auth = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name,
        email: `${name.toLowerCase()}@private.example`,
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
  return { client, profile, name };
}
export async function admit(
  t: Backend,
  owner: Awaited<ReturnType<typeof account>>,
  member: Awaited<ReturnType<typeof account>>,
  campaignId: Id<'campaigns'>,
) {
  const details = await owner.client.query(api.campaigns.get, { campaignId });
  await member.client.mutation(api.campaigns.requestJoin, {
    shareCode: details.shareCode!,
    commandId: `join-${member.name}`,
  });
  const request = (
    await owner.client.query(api.campaigns.get, { campaignId })
  ).pendingRequests.find(r => r.userId === member.profile.userId)!;
  await owner.client.mutation(api.campaigns.approveRequest, {
    requestId: request.id,
    commandId: `approve-${member.name}`,
  });
}
/** Director, player (selected) and observer (member, not selected) at a running session. */
export async function table(t: Backend, options: { session?: boolean } = {}) {
  const director = await account(t, 'Director');
  const player = await account(t, 'Player');
  const observer = await account(t, 'Observer');
  const campaignId = await director.client.mutation(api.campaigns.create, {
    name: 'The Salient',
    commandId: 'create-campaign',
  });
  await admit(t, director, player, campaignId);
  await admit(t, director, observer, campaignId);
  const sessionId =
    options.session === false
      ? null
      : await director.client.mutation(api.sessions.start, {
          campaignId,
          selectedPlayerIds: [player.profile.userId],
          commandId: 'start-session',
        });
  const thornId = await t.run(ctx =>
    ctx.db.insert('characters', {
      ownerId: player.profile.userId,
      authored: { name: 'Thorn', appearance: '', biography: '', notes: '' },
      revision: 1,
      draftRevisionId: null,
      effectiveRevisionId: null,
      derivedBaseline: null,
      liveState: null,
      campaignId,
      combatLocked: false,
    }),
  );
  return { director, player, observer, campaignId, sessionId, thornId };
}
export async function storedEvents(t: Backend, campaignId: Id<'campaigns'>) {
  return t.run(ctx =>
    ctx.db
      .query('events')
      .withIndex('by_campaign_sequence', q => q.eq('campaignId', campaignId))
      .take(1000),
  );
}
