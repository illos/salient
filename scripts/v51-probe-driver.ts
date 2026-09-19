// SPDX-License-Identifier: GPL-3.0-only
/**
 * V51 TEMPORARY DIAGNOSTIC DRIVER. Deleted with `convex/diagnostics.ts` before any merge.
 *
 * Drives the two probes in `convex/diagnostics.ts` and records what was actually measured. It
 * changes nothing: no limit, no data, no auth path, no environment configuration.
 *
 * Usage (CT114 only, and only after the V46 owner has released the `characters` slot):
 *   presidium-dev --env characters run build -- \
 *     pnpm exec tsx scripts/v51-probe-driver.ts --condition idle   --out <dir>
 *     ... and again with --condition loaded while the closeout scenario runs.
 *
 * TIMING SOURCE, verified against the installed CLI rather than assumed:
 *   node_modules/convex/src/cli/lib/logs.ts reads `log.executionTime * 1000` and formats the
 *   Completion line as "Function executed in N ms" — NOT "Function execution took N ms", which an
 *   earlier draft of the plan assumed. That line is emitted only when `shouldShowSuccessLogs` is
 *   true (logs.ts:226), i.e. `npx convex logs --success`. Without the flag a successful execution
 *   emits no timing line at all, so a driver that tailed plain `convex logs` would silently record
 *   nothing and report client latency as if it were server time.
 *
 * This driver therefore does NOT parse the log stream itself. It records the exact command the
 * operator must run alongside it, and requires its output as a retained artifact. Client latency
 * is measured here and is always labelled as client latency.
 *
 * `QueryCtx.runQuery` (convex/src/server/registration.ts) documents the same read snapshot plus
 * argument and return validation in a fresh isolated JS context. It makes NO caching promise, so
 * nested-call caching is unverified and this driver asserts nothing about it.
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';

try {
  process.loadEnvFile('.env.local');
} catch {
  /* Explicit environment also works. */
}

/**
 * Mints a token for a disposable probe account, using exactly the construction `scripts/app.ts`
 * uses for headless calls. No production auth path is altered and no product limit is touched —
 * in particular the signup rate limiter is left as configured, so this signs up at most once.
 *
 * The token is held in memory and never written to any artifact.
 */
async function mintToken(siteUrl: string, origin: string, email: string, password: string) {
  const storage = new Map<string, string>();
  const client = createAuthClient({
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
  const signUp = await client.signUp.email({ email, password, name: 'V51 probe' });
  if (signUp.error && !/exists|taken|already/i.test(signUp.error.message ?? ''))
    throw new Error(`Probe sign-up failed: ${signUp.error.message}`);
  const signIn = await client.signIn.email({ email, password });
  if (signIn.error) throw new Error(`Probe sign-in failed: ${signIn.error.message}`);
  const jwt = await client.convex.token();
  if (jwt.error || !jwt.data?.token) throw new Error('Could not obtain an authenticated token.');
  return jwt.data.token;
}

type Condition = 'idle' | 'loaded';

interface Sample {
  index: number;
  arm: 'withAuthPrefix' | 'identityOnly';
  /** UTC instant this call was issued, so samples can be correlated with the closeout run,
   *  the `convex logs --success` window and the host samples. */
  atUtc: string;
  /** Round-trip time measured in this process. NOT server execution time. */
  clientLatencyMs: number;
  nonce: string;
  /** The probe returned literal `true`. Anything else does not count as a successful sample. */
  ok: boolean;
  /** The value actually returned, retained so a `false` is distinguishable from a throw. */
  returned: boolean | null;
  error?: string;
}

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? process.argv[i + 1] : undefined;
  if (value === undefined && fallback === undefined) throw new Error(`missing --${name}`);
  return value ?? fallback!;
}

const withPrefix = makeFunctionReference<'query'>('diagnostics:probeWithAuthPrefix');
const identityOnly = makeFunctionReference<'query'>('diagnostics:probeIdentityOnly');

/**
 * A call counts as successful only when the probe returned literal `true`.
 *
 * The two probes fail differently and both matter. `probeWithAuthPrefix` THROWS when the caller is
 * unauthenticated, because `requireUser` raises. `probeIdentityOnly` RETURNS `false` — it does not
 * throw — so discarding the boolean would silently treat an unauthenticated control call as a
 * clean sample. An earlier draft of this driver discarded it.
 *
 * A throw is not proof of anything in particular: it may be an authentication failure, a query
 * timeout, or a backend error. The raw error string is retained rather than interpreted here.
 */
async function timed(
  client: ConvexHttpClient,
  ref: typeof withPrefix,
  nonce: string,
): Promise<{ ms: number; ok: boolean; returned: boolean | null; atUtc: string; error?: string }> {
  const atUtc = new Date().toISOString();
  const started = performance.now();
  try {
    const value = (await client.query(ref, { nonce })) as boolean;
    return { ms: performance.now() - started, ok: value === true, returned: value, atUtc };
  } catch (error) {
    return { ms: performance.now() - started, ok: false, returned: null, atUtc, error: String(error) };
  }
}

/**
 * Preflight. The experiment does not proceed if any of these fails, because each failure would
 * make the measurement mean something other than what it claims.
 */
async function preflight(client: ConvexHttpClient) {
  const checks: Record<string, unknown> = {};

  // 1. Both probes must return literal `true`, which is the only evidence available here that the
  //    caller is authenticated. The two fail differently: probeWithAuthPrefix throws (requireUser
  //    raises), while probeIdentityOnly returns `false` without throwing.
  const a = await timed(client, withPrefix, randomUUID());
  const b = await timed(client, identityOnly, randomUUID());
  checks.withAuthPrefix = { returnedTrue: a.ok, returned: a.returned, error: a.error ?? null };
  checks.identityOnly = { returnedTrue: b.ok, returned: b.returned, error: b.error ?? null };
  if (!a.ok || !b.ok)
    throw new Error(
      'Preflight failed: a probe did not return true. A `false` from the control means no ' +
        'identity was present. A throw may be an authentication failure, a query timeout or a ' +
        'backend error — it is not interpreted here. Either way the timings below would not mean ' +
        'what the experiment claims, so the run stops.\n' +
        // Surface WHICH probe failed and how. An earlier draft refused without saying, which made
        // the refusal useless for diagnosing the refusal.
        `  withAuthPrefix: returned=${JSON.stringify(a.returned)} error=${a.error ?? 'none'}\n` +
        `  identityOnly:   returned=${JSON.stringify(b.returned)} error=${b.error ?? 'none'}`,
    );

  // 2. Does the nonce actually force execution here? Compare a repeated identical call against a
  //    nonce-varied one. This is INDICATIVE from the client side only — a cache hit should be
  //    markedly faster, but client latency is not proof. The authoritative check is whether the
  //    retained `convex logs --success` output shows one Completion line per nonce-varied call.
  const fixed = 'preflight-fixed-nonce';
  const first = await timed(client, withPrefix, fixed);
  const repeat = await timed(client, withPrefix, fixed);
  const varied = await timed(client, withPrefix, randomUUID());
  checks.nonceProbe = {
    firstMs: first.ms,
    repeatedIdenticalArgsMs: repeat.ms,
    nonceVariedMs: varied.ms,
    note:
      'Indicative only. Confirm against the retained convex logs --success output that each ' +
      'nonce-varied call produced its own Completion line.',
  };

  return checks;
}

async function main(): Promise<void> {
  const condition = arg('condition') as Condition;
  if (condition !== 'idle' && condition !== 'loaded')
    throw new Error('--condition must be idle or loaded');
  const outDir = arg('out');
  const pairs = Number(arg('pairs', '30'));
  const intervalMs = Number(arg('interval-ms', '2000'));
  const url = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;
  if (!url) throw new Error('Set CONVEX_URL or VITE_CONVEX_URL to the characters deployment.');
  let token = process.env.SALIENT_AUTH_TOKEN;
  if (!token) {
    const siteUrl = process.env.VITE_CONVEX_SITE_URL;
    const origin = process.env.VITE_SITE_URL;
    const email = process.env.V51_PROBE_EMAIL;
    const password = process.env.V51_PROBE_PASSWORD;
    if (!siteUrl || !origin || !email || !password)
      throw new Error(
        'Set SALIENT_AUTH_TOKEN, or V51_PROBE_EMAIL and V51_PROBE_PASSWORD with ' +
          'VITE_CONVEX_SITE_URL and VITE_SITE_URL, for a disposable probe account.',
      );
    token = await mintToken(siteUrl, origin, email, password);
  }

  await mkdir(outDir, { recursive: true });
  const client = new ConvexHttpClient(url);
  client.setAuth(token);

  // A freshly signed-up account has an auth identity but no application `users` row, so
  // `requireUser` raises "Finish account setup first." until the app's own setup mutation runs.
  // This is the ordinary account-setup path the web client already calls — not an auth change,
  // and not a bypass of anything. The preflight caught this rather than letting it produce
  // meaningless timings.
  await client.mutation(makeFunctionReference<'mutation'>('auth:ensureProfile'), {});

  const runStartedAtUtc = new Date().toISOString();
  const checks = await preflight(client);
  // Sampling starts AFTER preflight, and the aggregation window below is [samplingStartedAtUtc,
  // runFinishedAtUtc]. That is what keeps preflight executions out of the sample distribution:
  // the void first run mixed them in, and also mixed in earlier runs by pulling log history.
  // Settle before opening the window so a preflight call in flight cannot land inside it.
  await new Promise(resolve => setTimeout(resolve, 1500));
  const samplingStartedAtUtc = new Date().toISOString();

  // Arms are INTERLEAVED, not run in blocks, so drift in host conditions across the window cannot
  // be mistaken for a difference between arms.
  const samples: Sample[] = [];
  for (let i = 0; i < pairs; i += 1) {
    const first = i % 2 === 0; // alternate which arm leads, so ordering cannot bias one arm
    const nonceA = randomUUID();
    const nonceB = randomUUID();
    const record = (arm: Sample['arm'], nonce: string, r: Awaited<ReturnType<typeof timed>>) =>
      samples.push({
        index: i,
        arm,
        atUtc: r.atUtc,
        clientLatencyMs: r.ms,
        nonce,
        ok: r.ok,
        returned: r.returned,
        ...(r.error ? { error: r.error } : {}),
      });
    const runPrefix = async () => record('withAuthPrefix', nonceA, await timed(client, withPrefix, nonceA));
    const runControl = async () => record('identityOnly', nonceB, await timed(client, identityOnly, nonceB));
    if (first) {
      await runPrefix();
      await runControl();
    } else {
      await runControl();
      await runPrefix();
    }
    if (i < pairs - 1) await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  const summarise = (arm: Sample['arm']) => {
    const values = samples.filter(s => s.arm === arm && s.ok).map(s => s.clientLatencyMs).sort((x, y) => x - y);
    if (!values.length) return null;
    const at = (q: number) => values[Math.min(values.length - 1, Math.floor(q * values.length))];
    return {
      n: values.length,
      minMs: values[0],
      medianMs: at(0.5),
      p90Ms: at(0.9),
      maxMs: values[values.length - 1],
    };
  };

  // Failures are retained as failures and are NOT folded into the success latency distribution:
  // a fast throw would otherwise look like a fast success.
  const failures = samples
    .filter(sample => !sample.ok)
    .map(({ index, arm, atUtc, clientLatencyMs, returned, error }) => ({
      index,
      arm,
      atUtc,
      clientLatencyMs,
      returned,
      error: error ?? null,
    }));

  const report = {
    unit: 'V51',
    status: 'measured client latency only; server execution time comes from the retained logs artifact',
    condition,
    runStartedAtUtc,
    samplingStartedAtUtc,
    runFinishedAtUtc: new Date().toISOString(),
    aggregationWindow: {
      fromUtc: samplingStartedAtUtc,
      note:
        'Bound every server-side aggregation to [samplingStartedAtUtc, runFinishedAtUtc]. Do NOT ' +
        'use `convex logs --history`: it returns executions from before this window. Capture with ' +
        'a live tail started before samplingStartedAtUtc.',
    },
    preflightCallCount: 5,
    convexUrlHash: createHash('sha256').update(url).digest('hex').slice(0, 12),
    pairs,
    intervalMs,
    preflight: checks,
    clientLatency: {
      withAuthPrefix: summarise('withAuthPrefix'),
      identityOnly: summarise('identityOnly'),
      caveat:
        'Client latency includes network, websocket scheduling and process time. It is NOT server ' +
        'execution time and must not be reported as such. Only samples that returned literal ' +
        '`true` are in this distribution.',
    },
    failures: { count: failures.length, samples: failures },
    serverExecutionTime: {
      source: 'npx convex logs --success',
      lineFormat: 'Function executed in N ms',
      required: true,
      note:
        'The --success flag is required: without it, successful executions emit no Completion ' +
        'line and no server timing exists. Retain that output alongside this file.',
    },
    limits: [
      'A single closeout scenario is a narrower load than the full browser suite that produced the blocker.',
      'If the loaded condition does not reproduce an application timeout, fast probes are INCONCLUSIVE and refute nothing.',
      'Fast probes concurrent with an application failure are evidence against a fixed universal-prefix explanation, not logical proof excluding rare or context-dependent prefix effects.',
      'Nested ctx.runQuery caching semantics are unverified; nothing here asserts them.',
    ],
    samples,
  };

  await writeFile(join(outDir, `v51-${condition}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.error(
    `V51 ${condition}: ${samples.length} samples written. Server execution time is NOT in this ` +
      'file — retain `npx convex logs --success` output for the same window.',
  );
}

await main();
