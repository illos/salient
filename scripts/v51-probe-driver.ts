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

type Condition = 'idle' | 'loaded';

interface Sample {
  index: number;
  arm: 'withAuthPrefix' | 'identityOnly';
  /** Round-trip time measured in this process. NOT server execution time. */
  clientLatencyMs: number;
  nonce: string;
  ok: boolean;
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

async function timed(
  client: ConvexHttpClient,
  ref: typeof withPrefix,
  nonce: string,
): Promise<{ ms: number; ok: boolean; error?: string }> {
  const started = performance.now();
  try {
    await client.query(ref, { nonce });
    return { ms: performance.now() - started, ok: true };
  } catch (error) {
    return { ms: performance.now() - started, ok: false, error: String(error) };
  }
}

/**
 * Preflight. The experiment does not proceed if any of these fails, because each failure would
 * make the measurement mean something other than what it claims.
 */
async function preflight(client: ConvexHttpClient) {
  const checks: Record<string, unknown> = {};

  // 1. Both probes reachable AND authenticated. An unauthenticated probe measures the wrong thing:
  //    requireUser would throw rather than pay the prefix.
  const a = await timed(client, withPrefix, randomUUID());
  const b = await timed(client, identityOnly, randomUUID());
  checks.withAuthPrefixReachable = a.ok;
  checks.identityOnlyReachable = b.ok;
  if (!a.ok) checks.withAuthPrefixError = a.error;
  if (!b.ok) checks.identityOnlyError = b.error;
  if (!a.ok || !b.ok)
    throw new Error(
      'Preflight failed: a probe did not return. If requireUser threw, the caller is not ' +
        'authenticated and no timing below would mean anything.',
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
  const token = process.env.SALIENT_AUTH_TOKEN;
  if (!token)
    throw new Error(
      'Set SALIENT_AUTH_TOKEN. Obtain it the way scripts/app.ts does, with a disposable test ' +
        'user. The token is never written to any artifact.',
    );

  await mkdir(outDir, { recursive: true });
  const client = new ConvexHttpClient(url);
  client.setAuth(token);

  const checks = await preflight(client);

  // Arms are INTERLEAVED, not run in blocks, so drift in host conditions across the window cannot
  // be mistaken for a difference between arms.
  const samples: Sample[] = [];
  for (let i = 0; i < pairs; i += 1) {
    const first = i % 2 === 0; // alternate which arm leads, so ordering cannot bias one arm
    const nonceA = randomUUID();
    const nonceB = randomUUID();
    const runPrefix = async () => {
      const r = await timed(client, withPrefix, nonceA);
      samples.push({ index: i, arm: 'withAuthPrefix', clientLatencyMs: r.ms, nonce: nonceA, ok: r.ok, error: r.error });
    };
    const runControl = async () => {
      const r = await timed(client, identityOnly, nonceB);
      samples.push({ index: i, arm: 'identityOnly', clientLatencyMs: r.ms, nonce: nonceB, ok: r.ok, error: r.error });
    };
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

  const report = {
    unit: 'V51',
    status: 'measured client latency only; server execution time comes from the retained logs artifact',
    condition,
    startedAt: new Date().toISOString(),
    convexUrlHash: createHash('sha256').update(url).digest('hex').slice(0, 12),
    pairs,
    intervalMs,
    preflight: checks,
    clientLatency: {
      withAuthPrefix: summarise('withAuthPrefix'),
      identityOnly: summarise('identityOnly'),
      caveat:
        'Client latency includes network, websocket scheduling and process time. It is NOT server ' +
        'execution time and must not be reported as such.',
    },
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
