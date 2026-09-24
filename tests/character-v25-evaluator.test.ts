// SPDX-License-Identifier: GPL-3.0-only
/** Expectations are the independently source-audited Bethell fixture, not evaluator snapshots. */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { definitions } from '../shared/content/level-one-decisions.ts';
import { assignCharacteristic, assignmentContext } from '../shared/evaluate/assignment.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { EvaluationInput, SelectionValue } from '../shared/contracts/characterEvaluation.ts';
import { vendorPath } from '../scripts/lib/vendor.ts';

const fixture = JSON.parse(readFileSync('tests/fixtures/v25-bethell.json', 'utf8'));
const selections = fixture.selections as Record<string, SelectionValue>;
const evaluate = (values = selections) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: fixture.compendiumRevision,
      level: 1,
      selections: values,
    },
    definitions,
  );

test('V25 retains the independently re-audited Fury totals and every grant', () => {
  const fury = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));
  const result = evaluate(fury.selections);
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  const baseline = result.baseline!;
  for (const key of [
    'level',
    'ancestry',
    'class',
    'subclass',
    'career',
    'staminaMaximum',
    'recoveriesMaximum',
    'recoveryValue',
    'windedValue',
    'speed',
    'stability',
    'size',
    'disengage',
    'potencyCharacteristic',
    'savingThrowThreshold',
    'renown',
    'wealth',
  ] as const)
    assert.equal(baseline[key].value, fury.expected[key], key);
  for (const key of ['characteristics', 'potency'] as const)
    assert.deepEqual(
      Object.fromEntries(Object.entries(baseline[key]).map(([name, value]) => [name, value.value])),
      fury.expected[key],
    );
  for (const key of ['skills', 'languages', 'traits', 'features', 'perks', 'abilities'] as const)
    assert.deepEqual(
      baseline[key].map(grant => grant.name).sort(),
      [...fury.expected[key]].sort(),
      key,
    );
  assert.equal(baseline.heroicResource.name.value, fury.expected.heroicResource);
  assert.equal(baseline.kit?.name.value, fury.expected.kit);
});

test('V25 complete corrected Bethell matches every independent baseline and granted content expectation', () => {
  const result = evaluate();
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  const baseline = result.baseline!;
  const expected = fixture.expected;
  for (const key of [
    'level',
    'ancestry',
    'class',
    'subclass',
    'career',
    'staminaMaximum',
    'recoveriesMaximum',
    'recoveryValue',
    'windedValue',
    'speed',
    'stability',
    'size',
    'disengage',
    'potencyCharacteristic',
    'savingThrowThreshold',
    'renown',
    'wealth',
  ] as const)
    assert.equal(baseline[key].value, expected[key], key);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(baseline.characteristics).map(([key, value]) => [key, value.value]),
    ),
    expected.characteristics,
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(baseline.potency).map(([key, value]) => [key, value.value])),
    expected.potency,
  );
  assert.equal(baseline.heroicResource.name.value, expected.heroicResource);
  assert.equal(baseline.heroicResource.startingValue.value, 0);
  assert.equal(baseline.kit, null);
  for (const key of ['skills', 'languages', 'traits', 'features', 'perks', 'abilities'] as const)
    assert.deepEqual(baseline[key].map(value => value.name).sort(), [...expected[key]].sort(), key);
  assert.deepEqual(
    baseline.abilities.filter(ability => ability.cost).map(ability => [ability.name, ability.cost]),
    [
      ['The Flesh, a Crucible', { resource: 'essence', amount: 3 }],
      ['Conflagration', { resource: 'essence', amount: 5 }],
      ['Practical Magic: Additional Square', { resource: 'essence', amount: 1 }],
      ['Explosive Assistance: Enhance', { resource: 'essence', amount: 1 }],
    ],
  );
  assert.deepEqual(
    baseline.damageImmunities?.map(row => [row.damageType, row.value.value]),
    [['corruption', 3]],
  );
  assert.deepEqual(
    baseline.conditionImmunities?.map(row => row.condition),
    ['frightened'],
  );
  const magic = baseline.skills.find(skill => skill.name === 'Magic')!;
  assert.equal(magic.provenance.decisionId, 'career.mages-apprentice.skill.magic');
  assert.equal(magic.additionalProvenance?.[0]?.decisionId, 'class.elementalist.skill.magic');
  assert.equal(
    baseline.skills.find(skill => skill.name === 'Empathize')!.provenance.decisionId,
    'class.elementalist.magic-replacement',
  );
});

test('V25 raw Forge illegal Creative choice and unresolved fixed Magic collision are diagnosed', () => {
  const raw: Record<string, SelectionValue> = {
    ...selections,
    'culture.upbringing.skill': 'Empathize',
    'class.elementalist.skills': ['Alchemy', 'Blacksmithing', 'Tailoring'],
  };
  delete raw['class.elementalist.magic-replacement'];
  const result = evaluate(raw);
  assert.equal(result.status, 'invalid');
  assert.equal(result.diagnostics['culture.upbringing.skill']?.[0]?.code, 'value-not-in-pool');
  assert.equal(
    result.diagnostics['class.elementalist.magic-replacement']?.[0]?.code,
    'required-choice-missing',
  );
  assert.equal(result.partial?.skills?.filter(skill => skill.name === 'Magic').length, 1);
  assert.ok(
    evaluate({ ...selections, 'class.elementalist.magic-replacement': 'Magic' }).diagnostics[
      'class.elementalist.magic-replacement'
    ]?.some(d => d.code === 'duplicate-skill'),
  );
});

function permutations(values: number[]): number[][] {
  if (!values.length) return [[]];
  return [...new Set(values)].flatMap(value => {
    const remainder = [...values];
    remainder.splice(remainder.indexOf(value), 1);
    return permutations(remainder).map(rest => [value, ...rest]);
  });
}
test('V25 all 34 legal Elementalist assignments preserve fixed Reason and use the same named/drag transition', () => {
  let count = 0;
  for (const array of ['2, 2, −1, −1', '2, 1, 1, −1', '2, 1, 0, 0', '1, 1, 1, 0']) {
    for (const [Might, Agility, Intuition, Presence] of permutations(
      array.split(',').map(value => Number(value.trim().replace('−', '-'))),
    )) {
      let chosen: Record<string, SelectionValue> = {
        ...selections,
        'class.elementalist.characteristic-array': array,
        'class.elementalist.array-assignment': {},
      };
      for (const [name, value] of Object.entries({
        Might: Might!,
        Agility: Agility!,
        Intuition: Intuition!,
        Presence: Presence!,
      }))
        chosen = assignCharacteristic(chosen, name, value, undefined, definitions);
      const result = evaluate(chosen);
      assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
      assert.deepEqual(
        Object.values(result.baseline!.characteristics).map(row => row.value),
        [Might, Agility, 2, Intuition, Presence],
      );
      count++;
    }
  }
  assert.equal(count, 34);
  assert.deepEqual(assignmentContext(selections, definitions)?.fixed, { Reason: 2 });
  assert.throws(
    () => assignCharacteristic(selections, 'Reason', 2, undefined, definitions),
    /fixed/,
  );
  const partial = evaluate({ ...selections, 'class.elementalist.array-assignment': { Might: -1 } });
  assert.equal(partial.status, 'incomplete');
  const invalid = evaluate({
    ...selections,
    'class.elementalist.array-assignment': {
      Might: -1,
      Agility: 2,
      Reason: 2,
      Intuition: 2,
      Presence: 1,
    },
  });
  assert.equal(invalid.status, 'invalid');
});

test('V25 class/ancestry/career changes remove dependent grants but retain independent choices and authored text', () => {
  const switched = pruneUnavailable({ ...selections, 'class.choice': 'Fury' }, definitions);
  assert.ok(switched.removed.includes('class.elementalist.magic-replacement'));
  assert.ok(!Object.keys(switched.selections).some(id => id.startsWith('class.elementalist.')));
  assert.equal(switched.selections['culture.upbringing.skill'], 'Tailoring');
  assert.equal(switched.selections['details.name'], 'Bethell');
  const result = evaluate(switched.selections);
  assert.equal(result.status, 'incomplete');
  assert.ok(!result.partial?.abilities?.some(row => row.name === 'Hurl Element'));
  assert.equal(result.partial?.abilityModifiers, undefined);
  const career = pruneUnavailable({ ...selections, 'career.choice': 'Soldier' }, definitions);
  assert.ok(career.removed.includes('class.elementalist.magic-replacement'));
  assert.equal(career.selections['class.elementalist.specialization'], 'Fire');
  const ancestry = pruneUnavailable({ ...selections, 'ancestry.choice': 'Devil' }, definitions);
  assert.ok(ancestry.removed.includes('ancestry.polder.purchased-traits'));
  assert.equal(evaluate(ancestry.selections).partial?.damageImmunities, undefined);
});

test('V25 composition preserves legacy Fury values while V101 exposes embedded uses', () => {
  const file = JSON.parse(
    readFileSync('shared/content/character-evaluation-examples.json', 'utf8'),
  );
  const oldInput = file.examples.complete.input as EvaluationInput;
  const expanded = evaluateCharacter(oldInput, definitions);
  // V101 exposes two uses already printed inside these legacy source abilities.
  // Assert the exact delta, then retain the complete old output/provenance comparison.
  const additions = ['Lines of Force: Enhance', 'Out of the Way!: Follow'];
  assert.deepEqual(
    expanded
      .baseline!.abilities.filter(a => additions.includes(a.name))
      .map(a => a.name)
      .sort(),
    [...additions].sort(),
  );
  expanded.baseline!.abilities = expanded.baseline!.abilities.filter(
    a => !additions.includes(a.name),
  );
  assert.deepEqual(expanded, file.examples.complete.expected);
  const oldChoices = oldInput.selections;
  const polderFury = {
    ...oldChoices,
    'ancestry.choice': 'Polder',
    'ancestry.polder.purchased-traits': selections['ancestry.polder.purchased-traits']!,
  };
  const result = evaluate(pruneUnavailable(polderFury, definitions).selections);
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  assert.equal(result.baseline!.staminaMaximum.value, 30);
  assert.equal(result.baseline!.disengage.value, 2);
  assert.equal(result.baseline!.heroicResource.name.value, 'ferocity');
});

const normalizedSource = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/[*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
test('V25 every derived provenance sentence is present in the pinned Compendium and every grant is readable', () => {
  const baseline = evaluate().baseline!;
  const citations: { path: string; revision: string; quote: string }[] = [];
  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return;
    const row = value as Record<string, unknown>;
    if (
      typeof row.path === 'string' &&
      typeof row.quote === 'string' &&
      typeof row.revision === 'string'
    )
      citations.push(row as (typeof citations)[number]);
    for (const child of Object.values(row)) visit(child);
  }
  visit(baseline);
  assert.ok(citations.length >= 60);
  for (const citation of citations) {
    assert.equal(citation.revision, fixture.compendiumRevision);
    const source = normalizedSource(
      readFileSync(vendorPath(`vendor/steel-compendium/${citation.path}`), 'utf8'),
    );
    assert.ok(
      source.includes(normalizedSource(citation.quote)),
      `${citation.path}: ${citation.quote}`,
    );
  }
  const manifest = JSON.parse(readFileSync('shared/content/compendium/manifest.json', 'utf8'));
  const entries = manifest.entries as { sourcePath: string }[];
  for (const grant of [
    ...baseline.traits,
    ...baseline.features,
    ...baseline.perks,
    ...baseline.abilities,
  ]) {
    assert.ok(
      readFileSync(vendorPath(`vendor/steel-compendium/${grant.sourcePath}`), 'utf8').length > 0,
      grant.name,
    );
    // Culture's old whole-book provenance is resolved to the background entry by the sheet reader.
    if (grant.name !== 'Culture edge')
      assert.ok(
        entries.some(entry => entry.sourcePath === `vendor/steel-compendium/${grant.sourcePath}`),
        `${grant.name} missing source content`,
      );
  }
});

test('V25 changed parent pools invalidate only choices whose eligibility actually changed', () => {
  const culture = pruneUnavailable(
    { ...selections, 'culture.environment': 'Wilderness' },
    definitions,
  );
  assert.ok(culture.removed.includes('culture.environment.skill'));
  assert.equal(culture.selections['culture.organization.skill'], 'Gymnastics');
  assert.equal(culture.selections['details.name'], 'Bethell');
  const array = pruneUnavailable(
    { ...selections, 'class.elementalist.characteristic-array': '1, 1, 1, 0' },
    definitions,
  );
  assert.ok(array.removed.includes('class.elementalist.array-assignment'));
  assert.equal(array.selections['class.elementalist.ability-3'], 'The Flesh, a Crucible');
});
