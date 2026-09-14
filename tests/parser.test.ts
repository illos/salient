import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadScenario, loadMonster, loadHeroAbility } from '../src/content.ts';
import { parseAbility } from '../src/parser.ts';
import type { AbilitySource } from '../src/contracts.ts';

test('source-grounded fixtures and ordinary monster/hero grammar', async () => {
  const s = await loadScenario({ includeSquad: true });
  assert.equal(s.abilities['mountain:pain-for-pain'].kitBonusesIncluded, true);
  assert.equal(s.abilities['fury:brutal-slam'].kitBonusesIncluded, undefined);
  assert.equal(s.state.entities.fury.maxStamina, 30); // Fury21 + Mountain9
  assert.equal(s.state.entities.fury.stability, 2);
  assert.deepEqual(s.state.entities.fury.meleeDamageBonus, [0, 0, 4]);
  assert.equal(s.state.squads['spine-squad'].stamina, 20); // four minions x 5
  assert.equal(s.state.entities['spine-1'].freeStrikeDamage, 2);
  assert.deepEqual(parseAbility(s.abilities['warrior:spear-charge']).tiers, [
    [{ kind: 'damage', amount: { constant: 3 } }],
    [{ kind: 'damage', amount: { constant: 4 } }],
    [{ kind: 'damage', amount: { constant: 5 } }],
  ]);
  const slam = parseAbility(s.abilities['fury:brutal-slam']);
  assert.deepEqual(slam.diagnostics, []);
  assert.deepEqual(slam.roll, { constant: 0, characteristic: 'M' });
  assert.deepEqual(slam.tiers[2], [
    { kind: 'damage', amount: { constant: 9, characteristic: 'M' } },
    { kind: 'push', distance: 4 },
  ]);
  const bury = parseAbility(s.abilities['warrior:bury-the-point']);
  assert.deepEqual(bury.diagnostics, []);
  assert.deepEqual(bury.cost, { resource: 'malice', amount: 2 });
  assert.deepEqual(bury.tiers[0][1], {
    kind: 'condition',
    characteristic: 'M',
    threshold: 0,
    condition: 'bleeding',
    duration: 'save ends',
  });
  assert.deepEqual(parseAbility(s.abilities['spine:axe']).diagnostics, []);
});

test('homebrew renaming, numeric changes and composition use the same grammar', async () => {
  const original = (await loadScenario()).abilities['warrior:bury-the-point'];
  const homebrew: AbilitySource = {
    ...original,
    id: 'homebrew:ember-hook',
    name: 'Ember Hook',
    cost: '3 Ferocity',
    text: original.text
      .replace('Bury the Point', 'Ember Hook')
      .replace('2 [Malice](scc.v1:mcdm.monsters.v1/rule.monster/malice)', '3 Ferocity')
      .replace('5 damage;', '10 fire damage; push 2;'),
    tiers: [
      '10 fire damage; push 2; M < 0 bleeding (save ends)',
      original.tiers![1],
      original.tiers![2],
    ],
  };
  const result = parseAbility(homebrew);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.cost, { resource: 'ferocity', amount: 3 });
  assert.deepEqual(result.tiers[0].slice(0, 2), [
    { kind: 'damage', amount: { constant: 10 }, damageType: 'fire' },
    { kind: 'push', distance: 2 },
  ]);
});

test('extra mechanical text blocks automation even when structured tiers look supported', async () => {
  const original = (await loadScenario()).abilities['warrior:spear-charge'];
  for (const extra of [
    '\n> **Effect:** The target cannot be adjacent to an ally.',
    '\n> - The target also explodes.',
  ]) {
    const result = parseAbility({ ...original, text: original.text + extra });
    assert.ok(result.diagnostics.some(value => value.includes('Unsupported body text')));
  }
  const edited = parseAbility({ ...original, tiers: ['99 damage', '4 damage', '5 damage'] });
  assert.ok(edited.diagnostics.includes('Structured tiers differ from full text.'));
});

test('contradictory cost and extra title mechanics cannot be skipped', async () => {
  const s = await loadScenario();
  assert.ok(
    parseAbility({ ...s.abilities['warrior:bury-the-point'], cost: '1 Malice' }).diagnostics.some(
      value => value.includes('title'),
    ),
  );
  assert.ok(
    parseAbility({ ...s.abilities['fury:out-of-the-way'], cost: '1 Ferocity' }).diagnostics.some(
      value => value.includes('cost differs'),
    ),
  );
  const original = s.abilities['warrior:spear-charge'];
  assert.ok(
    parseAbility({
      ...original,
      text: original.text.replace('Signature Ability', 'Signature Ability; cannot target heroes'),
    }).diagnostics.some(value => value.includes('title')),
  );
});

test('hero selected options preserve additional effects and report manual requirements', async () => {
  const s = await loadScenario();
  for (const id of [
    'fury:out-of-the-way',
    'fury:thunder-roar',
    'fury:lines-of-force',
    'mountain:pain-for-pain',
  ]) {
    assert.ok(parseAbility(s.abilities[id]).diagnostics.length > 0, id);
  }
  assert.match(s.abilities['fury:thunder-roar'].text, /one at a time/);
});

test('unseen monster ability retains an unsupported charge rider', async () => {
  // Separate from the fixture; verifies a real, supported construction.
  const { entity, abilities } = await loadMonster(
    'monster/human/statblock/human-raider',
    'holdout',
    'holdout',
  );
  const handaxes = abilities.find(ability => ability.name === 'Handaxes')!;
  assert.ok(handaxes);
  assert.ok(entity.traits.some(value => value.startsWith('unsupported-field:immunities:')));
  assert.match(handaxes.text, /ranged/);
  const parsed = parseAbility(handaxes);
  assert.deepEqual(parsed.tiers[2], [{ kind: 'damage', amount: { constant: 3 } }]);
  assert.ok(parsed.diagnostics.some(value => value.includes('free strike')));
});

test('malformed roll/tier syntax is surfaced, never evaluated', async () => {
  const original = (await loadScenario()).abilities['warrior:spear-charge'];
  const source = { ...original, text: original.text.replace('3 damage', 'process.exit() damage') };
  assert.ok(parseAbility(source).diagnostics.some(value => value.includes('Unsupported tier 1')));
});

test('full hero text preserves known JSON projection omissions', async () => {
  const magma = await loadHeroAbility(
    'feature/ability/elementalist/level-6/magma-titan',
    'holdout:magma',
  );
  const stasis = await loadHeroAbility(
    'feature/ability/talent/level-6/stasis-field',
    'holdout:stasis',
  );
  assert.ok(
    parseAbility(magma).diagnostics.some(value => value.includes('They have fire immunity 10.')),
  );
  assert.ok(
    parseAbility(stasis).diagnostics.some(value =>
      value.includes('targets each enemy in the area.'),
    ),
  );
});
