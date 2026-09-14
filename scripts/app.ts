/** Headless caller of the same authorized Convex operations used by the web app. */
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';

try { process.loadEnvFile('.env.local'); } catch { /* Explicit environment also works. */ }
const [kind, functionName, json = '{}'] = process.argv.slice(2);
if ((kind !== 'query' && kind !== 'mutation') || !functionName) {
  console.error('Usage: pnpm app <query|mutation> <module:function> [JSON arguments]\nAuthenticate with SALIENT_EMAIL and SALIENT_PASSWORD, or SALIENT_AUTH_TOKEN. Mutations use the same commandId and authorization contract as the browser.');
  process.exit(1);
}
let auth: ReturnType<typeof createAuthClient> | undefined;
try {
  const url = process.env.VITE_CONVEX_URL;
  const siteUrl = process.env.VITE_CONVEX_SITE_URL;
  if (!url || !siteUrl) throw new Error('Configure the Convex client and HTTP URLs in .env.local.');
  const client = new ConvexHttpClient(url);
  let token = process.env.SALIENT_AUTH_TOKEN;
  if (!token) {
    const email = process.env.SALIENT_EMAIL; const password = process.env.SALIENT_PASSWORD;
    if (!email || !password) throw new Error('Set SALIENT_EMAIL and SALIENT_PASSWORD, or SALIENT_AUTH_TOKEN.');
    const storage = new Map<string, string>();
    const origin = process.env.VITE_SITE_URL ?? (['127.0.0.1', 'localhost'].includes(new URL(url).hostname) ? 'http://127.0.0.1:5180' : undefined);
    if (!origin) throw new Error('Set VITE_SITE_URL to the configured trusted frontend origin for password sign-in.');
    const login = createAuthClient({ baseURL: siteUrl, fetchOptions: { headers: { Origin: origin } }, plugins: [convexClient(), crossDomainClient({ storage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { storage.set(key, value); } } })] });
    const result = await login.signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message || 'Sign-in failed.');
    auth = login;
    const jwt = await login.convex.token();
    if (jwt.error || !jwt.data?.token) throw new Error('Could not obtain an authenticated application token.');
    token = jwt.data.token;
  }
  client.setAuth(token);
  const ref = makeFunctionReference<typeof kind>(functionName);
  const args = JSON.parse(json);
  const result = kind === 'query' ? await client.query(ref as ReturnType<typeof makeFunctionReference<'query'>>, args) : await client.mutation(ref as ReturnType<typeof makeFunctionReference<'mutation'>>, args);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Application command failed.');
  process.exitCode = 1;
} finally {
  if (auth) {
    try {
      const result = await auth.signOut();
      // The throw is caught by the catch below; it never escapes the finally block.
      // eslint-disable-next-line no-unsafe-finally
      if (result.error) throw new Error('Temporary CLI session could not be revoked.');
    } catch { console.error('Temporary CLI session cleanup failed; sign out that session before reusing this environment.'); process.exitCode = 1; }
  }
}
