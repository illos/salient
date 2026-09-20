// SPDX-License-Identifier: GPL-3.0-only
/**
 * V94 Tactician level one. Every expected value comes from tests/fixtures/v94-tactician-expected.json,
 * the independently source-derived ledger (four witnesses: one per doctrine plus a second Insurgent
 * with the equal-overlap kit pair), never from the evaluator.
 */
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v94-tactician-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type {
  KitBenefit,
  KitContributions,
  SelectionValue,
} from '../shared/contracts/characterEvaluation.ts';

type Selections = Record<string, SelectionValue>;
const definitions = getDefinitions(1);
const witnesses = ledger.witnesses.map(witness => ({
  ...witness,
  selections: witness.selections as Selections,
}));
const shiningSniper = witnesses[0]!;
const artistMountain = witnesses[1]!;
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
const FIELDS: Record<KitBenefit, keyof KitContributions> = {
  stamina: 'staminaBonusPerEchelon',
  speed: 'speedBonus',
  stability: 'stabilityBonus',
  disengage: 'disengageBonus',
  meleeDamage: 'meleeDamageBonus',
  rangedDamage: 'rangedDamageBonus',
  meleeDistance: 'meleeDistanceBonus',
  rangedDistance: 'rangedDistanceBonus',
};
const bonuses = (kit: KitContributions) =>
  Object.fromEntries(Object.entries(FIELDS).map(([benefit, field]) => [benefit, kit[field].value]));

// Catches any drift between the Tactician's derived baseline (Field Arsenal vitals, Reason potency,
// Focus, doctrine grants, both kit signatures, ability lists) and the source-derived ledger for all
// three doctrines, all three arrays and the three kinds of kit pair.
test('V94 every ledger witness evaluates complete with the source-derived baseline', () => {
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
    // Field Arsenal: both kits are listed with their printed bonuses; `kit` is the resolved arsenal.
    assert.deepEqual(
      hero.kits?.map(kit => kit.name.value),
      expected.kits,
      label('kits'),
    );
    assert.equal(hero.kits![0]!.name.value, expected.kit, label('first kit'));
    assert.equal(hero.kit?.name.value, expected.kits.join(' and '), label('arsenal name'));
    assert.deepEqual(bonuses(hero.kit!), expected.mergedKitBonuses, label('arsenal bonuses'));
    for (const kit of hero.kits!) {
      const printed = expected.printedKitBonuses[
        kit.name.value as keyof typeof expected.printedKitBonuses
      ] as Record<string, unknown>;
      const actual = bonuses(kit);
      for (const [benefit, value] of Object.entries(printed))
        assert.deepEqual(actual[benefit], value, label(`${kit.name.value} printed ${benefit}`));
    }
    for (const key of ['skills', 'languages', 'traits', 'features', 'perks', 'abilities'] as const)
      assert.deepEqual(names(hero[key]), sorted(expected[key]), label(key));
    const ability = (name: string) => hero.abilities.find(entry => entry.name === name)!;
    assert.deepEqual(
      ability(witness.selections['class.tactician.ability-3'] as string).cost,
      { resource: 'focus', amount: 3 },
      label('3-Focus cost'),
    );
    assert.deepEqual(
      ability(witness.selections['class.tactician.ability-5'] as string).cost,
      { resource: 'focus', amount: 5 },
      label('5-Focus cost'),
    );
    const triggered = {
      Insurgent: 'Advanced Tactics',
      Mastermind: 'Overwatch',
      Vanguard: 'Parry',
    }[witness.selections['class.tactician.doctrine'] as string]!;
    assert.equal(ability(triggered).kind, 'aspect-triggered', label('doctrine triggered action'));
    const signatures = hero.abilities.filter(entry => entry.kind === 'kit-signature');
    assert.equal(signatures.length, 2, label('two kit signatures'));
    assert.ok(
      signatures.every(entry => entry.kitBonusesIncluded),
      label('signatures include kit bonuses'),
    );
    // The losing kit's signature carries the source's whole-tuple replacement arithmetic.
    const replacements = hero.abilities.flatMap(entry =>
      (entry.kitBonusReplacements ?? []).map(replacement => ({
        ability: entry.name,
        benefit: replacement.benefit,
        fromKit: replacement.fromKit,
        toKit: replacement.toKit,
        subtract: replacement.subtract,
        add: replacement.add,
      })),
    );
    assert.deepEqual(
      replacements,
      expected.kitBonusReplacements.map(({ ability, benefit, fromKit, toKit, subtract, add }) => ({
        ability,
        benefit,
        fromKit,
        toKit,
        subtract,
        add,
      })),
      label('kit bonus replacements'),
    );
  }
});

// Catches the two-skill count, a skill outside the printed list, a repeated chosen skill, Lead,
// a doctrine skill from the wrong group, the same kit twice, an arsenal choice naming a kit the hero
// does not use, and a Shadow array leaking into the Tactician pool.
test('V94 skill, kit, arsenal and array violations are diagnosed with no baseline', () => {
  const skills = shiningSniper.selections['class.tactician.skills'] as string[];
  const cases: [string, Selections, string, string][] = [
    [
      'third skill',
      { ...shiningSniper.selections, 'class.tactician.skills': [...skills, 'Ride'] },
      'class.tactician.skills',
      'count-mismatch',
    ],
    [
      'skill outside the printed list',
      { ...shiningSniper.selections, 'class.tactician.skills': [skills[0]!, 'Nature'] },
      'class.tactician.skills',
      'value-not-in-pool',
    ],
    [
      'doctrine skill chosen again',
      {
        ...shiningSniper.selections,
        'class.tactician.doctrine-skill': 'Search',
        'class.tactician.skills': [skills[0]!, 'Search'],
      },
      'class.tactician.skills',
      'duplicate-skill',
    ],
    [
      'Lead chosen again (not in the printed list)',
      { ...shiningSniper.selections, 'class.tactician.skills': [skills[0]!, 'Lead'] },
      'class.tactician.skills',
      'value-not-in-pool',
    ],
    [
      'doctrine skill from another group',
      { ...shiningSniper.selections, 'class.tactician.doctrine-skill': 'Magic' },
      'class.tactician.doctrine-skill',
      'value-not-in-pool',
    ],
    [
      'same kit twice',
      { ...shiningSniper.selections, 'class.tactician.second-kit': 'Shining Armor' },
      'class.tactician.second-kit',
      'value-not-in-pool',
    ],
    [
      'arsenal choice names an unused kit',
      { ...artistMountain.selections, 'class.tactician.arsenal.stamina': 'Sniper' },
      'class.tactician.arsenal.stamina',
      'value-not-in-pool',
    ],
    [
      'Shadow array',
      { ...shiningSniper.selections, 'class.tactician.characteristic-array': '2, 2, −1, −1' },
      'class.tactician.characteristic-array',
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
});

// Catches a missing second kit or a missing arsenal choice on a differing benefit passing as
// complete, and an arsenal decision appearing for a benefit the kits do not both grant.
test('V94 a missing second kit or arsenal choice is incomplete; equal or single benefits need none', () => {
  const noSecond = { ...shiningSniper.selections };
  delete noSecond['class.tactician.second-kit'];
  const missingKit = evaluate(noSecond);
  assert.equal(missingKit.status, 'incomplete');
  assert.equal(missingKit.baseline, null);
  const diagnostic = missingKit.diagnostics['class.tactician.second-kit']?.find(
    d => d.code === 'required-choice-missing',
  );
  assert.ok(diagnostic, JSON.stringify(missingKit.diagnostics));
  assert.equal(diagnostic.source?.path, 'en/unified/md/feature/tactician/level-1/field-arsenal.md');
  assert.equal(
    diagnostic.source?.quote,
    'You can use and gain the benefits of two kits, including both their signature abilities.',
  );
  // Shining Armor + Sniper: no benefit overlaps, so no arsenal decision may be demanded.
  assert.ok(
    !Object.keys(evaluate(shiningSniper.selections).diagnostics).some(id =>
      id.startsWith('class.tactician.arsenal.'),
    ),
  );
  // Martial Artist + Mountain differ on Stamina and melee damage only.
  const noChoice = { ...artistMountain.selections };
  delete noChoice['class.tactician.arsenal.stamina'];
  const missingChoice = evaluate(noChoice);
  assert.equal(missingChoice.status, 'incomplete');
  assert.equal(missingChoice.baseline, null);
  assert.ok(
    missingChoice.diagnostics['class.tactician.arsenal.stamina']?.some(
      d => d.code === 'required-choice-missing',
    ),
    JSON.stringify(missingChoice.diagnostics),
  );
  assert.deepEqual(
    missingChoice.diagnostics['class.tactician.arsenal.stamina']![0]!.source?.quote,
    "If both kits grant you the same benefit, you take one or the other and can't change your choice until you finish a respite.",
  );
  // Martial Artist + Swashbuckler print equal values: taken once, no decision offered.
  const equal = evaluate(witnesses[3]!.selections);
  assert.equal(equal.status, 'complete');
  assert.ok(!Object.keys(equal.diagnostics).some(id => id.startsWith('class.tactician.arsenal.')));
  assert.equal(equal.baseline!.kit!.staminaBonusApplied.value, 3);
});

// Catches a doctrine change that leaves the old doctrine's skill, feature or triggered action
// behind, and a first-kit change that keeps arsenal choices naming the replaced kit.
test('V94 replacing the doctrine or the first kit revokes what depended on it and keeps the rest', () => {
  const changed = pruneUnavailable(
    { ...shiningSniper.selections, 'class.tactician.doctrine': 'Vanguard' },
    definitions,
  );
  // The Insurgent's intrigue skill is not an interpersonal option, so it is removed with the doctrine.
  assert.deepEqual(changed.removed, ['class.tactician.doctrine-skill']);
  for (const id of [
    'career.choice',
    'ancestry.choice',
    'kit.choice',
    'class.tactician.second-kit',
    'class.tactician.ability-3',
  ])
    assert.deepEqual(changed.selections[id], shiningSniper.selections[id], id);
  const result = evaluate({ ...changed.selections, 'class.tactician.doctrine-skill': 'Persuade' });
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  const hero = result.baseline!;
  assert.equal(hero.subclass.value, 'Vanguard');
  const skills = names(hero.skills);
  assert.ok(!skills.includes('Hide') && skills.includes('Persuade'));
  const abilities = names(hero.abilities);
  assert.ok(!abilities.includes('Advanced Tactics') && abilities.includes('Parry'));
  const features = names(hero.features);
  assert.ok(!features.includes('Covert Operations') && features.includes('Commanding Presence'));

  const rekitted = pruneUnavailable(
    { ...artistMountain.selections, 'kit.choice': 'Shining Armor' },
    definitions,
  );
  assert.deepEqual(rekitted.removed.sort(), [
    'class.tactician.arsenal.meleeDamage',
    'class.tactician.arsenal.stamina',
  ]);
  const pending = evaluate(rekitted.selections);
  assert.equal(pending.status, 'incomplete');
  assert.ok(pending.diagnostics['class.tactician.arsenal.stamina']);
  // Shining Armor + Mountain also differ on stability (+1 vs +2), a benefit the old pair did not share.
  assert.ok(pending.diagnostics['class.tactician.arsenal.stability']);
  const resolved = evaluate({
    ...rekitted.selections,
    'class.tactician.arsenal.stamina': 'Shining Armor',
    'class.tactician.arsenal.stability': 'Mountain',
    'class.tactician.arsenal.meleeDamage': 'Mountain',
  });
  assert.equal(resolved.status, 'complete', JSON.stringify(resolved.diagnostics));
  // Shining Armor Stamina +12 (kit/shining-armor.md); Mountain stability +2 and melee +0/+0/+4
  // (kit/mountain.md).
  assert.equal(resolved.baseline!.staminaMaximum.value, 21 + 12);
  assert.equal(resolved.baseline!.stability.value, 2);
  assert.deepEqual(resolved.baseline!.kit!.meleeDamageBonus.value, [0, 0, 4]);
});

// Catches Tactician decisions or the class-granted kits surviving a class change, and the Tactician
// kit parent breaking the Shadow path that the same decision still serves.
test('V94 replacing class Tactician clears both kits and its decisions; the Shadow kit path still works', () => {
  const changed = pruneUnavailable(
    { ...shiningSniper.selections, 'class.choice': 'Elementalist' },
    definitions,
  );
  assert.ok(changed.removed.includes('kit.choice'));
  for (const id of Object.keys(shiningSniper.selections).filter(id =>
    id.startsWith('class.tactician.'),
  ))
    assert.ok(changed.removed.includes(id), id);
  assert.ok(!Object.keys(changed.selections).some(id => id.startsWith('class.tactician.')));
  assert.equal(changed.selections['kit.choice'], undefined);
  assert.equal(changed.selections['career.choice'], shiningSniper.selections['career.choice']);
  const shadow = pruneUnavailable(
    {
      ...shiningSniper.selections,
      'class.choice': 'Shadow',
      'class.tactician.second-kit': 'Sniper',
    },
    definitions,
  );
  assert.equal(shadow.selections['kit.choice'], 'Shining Armor');
  assert.ok(shadow.removed.includes('class.tactician.second-kit'));
});
