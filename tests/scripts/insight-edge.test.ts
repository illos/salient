// SPDX-License-Identifier: GPL-3.0-only
/**
 * V156, feature/shadow/level-1/insight.md: a heroic ability with a power roll "costs 1 fewer insight
 * if you have an edge or double edge on it", even against only one of several targets. Edges and
 * banes cancel first (rule/dice/power-roll.md, "Rolling With Edges and Banes").
 */
import { expect, test } from 'vitest';
import { effectiveFixedCost } from '../../shared/resolve/index.ts';

const shadow = {
  edgeCostReduction: { resource: 'insight', amount: 1, sourcePath: 'insight.md' },
};
const cost = { resource: 'insight', amount: 5 };
const target = (edges: number, banes: number) => ({ edges, banes });

test.each([
  ['an edge', [target(1, 0)], 4],
  ['a double edge', [target(2, 0)], 4],
  ['a double edge and one bane (one edge remains)', [target(2, 1)], 4],
  ['an edge and a bane (cancel)', [target(1, 1)], 5],
  ['a double edge and a double bane (cancel)', [target(2, 2)], 5],
  ['a bane only', [target(0, 1)], 5],
  ['no edge', [target(0, 0)], 5],
  ['an edge against only one of several targets', [target(0, 0), target(1, 0)], 4],
  ['edges against every target (still 1 fewer)', [target(1, 0), target(2, 0)], 4],
  ['three edges and two banes (capped double edge cancels a double bane)', [target(3, 2)], 5],
])('a Shadow with %s pays the right insight', (_label, targets, amount) => {
  expect(effectiveFixedCost(cost, shadow, targets)?.amount).toBe(amount);
});

test('only the named resource, only for a cost, never below 0, and not for other classes', () => {
  expect(effectiveFixedCost({ resource: 'focus', amount: 5 }, shadow, [target(1, 0)])).toEqual({
    resource: 'focus',
    amount: 5,
  });
  expect(effectiveFixedCost(undefined, shadow, [target(1, 0)])).toBeUndefined();
  expect(effectiveFixedCost({ resource: 'insight', amount: 0 }, shadow, [target(1, 0)])).toEqual({
    resource: 'insight',
    amount: 0,
  });
  expect(effectiveFixedCost(cost, {}, [target(1, 0)])).toEqual(cost);
});
