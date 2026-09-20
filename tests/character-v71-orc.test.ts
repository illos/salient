// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import elementalist from './fixtures/v25-bethell.json' with { type: 'json' };
import traitCorpus from '../shared/content/compendium/trait.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const definitions = getDefinitions(1);
const traitsId = 'ancestry.orc.purchased-traits';
const artisanId = 'ancestry.orc.passionate-artisan.skills';
function build(
  traits: string[],
  fixture: Record<string, SelectionValue> = fury.selections,
): Record<string, SelectionValue> {
  const selections = { ...fixture };
  for (const id of Object.keys(selections)) if (id.startsWith('ancestry.')) delete selections[id];
  return { ...selections, 'ancestry.choice': 'Orc', [traitsId]: traits };
}
const evaluate = (selections: Record<string, SelectionValue>) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections,
    },
    definitions,
  );

// Catches losing kit stability or treating unlimited Catch Breath spending as extra recoveries.
test('V71 Orc quick build stacks Grounded with kit and no-kit bases without inflating healing', () => {
  for (const [fixture, stability, stamina, recoveries, healing] of [
    [fury.selections, 3, 30, 10, 10],
    [elementalist.selections, 1, 18, 8, 6],
  ] as const) {
    const result = evaluate(build(['Glowing Recovery', 'Grounded'], fixture));
    assert.equal(result.status, 'complete');
    const hero = result.baseline!;
    assert.equal(hero.size.value, '1M');
    assert.equal(hero.speed.value, 5);
    assert.equal(hero.stability.value, stability);
    assert.equal(hero.staminaMaximum.value, stamina);
    assert.equal(hero.recoveriesMaximum.value, recoveries);
    assert.equal(hero.recoveryValue.value, healing);
    assert.deepEqual(hero.traits.map(t => t.name).sort(), [
      'Glowing Recovery',
      'Grounded',
      'Relentless',
    ]);
  }
});

// Covers the other permanent grant and guards against baking a damage-triggered speed bonus into the build.
test('V71 Nonstop grants slowed immunity while Bloodfire Rush remains conditional', () => {
  const result = evaluate(build(['Nonstop', 'Bloodfire Rush']));
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.baseline!.conditionImmunities?.map(i => i.condition), ['slowed']);
  assert.equal(result.baseline!.speed.value, 5);
  assert.equal(result.baseline!.stability.value, 2);
  for (const [name, phrase] of [
    ['Relentless', 'against any creature'],
    ['Bloodfire Rush', 'until the end of the round'],
    ['Nonstop', "You can't be made"],
  ]) {
    const trait = result.baseline!.traits.find(t => t.name === name)!;
    const readable = traitCorpus.find(
      entry => entry.sourcePath === `vendor/steel-compendium/${trait.sourcePath}`,
    );
    assert.ok(readable?.text.includes(phrase), `${name} must retain its readable rule`);
  }
});

// Distinct Orc risk: Artisan targets can be unowned and must never become trained skills or ordinary bonuses.
test('V71 Artisan records owned and unowned crafting targets without granting skills', () => {
  const choices = {
    ...build(['Passionate Artisan', 'Grounded', 'Bloodfire Rush']),
    [artisanId]: ['Blacksmithing', 'Tailoring'],
  };
  const result = evaluate(choices);
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.ok(hero.skills.some(skill => skill.name === 'Blacksmithing'));
  assert.ok(!hero.skills.some(skill => skill.name === 'Tailoring'));
  assert.equal(hero.skills.find(skill => skill.name === 'Blacksmithing')!.bonus, undefined);
  const target = hero.supportingChoices?.find(choice => choice.decisionId === artisanId);
  assert.deepEqual(target?.values, ['Blacksmithing', 'Tailoring']);
  assert.ok(target?.condition?.includes('+2 on crafting-project rolls'));
  assert.equal(hero.speed.value, 5);
  assert.equal(hero.stability.value, 3);
});

// Covers child completeness, group membership and distinctness rather than only a happy-path target list.
test('V71 Artisan requires two distinct crafting targets and rejects noncrafting skills', () => {
  const choices = build(['Passionate Artisan', 'Nonstop']);
  assert.equal(evaluate(choices).status, 'incomplete');
  for (const targets of [['Alchemy'], ['Alchemy', 'Alchemy'], ['Alchemy', 'Climb']]) {
    const result = evaluate({ ...choices, [artisanId]: targets });
    assert.notEqual(result.status, 'complete');
    assert.ok(result.diagnostics[artisanId]?.length);
  }
});

// Catches a four-point loadout leaking a permanent immunity into partial evaluation.
test('V71 over-budget Orc purchases cannot grant Nonstop immunity', () => {
  const result = evaluate(build(['Glowing Recovery', 'Nonstop']));
  assert.equal(result.status, 'invalid');
  assert.equal(result.baseline, null);
  assert.ok(result.diagnostics[traitsId]?.some(d => d.code === 'budget-exceeded'));
  assert.deepEqual(result.partial!.conditionImmunities ?? [], []);
});

// Catches stale Artisan targets after either its purchased parent or the ancestry itself is replaced.
test('V71 parent edits remove Artisan targets and Orc effects while preserving unrelated choices', () => {
  const previous = {
    ...build(['Passionate Artisan', 'Nonstop']),
    [artisanId]: ['Blacksmithing', 'Tailoring'],
  };
  const changedTraits = pruneUnavailable(
    { ...previous, [traitsId]: ['Glowing Recovery', 'Grounded'] },
    definitions,
  );
  assert.ok(changedTraits.removed.includes(artisanId));
  assert.equal(evaluate(changedTraits.selections).status, 'complete');
  const changedAncestry = pruneUnavailable(
    {
      ...previous,
      'ancestry.choice': 'Polder',
      'ancestry.polder.purchased-traits': ['Corruption Immunity', 'Fearless', 'Graceful Retreat'],
    },
    definitions,
  );
  assert.ok(changedAncestry.removed.includes(artisanId));
  assert.ok(changedAncestry.removed.includes(traitsId));
  assert.equal(changedAncestry.selections['details.name'], 'Grug');
  const hero = evaluate(changedAncestry.selections).baseline!;
  assert.equal(hero.size.value, '1S');
  assert.ok(!hero.traits.some(t => t.name === 'Relentless'));
  assert.ok(!hero.conditionImmunities?.some(i => i.condition === 'slowed'));
});
