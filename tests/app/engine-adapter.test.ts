// SPDX-License-Identifier: GPL-3.0-only
// The engine adapter calls the pure engine in src/ in-process from the Convex side and returns its
// structured resolution unchanged. No dice, no database. Expected values are the engine's documented
// rejection contract (src/engine.ts validates state before any command), not derived by running it.
import { expect, test } from 'vitest';
import { ENGINE, evaluate } from '../../convex/lib/engine';
import { backend } from './fixtures/table';
import type { GameState } from '../../src/contracts';

const state: GameState = { entities: {}, squads: {}, round: 1, malice: 0, pending: [] };

test('the adapter is the in-process TypeScript engine and returns structured outcomes', async () => {
  expect(ENGINE).toEqual({
    module: 'src/engine.ts',
    language: 'typescript',
    placement: 'in-process',
  });
  const t = backend();
  // Called from inside a mutation context, as a registered operation would call it.
  const resolution = await t.run(async () =>
    evaluate({
      kind: 'manual',
      state,
      command: { kind: 'manual', id: 'm1', reason: 'fixture', changes: [] },
    }),
  );
  expect(resolution.status).toBe('rejected');
  expect(resolution.messages).toEqual(['Manual command has no changes or pending completion.']);
  expect(resolution.state).toEqual(state);
  const invalid = evaluate({
    kind: 'manual',
    state: { ...state, round: 0 },
    command: {
      kind: 'manual',
      id: 'm2',
      reason: 'fixture',
      changes: [{ kind: 'round', value: 1 }],
    },
  });
  expect(invalid.status).toBe('rejected');
  expect(invalid.messages).toEqual(['Invalid game state.']);
});
