// SPDX-License-Identifier: GPL-3.0-only
// V95 account operations. These tests protect user-visible profile/session behavior and the
// confirmed deletion lifecycle in docs/accounts-and-access-spec.md#campaign-and-account-deletion.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components, internal } from '../../convex/_generated/api';
import { account, admit, admitHero, backend, table } from './fixtures/table';
import { PORTRAIT_UPLOAD_TTL_MS } from '../../convex/account';
import { PURGE_BUDGET } from '../../convex/lib/accountDeletion';

const modules = import.meta.glob('../../convex/**/*.ts');
const site = 'https://salient.example.test';
const password = 'Account-password-42';

function authBackend() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  return t;
}

function post(
  t: ReturnType<typeof authBackend>,
  path: string,
  body: unknown,
  cookie?: string,
  userAgent?: string,
) {
  return t.fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: site,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(userAgent ? { 'User-Agent': userAgent } : {}),
    },
    body: JSON.stringify(body),
  });
}

function get(t: ReturnType<typeof authBackend>, path: string, cookie: string) {
  return t.fetch(`/api/auth/${path}`, {
    method: 'GET',
    headers: { Origin: site, Cookie: cookie },
  });
}

beforeEach(() => {
  vi.stubEnv('SITE_URL', site);
  vi.stubEnv('CONVEX_SITE_URL', 'https://example.convex.site');
  vi.stubEnv('SALIENT_AUTH_BASE_URL', 'https://example.convex.site');
  vi.stubEnv('BETTER_AUTH_SECRET', 'only-a-test-secret-at-least-thirty-two-characters');
});
afterEach(() => {
  vi.useRealTimers();
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
    const otherViewer = await account(t, 'Other portrait');
    // convex-test's storage metadata omits contentType. setPortrait deliberately falls back to a
    // HEAD request for that legacy shape; vary this trusted storage response across uploads.
    let contentType = 'image/png';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { headers: { 'Content-Type': contentType } })),
    );
    const firstTicket = await viewer.client.mutation(api.account.portraitUploadUrl, {});
    const first = await t.run(ctx => ctx.storage.store(new Blob(['first'])));
    expect(
      await viewer.client.action(api.account.setPortrait, {
        ticketId: firstTicket.ticketId,
        storageId: first,
      }),
    ).toEqual({ ok: true });
    expect((await viewer.client.query(api.auth.viewer, {}))?.portraitUrl).toEqual(
      expect.any(String),
    );

    const foreignTicket = await otherViewer.client.mutation(api.account.portraitUploadUrl, {});
    expect(
      await otherViewer.client.action(api.account.setPortrait, {
        ticketId: foreignTicket.ticketId,
        storageId: first,
      }),
    ).toEqual({ ok: false, error: 'That upload expired; choose the file again.' });
    expect(await t.run(ctx => ctx.db.system.get(first))).not.toBeNull();
    expect((await viewer.client.query(api.auth.viewer, {}))?.portraitUrl).toEqual(
      expect.any(String),
    );

    contentType = 'image/webp';
    const secondTicket = await viewer.client.mutation(api.account.portraitUploadUrl, {});
    const second = await t.run(ctx => ctx.storage.store(new Blob(['second'])));
    expect(
      await viewer.client.action(api.account.setPortrait, {
        ticketId: secondTicket.ticketId,
        storageId: second,
      }),
    ).toEqual({ ok: true });
    expect(await t.run(ctx => ctx.db.system.get(first))).toBeNull();

    contentType = 'text/plain';
    const rejectedTicket = await viewer.client.mutation(api.account.portraitUploadUrl, {});
    const rejected = await t.run(ctx => ctx.storage.store(new Blob(['not an image'])));
    expect(
      await viewer.client.action(api.account.setPortrait, {
        ticketId: rejectedTicket.ticketId,
        storageId: rejected,
      }),
    ).toEqual({ ok: false, error: 'Choose an image under 2 MB.' });
    expect(await t.run(ctx => ctx.db.system.get(rejected))).toBeNull();

    contentType = 'image/png';
    const oversizedTicket = await viewer.client.mutation(api.account.portraitUploadUrl, {});
    const oversized = await t.run(ctx =>
      ctx.storage.store(new Blob([new Uint8Array(2 * 1024 * 1024 + 1)])),
    );
    expect(
      await viewer.client.action(api.account.setPortrait, {
        ticketId: oversizedTicket.ticketId,
        storageId: oversized,
      }),
    ).toEqual({ ok: false, error: 'Choose an image under 2 MB.' });
    expect(await t.run(ctx => ctx.db.system.get(oversized))).toBeNull();

    await viewer.client.mutation(api.account.portraitUploadUrl, {});
    const orphan = await t.run(ctx => ctx.storage.store(new Blob(['never claimed'])));
    await t.mutation(internal.account.cleanupPortraitUploads, {
      before: Date.now() + PORTRAIT_UPLOAD_TTL_MS * 2,
      cursor: null,
    });
    expect(await t.run(ctx => ctx.db.system.get(orphan))).toBeNull();
    expect(await t.run(ctx => ctx.db.system.get(second))).not.toBeNull();
    await viewer.client.mutation(api.account.clearPortrait, {});
    expect(await t.run(ctx => ctx.db.system.get(second))).toBeNull();
    expect((await t.run(ctx => ctx.db.get(viewer.profile.userId)))?.portraitId).toBeUndefined();
  });

  test('Better Auth lists every active device and revokes one or every other session', async () => {
    const t = authBackend();
    const signup = await post(t, 'sign-up/email', {
      email: 'devices@example.test',
      password,
      name: 'Devices',
    });
    const cookie = signup.headers.getSetCookie()[0]!.split(';', 1)[0]!;
    const second = await post(
      t,
      'sign-in/email',
      { email: 'devices@example.test', password },
      undefined,
      'Second device',
    );
    const secondCookie = second.headers.getSetCookie()[0]!.split(';', 1)[0]!;
    const listed = await get(t, 'list-sessions', cookie);
    expect(listed.status).toBe(200);
    const sessions = (await listed.json()) as Array<{ token: string; userAgent?: string }>;
    expect(sessions).toHaveLength(2);
    const other = sessions.find(session => session.userAgent === 'Second device')!;
    expect((await post(t, 'revoke-session', { token: other.token }, cookie)).status).toBe(200);
    expect((await get(t, 'get-session', secondCookie)).status).toBe(200);
    expect(await (await get(t, 'get-session', secondCookie)).json()).toBeNull();

    await post(
      t,
      'sign-in/email',
      { email: 'devices@example.test', password },
      undefined,
      'Third device',
    );
    expect((await post(t, 'revoke-other-sessions', {}, cookie)).status).toBe(200);
    expect(await (await get(t, 'list-sessions', cookie)).json()).toHaveLength(1);
  });

  test('device pagination and bounded revoke cover more than Better Auth’s 100-row default', async () => {
    const t = backend();
    const viewer = await account(t, 'Many devices');
    const profile = (await t.run(ctx => ctx.db.get(viewer.profile.userId)))!;
    for (let index = 0; index < 101; index++)
      await t.mutation(components.betterAuth.adapter.create, {
        input: {
          model: 'session',
          data: {
            userId: profile.authId,
            token: `extra-device-${index}`,
            userAgent: `Extra device ${index}`,
            expiresAt: Date.now() + 3_600_000,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      });

    let cursor: string | null = null;
    let done = false;
    const listed: Array<{ current: boolean }> = [];
    while (!done) {
      const page: {
        page: Array<{ current: boolean }>;
        continueCursor: string;
        isDone: boolean;
      } = await viewer.client.query(api.account.devicesPage, { cursor });
      listed.push(...page.page);
      cursor = page.continueCursor;
      done = page.isDone;
    }
    expect(listed).toHaveLength(102);
    expect(listed.filter(device => device.current)).toHaveLength(1);

    let removed = 0;
    done = false;
    while (!done) {
      const page = await viewer.client.mutation(api.account.revokeOtherDevices, {});
      removed += page.removed;
      done = page.done;
    }
    expect(removed).toBe(101);
    expect(
      (await viewer.client.query(api.account.devicesPage, { cursor: null })).page,
    ).toHaveLength(1);
  });

  test('a purge beyond one transaction budget resumes until the profile is gone', async () => {
    vi.useFakeTimers();
    const t = backend();
    const viewer = await account(t, 'Large account');
    await t.run(async ctx => {
      for (let index = 0; index <= PURGE_BUDGET; index++)
        await ctx.db.insert('commands', {
          userId: viewer.profile.userId,
          commandId: `purge-${index}`,
          fingerprint: `purge-${index}`,
          result: null,
        });
    });
    await t.mutation(internal.account.continuePurge, { userId: viewer.profile.userId });
    expect(await t.run(ctx => ctx.db.get(viewer.profile.userId))).not.toBeNull();
    expect(await t.run(ctx => ctx.db.query('commands').take(2))).toHaveLength(1);
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run(ctx => ctx.db.get(viewer.profile.userId))).toBeNull();
    expect(await t.run(ctx => ctx.db.query('commands').take(1))).toHaveLength(0);
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
