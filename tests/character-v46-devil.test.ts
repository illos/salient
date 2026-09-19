// SPDX-License-Identifier: GPL-3.0-only
/**
 * V46 Devil level one. Every expected value comes from the pinned Compendium sentences recorded
 * in docs/build/evidence/V46/expectations.md and the fixture ledger, never from the evaluator.
 * Quotes are checked verbatim against the pinned source with the same normalization R01 uses.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import {
  TRAIT_EFFECTS,
  WINGS_WEAKNESS_SENTENCE,
  UNTYPED_DAMAGE_WEAKNESS,
  FLY_RULE,
} from '../shared/evaluate/sources.ts';
import { readPinnedSource } from './helpers/pinned-source.ts';
import type {
  DerivedBaseline,
  EvaluationResult,
  PartialBaseline,
  SelectionValue,
} from '../shared/contracts/characterEvaluation.ts';
import type { Decision } from '../shared/evaluate/definitions.ts';

const root = process.cwd();
/** The definitions the application actually serves, including the V37 supporting extensions. */
const definitions = getDefinitions(1);
const fixture = JSON.parse(readFileSync('tests/fixtures/v46-devil/templates.json', 'utf8'));
/** The amount an effect is expected to have, from the fixture ledger, never from the evaluator. */
const expectedEffect = (template: string, effect: string) =>
  fixture.templates[template].expected.conditionalEffects.find(
    (row: { effect: string }) => row.effect === effect,
  ).amount as number;
const fury = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));
const bethell = JSON.parse(readFileSync('tests/fixtures/v25-bethell.json', 'utf8'));
const bases: Record<string, Record<string, SelectionValue>> = {
  'v25-fury': fury.selections,
  'v25-bethell': bethell.selections,
};

/** R01 text normalization: links collapse to their label, emphasis drops, whitespace collapses. */
function normalize(text: string): string {
  let out = text.replace(/<br>/g, ' ');
  for (let i = 0; i < 4; i++) out = out.replace(/\[([^[\]]*)\]\([^()]*\)/g, '$1');
  out = out.replace(/\*/g, '');
  return out.replace(/\s+/g, ' ').trim();
}
const files = new Map<string, string>();
function source(relative: string): string {
  let text = files.get(relative);
  if (text === undefined) {
    text = normalize(readPinnedSource(root, join(fixture.sourceRoot, relative)));
    files.set(relative, text);
  }
  return text;
}
function verbatim(relative: string, quote: string, label: string) {
  assert.ok(source(relative).includes(normalize(quote)), `${label}: "${quote}" not in ${relative}`);
}

const all = (): Decision[] => definitions.steps.flatMap(step => step.decisions);
const decision = (id: string): Decision => {
  const found = all().find(entry => entry.id === id);
  assert.ok(found, `missing decision ${id}`);
  return found;
};

/** Build one template's selections from its audited base build. */
function selectionsFor(name: string, overrides: Record<string, SelectionValue> = {}) {
  const template = fixture.templates[name];
  const merged: Record<string, SelectionValue> = {
    ...bases[template.base],
    'ancestry.choice': 'Devil',
    'ancestry.devil.silver-tongue-skill': template.silverTongue,
    'ancestry.devil.purchased-traits': [...template.traits],
    ...(template.overrides ?? {}),
    ...overrides,
  };
  // An ancestry change drops selections whose decisions are no longer available, exactly as the
  // wizard does; nothing Polder-specific is carried into a Devil build by hand.
  return pruneUnavailable(merged, definitions).selections;
}

const evaluate = (selections: Record<string, SelectionValue>, level = 1): EvaluationResult =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: fixture.compendiumRevision,
      level,
      selections,
    },
    getDefinitions(level),
  );

const complete = (selections: Record<string, SelectionValue>): DerivedBaseline => {
  const result = evaluate(selections);
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  return result.baseline!;
};

const codesFor = (result: EvaluationResult, decisionId: string) =>
  (result.diagnostics[decisionId] ?? []).map(entry => entry.code);

test('V46 check 1: every purchased trait and interpersonal skill is offered with its sourced cost', () => {
  const traits = decision('ancestry.devil.purchased-traits');
  assert.equal(traits.shape.type, 'points');
  assert.equal((traits.shape as { budget: number }).budget, fixture.budget);
  verbatim(traits.source, traits.quote, 'purchased-traits');
  const offered = traits.options ?? [];
  assert.deepEqual(
    offered.map(option => option.value).sort(),
    Object.keys(fixture.traitCosts).sort(),
    'all seven traits are present',
  );
  for (const option of offered) {
    assert.equal(option.supportedInV001, true, `${option.value} is selectable`);
    assert.equal(option.cost, fixture.traitCosts[option.value], `${option.value} cost`);
    // The cost sentence is the source's own front matter, read back from the pinned file.
    verbatim(option.source!, option.costQuote!, `${option.value} cost sentence`);
    verbatim(option.source!, option.value, `${option.value} name`);
  }
  // The "offered set" caption exists to say which options are held back. Nothing is held back
  // now, so the metadata is gone rather than restating the list; Polder, which does hold options
  // back, never carried it either.
  assert.equal(traits.supportedSetInV001, undefined, 'no stale offered-set metadata');

  const skill = decision('ancestry.devil.silver-tongue-skill');
  verbatim(skill.source, skill.quote, 'silver-tongue-skill');
  assert.deepEqual(
    [...(skill.supportedInV001 ?? [])].sort(),
    [...fixture.interpersonalSkills].sort(),
    'all thirteen interpersonal skills are supported',
  );
  // Eligibility still comes from the pool, which this unit does not widen.
  assert.equal(skill.optionsFrom, 'pool.skills.interpersonal');
  assert.deepEqual(
    [...definitions.pools['pool.skills.interpersonal']!.values].sort(),
    [...fixture.interpersonalSkills].sort(),
  );
  for (const value of fixture.interpersonalSkills)
    verbatim('en/unified/md/skill/group/interpersonal.md', value, 'interpersonal pool');
});

test('V46 check 1: the assembled Devil rows quote the pinned source verbatim', () => {
  for (const row of all().filter(entry => entry.id.startsWith('ancestry.devil.'))) {
    verbatim(row.source, row.quote, row.id);
    for (const rule of [row.budgetRule, row.poolRule, row.baseRule, row.choiceRule])
      if (rule?.quote) verbatim(rule.source, rule.quote, `${row.id} rule`);
    for (const grant of row.grants ?? [])
      if (grant.source) verbatim(grant.source, grant.value, `${row.id} grant`);
    for (const option of row.options ?? [])
      for (const grant of option.grants ?? []) {
        if (grant.source) verbatim(grant.source, grant.value, `${row.id} ${option.value} grant`);
        if (grant.quote) verbatim(grant.source!, grant.quote, `${row.id} ${option.value} quote`);
      }
  }
});

test('V46 check 1: every trait source sentence is verbatim, including the ones nothing reads', () => {
  const traits = decision('ancestry.devil.purchased-traits');
  for (const option of traits.options ?? []) {
    const effect = TRAIT_EFFECTS[option.value];
    assert.ok(effect, `${option.value} has a source sentence`);
    verbatim(effect.sentence.path, effect.sentence.quote, `${option.value} sentence`);
    assert.equal(effect.sentence.path, option.source, `${option.value} cites its own entry`);
  }
  for (const sentence of [WINGS_WEAKNESS_SENTENCE, UNTYPED_DAMAGE_WEAKNESS, FLY_RULE])
    verbatim(sentence.path, sentence.quote, 'wings and movement rules');
  // Only Beast Legs and Impressive Horns set a baseline value; the rest carry a sentence alone.
  assert.deepEqual(
    Object.entries(TRAIT_EFFECTS)
      .filter(([, effect]) => effect.field)
      .map(([name, effect]) => [name, effect.field, effect.value])
      .sort(),
    [
      ['Beast Legs', 'speed', 6],
      ['Impressive Horns', 'savingThrowThreshold', 5],
    ],
  );
});

test('V46 check 2: the three-point budget admits and refuses the sourced combinations', () => {
  for (const scenario of fixture.budgetCases) {
    const cost = scenario.traits.reduce(
      (total: number, trait: string) => total + fixture.traitCosts[trait],
      0,
    );
    assert.equal(cost, scenario.cost, `${scenario.traits.join(' + ')} cost`);
    const result = evaluate(
      selectionsFor('A', { 'ancestry.devil.purchased-traits': scenario.traits }),
    );
    const codes = codesFor(result, 'ancestry.devil.purchased-traits');
    if (scenario.expected === 'complete') {
      assert.deepEqual(codes, [], scenario.traits.join(' + '));
      assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
    } else {
      assert.ok(codes.includes(scenario.expected), `${scenario.traits.join(' + ')} ${codes}`);
    }
  }
  // An unspent point stays a nonblocking warning, as the existing accepted policy records.
  const unspent = evaluate(
    selectionsFor('A', { 'ancestry.devil.purchased-traits': ['Beast Legs'] }),
  );
  assert.equal(unspent.status, 'complete');
  assert.equal(unspent.diagnostics['ancestry.devil.purchased-traits']?.[0]?.severity, 'warning');
});

test('V46 check 2: the signature skill stays inside the interpersonal group', () => {
  // Kept unpruned on purpose: pruneUnavailable drops a selection that no longer fits its pool,
  // so pruning first would hide the diagnostic this case exists to prove.
  const result = evaluate({
    ...selectionsFor('A'),
    'ancestry.devil.silver-tongue-skill': 'Blacksmithing',
  });
  assert.ok(codesFor(result, 'ancestry.devil.silver-tongue-skill').includes('value-not-in-pool'));
});

test('V46 check 3: templates A to D derive the source values, including the aloft minimum', () => {
  for (const name of ['A', 'B', 'C', 'D'] as const) {
    const template = fixture.templates[name];
    const expected = template.expected;
    const baseline = complete(selectionsFor(name));
    const where = `template ${name}`;
    assert.equal(baseline.size.value, expected.size, `${where} size`);
    assert.equal(baseline.speed.value, expected.speed, `${where} speed`);
    assert.equal(baseline.stability.value, expected.stability, `${where} stability`);
    assert.equal(
      baseline.savingThrowThreshold.value,
      expected.savingThrowThreshold,
      `${where} saving throws`,
    );
    if (expected.disengage !== undefined)
      assert.equal(baseline.disengage.value, expected.disengage, `${where} disengage`);
    assert.deepEqual(
      (baseline.movementModes ?? []).map(mode => mode.mode),
      expected.movementModes,
      `${where} movement modes`,
    );
    assert.deepEqual(
      (baseline.conditionalEffects ?? []).map(effect => ({
        feature: effect.feature,
        effect: effect.effect,
        amount: effect.amount.value,
      })),
      expected.conditionalEffects,
      `${where} conditional effects`,
    );
    // A conditional weakness is never an always-on one.
    assert.deepEqual(baseline.damageWeaknesses ?? [], [], `${where} unconditional weaknesses`);
    assert.deepEqual(
      (baseline.abilities ?? [])
        .filter(ability => ability.kind === 'ancestry')
        .map(ability => ability.name),
      expected.ancestryAbilities,
      `${where} ancestry abilities`,
    );
    const traitNames = baseline.traits.map(trait => trait.name);
    for (const trait of template.traits) assert.ok(traitNames.includes(trait), `${where} ${trait}`);
    assert.ok(traitNames.includes('Silver Tongue'), `${where} signature trait`);
    assert.ok(
      baseline.skills.some(skill => skill.name === expected.ancestrySkill),
      `${where} ${expected.ancestrySkill}`,
    );
    for (const removed of expected.removedPolderTraits ?? [])
      assert.ok(!traitNames.includes(removed), `${where} dropped ${removed}`);
  }
});

test('V46 check 3: each trait contributes exactly what its own sentence states', () => {
  const only = (trait: string) =>
    complete(selectionsFor('A', { 'ancestry.devil.purchased-traits': [trait] }));
  // Traits whose effect is manual change no baseline number and add no conditional amount.
  for (const trait of ['Hellsight', 'Prehensile Tail', 'Glowing Eyes']) {
    const baseline = only(trait);
    assert.equal(baseline.speed.value, 5, `${trait} leaves speed alone`);
    assert.equal(baseline.savingThrowThreshold.value, 6, `${trait} leaves saving throws alone`);
    assert.deepEqual(baseline.movementModes ?? [], [], `${trait} grants no movement`);
    assert.deepEqual(baseline.conditionalEffects ?? [], [], `${trait} calculates nothing`);
    const granted = baseline.traits.find(entry => entry.name === trait)!;
    assert.equal(granted.affects, undefined, `${trait} claims no baseline contribution`);
  }
  // Glowing Eyes is readable as an ability as well as a trait; nothing activates it.
  const glowing = only('Glowing Eyes').abilities.find(entry => entry.name === 'Glowing Eyes')!;
  assert.equal(glowing.kind, 'ancestry');
  assert.equal(glowing.sourcePath, 'en/unified/md/feature/trait/devil/glowing-eyes.md');
  assert.equal(glowing.cost, undefined);
  assert.equal(glowing.kitBonusesIncluded, false);
  // The grant names the option that carried it, not just the points decision, and records that
  // the trigger, roll and damage are the table's.
  assert.equal(glowing.provenance.decisionId, 'ancestry.devil.purchased-traits');
  assert.equal(glowing.provenance.selection, 'Glowing Eyes');
  assert.match(glowing.provenance.note ?? '', /resolved manually/);
  // A build without that trait carries no such note anywhere, so the projection cannot be
  // showing a manual marker on grants that never claimed one.
  const plain = complete(selectionsFor('A'));
  assert.equal(
    [...plain.abilities, ...plain.traits, ...plain.features, ...plain.perks].some(
      entry => entry.provenance.note,
    ),
    false,
  );
  // The traits that do set a value say which one.
  assert.deepEqual(only('Beast Legs').traits.find(entry => entry.name === 'Beast Legs')!.affects, [
    'speed',
  ]);
  assert.deepEqual(
    only('Impressive Horns').traits.find(entry => entry.name === 'Impressive Horns')!.affects,
    ['savingThrowThreshold'],
  );
});

test('V46 check 3: Beast Legs sets speed 6, and the kit bonus then adds to it', () => {
  const { kit, withBeastLegs, withoutBeastLegs } = fixture.setNotAdd;
  const withTrait = complete(
    selectionsFor('A', {
      'kit.choice': kit,
      'ancestry.devil.purchased-traits': ['Beast Legs', 'Impressive Horns'],
    }),
  );
  const without = complete(
    selectionsFor('A', {
      'kit.choice': kit,
      'ancestry.devil.purchased-traits': ['Barbed Tail', 'Prehensile Tail'],
    }),
  );
  assert.equal(withTrait.speed.value, withBeastLegs);
  assert.equal(without.speed.value, withoutBeastLegs);
});

test('V46 check 3: Wings cites the trait, the fly rule and the untyped weakness rule', () => {
  const baseline = complete(selectionsFor('C'));
  const fly = baseline.movementModes!.find(mode => mode.mode === 'Fly')!;
  assert.equal(fly.sourcePath, 'en/unified/md/feature/trait/devil/wings.md');
  assert.equal(fly.ruleSourcePath, 'en/unified/md/movement/fly.md');
  verbatim(fly.sourcePath, fly.condition!, 'fly condition');
  verbatim(fly.provenance.source.path, fly.provenance.source.quote, 'fly provenance');
  const weakness = baseline.conditionalEffects!.find(
    effect => effect.effect === 'damage-weakness',
  )!;
  assert.equal(weakness.damageType, 'all-damage', 'the literal the resolution contract documents');
  verbatim(weakness.sourcePath, weakness.condition, 'weakness condition');
  const cited = weakness.amount.provenance.map(entry => entry.source.path);
  assert.ok(
    cited.includes('en/unified/md/rule/damage/damage-weakness.md'),
    'an untyped weakness cites the rule that makes it apply to any damage type',
  );
  for (const entry of weakness.amount.provenance)
    verbatim(entry.source.path, entry.source.quote, 'weakness provenance');
  const aloft = baseline.conditionalEffects!.find(effect => effect.effect === 'rounds-aloft')!;
  // The amount is pinned to the ledger's independent constant first. Comparing it only against
  // `Math.max(1, baseline.characteristics.M.value)` would re-derive the expectation from the same
  // evaluator under test, so a wrong Might would satisfy it; the relation is checked after.
  assert.equal(
    aloft.amount.value,
    expectedEffect('C', 'rounds-aloft'),
    'rounds aloft matches the expectation ledger',
  );
  assert.equal(aloft.amount.value, Math.max(1, baseline.characteristics.M.value));
  assert.equal(
    weakness.amount.value,
    expectedEffect('C', 'damage-weakness'),
    'the weakness matches the expectation ledger',
  );
  // The Fury's Might is fixed by its class, not assigned from the array, so the limit carries
  // whatever provenance actually supplied the score rather than a guessed decision id.
  assert.deepEqual(
    aloft.amount.provenance.slice(1),
    baseline.characteristics.M.provenance,
    'the aloft limit carries the provenance of the Might score it reads',
  );
  assert.ok(aloft.amount.provenance.length > 1, 'and cites more than the trait sentence alone');
});

test('V46 check 3: Barbed Tail calculates the highest characteristic score, not a fixed bonus', () => {
  const baseline = complete(selectionsFor('B'));
  const scores = Object.values(baseline.characteristics).map(entry => entry.value);
  const effect = baseline.conditionalEffects!.find(
    entry => entry.effect === 'extra-strike-damage',
  )!;
  // Ledger constant first, for the same reason as the aloft limit above.
  assert.equal(
    effect.amount.value,
    expectedEffect('B', 'extra-strike-damage'),
    'extra strike damage matches the expectation ledger',
  );
  assert.equal(effect.amount.value, Math.max(...scores));
  verbatim(effect.sourcePath, effect.condition, 'barbed tail condition');
  // It must never become an automatically applied damage modifier. Asserting the whole list is
  // absent is the real claim: a `some()` over provenance would pass for a Fury no matter what.
  assert.equal(baseline.abilityModifiers, undefined, 'no automatic damage modifier');
});

test('V46 check 4: every interpersonal choice grants that skill on its witness template', () => {
  for (const entry of fixture.witnessLedger.filter(
    (row: { kind: string }) => row.kind === 'silver-tongue-skill',
  )) {
    const baseline = complete(
      selectionsFor(entry.template, { 'ancestry.devil.silver-tongue-skill': entry.option }),
    );
    const granted = baseline.skills.find(skill => skill.name === entry.option);
    assert.ok(granted, `${entry.option} granted on template ${entry.template}`);
    assert.equal(granted.group, 'interpersonal', `${entry.option} group`);
  }
});

test('V46 check 4: choosing an already-granted skill keeps the existing duplicate handling', () => {
  for (const scenario of fixture.duplicateCases) {
    const result = evaluate(
      selectionsFor(scenario.template, {
        'ancestry.devil.silver-tongue-skill': scenario.choice,
      }),
    );
    assert.ok(
      codesFor(result, 'ancestry.devil.silver-tongue-skill').includes(scenario.expected),
      `${scenario.template}/${scenario.choice}: ${scenario.reason}`,
    );
  }
});

test('V46 check 5: deselecting a trait or leaving Devil removes its contributions', () => {
  const flying = complete(selectionsFor('C'));
  assert.ok(flying.movementModes?.length);
  const grounded = complete(
    selectionsFor('C', { 'ancestry.devil.purchased-traits': ['Barbed Tail', 'Prehensile Tail'] }),
  );
  assert.deepEqual(grounded.movementModes ?? [], []);
  assert.deepEqual(
    (grounded.conditionalEffects ?? []).map(effect => effect.feature),
    ['Barbed Tail'],
  );
  assert.equal(
    grounded.abilities.some(ability => ability.name === 'Glowing Eyes'),
    false,
  );

  // Changing ancestry away from Devil drops every Devil grant and keeps the class build.
  const polder = pruneUnavailable(
    { ...selectionsFor('C'), 'ancestry.choice': 'Polder' },
    definitions,
  ).selections;
  const result = evaluate(polder);
  const partial: PartialBaseline = result.baseline ?? result.partial!;
  assert.deepEqual(partial.movementModes ?? [], []);
  assert.deepEqual(partial.conditionalEffects ?? [], []);
  assert.equal(
    (partial.traits ?? []).some(trait => trait.name === 'Silver Tongue' || trait.name === 'Wings'),
    false,
  );
  assert.equal(partial.savingThrowThreshold?.value, 6);
  assert.equal(partial.class?.value, 'Fury');
  assert.equal(partial.career?.value, 'Soldier');
});

test('V46 check 3: the Devil contributions carry forward to the supported level two', () => {
  const levelTwo = JSON.parse(readFileSync('tests/fixtures/v32-fury-level-two.json', 'utf8'));
  const flying = {
    ...levelTwo.selections,
    'ancestry.devil.purchased-traits': ['Glowing Eyes', 'Wings'],
  };
  const result = evaluate(flying, 2);
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  const baseline = result.baseline!;
  assert.equal(baseline.level.value, 2);
  assert.deepEqual(
    (baseline.movementModes ?? []).map(mode => mode.mode),
    ['Fly'],
    'flight carries forward',
  );
  // "at 3rd level or lower" still holds at level two, so the weakness is still recorded, and the
  // aloft limit still reads the same Might. Both numbers are source-derived rather than read back
  // out of the evaluator: `class/fury.md:29` "You start with a Might of 2 and an Agility of 2",
  // and this fixture's `class.fury.array-assignment` places only Intuition, Reason and Presence,
  // so nothing reassigns Might; `max(1, 2)` is 2. The weakness amount is the trait's printed 5.
  const FURY_MIGHT = 2;
  assert.deepEqual(
    (baseline.conditionalEffects ?? []).map(effect => [effect.effect, effect.amount.value]),
    [
      ['rounds-aloft', Math.max(1, FURY_MIGHT)],
      ['damage-weakness', 5],
    ],
  );
  // And the fixture really does leave Might alone, so the constant above is about this build.
  assert.equal(baseline.characteristics.M.value, FURY_MIGHT, 'the fixture does not reassign Might');
  assert.deepEqual(baseline.damageWeaknesses ?? [], []);
  assert.ok(baseline.abilities.some(ability => ability.kind === 'ancestry'));
  // The unchanged level-two reference keeps its own values.
  const unchanged = evaluate(levelTwo.selections, 2);
  assert.equal(unchanged.status, 'complete');
  assert.equal(unchanged.baseline!.speed.value, levelTwo.expected.speed);
  assert.equal(
    unchanged.baseline!.savingThrowThreshold.value,
    levelTwo.expected.savingThrowThreshold,
  );
  assert.deepEqual(unchanged.baseline!.movementModes ?? [], []);
  assert.deepEqual(unchanged.baseline!.conditionalEffects ?? [], []);
});

test('V46 check 5: changing the signature skill moves the grant with it', () => {
  const before = complete(selectionsFor('A'));
  assert.ok(before.skills.some(skill => skill.name === 'Persuade'));
  const after = complete(
    selectionsFor('A', { 'ancestry.devil.silver-tongue-skill': 'Read Person' }),
  );
  assert.ok(after.skills.some(skill => skill.name === 'Read Person'));
  assert.equal(
    after.skills.some(skill => skill.name === 'Persuade'),
    false,
    'the previous choice stops granting its skill',
  );
});

test('V46: no new class, ancestry or level becomes supported', () => {
  const level = getDefinitions(2);
  const devil = level.steps
    .flatMap(step => step.decisions)
    .find(entry => entry.id === 'ancestry.devil.purchased-traits');
  assert.ok(devil, 'level two still composes the Devil rows');
  const unsupported = evaluate(selectionsFor('A'), 3);
  assert.equal(unsupported.status, 'unsupported');
  const ancestries = decision('ancestry.choice');
  assert.deepEqual(
    (ancestries.options ?? [])
      .filter(option => option.supportedInV001)
      .map(option => option.value)
      .sort(),
    ['Devil', 'Polder'],
    'this unit adds no other ancestry',
  );
});
