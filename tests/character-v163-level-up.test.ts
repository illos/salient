// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import pinned from './fixtures/v138-summoner-three-expected.json' with { type: 'json' };
import shadowSix from './fixtures/v108-shadow-six-expected.json' with { type: 'json' };
import { levelThreeBuilds } from './fixtures/level-three-builds.ts';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { levelUpTarget } from '../shared/content/character-support.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const evaluate = (selections: Selections, level: number) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: pinned.compendiumRevision,
      level,
      selections,
    },
    getDefinitions(level),
  );
const ids = (level: number) =>
  new Set(getDefinitions(level).steps.flatMap(step => step.decisions.map(d => d.id)));
const only = (selections: Selections, keep: Set<string>) =>
  Object.fromEntries(Object.entries(selections).filter(([id]) => keep.has(id)));

// docs/character-wizard-spec.md#level-up: one level per level-up, adding only that level's
// decisions to the unchanged earlier build. Each class's level-3 ledger build splits cleanly.
test('every class levels 1 → 2 → 3 by adding only each level’s new decisions', () => {
  const builds = levelThreeBuilds();
  assert.equal(new Set(builds.map(b => b.className)).size, 11);
  for (const build of builds) {
    const one = only(build.selections, ids(1));
    assert.equal(evaluate(one, 1).status, 'complete', `${build.className} level 1`);
    let current = one;
    for (const level of [2, 3]) {
      assert.deepEqual(levelUpTarget(level - 1, current), { targetLevel: level, reason: null });
      const added = only(build.selections, ids(level));
      for (const id of Object.keys(current)) delete added[id];
      current = { ...current, ...added };
      const result = evaluate(current, level);
      assert.equal(result.status, 'complete', `${build.className} level ${level}`);
    }
    assert.deepEqual(current, only(build.selections, ids(3)), build.className);
    assert.equal(
      evaluate(current, 3).baseline!.staminaMaximum.value,
      build.staminaMaximum,
      `${build.className} level-3 Stamina from its ledger`,
    );
    // Level four is Shadow only (character-support.ts); every other class stops at three.
    const four = levelUpTarget(3, current);
    assert.equal(four.reason === null, build.className === 'Shadow', build.className);
  }
});

// Shadow supports levels 4–6 (character-support.ts): its level-6 ledger builds split level by level.
test('Shadow levels 1 → 4–6, one level per level-up', () => {
  for (const witness of shadowSix.witnesses) {
    const full = witness.selections as unknown as Selections;
    let current = only(full, ids(1));
    assert.equal(evaluate(current, 1).status, 'complete', `${witness.id} level 1`);
    const top = witness.level;
    for (let level = 2; level <= top; level++) {
      assert.deepEqual(levelUpTarget(level - 1, current), { targetLevel: level, reason: null });
      const added = only(full, ids(level));
      for (const id of Object.keys(current)) delete added[id];
      current = { ...current, ...added };
      assert.equal(evaluate(current, level).status, 'complete', `${witness.id} level ${level}`);
    }
    assert.equal(
      evaluate(current, top).baseline!.staminaMaximum.value,
      witness.expected.staminaMaximum,
      witness.id,
    );
    assert.equal(levelUpTarget(top, current).reason === null, top < 6, witness.id);
  }
});
