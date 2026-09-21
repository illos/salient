// SPDX-License-Identifier: GPL-3.0-only
/** Source expectations were researched before implementation; no generated evaluator snapshots. */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import {
  getDefinitions,
  FURY_LEVEL_TWO_PERK_GROUPS,
} from '../shared/content/character-decisions.ts';
import { definitions as levelOneDefinitions } from '../shared/content/level-one-decisions.ts';
import { indexDecisions, isAvailable, pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { Provenance, SelectionValue } from '../shared/contracts/characterEvaluation.ts';
import { readPinnedSource } from './helpers/pinned-source.ts';

const fixture = JSON.parse(readFileSync('tests/fixtures/v32-fury-level-two.json', 'utf8'));
const oldFixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));
const bethell = JSON.parse(readFileSync('tests/fixtures/v25-bethell.json', 'utf8'));
const selections = fixture.selections as Record<string, SelectionValue>;
const definitions = getDefinitions(2);
const evaluate = (values = selections, level = 2, content = getDefinitions(level)) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: fixture.compendiumRevision,
      level,
      selections: values,
    },
    content,
  );
const numericFields = [
  'level',
  'staminaMaximum',
  'recoveriesMaximum',
  'recoveryValue',
  'windedValue',
  'speed',
  'stability',
  'disengage',
  'savingThrowThreshold',
  'renown',
  'wealth',
] as const;
const normalize = (text: string) =>
  text
    .replace(/\[([^[\]]*)\]\([^()]*\)/g, '$1')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function assertQuote(provenance: Provenance) {
  assert.equal(provenance.source.revision, fixture.compendiumRevision);
  const text = readPinnedSource(
    process.cwd(),
    join(process.cwd(), 'vendor/steel-compendium', provenance.source.path),
  );
  assert.ok(
    normalize(text).includes(normalize(provenance.source.quote)),
    `${provenance.decisionId}: quote missing from ${provenance.source.path}`,
  );
}

test('V32 complete level-two Grug matches the independent expected values and every grant', () => {
  const result = evaluate();
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  const baseline = result.baseline!;
  for (const key of numericFields) assert.equal(baseline[key].value, fixture.expected[key], key);
  for (const key of [
    'ancestry',
    'class',
    'subclass',
    'career',
    'size',
    'potencyCharacteristic',
  ] as const)
    assert.equal(baseline[key].value, fixture.expected[key], key);
  for (const key of ['characteristics', 'potency'] as const)
    assert.deepEqual(
      Object.fromEntries(Object.entries(baseline[key]).map(([name, value]) => [name, value.value])),
      fixture.expected[key],
    );
  for (const key of ['skills', 'languages', 'traits', 'features', 'perks', 'abilities'] as const)
    assert.deepEqual(
      baseline[key].map(row => row.name).sort(),
      [...fixture.expected[key]].sort(),
      key,
    );
  assert.equal(baseline.kit!.staminaBonusApplied.value, 9);
  assert.equal(baseline.kit!.echelon.value, 1);
  assert.equal(baseline.heroicResource.name.value, 'ferocity');
  const newAbility = baseline.abilities.find(row => row.name === 'Wrecking Ball')!;
  assert.equal(newAbility.kind, 'heroic');
  assert.deepEqual(newAbility.cost, { resource: 'ferocity', amount: 5 });
  assert.equal(newAbility.kitBonusesIncluded, false);
  assert.equal(
    newAbility.sourcePath,
    'en/unified/md/feature/ability/fury/level-2/wrecking-ball.md',
  );
});

test('V32 progression adds a sourced Stamina contribution and new grant provenance without changing level-one provenance', () => {
  const baseline = evaluate().baseline!;
  const old = evaluate(oldFixture.selections, 1).baseline!;
  assert.deepEqual(baseline.staminaMaximum.provenance.slice(0, -1), old.staminaMaximum.provenance);
  const increase = baseline.staminaMaximum.provenance.at(-1)!;
  assert.equal(increase.decisionId, 'class.fury.level-2.stamina');
  assert.equal(increase.operation, 'add');
  assert.equal(increase.amount, 9);
  assertQuote(increase);
  for (const entry of baseline.level.provenance) assertQuote(entry);
  for (const entry of [...baseline.features, ...baseline.perks, ...baseline.abilities]) {
    if (entry.provenance.decisionId.startsWith('class.fury.level-2.')) {
      assertQuote(entry.provenance);
      assert.ok(
        readPinnedSource(
          process.cwd(),
          join(process.cwd(), 'vendor/steel-compendium', entry.sourcePath),
        ).length,
      );
    }
  }
  const rawFury = readFileSync('vendor/steel-compendium/en/unified/md/class/fury.md', 'utf8');
  const start = Number(/^starting_stamina: (\d+)$/m.exec(rawFury)![1]);
  const perLevel = Number(/^stamina_per_level: (\d+)$/m.exec(rawFury)![1]);
  assert.equal(start + perLevel + 9, fixture.expected.staminaMaximum);
  assert.equal(Math.floor(fixture.expected.staminaMaximum / 3), fixture.expected.recoveryValue);
  assert.equal(Math.floor(fixture.expected.staminaMaximum / 2), fixture.expected.windedValue);
});

test('V37 extends the level-one definitions while preserving both existing builds byte-identically', () => {
  assert.equal(getDefinitions(1).supportingChoicesVersion, 'v37');
  for (const previous of [oldFixture, bethell]) {
    const input = {
      definitionsSchemaVersion: 'r01.1' as const,
      compendiumRevision: previous.compendiumRevision,
      level: 1,
      selections: previous.selections,
    };
    assert.equal(
      JSON.stringify(evaluateCharacter(input, getDefinitions(1))),
      JSON.stringify(evaluateCharacter(input, levelOneDefinitions)),
    );
  }
  assert.ok(
    !levelOneDefinitions.steps
      .flatMap(step => step.decisions)
      .some(row => row.id.startsWith('class.fury.level-2.')),
  );
});

test('V32 Special Delivery is the alternate legal Berserker choice with exact cost and source', () => {
  const result = evaluate({
    ...selections,
    'class.fury.level-2.aspect-ability': 'Special Delivery',
  });
  assert.equal(result.status, 'complete');
  const chosen = result.baseline!.abilities.find(row => row.name === 'Special Delivery')!;
  assert.equal(chosen.sourcePath, 'en/unified/md/feature/ability/fury/level-2/special-delivery.md');
  assert.deepEqual(chosen.cost, { resource: 'ferocity', amount: 5 });
  assert.ok(!result.baseline!.abilities.some(row => row.name === 'Wrecking Ball'));
  const source = readFileSync('vendor/steel-compendium/' + chosen.sourcePath, 'utf8');
  assert.match(source, /action_type: '\[Maneuver\]/);
  assert.match(source, /target: One willing ally/);
  assert.match(source, /ignores the target's \[stability\]/);
});

test('V37 supports all 22 source-eligible Fury perks and still refuses ineligible groups', () => {
  assert.deepEqual(
    Object.values(FURY_LEVEL_TWO_PERK_GROUPS).map(group => group.length),
    [6, 10, 6],
  );
  const perk = indexDecisions(definitions).get('class.fury.level-2.perk')!;
  assert.equal(perk.options!.length, 22);
  assert.deepEqual(
    perk
      .options!.filter(option => option.supportedInV001)
      .map(option => option.value)
      .sort(),
    Object.values(FURY_LEVEL_TWO_PERK_GROUPS).flat().sort(),
  );
  for (const option of perk.options!) {
    assert.ok(
      readFileSync('vendor/steel-compendium/' + option.source, 'utf8').includes(
        'scc: mcdm.heroes.v1/perk/',
      ),
    );
    const result = evaluate({ ...selections, 'class.fury.level-2.perk': option.value });
    // Area of Expertise additionally requires an owned crafting-skill target.
    assert.equal(
      result.status,
      option.value === 'Area of Expertise' ? 'incomplete' : 'complete',
      option.value,
    );
  }
  const ineligible = evaluate({ ...selections, 'class.fury.level-2.perk': 'Arcane Trick' });
  assert.equal(ineligible.status, 'invalid');
  assert.equal(ineligible.diagnostics['class.fury.level-2.perk'][0].code, 'value-not-in-pool');
});

test('V32 requires exactly the new transition choices and refuses other aspects, missing choices and multiple abilities', () => {
  for (const id of ['class.fury.level-2.perk', 'class.fury.level-2.aspect-ability']) {
    const values = { ...selections };
    delete values[id];
    const result = evaluate(values);
    assert.equal(result.status, 'incomplete');
    assert.equal(result.diagnostics[id][0].code, 'required-choice-missing');
  }
  for (const illegal of [
    'Death... Death!',
    'Phalanx-Breaker',
    'Apex Predator',
    'Visceral Roar',
    ['Wrecking Ball', 'Special Delivery'],
  ]) {
    const result = evaluate({ ...selections, 'class.fury.level-2.aspect-ability': illegal });
    assert.equal(result.status, 'invalid');
    assert.equal(
      result.diagnostics['class.fury.level-2.aspect-ability'][0].code,
      'value-not-in-pool',
    );
    assert.ok(
      !result.partial?.abilities?.some(
        row => row.provenance.decisionId === 'class.fury.level-2.aspect-ability',
      ),
    );
  }
});

test('V32 level and class support are explicit and never silently evaluated as level one', () => {
  for (const level of [-1, 0, 4, 10, 1.5, Number.NaN, Infinity]) {
    const result = evaluate(oldFixture.selections, level);
    assert.equal(result.status, 'unsupported', String(level));
    assert.equal(result.baseline, null);
    assert.equal(result.diagnostics['class.level'][0].code, 'unsupported-option');
    assert.notEqual(result.partial?.level?.value, 1);
  }
  const unsupportedClass = evaluate(bethell.selections, 2);
  assert.equal(unsupportedClass.status, 'unsupported');
  assert.equal(unsupportedClass.baseline, null);
  assert.equal(unsupportedClass.partial?.level?.value, 2);
  assert.equal(unsupportedClass.diagnostics['class.choice'][0].code, 'unsupported-option');
  assert.equal(evaluate(selections, 2, getDefinitions(1)).status, 'invalid');
  assert.equal(evaluate({ ...selections, 'class.choice': 'not-a-class' }).baseline, null);
});

test('V32 class and aspect changes invalidate only dependent progression choices and grants', () => {
  const decisions = indexDecisions(definitions);
  const changes: Record<string, SelectionValue>[] = [
    { 'class.choice': 'Elementalist' },
    { 'class.fury.aspect': 'Reaver' },
  ];
  for (const change of changes) {
    const changed = { ...selections, ...change };
    for (const id of [
      'class.fury.level-2.perk',
      'class.fury.level-2.aspect-ability',
      'class.fury.level-2.aspect-feature',
    ])
      assert.equal(isAvailable(decisions.get(id)!, changed, decisions), false, id);
    const pruned = pruneUnavailable(changed, definitions);
    assert.ok(pruned.removed.includes('class.fury.level-2.perk'));
    assert.ok(pruned.removed.includes('class.fury.level-2.aspect-ability'));
    assert.equal(pruned.selections['career.soldier.perk'], 'Teamwork');
    const result = evaluate(changed);
    assert.equal(result.baseline, null);
    assert.ok(!result.partial?.features?.some(row => row.name === 'Unstoppable Force'));
    assert.ok(!result.partial?.abilities?.some(row => row.name === 'Wrecking Ball'));
    assert.ok(!result.partial?.perks?.some(row => row.name === 'Danger Sense'));
  }
});

test('V32 retained level-scaling ancestry traits use the new level without acquiring new selections', () => {
  const hybrid = Object.fromEntries(
    Object.entries(selections).filter(([id]) => !id.startsWith('ancestry.')),
  ) as Record<string, SelectionValue>;
  for (const [id, value] of Object.entries(bethell.selections))
    if (id.startsWith('ancestry.')) hybrid[id] = value as SelectionValue;
  const result = evaluate(hybrid);
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  assert.equal(result.baseline!.damageImmunities![0].value.value, 4);
  assert.equal(
    result.baseline!.damageImmunities![0].value.provenance[0].source.quote,
    'You have corruption immunity equal to your level + 2.',
  );
  assert.deepEqual(
    result.baseline!.skills.map(row => row.name).sort(),
    oldFixture.expected.skills.filter((name: string) => name !== 'Persuade').sort(),
  );
});
