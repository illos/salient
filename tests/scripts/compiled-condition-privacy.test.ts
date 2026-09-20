// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest';
import { publicCompiledResult } from '../../convex/lib/compiledResults';
import type { CompiledResult } from '../../shared/contracts/compiledResult';
import type { CompiledConditionOutcome } from '../../shared/resolve/compiledOutcome';

const effect: CompiledConditionOutcome = {
  kind: 'condition',
  nodeId: 'condition',
  targetId: 'hero',
  locator: 'tier:2:1',
  clause: 'M < 1, bleeding (save ends)',
  status: 'applied',
  after: 'damage',
  characteristic: 'M',
  threshold: 1,
  thresholdSource: { kind: 'printed', value: 1 },
  targetScore: -1,
  condition: 'bleeding',
  duration: 'save-ends',
  requirements: [],
};
const result = {
  version: 1,
  revision: 'use',
  definition: { source: { path: 'goblin-warrior.md' } },
  inputs: { privateFacts: 'never public' },
  effects: [{ id: 'occurrence', useEventId: 'use', revision: 'use', effect }],
} as unknown as CompiledResult;

describe('compiled potency audience projection', () => {
  it('keeps the public inequality and outcome while excluding scores and stored inputs', () => {
    for (const foeIds of [new Set<string>(), new Set(['hero'])]) {
      const projected = publicCompiledResult(result, foeIds, false, true);
      expect(projected).not.toHaveProperty('inputs');
      expect(projected.effects[0]!.effect).not.toHaveProperty('targetScore');
      expect(projected.effects[0]!.effect).toMatchObject({
        clause: effect.clause,
        status: 'applied',
        threshold: 1,
      });
    }
    // Projection does not mutate the saved facts needed by correction.
    expect(result.effects[0]!.effect).toHaveProperty('targetScore', -1);
  });
  it('reveals scores only to the Director or an explicitly authorized target controller', () => {
    expect(publicCompiledResult(result, new Set(), true, false).effects[0]!.effect).toHaveProperty(
      'targetScore',
      -1,
    );
    expect(
      publicCompiledResult(result, new Set(), false, false, new Set(['hero'])).effects[0]!.effect,
    ).toHaveProperty('targetScore', -1);
    expect(
      publicCompiledResult(result, new Set(['hero']), false, false, new Set(['hero'])).effects[0]!
        .effect,
    ).not.toHaveProperty('targetScore');
    expect(
      publicCompiledResult(result, new Set(), false, false, new Set(['different-hero'])).effects[0]!
        .effect,
    ).not.toHaveProperty('targetScore');
  });
});
