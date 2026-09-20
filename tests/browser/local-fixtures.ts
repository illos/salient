// SPDX-License-Identifier: GPL-3.0-only
// Browser fixtures: a hero admitted through the real A02 path (create, save the hero-fixture
// selections, submit, Director approval) using the headless CLI with each account's own
// credentials, so the table sees an evaluated build and R03 live values, never a seeded row.
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';

export interface Credentials {
  email: string;
  password: string;
}

/** One legitimately issued session per fixture actor; callers must close it in finally. */
export async function authenticatedFixtureCli(credentials: Credentials) {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // Explicit hosted environment variables also work.
  }
  const siteUrl = process.env.VITE_CONVEX_SITE_URL;
  const origin = process.env.VITE_SITE_URL ?? process.env.SALIENT_TEST_URL;
  if (!siteUrl || !origin)
    throw new Error('Fixture authentication needs site URL and frontend origin.');
  const storage = new Map<string, string>();
  const auth = createAuthClient({
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
  const result = await auth.signIn.email(credentials);
  if (result.error) throw new Error(result.error.message || 'Fixture sign-in failed.');
  const close = async () => {
    const result = await auth.signOut();
    if (result.error) throw new Error('Fixture authentication session cleanup failed.');
  };
  return {
    async cli(...args: string[]) {
      // Refresh through the existing session, not another password sign-in. Never log tokens.
      const jwt = await auth.convex.token();
      if (jwt.error || !jwt.data?.token)
        throw new Error('Could not obtain fixture application token.');
      const result = await promisify(execFile)('pnpm', ['app', ...args], {
        env: {
          ...process.env,
          SALIENT_EMAIL: '',
          SALIENT_PASSWORD: '',
          SALIENT_AUTH_TOKEN: jwt.data.token,
        },
      });
      return JSON.parse(result.stdout);
    },
    close,
  };
}

/** R01 Set A (docs/hero-fixture.md) with the given name, as persisted draft selections. */
export function heroFixtureSelections(name: string) {
  const examples = JSON.parse(
    readFileSync('shared/content/character-evaluation-examples.json', 'utf8'),
  ) as { examples: { complete: { input: EvaluationInput } } };
  const definitions = JSON.parse(
    readFileSync('shared/content/fury-level-one-decisions.json', 'utf8'),
  ) as DecisionDefinitions;
  return draftSelectionsFrom(
    { ...examples.examples.complete.input.selections, 'details.name': name },
    definitions,
  );
}

/**
 * Creates `name` for `owner`, submits it to the campaign and approves it as `director` (or logs
 * it without approval when the owner is the Director). Returns the character id.
 */
export async function seedLocalHero(
  campaignId: string,
  name: string,
  owner: Credentials,
  director: Credentials,
): Promise<string> {
  const ownerSession = await authenticatedFixtureCli(owner);
  let directorSession: Awaited<ReturnType<typeof authenticatedFixtureCli>> | undefined;
  try {
    const cli = ownerSession.cli;
    const authored = { name, appearance: '', biography: '', notes: 'Private audit fixture note' };
    const characterId: string = await cli(
      'mutation',
      'characters:create',
      JSON.stringify({ commandId: crypto.randomUUID(), authored }),
    );
    await cli(
      'mutation',
      'characters:save',
      JSON.stringify({
        commandId: crypto.randomUUID(),
        characterId,
        expectedRevision: 1,
        authored,
        selections: heroFixtureSelections(name),
      }),
    );
    await cli(
      'mutation',
      'characters:submit',
      JSON.stringify({ commandId: crypto.randomUUID(), characterId, campaignId }),
    );
    if (owner.email !== director.email) {
      directorSession = await authenticatedFixtureCli(director);
      await directorSession.cli(
        'mutation',
        'characters:approve',
        JSON.stringify({ commandId: crypto.randomUUID(), characterId }),
      );
    }
    return characterId;
  } finally {
    await Promise.all([ownerSession.close(), directorSession?.close()]);
  }
}
