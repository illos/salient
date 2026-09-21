// SPDX-License-Identifier: GPL-3.0-only
/**
 * V95 authenticated headless journey. Every capability uses the same Better Auth or Convex API as
 * the account screen and reads the resulting state back; it performs no direct database writes.
 */
import { ConvexHttpClient } from 'convex/browser';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { api } from '../convex/_generated/api.js';

function required(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`Set ${name} (VITE_CONVEX_URL, VITE_CONVEX_SITE_URL, VITE_SITE_URL).`);
  return value;
}
function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const convexUrl = required('VITE_CONVEX_URL');
const siteUrl = required('VITE_CONVEX_SITE_URL');
const origin = required('VITE_SITE_URL');
const run = `v95-${Date.now().toString(36)}`;
const email = `${run}@example.test`;
const renamedEmail = `${run}-changed@example.test`;
const initialPassword = `V95-initial-${run}`;
const changedPassword = `V95-changed-${run}`;

function sessionClient() {
  const storage = new Map<string, string>();
  return createAuthClient({
    baseURL: siteUrl,
    fetchOptions: { headers: { Origin: origin } },
    plugins: [
      convexClient(),
      crossDomainClient({
        storage: {
          getItem: key => storage.get(key) ?? null,
          setItem: (key, value) => storage.set(key, value),
        },
      }),
    ],
  });
}

async function appClient(auth: ReturnType<typeof sessionClient>) {
  const token = await auth.convex.token();
  if (token.error || !token.data?.token)
    throw new Error(token.error?.message || 'Could not obtain an application token.');
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token.data.token);
  return client;
}

const firstAuth = sessionClient();
const extraSessions: ReturnType<typeof sessionClient>[] = [];
let deleted = false;
try {
  const signup = await firstAuth.signUp.email({
    email,
    password: initialPassword,
    name: 'Account headless',
  });
  if (signup.error) throw new Error(signup.error.message || 'Sign-up failed.');
  let first = await appClient(firstAuth);
  await first.mutation(api.auth.ensureProfile, {});

  await first.mutation(api.account.updateProfile, { displayName: 'Account headless renamed' });
  let viewer = await first.query(api.auth.viewer, {});
  expect(viewer?.displayName === 'Account headless renamed', 'display name did not persist');

  const { url: uploadUrl, ticketId } = await first.mutation(api.account.portraitUploadUrl, {});
  const upload = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'image/png' },
    body: new Blob(['v95 portrait'], { type: 'image/png' }),
  });
  expect(upload.ok, `portrait upload failed (${upload.status})`);
  const { storageId } = (await upload.json()) as { storageId: string };
  const portrait = await first.action(api.account.setPortrait, {
    ticketId,
    storageId: storageId as never,
  });
  expect(portrait.ok, portrait.ok ? '' : portrait.error);
  viewer = await first.query(api.auth.viewer, {});
  expect(viewer?.portraitUrl, 'portrait URL did not persist');
  await first.mutation(api.account.clearPortrait, {});
  expect((await first.query(api.auth.viewer, {}))?.portraitUrl === null, 'portrait did not clear');

  const secondAuth = sessionClient();
  extraSessions.push(secondAuth);
  const secondLogin = await secondAuth.signIn.email({ email, password: initialPassword });
  if (secondLogin.error) throw new Error(secondLogin.error.message || 'Second sign-in failed.');
  const second = await appClient(secondAuth);
  const deviceResult = await firstAuth.listSessions();
  if (deviceResult.error) throw new Error(deviceResult.error.message || 'Device listing failed.');
  const devices = deviceResult.data;
  expect(devices.length === 2, `expected two devices, found ${devices.length}`);
  const firstSession = await firstAuth.getSession({ query: { disableCookieCache: true } });
  const other = devices.find(device => device.token !== firstSession.data?.session.token);
  expect(other, 'the second device was not distinguishable from the current device');
  const revocation = await firstAuth.revokeSession({ token: other.token });
  if (revocation.error) throw new Error(revocation.error.message || 'Device revocation failed.');
  expect((await second.query(api.auth.viewer, {})) === null, 'revoked device stayed authorized');

  const thirdAuth = sessionClient();
  extraSessions.push(thirdAuth);
  const thirdLogin = await thirdAuth.signIn.email({ email, password: initialPassword });
  if (thirdLogin.error) throw new Error(thirdLogin.error.message || 'Third sign-in failed.');
  const third = await appClient(thirdAuth);
  const passwordChange = await firstAuth.changePassword({
    currentPassword: initialPassword,
    newPassword: changedPassword,
    revokeOtherSessions: true,
  });
  if (passwordChange.error)
    throw new Error(passwordChange.error.message || 'Password change failed.');
  expect((await third.query(api.auth.viewer, {})) === null, 'password change kept another session');
  first = await appClient(firstAuth);

  const emailChange = await firstAuth.changeEmail({ newEmail: renamedEmail });
  if (emailChange.error) throw new Error(emailChange.error.message || 'Email change failed.');
  const session = await firstAuth.getSession({ query: { disableCookieCache: true } });
  expect(session.data?.user.email === renamedEmail, 'email change did not persist');

  const campaignId = await first.mutation(api.campaigns.create, {
    name: 'Deleted with the account',
    commandId: `${run}-campaign`,
  });
  expect(campaignId, 'campaign creation failed');
  const campaign = await first.query(api.campaigns.get, { campaignId });
  expect(campaign.shareCode, 'the owner could not read the campaign share code');
  const deletion = await firstAuth.deleteUser({ password: changedPassword });
  if (deletion.error) throw new Error(deletion.error.message || 'Account deletion failed.');
  deleted = true;
  expect((await first.query(api.auth.viewer, {})) === null, 'deleted account profile remained');
  const anonymous = new ConvexHttpClient(convexUrl);
  expect(
    (await anonymous.query(api.campaigns.preview, { shareCode: campaign.shareCode })) === null,
    'the deleted account campaign remained reachable',
  );

  console.log(
    JSON.stringify({
      ok: true,
      displayName: 'Account headless renamed',
      portrait: 'set-and-cleared',
      devices: 'revoked-and-password-revoked',
      email: renamedEmail,
      deletion: 'auth-profile-and-owned-campaign-removed',
    }),
  );
} finally {
  if (!deleted) {
    await firstAuth.deleteUser({ password: changedPassword }).catch(() => undefined);
    await firstAuth.deleteUser({ password: initialPassword }).catch(() => undefined);
  }
  await Promise.all(extraSessions.map(auth => auth.signOut().catch(() => undefined)));
}
