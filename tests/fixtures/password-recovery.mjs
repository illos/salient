// Explicit isolated-browser fixture, never deployed. Run as the CT114 backend task.
// This creates a Better Auth verification record instead of delivering external mail.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

const config = JSON.parse(readFileSync('.convex/local/default/config.json', 'utf8'));
if (
  !config.deploymentName.startsWith('anonymous-') ||
  process.env.DEV_WEB_URL !== 'https://salient-hosted-dev-b665f1281342.tail41404c.ts.net'
) {
  throw new Error('Fixture restricted to the isolated hosted anonymous environment.');
}
// Fake, unusable credential enables the request UI. Browser requests use nonexistent accounts,
// so no mail job is scheduled. This is never copied to a hosted Convex deployment.
const configured = await fetch('http://backend:3210/api/update_environment_variables', {
  method: 'POST',
  headers: { Authorization: `Convex ${config.adminKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    changes: [
      {
        name: 'CLOUDFLARE_EMAIL_API_TOKEN',
        value: process.argv.includes('--cleanup') ? null : 'fixture-only-no-delivery',
      },
    ],
  }),
});
if (!configured.ok) throw new Error('Cannot configure isolated recovery fixture.');
if (process.argv.includes('--cleanup')) {
  rmSync('/artifacts/v39-recovery-fixture.json', { force: true });
  console.log('Isolated fake mail configuration and secret fixture removed.');
  process.exit(0);
}
const client = new ConvexHttpClient('http://backend:3210', { logger: false });
client.setAdminAuth(config.adminKey);
try {
  await client.function(makeFunctionReference('accountEmail:sendPasswordReset'), undefined, {
    email: 'transport-probe@example.test',
    token: 'non-account-transport-probe',
  });
  throw new Error('Unusable credential unexpectedly accepted.');
} catch (error) {
  if (!String(error).includes('Account email delivery failed: HTTP 401.')) {
    throw new Error('Runtime transport probe did not reach the expected sanitized HTTP 401.');
  }
  console.log(
    'Actual Convex mail action reached Cloudflare and rejected fake credentials with sanitized HTTP 401; no email sent.',
  );
}

const email = `recovery-${randomUUID()}@example.test`;
const password = `Before-${randomUUID()}`;
const token = randomUUID();
// V52: this is the suite's one non-UI sign-up, and it shares the per-address `/sign-up/email`
// bucket with every browser registration (better-auth's key is the address and the exact path).
// It runs in its own process, so it cannot share the browser helper's in-process pacing; a plain
// quiet period before the request achieves the same guarantee — the server's own counter resets
// on any request more than its ten-second window after the previous one.
//
// Deliberately NOT paced: the `/request-password-reset` and `/reset-password` calls this fixture
// and `password-recovery.spec.ts` make on purpose. Those have their own custom rule
// (`convex/auth.ts:42`) and, decisively, their own bucket, and the spec asserts the refusal they
// are meant to provoke. Pacing them would destroy the thing under test.
const SIGN_UP_QUIET_MS = 11_500;
await new Promise(resolve => setTimeout(resolve, SIGN_UP_QUIET_MS));
const signUpAt = new Date().toISOString();
const response = await fetch('http://backend:3211/api/auth/sign-up/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: process.env.DEV_WEB_URL },
  body: JSON.stringify({ name: 'Recovery browser fixture', email, password }),
});
// Logged in the same shape as the browser helper's record, so the two can be read together when
// reconstructing what reached the endpoint during a run.
console.log(
  JSON.stringify({
    signUpExchange: {
      at: signUpAt,
      status: response.status,
      // 1.6.15's rateLimitResponse sets X-Retry-After; Retry-After is the fallback, not a case
      // variant of it. Reading only one silently drops the header on a refusal.
      retryAfter: response.headers.get('x-retry-after') ?? response.headers.get('retry-after'),
      source: 'tests/fixtures/password-recovery.mjs',
      quietMsBefore: SIGN_UP_QUIET_MS,
    },
  }),
);
if (!response.ok) throw new Error(`Fixture signup failed: HTTP ${response.status}`);
const { user } = await response.json();
const now = Date.now();
try {
  await client.function(makeFunctionReference('adapter:create'), 'betterAuth', {
    input: {
      model: 'verification',
      data: {
        identifier: `reset-password:${token}`,
        value: user.id,
        expiresAt: now + 1800000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
} catch {
  throw new Error('Fixture verification insertion failed.');
}
writeFileSync('/artifacts/v39-recovery-fixture.json', JSON.stringify({ email, password, token }), {
  mode: 0o600,
});
console.log(
  'Isolated recovery fixture ready; credentials withheld. Delete fixture after browser checks.',
);
