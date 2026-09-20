// SPDX-License-Identifier: GPL-3.0-only
/**
 * V92 Shadow level one. Every expected value comes from tests/fixtures/v92-shadow-expected.json, the
 * independently source-derived ledger (four witnesses, one per college plus a second Black Ash with
 * the remaining array), never from the evaluator.
 */
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v92-shadow-expected.json' with { type: 'json' };
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

type Selections = Record<string, SelectionValue>;
const definitions = getDefinitions(1);
const witnesses = ledger.witnesses.map(witness => ({
  ...witness,
  selections: witness.selections as Selections,
}));
const blackAsh = witnesses[0]!;
const evaluate = (selections: Selections) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections,
    },
    definitions,
  );
const names = (grants: { name: string }[]) => grants.map(grant => grant.name).sort();
const sorted = (values: readonly string[]) => [...values].sort();

// Catches any drift between the Shadow's derived baseline (kit-fed vitals, Agility potency, Insight,
// college grants, ability lists) and the source-derived ledger for all three colleges and four arrays.
test('V92 every ledger witness evaluates complete with the source-derived baseline', () => {
  for (const witness of witnesses) {
    const result = evaluate(witness.selections);
    assert.equal(result.status, 'complete', `${witness.id} ${JSON.stringify(result.diagnostics)}`);
    const hero = result.baseline!;
    const expected = witness.expected;
    const label = (field: string) => `${witness.id} ${field}`;
    assert.deepEqual(
      Object.fromEntries(Object.entries(hero.characteristics).map(([k, v]) => [k, v.value])),
      expected.characteristics,
      label('characteristics'),
    );
    for (const key of [
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'size',
      'disengage',
      'potencyCharacteristic',
      'subclass',
      'renown',
      'wealth',
    ] as const)
      assert.equal(hero[key].value, expected[key], label(key));
    for (const tier of ['weak', 'average', 'strong'] as const)
      assert.equal(hero.potency[tier].value, expected.potency[tier], label(`potency ${tier}`));
    assert.equal(hero.heroicResource.name.value, expected.heroicResource, label('resource'));
    assert.equal(
      hero.heroicResource.startingValue.value,
      expected.heroicResourceCurrent,
      label('resource start'),
    );
    assert.equal(hero.kit?.name.value, expected.kit, label('kit'));
    for (const key of ['skills', 'languages', 'traits', 'features', 'perks', 'abilities'] as const)
      assert.deepEqual(names(hero[key]), sorted(expected[key]), label(key));
    const ability = (name: string) => hero.abilities.find(entry => entry.name === name)!;
    assert.deepEqual(
      ability(witness.selections['class.shadow.ability-3'] as string).cost,
      { resource: 'insight', amount: 3 },
      label('3-Insight cost'),
    );
    assert.deepEqual(
      ability(witness.selections['class.shadow.ability-5'] as string).cost,
      { resource: 'insight', amount: 5 },
      label('5-Insight cost'),
    );
    const triggered = {
      'Black Ash': 'In All This Confusion',
      'Caustic Alchemy': 'Defensive Roll',
      'Harlequin Mask': 'Clever Trick',
    }[witness.selections['class.shadow.college'] as string]!;
    assert.equal(ability(triggered).kind, 'aspect-triggered', label('college triggered action'));
  }
});

// Catches the five-skill count, the Criminal-Underworld-only lore exception, the duplicate of a fixed
// class skill, the class-granted Kit requirement and a Fury array leaking into the Shadow pool.
test('V92 skill, kit and array violations are diagnosed with no baseline', () => {
  const skills = blackAsh.selections['class.shadow.skills'] as string[];
  const cases: [string, Selections, string, string][] = [
    [
      'sixth skill',
      { ...blackAsh.selections, 'class.shadow.skills': [...skills, 'Ride'] },
      'class.shadow.skills',
      'count-mismatch',
    ],
    [
      'other lore skill',
      { ...blackAsh.selections, 'class.shadow.skills': [...skills.slice(0, 4), 'Nature'] },
      'class.shadow.skills',
      'value-not-in-pool',
    ],
    [
      'Hide chosen again',
      { ...blackAsh.selections, 'class.shadow.skills': [...skills.slice(0, 4), 'Hide'] },
      'class.shadow.skills',
      'duplicate-skill',
    ],
    [
      'Fury array',
      { ...blackAsh.selections, 'class.shadow.characteristic-array': '2, −1, −1' },
      'class.shadow.characteristic-array',
      'value-not-in-pool',
    ],
  ];
  for (const [name, selections, decisionId, code] of cases) {
    const result = evaluate(selections);
    assert.equal(result.status, 'invalid', name);
    assert.equal(result.baseline, null, name);
    assert.ok(
      result.diagnostics[decisionId]?.some(d => d.code === code),
      `${name}: ${JSON.stringify(result.diagnostics[decisionId])}`,
    );
  }
  const noKit = { ...blackAsh.selections };
  delete noKit['kit.choice'];
  const result = evaluate(noKit);
  assert.equal(result.status, 'incomplete');
  assert.equal(result.baseline, null);
  const diagnostic = result.diagnostics['kit.choice']?.find(
    d => d.code === 'required-choice-missing',
  );
  assert.ok(diagnostic, JSON.stringify(result.diagnostics));
  assert.equal(diagnostic.source?.path, 'en/unified/md/feature/shadow/level-1/kit.md');
  assert.equal(diagnostic.source?.quote, 'You can use and gain the benefits of a kit.');
});

// Catches a college change that leaves the old college's skill, feature or actions behind or that
// prunes unrelated choices along with it.
test('V92 replacing the college revokes its skill and actions and keeps unrelated choices', () => {
  const changed = pruneUnavailable(
    { ...blackAsh.selections, 'class.shadow.college': 'Caustic Alchemy' },
    definitions,
  );
  assert.deepEqual(changed.removed, []);
  for (const id of [
    'career.choice',
    'ancestry.choice',
    'ancestry.human.purchased-traits',
    'kit.choice',
    'class.shadow.signature-ability',
  ])
    assert.deepEqual(changed.selections[id], blackAsh.selections[id], id);
  const result = evaluate(changed.selections);
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.equal(hero.subclass.value, 'Caustic Alchemy');
  const skills = names(hero.skills);
  assert.ok(!skills.includes('Magic'));
  assert.ok(skills.includes('Alchemy'));
  const abilities = names(hero.abilities);
  for (const gone of ['Black Ash Teleport', 'In All This Confusion'])
    assert.ok(!abilities.includes(gone), gone);
  for (const added of ['Coat the Blade', 'Defensive Roll'])
    assert.ok(abilities.includes(added), added);
  assert.ok(names(hero.features).includes('Smoke Bomb'));
  assert.equal(hero.kit?.name.value, blackAsh.expected.kit);
});

// Catches Shadow decisions or the class-granted kit surviving a class change, and the Shadow kit
// parent breaking the Fury aspect path that the same decision still serves.
test('V92 replacing class Shadow clears the kit and Shadow decisions; the Fury kit path still works', () => {
  const changed = pruneUnavailable(
    { ...blackAsh.selections, 'class.choice': 'Elementalist' },
    definitions,
  );
  assert.ok(changed.removed.includes('kit.choice'));
  for (const id of Object.keys(blackAsh.selections).filter(id => id.startsWith('class.shadow.')))
    assert.ok(changed.removed.includes(id), id);
  assert.ok(!Object.keys(changed.selections).some(id => id.startsWith('class.shadow.')));
  assert.equal(changed.selections['kit.choice'], undefined);
  assert.equal(changed.selections['career.choice'], blackAsh.selections['career.choice']);
  const furyResult = evaluate(fury.selections as Selections);
  assert.equal(furyResult.status, 'complete');
  assert.equal(furyResult.baseline!.kit?.name.value, fury.expected.kit);
  assert.equal(furyResult.baseline!.staminaMaximum.value, fury.expected.staminaMaximum);
});
