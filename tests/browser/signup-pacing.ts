// SPDX-License-Identifier: GPL-3.0-only
/**
 * V52: wait out the product's sign-up rate-limit window before every registration, and record the
 * `/api/auth/sign-up/email` exchanges that result.
 *
 * The limit is the application's and is deliberate. Nothing here changes, disables, resets or
 * evades it, spoofs an address, or retries a refusal.
 *
 * ## The policy
 *
 * From the installed `better-auth` **1.6.15**, whose `@better-auth/core` also resolves to 1.6.15
 * (`pnpm-lock.yaml`; the `1.6.31` directories under `.pnpm` are orphaned and reachable from no
 * import — this file once cited them, which mattered because 1.6.31 reworked the limiter).
 * `convex/auth.ts:41` enables it with no custom rule for sign-up, so the default applies:
 *
 * - `better-auth/dist/api/rate-limiter/index.mjs`, `getDefaultSpecialRules()` — paths starting
 *   `/sign-in`, `/sign-up`, `/change-password`, `/change-email`: `window: 10`, `max: 3`.
 * - `@better-auth/core/src/utils/ip.ts`, `createRateLimitKey(ip, path)` — one bucket per address
 *   and exact path, so `/sign-up/email` is its own.
 * - same rate-limiter module, `shouldRateLimit` — refuses when
 *   `now - lastRequest < window * 1000 && count >= max`, checked *before* the increment.
 * - same module, `onResponseRateLimit` — the counter resets to 1 only when a response arrives more
 *   than `window` after the previous one.
 *
 * ## Why an unconditional wait
 *
 * An earlier version replicated the server's counter. Its reset predicate had to run on
 * client-observed instants, and unequal latency can push an observed gap past the window while the
 * server's stayed inside it — clearing the replica while the server's count still held. It was
 * also per worker process, while the bucket is per address. Waiting longer than the window before
 * every sign-up has neither failure mode, because it models nothing: the server's own reset fires
 * each time and its count never exceeds one.
 *
 * ## What the record is
 *
 * Every matching response is recorded once, timestamped **in the response listener**, by the one
 * code path that sees the network event. A paced call then claims its own response by identity.
 * Responses nobody claims stay `initiated: false`, which is how a request the specs did not issue
 * becomes visible — one hypothesis for the unexplained refusals in V43, V45 and V46.
 *
 * **`initiated: false` does not prove an extra request.** A response slower than
 * `CLAIM_GRACE_MS` looks identical: its paced call gave up waiting and recorded `observed: false`,
 * then the response arrived and was recorded unclaimed. So an `observed: false` row followed
 * closely by an unclaimed one is most likely **one** exchange, not two. Read the pair together
 * before concluding anything.
 *
 * This records what reached the endpoint; it does not record the server's counter, which only a
 * backend read can show. No response body and no token is logged.
 */
import { test, type Page, type Response } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/** `window` in the library's rule for `/sign-up*`, in milliseconds. */
const WINDOW_MS = 10_000;
/** Slack: the wait is computed client-side against a server-side strict `>` comparison. */
const MARGIN_MS = 1_500;
/** The quiet period guaranteed between consecutive sign-ups. */
const QUIET_MS = WINDOW_MS + MARGIN_MS;
/** Bound on the observer itself; it is armed before the submit, so this spans the whole submit. */
const RESPONSE_WAIT_MS = 30_000;
/**
 * Bound on waiting *after* the submit has settled. Short by design: when a submit produces no
 * request at all, blocking for the observer's full timeout would delay the real failure and would
 * not be charged to any test's budget. Nothing is lost by giving up early — the listener records
 * every response independently, so a late arrival is still retained, merely as `initiated: false`.
 */
const CLAIM_GRACE_MS = 2_000;

const SIGN_UP_PATH = '/api/auth/sign-up/email';
/** Cheap prefilter first, so a URL this cannot parse can never throw inside the response emitter. */
const isSignUp = (url: string) => {
  if (!url.includes(SIGN_UP_PATH)) return false;
  try {
    return new URL(url).pathname.endsWith(SIGN_UP_PATH);
  } catch {
    return false;
  }
};

/**
 * First import of this module, which necessarily follows the previous process's last sign-up.
 * Playwright restarts a worker after a failure — possibly moments after a refused sign-up — so the
 * first sign-up of a process waits a full quiet period from here. Often a no-op, since import can
 * precede the first paced call by minutes.
 */
const processStarted = Date.now();

interface Exchange {
  index: number;
  /** ISO-8601 UTC, taken when the response event fired. */
  at: string;
  method: string;
  /** Null only when a paced submit produced no observed response. */
  status: number | null;
  /** `X-Retry-After` as 1.6.15 spells it, falling back to `Retry-After`. */
  retryAfter: string | null;
  /** False when no response was seen for a paced submit; true for every recorded response. */
  observed: boolean;
  /**
   * True once a paced call claims this response as the one it submitted. False can mean a request
   * this helper did not make, or simply a response slower than `CLAIM_GRACE_MS` — see the header.
   */
  initiated: boolean;
  /** Wait imposed before the submit that produced this; null until claimed. */
  waitedMs: number | null;
  reason: 'unclaimed' | 'none' | 'initial-quiescence' | 'quiet-interval';
  /** Milliseconds since the previously recorded exchange. */
  sincePreviousMs: number | null;
  title: string;
}

const exchanges: Exchange[] = [];
/** Lets a paced call find the row its own response produced. */
const rowFor = new WeakMap<Response, Exchange>();
/** The instant of the most recent recorded sign-up response. */
let lastSignUpAt: number | null = null;
/** Serialises callers so two contexts cannot submit inside one quiet period. */
let chain: Promise<unknown> = Promise.resolve();
const watched = new WeakSet<Page>();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** The running test's title, or a placeholder. Never throws. */
function currentTitle(): string {
  try {
    return test.info().title;
  } catch {
    return '(outside a running test)';
  }
}

function push(entry: Omit<Exchange, 'index' | 'at' | 'sincePreviousMs'>, at: number): Exchange {
  const row: Exchange = {
    index: exchanges.length + 1,
    at: new Date(at).toISOString(),
    sincePreviousMs: lastSignUpAt === null ? null : at - lastSignUpAt,
    ...entry,
  };
  exchanges.push(row);
  lastSignUpAt = at;
  return row;
}

/**
 * Record every `/sign-up/email` response on this page, whether or not this helper asked for it.
 * This is the only place an exchange is timestamped, so the recorded instant is the network event
 * rather than whatever the caller happened to await afterwards.
 */
function watch(page: Page): void {
  if (watched.has(page)) return;
  watched.add(page);
  page.on('response', response => {
    if (!isSignUp(response.url())) return;
    const headers = response.headers();
    const row = push(
      {
        method: response.request().method(),
        status: response.status(),
        retryAfter: headers['x-retry-after'] ?? headers['retry-after'] ?? null,
        observed: true,
        initiated: false,
        waitedMs: null,
        reason: 'unclaimed',
        title: currentTitle(),
      },
      Date.now(),
    );
    rowFor.set(response, row);
  });
}

/**
 * `playwright.config.ts` pins `workers: 1`. The bucket is per address, so an in-process chain
 * cannot constrain a second worker; fail loudly rather than let that rot into a silent hole.
 */
function assertSingleWorker(): void {
  const { parallelIndex, config } = test.info();
  if (config.workers === 1 && parallelIndex === 0) return;
  throw new Error(
    `signup-pacing requires workers: 1 (saw ${config.workers}, parallelIndex ${parallelIndex}). ` +
      'Replace the in-process chain with cross-worker coordination before raising it.',
  );
}

/** How long before the next submit, and why. Pure. */
function plan(now: number): { waitMs: number; reason: Exchange['reason'] } {
  const since = lastSignUpAt ?? processStarted;
  const reason: Exchange['reason'] =
    lastSignUpAt === null ? 'initial-quiescence' : 'quiet-interval';
  return now - since >= QUIET_MS
    ? { waitMs: 0, reason: 'none' }
    : { waitMs: since + QUIET_MS - now, reason };
}

/**
 * Run `submit` — whatever produces one `POST /api/auth/sign-up/email` on `page` — after a quiet
 * period the product's rule is guaranteed to accept, then claim the response it produced.
 *
 * `submit` keeps the caller's own assertions; this observes the response in addition to them.
 *
 * Two bounded waits per call, both charged to the running test's budget: the quiet period before
 * the submit (at most `QUIET_MS`, plus any time queued behind another caller), and at most
 * `CLAIM_GRACE_MS` afterwards to claim the response. No loop, no retry.
 *
 * The charging is best-effort, not a guarantee. Three known gaps: a test that calls
 * `test.setTimeout()` after a paced sign-up discards the extension; a test abandoned mid-submit
 * leaves its continuation running while a later test holds the budget; and `info.timeout` reads
 * the default slot while `setTimeout` writes the running one, which differ inside a fixture or
 * hook — no registration happens in one today.
 */
export async function pacedSignUp<T>(page: Page, submit: () => Promise<T>): Promise<T> {
  assertSingleWorker();
  watch(page);
  // Captured before queueing: by the time the body runs, `test.info()` may be a later test.
  const info = test.info();
  const title = info.title;
  const enteredAt = Date.now();

  const run = chain.then(async () => {
    const { waitMs, reason } = plan(Date.now());
    const chargeable = Date.now() - enteredAt + waitMs;
    if (chargeable > 0) {
      try {
        info.setTimeout(info.timeout + chargeable);
      } catch {
        // The test has already ended; the extension is moot and must not mask its outcome.
      }
    }
    if (waitMs > 0) await sleep(waitMs);

    const seen = page
      .waitForResponse(response => isSignUp(response.url()), { timeout: RESPONSE_WAIT_MS })
      .catch(() => null);
    try {
      return await submit();
    } finally {
      const graceStart = Date.now();
      const response = await Promise.race([seen, sleep(CLAIM_GRACE_MS).then(() => null)]);
      try {
        // Charge the grace too, for the same reason the wait is charged.
        info.setTimeout(info.timeout + (Date.now() - graceStart));
      } catch {
        // The test has already ended.
      }
      const row = response ? rowFor.get(response) : undefined;
      if (row) {
        row.initiated = true;
        row.waitedMs = waitMs;
        row.reason = reason;
        row.title = title;
      } else {
        // No response seen, or one seen on a page this helper does not watch. Recorded as
        // unobserved rather than given the calling code's timing, which would invent a
        // measurement that was never taken.
        push(
          {
            method: 'POST',
            status: null,
            retryAfter: null,
            observed: false,
            initiated: true,
            waitedMs: waitMs,
            reason,
            title,
          },
          Date.now(),
        );
      }
    }
  });
  // Keep the chain alive after a failure so one refusal cannot deadlock the suite.
  chain = run.catch(() => undefined);
  return run as Promise<T>;
}

/** Every sign-up exchange this worker recorded, in order. */
export function signUpExchanges(): readonly Exchange[] {
  return exchanges;
}

/**
 * Write the record when the worker ends. `exit` cannot await, so this is synchronous; a worker
 * killed outright leaves no file, which is better than a partial one.
 */
process.on('exit', () => {
  if (exchanges.length === 0) return;
  try {
    mkdirSync('.playtest/v52', { recursive: true });
    writeFileSync(
      `.playtest/v52/signup-exchanges-${process.pid}.json`,
      JSON.stringify(
        {
          policy: { windowMs: WINDOW_MS, marginMs: MARGIN_MS, quietMs: QUIET_MS },
          note:
            'One row per /api/auth/sign-up/email response seen on a watched page, timestamped at ' +
            'the response event. observed:false means a paced submit produced no response within ' +
            'the claim grace. initiated:false means no paced call claimed the response, which is ' +
            'how an unissued request shows up — but a response slower than the grace looks the ' +
            'same, so an observed:false row followed closely by an unclaimed one is probably one ' +
            'exchange, not two. The server-side counter is not visible here; only a backend read ' +
            'shows it.',
          processStarted: new Date(processStarted).toISOString(),
          exchanges,
        },
        null,
        1,
      ),
    );
  } catch {
    // Retention is evidence, not behaviour. Never fail a run because a log could not be written.
  }
});
