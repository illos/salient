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
const response = await fetch('http://backend:3211/api/auth/sign-up/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: process.env.DEV_WEB_URL },
  body: JSON.stringify({ name: 'Recovery browser fixture', email, password }),
});
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
