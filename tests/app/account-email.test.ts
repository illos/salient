// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components } from '../../convex/_generated/api';
import { deliverPasswordReset } from '../../convex/lib/accountEmail';

const modules = import.meta.glob('../../convex/**/*.ts');
const site = 'https://salient.example.test';
const oldPassword = 'Before-reset-password-42';
const newPassword = 'After-reset-password-84';
function backend() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  return t;
}
function post(t: ReturnType<typeof backend>, path: string, body: unknown, ip = '192.0.2.1') {
  return t.fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: site, 'X-Forwarded-For': ip },
    body: JSON.stringify(body),
  });
}
async function signUp(t: ReturnType<typeof backend>, email = 'recovery@example.test') {
  const response = await post(t, 'sign-up/email', {
    email,
    password: oldPassword,
    name: 'Recovery',
  });
  expect(response.status).toBe(200);
  return response.json();
}
let messages: { to: string; from: string; text: string; html: string }[];
beforeEach(() => {
  vi.stubEnv('SITE_URL', site);
  vi.stubEnv('CONVEX_SITE_URL', 'https://example.convex.site');
  vi.stubEnv('BETTER_AUTH_SECRET', 'only-a-test-secret-at-least-thirty-two-characters');
  vi.stubEnv('CLOUDFLARE_EMAIL_API_TOKEN', 'test-email-token');
  vi.stubEnv('SALIENT_AUTH_BASE_URL', 'https://example.convex.site');
  messages = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      const message = JSON.parse(String(init.body));
      messages.push(message);
      return Response.json({
        success: true,
        result: { delivered: [], queued: [message.to], permanent_bounces: [] },
      });
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Better Auth recovery with Cloudflare mail', () => {
  test('real routes queue canonical mail, reset persisted credentials, revoke sessions and refuse reuse', async () => {
    const t = backend();
    const signup = await signUp(t);
    const login = await post(t, 'sign-in/email', {
      email: 'recovery@example.test',
      password: oldPassword,
    });
    expect(login.status).toBe(200);
    const before = await t.query(components.betterAuth.adapter.findMany, {
      model: 'session',
      paginationOpts: { cursor: null, numItems: 10 },
    });
    expect(before.page.length).toBe(2);
    const oldClient = t.withIdentity({ subject: signup.user.id, sessionId: before.page[0]!._id });
    const profile = await oldClient.mutation(api.auth.ensureProfile, {});
    expect(await oldClient.query(api.auth.viewer, {})).toEqual(profile);
    const reset = await post(t, 'request-password-reset', {
      email: 'recovery@example.test',
      redirectTo: site + '/reset-password',
    });
    expect(reset.status).toBe(200);
    const unknown = await post(t, 'request-password-reset', {
      email: 'missing@example.test',
      redirectTo: site + '/reset-password',
    });
    expect(await unknown.json()).toEqual(await reset.json());
    await t.finishAllScheduledFunctions(() => {});
    expect(messages).toHaveLength(1);
    const message = messages[0]!;
    expect(message.from).toBe('salient@blackgate.studio');
    expect(message.to).toBe('recovery@example.test');
    const url = new URL(message.text.match(/https:\/\/\S+/)![0]);
    expect(url.origin).toBe(site);
    expect(url.pathname).toBe('/reset-password');
    const token = url.searchParams.get('token')!;
    const verification = await t.query(components.betterAuth.adapter.findOne, {
      model: 'verification',
      where: [{ field: 'identifier', value: `reset-password:${token}` }],
    });
    expect(verification.expiresAt - Date.now()).toBeGreaterThan(1_790_000);
    expect(verification.expiresAt - Date.now()).toBeLessThanOrEqual(1_800_000);
    expect((await post(t, 'reset-password', { token, newPassword })).status).toBe(200);
    const after = await t.query(components.betterAuth.adapter.findMany, {
      model: 'session',
      paginationOpts: { cursor: null, numItems: 10 },
    });
    expect(after.page).toEqual([]);
    expect(await oldClient.query(api.auth.viewer, {})).toBeNull();
    expect((await post(t, 'reset-password', { token, newPassword })).status).toBe(400);
    expect(
      (await post(t, 'sign-in/email', { email: 'recovery@example.test', password: oldPassword }))
        .status,
    ).toBe(401);
    const newLogin = await post(t, 'sign-in/email', {
      email: 'recovery@example.test',
      password: newPassword,
    });
    expect(newLogin.status).toBe(200);
    expect((await newLogin.json()).user.id).toBe(signup.user.id);
  });

  test('expired tokens and untrusted redirects are refused', async () => {
    const t = backend();
    const signup = await signUp(t);
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'verification',
        data: {
          identifier: 'reset-password:expired',
          value: signup.user.id,
          expiresAt: Date.now() - 1,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 1000,
        },
      },
    });
    expect((await post(t, 'reset-password', { token: 'expired', newPassword })).status).toBe(400);
    expect(
      (
        await post(t, 'request-password-reset', {
          email: signup.user.email,
          redirectTo: 'https://attacker.example/reset',
        })
      ).status,
    ).toBe(403);
    expect(messages).toHaveLength(0);
  });

  test('database request limits reject a fourth request across separate auth instances', async () => {
    const t = backend();
    for (let i = 0; i < 3; i++) {
      expect(
        (await post(t, 'request-password-reset', { email: 'missing@example.test' })).status,
      ).toBe(200);
    }
    expect(
      (await post(t, 'request-password-reset', { email: 'missing@example.test' })).status,
    ).toBe(429);
    const records = await t.query(components.betterAuth.adapter.findMany, {
      model: 'rateLimit',
      paginationOpts: { cursor: null, numItems: 10 },
    });
    expect(records.page.some((row: { count: number }) => row.count === 3)).toBe(true);
  });

  test('unconfigured deployments expose no recovery capability and do not queue mail', async () => {
    vi.stubEnv('CLOUDFLARE_EMAIL_API_TOKEN', '');
    const t = backend();
    expect(await t.query(api.auth.recoveryAvailable, {})).toBe(false);
    expect(
      (await post(t, 'request-password-reset', { email: 'missing@example.test' })).status,
    ).toBe(400);
    expect(messages).toHaveLength(0);
  });

  test.each([401, 403, 429, 500])('provider HTTP %i errors are sanitized', async status => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('secret-token recipient@example.test', { status }),
    );
    await expect(deliverPasswordReset('recipient@example.test', 'secret-token')).rejects.toThrow(
      `HTTP ${status}`,
    );
  });

  test('bounced, malformed, and network failures are not reported as delivery', async () => {
    for (const body of [
      null,
      { success: true, result: {} },
      { success: true, result: { queued: 123 } },
      { success: true, result: { permanent_bounces: ['recipient@example.test'] } },
    ]) {
      vi.mocked(fetch).mockResolvedValue(Response.json(body));
      await expect(deliverPasswordReset('recipient@example.test', 'secret-token')).rejects.toThrow(
        'recipient not accepted',
      );
    }
    vi.mocked(fetch).mockRejectedValue(new Error('secret-token'));
    await expect(deliverPasswordReset('recipient@example.test', 'secret-token')).rejects.toThrow(
      'network error',
    );
  });
});
