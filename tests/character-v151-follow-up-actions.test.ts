// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import followUps from './fixtures/v151-follow-up-actions.json' with { type: 'json' };
import elementalist from './fixtures/v135-elementalist-three-expected.json' with { type: 'json' };
import elementalistOne from './fixtures/v104-elementalist-expected.json' with { type: 'json' };
import talent from './fixtures/v136-talent-three-expected.json' with { type: 'json' };
import talentOne from './fixtures/v105-talent-expected.json' with { type: 'json' };
import beastheart from './fixtures/v137-beastheart-three-expected.json' with { type: 'json' };
import beastheartOne from './fixtures/v106-beastheart-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { elementalistAbilitySource } from '../shared/evaluate/elementalistAbilities.ts';
import { talentAbilitySource } from '../shared/evaluate/talentAbilities.ts';
import { beastheartAbilitySource } from '../shared/evaluate/beastheartAbilities.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const evaluate = (selections: Selections, level: number) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: followUps.compendiumRevision,
      level,
      selections,
    },
    getDefinitions(level),
  );
const baseOf = (
  one: { witnesses: { id: string; selections: unknown }[] },
  id: string,
): Selections => one.witnesses.find(b => b.id === id)!.selections as Selections;
/** Level-3 witness builds from each class ledger, with the parent swapped into each ability slot. */
const builds: Record<string, ((parent: string) => Selections[])[]> = {
  Elementalist: Object.values(elementalist.witnesses).map(w => (parent: string) => {
    const l3 = {
      ...baseOf(elementalistOne, w.base),
      'class.elementalist.level-2.perk': w.levelTwo.addedSelections.perk,
      'class.elementalist.level-2.ability-5': w.levelTwo.addedSelections.ability5,
      'class.elementalist.level-3.ability-7': w.levelThree.addedSelections.ability7,
    };
    return [
      l3,
      { ...l3, 'class.elementalist.level-2.ability-5': parent },
      { ...l3, 'class.elementalist.level-3.ability-7': parent },
    ];
  }),
  Talent: Object.values(talent.witnesses).map(w => (parent: string) => {
    const slot = `class.talent.level-2.${w.tradition.toLowerCase()}-ability`;
    const l3 = {
      ...baseOf(talentOne, w.base),
      'class.talent.level-2.perk': w.levelTwo.addedSelections.perk,
      [slot]: w.levelTwo.addedSelections.traditionAbility,
      'class.talent.level-3.ability-7': w.levelThree.addedSelections.ability7,
    };
    return [l3, { ...l3, [slot]: parent }];
  }),
  Beastheart: Object.values(beastheart.witnesses).map(w => (parent: string) => {
    const slot = `class.beastheart.level-2.${w.wildNature.toLowerCase()}-ability`;
    const l3 = {
      ...baseOf(beastheartOne, w.base),
      'class.beastheart.level-2.perk': w.levelTwo.addedSelections.perk,
      [slot]: w.levelTwo.addedSelections.natureAbility,
      'class.beastheart.level-3.ability-7': w.levelThree.addedSelections.ability7,
    };
    return [l3, { ...l3, [slot]: parent }, { ...l3, 'class.beastheart.level-3.ability-7': parent }];
  }),
};
const sourceOf: Record<string, typeof elementalistAbilitySource> = {
  Elementalist: elementalistAbilitySource,
  Talent: talentAbilitySource,
  Beastheart: beastheartAbilitySource,
};

test('each source-granted follow-up action is its own sheet entry beside its parent', () => {
  for (const action of followUps.actions) {
    const hero = builds[action.class]!.flatMap(build => build(action.parent))
      .map(selections => evaluate(selections, 3))
      .find(
        r =>
          r.status === 'complete' &&
          [...r.baseline!.features, ...r.baseline!.abilities].some(p =>
            p.name.endsWith(action.parent),
          ),
      )?.baseline;
    assert.ok(hero, `${action.name}: a complete level-3 build with ${action.parent}`);
    const record = hero.abilities.find(a => a.name === action.name);
    assert.ok(record, action.name);
    assert.ok(record.activationCondition, action.name);
    assert.equal(record.cost, undefined, `${action.name} costs nothing extra`);
    const source = sourceOf[action.class]!(record);
    assert.equal(source?.actionType, action.actionType, action.name);
    // The record carries its source file, which prints the clause (link markup removed).
    assert.ok(
      source.text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').includes(action.quote),
      `${action.name} quotes ${action.source}`,
    );
  }
});

test('the great-cat jump waits for the great cat at 3rd level', () => {
  const jump = followUps.actions.find(a => a.name.endsWith('Great Cat Jump'))!;
  const [green] = builds
    .Elementalist!.flatMap(build => build(jump.parent))
    .filter(selections =>
      evaluate(selections, 3).baseline?.features.some(f => f.name === jump.parent),
    );
  assert.ok(green);
  const two = evaluate(
    Object.fromEntries(Object.entries(green).filter(([id]) => !id.includes('.level-3.'))),
    2,
  ).baseline!;
  assert.ok(two.abilities.some(a => a.name === 'Disciple of the Green: Animal Form'));
  assert.ok(!two.abilities.some(a => a.name === jump.name));
  assert.ok(evaluate(green, 3).baseline!.abilities.some(a => a.name === jump.name));
});
