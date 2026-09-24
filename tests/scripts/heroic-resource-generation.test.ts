// SPDX-License-Identifier: GPL-3.0-only
// V120: every generation-profile clause quotes its pinned source verbatim (link markup removed), so
// a profile can't drift from the Compendium or cite the wrong file.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { vendorPath } from '../../scripts/lib/vendor.ts';
import {
  GENERATION_PROFILES,
  claimWindow,
  generationProfile,
  triggerAmount,
} from '../../shared/resolve/heroicResourceGeneration.ts';

const plain = (markdown: string) =>
  markdown.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ');

test('every profile clause is quoted verbatim from its pinned source', () => {
  for (const profile of GENERATION_PROFILES) {
    const clauses = [
      profile.combatStart,
      profile.turnStart,
      profile.encounterEnd,
      ...profile.triggers,
      ...profile.triggers.flatMap(trigger => trigger.levelAmounts ?? []),
    ];
    for (const clause of clauses) {
      expect(clause.sourcePath, profile.className).toMatch(/^vendor\/steel-compendium\/en\//);
      expect(plain(readFileSync(vendorPath(clause.sourcePath), 'utf8')), clause.quote).toContain(
        clause.quote,
      );
    }
  }
});

test('profiles are keyed by class and trigger ids are unique and slash-safe', () => {
  const classes = GENERATION_PROFILES.map(p => p.className);
  expect(new Set(classes).size).toBe(classes.length);
  const ids = GENERATION_PROFILES.flatMap(p => p.triggers.map(t => t.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z0-9]+)+$/);
});

// feature/shadow/level-1/insight.md: 1d3 at each turn start, +1 the first time each combat round
// for damage incorporating surges, and all remaining insight lost at the end of the encounter.
test('the Shadow profile matches its source amounts', () => {
  expect(GENERATION_PROFILES.find(p => p.className === 'Shadow')).toMatchObject({
    resource: 'insight',
    combatStart: { kind: 'victories' },
    turnStart: { kind: 'dice', sides: 3 },
    encounterEnd: { kind: 'lose' },
    triggers: [{ id: 'shadow-surge-damage', amount: 1, limit: 'round' }],
  });
});

test('amounts follow later features and profiles stop at their verified level', () => {
  const shadow = GENERATION_PROFILES.find(p => p.className === 'Shadow')!;
  const trigger = shadow.triggers[0]!;
  expect(triggerAmount(trigger, 3).amount).toBe(1);
  expect(triggerAmount(trigger, 4)).toMatchObject({
    amount: 2,
    sourcePath: 'vendor/steel-compendium/en/unified/md/feature/shadow/level-4/surge-of-insight.md',
  });
  const baseline = (level: number) =>
    ({
      class: { value: 'Shadow' },
      level: { value: level },
    }) as Parameters<typeof generationProfile>[0];
  expect(generationProfile(baseline(6))).toBe(shadow);
  expect(generationProfile(baseline(7))).toBeUndefined();
  expect(claimWindow('turn', { round: 2 })).toBeNull();
  expect(claimWindow('round', { round: 2 })).toEqual({ round: 2 });
});

// feature/tactician/level-1/focus.md and level-4/focus-on-their-weaknesses.md ("you gain 2 focus
// instead of 1"); level-7/heightened-focus.md changes the turn-start gain, so levels 1–6 are checked.
test('the Tactician profile matches its source amounts', () => {
  const tactician = GENERATION_PROFILES.find(p => p.className === 'Tactician')!;
  expect(tactician).toMatchObject({
    resource: 'focus',
    verifiedThroughLevel: 6,
    combatStart: { kind: 'victories' },
    turnStart: { kind: 'fixed', amount: 2 },
    encounterEnd: { kind: 'lose' },
  });
  const [marked, ally] = tactician.triggers;
  expect([marked!.id, marked!.limit, triggerAmount(marked!, 3).amount]).toEqual([
    'tactician-marked-damage',
    'round',
    1,
  ]);
  expect(triggerAmount(marked!, 4).amount).toBe(2);
  expect([ally!.id, ally!.limit, triggerAmount(ally!, 6).amount]).toEqual([
    'tactician-ally-heroic',
    'round',
    1,
  ]);
});

// feature/censor/level-1/wrath.md, level-4/wrath-beyond-wrath.md ("2 wrath instead of 1") and
// level-7/focused-wrath.md (turn-start gain 3), so levels 1–6 are checked.
test('the Censor profile matches its source amounts', () => {
  const censor = GENERATION_PROFILES.find(p => p.className === 'Censor')!;
  expect(censor).toMatchObject({
    resource: 'wrath',
    verifiedThroughLevel: 6,
    combatStart: { kind: 'victories' },
    turnStart: { kind: 'fixed', amount: 2 },
    encounterEnd: { kind: 'lose' },
    triggers: [
      { id: 'censor-judged-damaged-you', amount: 1, limit: 'round' },
      { id: 'censor-damaged-judged', amount: 1, limit: 'round' },
    ],
  });
  expect(triggerAmount(censor.triggers[0]!, 6).amount).toBe(1);
  expect(triggerAmount(censor.triggers[1]!, 4).amount).toBe(2);
});

// feature/fury/level-1/ferocity.md, level-4/damaging-ferocity.md ("2 ferocity instead of 1") and
// level-7/greater-ferocity.md (turn-start gain 1d3 + 1), so levels 1–6 are checked.
test('the Fury profile matches its source amounts', () => {
  const fury = GENERATION_PROFILES.find(p => p.className === 'Fury')!;
  expect(fury).toMatchObject({
    resource: 'ferocity',
    verifiedThroughLevel: 6,
    combatStart: { kind: 'victories' },
    turnStart: { kind: 'dice', sides: 3 },
    encounterEnd: { kind: 'lose' },
    triggers: [
      { id: 'fury-first-damage', amount: 1, limit: 'round', observe: 'damage-taken' },
      {
        id: 'fury-winded-or-dying',
        dice: { sides: 3 },
        limit: 'encounter',
        observe: 'winded-or-dying',
      },
    ],
  });
  expect(triggerAmount(fury.triggers[0]!, 4).amount).toBe(2);
});
