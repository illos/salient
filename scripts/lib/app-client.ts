// SPDX-License-Identifier: GPL-3.0-only
/**
 * Authenticated headless Convex client for CLI routes such as scripts/forge/import.ts: the same
 * authorized operations the web app calls, with the same sign-in contract as scripts/app.ts.
 * Authenticate with SALIENT_EMAIL and SALIENT_PASSWORD (a temporary session, revoked by `close`)
 * or SALIENT_AUTH_TOKEN.
 */
import { ConvexHttpClient } from 'convex/browser';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';

export interface AppSession {
  client: ConvexHttpClient;
  /** Revokes a temporary password session; throws if revocation fails. */
  close(): Promise<void>;
}

export function loadLocalEnvironment() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    /* Explicit environment also works. */
  }
}

export async function openAppSession(): Promise<AppSession> {
  const url = process.env.VITE_CONVEX_URL;
  const siteUrl = process.env.VITE_CONVEX_SITE_URL;
  if (!url || !siteUrl) throw new Error('Configure the Convex client and HTTP URLs in .env.local.');
  // Keep stdout machine-readable even when Convex returns server diagnostics with a result.
  const client = new ConvexHttpClient(url, {
    logger: {
      logVerbose: console.error,
      log: console.error,
      warn: console.error,
      error: console.error,
    },
  });
  let auth: ReturnType<typeof createAuthClient> | undefined;
  let token = process.env.SALIENT_AUTH_TOKEN;
  const session: AppSession = {
    client,
    async close() {
      if (!auth) return;
      const result = await auth.signOut();
      if (result.error) throw new Error('Temporary CLI session could not be revoked.');
    },
  };
  if (!token) {
    const email = process.env.SALIENT_EMAIL;
    const password = process.env.SALIENT_PASSWORD;
    if (!email || !password)
      throw new Error('Set SALIENT_EMAIL and SALIENT_PASSWORD, or SALIENT_AUTH_TOKEN.');
    const storage = new Map<string, string>();
    const origin =
      process.env.VITE_SITE_URL ??
      (['127.0.0.1', 'localhost'].includes(new URL(url).hostname)
        ? 'http://127.0.0.1:5180'
        : undefined);
    if (!origin)
      throw new Error(
        'Set VITE_SITE_URL to the configured trusted frontend origin for password sign-in.',
      );
    const login = createAuthClient({
      baseURL: siteUrl,
      fetchOptions: { headers: { Origin: origin } },
      plugins: [
        convexClient(),
        crossDomainClient({
          storage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => {
              storage.set(key, value);
            },
          },
        }),
      ],
    });
    const result = await login.signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message || 'Sign-in failed.');
    auth = login;
    const jwt = await login.convex.token();
    if (jwt.error || !jwt.data?.token) {
      await session.close().catch(() => undefined);
      throw new Error('Could not obtain an authenticated application token.');
    }
    token = jwt.data.token;
  }
  client.setAuth(token);
  return session;
}
