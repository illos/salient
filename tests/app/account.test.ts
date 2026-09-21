// SPDX-License-Identifier: GPL-3.0-only
// V95 account operations. These tests protect user-visible profile/session behavior and the
// confirmed deletion lifecycle in docs/accounts-and-access-spec.md#campaign-and-account-deletion.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components, internal } from '../../convex/_generated/api';
import { account, admit, admitHero, backend, table } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');
const site = 'https://salient.example.test';
const password = 'Account-password-42';

function authBackend() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  return t;
}

function post(t: ReturnType<typeof authBackend>, path: string, body: unknown, cookie?: string) {
  return t.fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: site,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv('SITE_URL', site);
  vi.stubEnv('CONVEX_SITE_URL', 'https://example.convex.site');
  vi.stubEnv('SALIENT_AUTH_BASE_URL', 'https://example.convex.site');
  vi.stubEnv('BETTER_AUTH_SECRET', 'only-a-test-secret-at-least-thirty-two-characters');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('V95 account operations', () => {
  test('display-name changes are validated and immediately project into campaign members', async () => {
    const t = backend();
    const f = await table(t, { session: false });
    await f.director.client.mutation(api.account.updateProfile, {
      displayName: '  New Director  ',
    });
    const stored = await t.run(ctx => ctx.db.get(f.director.profile.userId));
    expect(stored?.displayName).toBe('New Director');
    const campaign = await f.player.client.query(api.campaigns.get, { campaignId: f.campaignId });
    expect(campaign.members.find(m => m.userId === f.director.profile.userId)?.displayName).toBe(
      'New Director',
    );
    await expect(
      f.director.client.mutation(api.account.updateProfile, { displayName: '   ' }),
    ).rejects.toThrow('display name');
    await expect(
      f.director.client.mutation(api.account.updateProfile, { displayName: 'x'.repeat(81) }),
    ).rejects.toThrow('80');
  });

  test('portrait replacement and clearing remove old files; rejected uploads do not linger', async () => {
    const t = backend();
    const viewer = await account(t, 'Portrait');
    // convex-test's storage metadata omits contentType. setPortrait deliberately falls back to a
    // HEAD request for that legacy shape; vary this trusted storage response across uploads.
    let contentType = 'image/png';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { headers: { 'Content-Type': contentType } })),
    );
    const first = await t.run(ctx => ctx.storage.store(new Blob(['first'])));
    expect(await viewer.client.action(api.account.setPortrait, { storageId: first })).toEqual({
      ok: true,
    });
    expect((await viewer.client.query(api.auth.viewer, {}))?.portraitUrl).toEqual(
      expect.any(String),
    );

    contentType = 'image/webp';
    const second = await t.run(ctx => ctx.storage.store(new Blob(['second'])));
    expect(await viewer.client.action(api.account.setPortrait, { storageId: second })).toEqual({
      ok: true,
    });
    expect(await t.run(ctx => ctx.db.system.get(first))).toBeNull();

    contentType = 'text/plain';
    const rejected = await t.run(ctx => ctx.storage.store(new Blob(['not an image'])));
    expect(await viewer.client.action(api.account.setPortrait, { storageId: rejected })).toEqual({
      ok: false,
      error: 'Choose an image under 2 MB.',
    });
    expect(await t.run(ctx => ctx.db.system.get(rejected))).toBeNull();
    await viewer.client.mutation(api.account.clearPortrait, {});
    expect(await t.run(ctx => ctx.db.system.get(second))).toBeNull();
    expect((await t.run(ctx => ctx.db.get(viewer.profile.userId)))?.portraitId).toBeUndefined();
  });

  test('device controls identify the current session and revoke only the viewer’s sessions', async () => {
    const t = backend();
    const viewer = await account(t, 'Devices');
    const profile = (await t.run(ctx => ctx.db.get(viewer.profile.userId)))!;
    const sessions = await t.query(components.betterAuth.adapter.findMany, {
      model: 'session',
      where: [{ field: 'userId', value: profile.authId }],
      paginationOpts: { cursor: null, numItems: 10 },
    });
    const current = sessions.page[0]!;
    const other = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'session',
        data: {
          userId: profile.authId,
          token: 'other-device-token',
          userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140 Safari/537.36',
          expiresAt: Date.now() + 3_600_000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    const listed = await viewer.client.query(api.account.devices, {});
    expect(listed.map(device => [device.id, device.current])).toEqual([
      [current._id, true],
      [other._id, false],
    ]);
    await expect(
      viewer.client.mutation(api.account.revokeDevice, { sessionId: current._id }),
    ).rejects.toThrow('this device');
    await viewer.client.mutation(api.account.revokeDevice, { sessionId: other._id });
    expect(
      await t
        .withIdentity({ subject: profile.authId, sessionId: other._id })
        .query(api.auth.viewer, {}),
    ).toBeNull();

    const third = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'session',
        data: {
          userId: profile.authId,
          token: 'third-device-token',
          expiresAt: Date.now() + 3_600_000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    expect(await viewer.client.mutation(api.account.revokeOtherDevices, {})).toBe(1);
    expect(
      await t
        .withIdentity({ subject: profile.authId, sessionId: third._id })
        .query(api.auth.viewer, {}),
    ).toBeNull();
    expect(await viewer.client.query(api.account.devices, {})).toHaveLength(1);
  });

  test('the app-data purge deletes owned data, detaches other heroes, and preserves snapshots elsewhere', async () => {
    const t = backend();
    const f = await table(t);
    const ownedHero = await admitHero(t, f.director, f.director, f.campaignId, 'OwnedHero');
    const otherOwner = await account(t, 'Other owner');
    const retainedCampaign = await otherOwner.client.mutation(api.campaigns.create, {
      name: 'Retained campaign',
      commandId: 'create-retained',
    });
    await admit(t, otherOwner, f.director, retainedCampaign);
    const crossTableHero = await admitHero(
      t,
      f.director,
      otherOwner,
      retainedCampaign,
      'CrossTableHero',
    );
    await f.director.client.mutation(api.chat.send, {
      campaignId: retainedCampaign,
      text: 'Keep my name.',
      commandId: 'retained-chat',
    });
    const thornRevisionsBefore = await t.run(ctx =>
      ctx.db
        .query('characterRevisions')
        .withIndex('by_character_and_revision', q => q.eq('characterId', f.thornId))
        .collect(),
    );

    await t.mutation(internal.account.continuePurge, { userId: f.director.profile.userId });

    expect(await t.run(ctx => ctx.db.get(f.campaignId))).toBeNull();
    const thorn = await t.run(ctx => ctx.db.get(f.thornId));
    expect(thorn && [thorn.campaignId, thorn.liveState, thorn.combatLocked]).toEqual([
      null,
      null,
      false,
    ]);
    expect(
      await t.run(ctx =>
        ctx.db
          .query('characterRevisions')
          .withIndex('by_character_and_revision', q => q.eq('characterId', f.thornId))
          .collect(),
      ),
    ).toHaveLength(thornRevisionsBefore.length);
    expect(await t.run(ctx => ctx.db.get(ownedHero))).toBeNull();
    expect(await t.run(ctx => ctx.db.get(crossTableHero))).toBeNull();
    expect(await t.run(ctx => ctx.db.get(retainedCampaign))).not.toBeNull();
    expect(
      await t.run(ctx =>
        ctx.db
          .query('memberships')
          .withIndex('by_campaign_user', q =>
            q.eq('campaignId', retainedCampaign).eq('userId', f.director.profile.userId),
          )
          .unique(),
      ),
    ).toBeNull();
    expect(
      await t.run(ctx =>
        ctx.db
          .query('chatMessages')
          .withIndex('by_campaign_created', q => q.eq('campaignId', retainedCampaign))
          .first(),
      ),
    ).toMatchObject({ authorName: 'Director', text: 'Keep my name.' });
    expect(await t.run(ctx => ctx.db.get(f.director.profile.userId))).toBeNull();
  });

  test('the password-confirmed Better Auth route removes the auth user and app-owned campaign', async () => {
    const t = authBackend();
    const signup = await post(t, 'sign-up/email', {
      email: 'delete@example.test',
      password,
      name: 'Delete me',
    });
    expect(signup.status).toBe(200);
    const authUser = (await signup.json()).user;
    let cookie = signup.headers
      .getSetCookie()
      .map(value => value.split(';', 1)[0])
      .join('; ');
    expect(
      (
        await post(t, 'sign-in/email', {
          email: 'delete@example.test',
          password,
        })
      ).status,
    ).toBe(200);
    const sessions = await t.query(components.betterAuth.adapter.findMany, {
      model: 'session',
      where: [{ field: 'userId', value: authUser.id }],
      paginationOpts: { cursor: null, numItems: 10 },
    });
    const client = t.withIdentity({ subject: authUser.id, sessionId: sessions.page[0]!._id });
    const profile = await client.mutation(api.auth.ensureProfile, {});
    const campaignId = await client.mutation(api.campaigns.create, {
      name: 'Delete with account',
      commandId: 'create-delete-route',
    });

    const changedPassword = 'Changed-account-password-84';
    const passwordResponse = await post(
      t,
      'change-password',
      { currentPassword: password, newPassword: changedPassword, revokeOtherSessions: true },
      cookie,
    );
    expect(passwordResponse.status).toBe(200);
    const refreshedCookie = passwordResponse.headers
      .getSetCookie()
      .map(value => value.split(';', 1)[0])
      .filter(value => !value.endsWith('='))
      .join('; ');
    if (refreshedCookie) cookie = refreshedCookie;
    const liveSessions = await t.query(components.betterAuth.adapter.findMany, {
      model: 'session',
      where: [{ field: 'userId', value: authUser.id }],
      paginationOpts: { cursor: null, numItems: 10 },
    });
    expect(liveSessions.page).toHaveLength(1);
    expect(
      (await post(t, 'change-email', { newEmail: 'changed@example.test' }, cookie)).status,
    ).toBe(200);
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'user',
        where: [{ field: '_id', value: authUser.id }],
      }),
    ).toMatchObject({ email: 'changed@example.test' });

    const response = await post(t, 'delete-user', { password: changedPassword }, cookie);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, message: 'User deleted' });
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'user',
        where: [{ field: '_id', value: authUser.id }],
      }),
    ).toBeNull();
    expect(await t.run(ctx => ctx.db.get(profile.userId))).toBeNull();
    expect(await t.run(ctx => ctx.db.get(campaignId))).toBeNull();
  });
});
