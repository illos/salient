// SPDX-License-Identifier: GPL-3.0-only
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import type { Value } from 'convex/values';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';

export interface Actor {
  query<T = unknown>(name: string, args: Record<string, unknown>): Promise<T>;
  mutation<T = unknown>(name: string, args: Record<string, unknown>): Promise<T>;
}
export interface ScenarioContext {
  actors: { director: Actor; player: Actor; peer: Actor };
  run(name: string, fn: () => Promise<void>): Promise<boolean>;
  skip(name: string, reason: string): void;
  runId: string;
}
export interface ActorSession {
  actor: Actor;
  close(): Promise<void>;
}

const failedOperations = new WeakMap<object, string>();

/** Keep the real exception for negative assertions; record only its public operation name. */
async function operation<T>(name: string, work: Promise<T>): Promise<T> {
  try {
    return await bounded(work);
  } catch (error) {
    if (error && typeof error === 'object' && /^[a-zA-Z0-9_/:.-]+$/.test(name))
      failedOperations.set(error, name);
    throw error;
  }
}

export function failureDetails(error: unknown) {
  const result: {
    reason: string;
    operation?: string;
    assertion?: string;
    location?: string;
    rejection?: { reason: string; operation?: string };
    operator?: string;
    actual?: number | boolean | null;
    expected?: number | boolean | null;
  } = { reason: failureCode(error) };
  if (error && typeof error === 'object') result.operation = failedOperations.get(error);
  if (error instanceof Error && error.name === 'AssertionError') {
    const assertion = error as Error & {
      generatedMessage?: boolean;
      actual?: unknown;
      expected?: unknown;
      operator?: string;
    };
    // Only a repository-controlled scenario filename and line, never the raw stack/payload.
    result.location = assertion.stack?.match(
      /(?:character-(?:lifecycle|scenarios)|censor)\.ts:\d+:\d+/,
    )?.[0];
    result.operator = assertion.operator;
    if (assertion.actual instanceof Error)
      result.rejection = {
        reason: failureCode(assertion.actual),
        operation: failedOperations.get(assertion.actual),
      };
    // Only explicitly supplied scenario labels; never serialize generated assertion payloads.
    if (
      assertion.generatedMessage === false &&
      /^[A-Za-z][A-Za-z0-9 _.,:'()/−-]{0,160}$/.test(assertion.message)
    )
      result.assertion = assertion.message;
    for (const key of ['actual', 'expected'] as const) {
      const value = assertion[key];
      if (typeof value === 'number' || typeof value === 'boolean' || value === null)
        result[key] = value;
    }
  }
  return result;
}

/** No raw SDK messages: auth/network exceptions may contain credentials or request payloads. */
export function failureCode(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'headless-request-timeout') return 'request-timeout';
    if (error.message === 'headless-deadline') return 'run-deadline';
    if (error.message === 'headless-cohort-validation-failed') return 'cohort-validation-failed';
    if (error.message === 'headless-target-validation-failed') return 'target-validation-failed';
    if (error.message === 'headless-session-cleanup-failed') return 'session-cleanup-failed';
    if (error.name === 'AssertionError') return 'assertion-failed';
    if (/Could not fetch JWKS/.test(error.message) && /HTTP 429\b/.test(error.message))
      return 'auth-key-discovery-rate-limited';
    if (/\b429\b|too many requests/i.test(error.message)) return 'rate-limited';
    if (/timed out|timeout/i.test(error.message)) return 'backend-or-network-timeout';
  }
  return 'operation-failed';
}

export async function bounded<T>(
  operation: Promise<T>,
  milliseconds = 15_000,
  timeoutMessage: 'headless-request-timeout' | 'headless-deadline' = 'headless-request-timeout',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Fresh accounts and real public operations only. Session ownership stays with this runner. */
export async function createActor(
  role: string,
  runId: string,
  config: { url: string; siteUrl: string; origin: string; active(): boolean },
  retain: (session: ActorSession) => void,
): Promise<Actor> {
  const storage = new Map<string, string>();
  const auth = createAuthClient({
    baseURL: config.siteUrl,
    fetchOptions: { headers: { Origin: config.origin }, timeout: 15_000 },
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
  const client = new ConvexHttpClient(config.url, { logger: false });
  const ready = () => {
    if (!config.active()) throw new Error('headless-deadline');
  };
  const actor: Actor = {
    async query<T>(name: string, args: Record<string, unknown>) {
      ready();
      return operation(
        `query:${name}`,
        client.query(
          makeFunctionReference<'query', Record<string, Value>, T>(name),
          args as Record<string, Value>,
        ),
      );
    },
    async mutation<T>(name: string, args: Record<string, unknown>) {
      ready();
      return operation(
        `mutation:${name}`,
        client.mutation(
          makeFunctionReference<'mutation', Record<string, Value>, T>(name),
          args as Record<string, Value>,
        ),
      );
    },
  };
  // Retain before signup so partial authentication setup still attempts session cleanup.
  retain({
    actor,
    async close() {
      const result = await bounded(auth.signOut());
      if (result.error) throw new Error('headless-session-cleanup-failed');
    },
  });
  ready();
  const signup = await bounded(
    auth.signUp.email({
      email: `headless-${role}-${runId}@example.test`,
      password: `${crypto.randomUUID()}-aA9!`,
      name: `Headless ${role} ${runId}`,
    }),
  );
  if (signup.error) throw new Error(signup.error.message ?? 'headless-signup-failed');
  const jwt = await bounded(auth.convex.token());
  if (jwt.error || !jwt.data?.token) throw new Error(jwt.error?.message ?? 'headless-token-failed');
  client.setAuth(jwt.data.token);
  await actor.mutation('auth:ensureProfile', {});
  return actor;
}
