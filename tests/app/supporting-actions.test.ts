import { runCulturePresets } from '../../scripts/headless/culture-presets';
// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { makeFunctionReference } from 'convex/server';
import type { Value } from 'convex/values';
import { internal } from '../../convex/_generated/api';
import { account, backend } from './fixtures/table';
import type { Actor, ScenarioContext } from '../../scripts/headless/character-client';
import {
  runSupportingChoices,
  runSupportingTable,
} from '../../scripts/headless/supporting-actions';

async function context(): Promise<ScenarioContext> {
  const t = backend();
  await t.action(internal.content.reseed, {});
  const actors = {} as ScenarioContext['actors'];
  for (const role of ['director', 'player', 'peer'] as const) {
    const { client } = await account(t, `Supporting${role}`);
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
    runId: 'convex-test-v83',
    run: async (_name, fn) => {
      await fn();
      return true;
    },
    skip: (_name, reason) => {
      expect.fail(reason);
    },
  };
}
// Proves persisted legal supporting choices do not drop prose/embedded grants or keep replaced
// actions; covers all ordinary kit signatures' action metadata beyond pure evaluator tests.
test('supporting choices persist their action grants and replacement through public routes', async () => {
  await runSupportingChoices(await context());
});
// Adds the effective table/review boundary and resource/history proof: Recovery restoration must
// not heal the hero, execute at zero, or leak actions from an unapproved character revision.
test('supporting table actions preserve manual semantics, costs, history and review boundaries', async () => {
  await runSupportingTable(await context());
});

// Catches presets changing ancestry, stale skill choices, missing language defaults and bespoke data loss.
test('all culture presets persist source defaults with independent ancestry and editable aspects', async () => {
  await runCulturePresets(await context());
});
