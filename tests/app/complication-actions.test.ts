// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { makeFunctionReference } from 'convex/server';
import type { Value } from 'convex/values';
import { internal } from '../../convex/_generated/api';
import { account, backend } from './fixtures/table';
import type { Actor, ScenarioContext } from '../../scripts/headless/character-client';
import {
  runComplicationChoices,
  runComplicationTable,
} from '../../scripts/headless/complication-actions';

async function context(): Promise<ScenarioContext> {
  const t = backend();
  await t.action(internal.content.reseed, {});
  const actors = {} as ScenarioContext['actors'];
  for (const role of ['director', 'player', 'peer'] as const) {
    const { client } = await account(t, `Complication${role}`);
    actors[role] = {
      query: <T>(name: string, args: Record<string, unknown>) =>
        client.query(
          makeFunctionReference<'query', Record<string, Value>, T>(name),
          args as Record<string, Value>,
        ),
      mutation: <T>(name: string, args: Record<string, unknown>) =>
        client.mutation(
          makeFunctionReference<'mutation', Record<string, Value>, T>(name),
          args as Record<string, Value>,
        ),
    } satisfies Actor;
  }
  return {
    actors,
    runId: 'convex-test-v85',
    run: async (_name, fn) => {
      await fn();
      return true;
    },
    skip: (_name, reason) => expect.fail(reason),
  };
}
// Failure/coverage descriptions live beside these same witnesses in the shared live API scenario.
test('complication actions persist with source timing and removed grants disappear', async () => {
  await runComplicationChoices(await context());
});
test('complication actions honor payment history and Victory-dependent availability', async () => {
  await runComplicationTable(await context());
});
