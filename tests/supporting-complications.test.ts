// SPDX-License-Identifier: GPL-3.0-only
/** V37 expectations from pinned complication benefits/drawbacks, not evaluator snapshots. */
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import {
  extendComplicationDefinitions,
  COMPLICATION_EFFECTS,
} from '../shared/content/supporting-complications.ts';
import { COMPLICATION_ABILITIES } from '../shared/content/supporting-complication-abilities.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { indexDecisions, poolOf, pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue, PartialBaseline } from '../shared/contracts/characterEvaluation.ts';

const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));
const definitions = () => extendComplicationDefinitions(structuredClone(getDefinitions(1)));
const selections = (complication: string, extra: Record<string, SelectionValue> = {}) => ({
  ...fixture.selections,
  'complication.choice': complication,
  ...extra,
});
const evaluate = (complication: string, extra: Record<string, SelectionValue> = {}) => {
  const defs = definitions();
  return evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: fixture.compendiumRevision,
      level: 1,
      selections: selections(complication, extra),
    },
    defs,
  );
};
const baseline = (
  complication: string,
  extra: Record<string, SelectionValue> = {},
): PartialBaseline => {
  const result = evaluate(complication, extra);
  expect(result.status, JSON.stringify(result.diagnostics)).toBe('complete');
  return result.baseline!;
};

test('Promising Apprentice grants a new crafting skill but can improve an older owned one', () => {
  const defs = definitions();
  const values = selections('Promising Apprentice', {
    'complication.promising-apprentice.skill': 'Alchemy',
    'complication.promising-apprentice.edgeSkill': 'Blacksmithing',
  });
  const target = indexDecisions(defs).get('complication.promising-apprentice.edgeSkill')!;
  expect(poolOf(target, values, defs).values).toContain('Blacksmithing');
  expect(poolOf(target, values, defs).values).toContain('Alchemy');
  expect(poolOf(target, values, defs).values).not.toContain('Jewelry');
  expect(
    baseline('Promising Apprentice', {
      'complication.promising-apprentice.skill': 'Alchemy',
      'complication.promising-apprentice.edgeSkill': 'Blacksmithing',
    }).skills!.filter(skill => skill.name === 'Blacksmithing'),
  ).toHaveLength(1);
});

test('Ivory Tower loses exactly one of its three choices, with a separate Director actor', () => {
  const defs = definitions();
  const values = selections('Ivory Tower', {
    'complication.ivory-tower.skills': ['Alchemy', 'Cooking', 'Magic'],
  });
  const loss = indexDecisions(defs).get('complication.ivory-tower.lostSkill')!;
  expect(loss.decisionActor).toBe('Director');
  expect(poolOf(loss, values, defs).values.sort()).toEqual(['Alchemy', 'Cooking', 'Magic']);
  expect(poolOf(loss, values, defs).values).not.toContain('Nature');
  const language = indexDecisions(defs).get('complication.ivory-tower.language')!;
  expect(poolOf(language, values, defs).values).toHaveLength(9);
  expect(poolOf(language, values, defs).values).toContain('Ananjali');
  expect(poolOf(language, values, defs).values).not.toContain('Anjali');
});

test('Ivory Tower cannot remove an unrelated owned skill or retain its cancelled skill', () => {
  const extra = {
    'complication.ivory-tower.skills': ['Alchemy', 'Cooking', 'Magic'],
    'complication.ivory-tower.language': ['Ananjali'],
    'complication.ivory-tower.lostSkill': 'Cooking',
  };
  const skills = baseline('Ivory Tower', extra).skills!.map(skill => skill.name);
  expect(skills).toContain('Alchemy');
  expect(skills).toContain('Magic');
  expect(skills).not.toContain('Cooking');
  const wrong = evaluate('Ivory Tower', {
    ...extra,
    'complication.ivory-tower.lostSkill': 'Nature',
  });
  expect(wrong.status).toBe('invalid');
});

test('Hunter has its eight printed options; Wrongly Imprisoned excludes interpersonal', () => {
  const defs = definitions();
  const decisions = indexDecisions(defs);
  expect(
    poolOf(decisions.get('complication.hunter.skill')!, selections('Hunter'), defs).values.sort(),
  ).toEqual(
    [
      'Alertness',
      'Criminal Underworld',
      'Eavesdrop',
      'Interrogate',
      'Rumors',
      'Search',
      'Society',
      'Track',
    ]
      .filter(name => name !== 'Alertness')
      .sort(),
  );
  const pool = poolOf(
    decisions.get('complication.wrongly-imprisoned.skills')!,
    selections('Wrongly Imprisoned'),
    defs,
  ).values;
  expect(pool).toContain('Alchemy');
  expect(pool).toContain('Magic');
  expect(pool).not.toContain('Flirt');
  expect(decisions.get('complication.wrongly-imprisoned.skills')!.shape).toEqual({
    type: 'multi',
    count: 2,
  });
});

test('Shipwrecked forgets a known language, including Caelian, never an empty entitlement', () => {
  const defs = definitions();
  const decision = indexDecisions(defs).get('complication.shipwrecked.forgottenLanguage')!;
  const pool = poolOf(decision, selections('Shipwrecked'), defs).values;
  expect(pool.sort()).toEqual(['Anjali', 'Caelian', 'Vaslorian']);
  const built = baseline('Shipwrecked', {
    'complication.shipwrecked.skills': ['Drive', 'Heal'],
    'complication.shipwrecked.forgottenLanguage': 'Anjali',
  });
  expect(built.languages!.map(language => language.name)).not.toContain('Anjali');
  expect(built.languages!.map(language => language.name)).toContain('Caelian');
});

test.each([
  ['Curse of Caution', 'speed', 5],
  ['Curse of Stone', 'stability', 3],
  ['Curse of Punishment', 'recoveriesMaximum', 11],
  ['Primordial Sickness', 'recoveriesMaximum', 9],
  ['Elemental Inside', 'staminaMaximum', 33],
  ['Wodewalker', 'recoveryValue', 12],
  ['Indebted', 'wealth', -5],
] as const)(
  '%s applies its source baseline effect to the otherwise identical Fury',
  (name, field, expected) => {
    expect(baseline(name)[field]!.value).toBe(expected);
  },
);

test('conditional play penalties do not silently change the healthy baseline', () => {
  expect(baseline('Getting Too Old for This').speed!.value).toBe(6);
  expect(baseline('Lightning Soul').staminaMaximum!.value).toBe(30);
  expect(baseline('Voice in Your Head').recoveriesMaximum!.value).toBe(10);
  expect(baseline('Curse of Poverty').wealth!.value).toBe(1);
});

test('Infernal Contract Bad is one of three benefits, not all three', () => {
  const stamina = baseline('Infernal Contract... But, Like, Bad', {
    'complication.infernal-contract-but-like-bad.benefit': 'staminaMaximum+3',
  });
  expect(stamina.staminaMaximum!.value).toBe(33);
  expect(stamina.renown!.value).toBe(1);
  expect(stamina.wealth!.value).toBe(1);
  const wealth = baseline('Infernal Contract... But, Like, Bad', {
    'complication.infernal-contract-but-like-bad.benefit': 'wealth+2',
  });
  expect(wealth.wealth!.value).toBe(3);
  expect(wealth.staminaMaximum!.value).toBe(30);
});

test('Betrothed caps starting Renown after grants and keeps the selected item source', () => {
  const built = baseline('Betrothed', { 'complication.betrothed.trinket': 'Divine Vine' });
  expect(built.renown!.value).toBe(0);
  const decision = indexDecisions(definitions()).get('complication.betrothed.trinket')!;
  expect(decision.options!.find(option => option.value === 'Divine Vine')!.source).toBe(
    'en/unified/md/treasure/1st-echelon/trinket/divine-vine.md',
  );
});

test('Dragon Dreams uses a two-point budget and only Scales is unavailable without Wyrmplate', () => {
  const defs = definitions();
  const decision = indexDecisions(defs).get('complication.dragon-dreams.traits')!;
  expect(decision.shape).toEqual({ type: 'points', budget: 2, costField: 'cost' });
  const pool = poolOf(decision, selections('Dragon Dreams'), defs).values;
  expect(pool).toContain('Dragon Breath');
  expect(pool).toContain('Draconian Pride');
  expect(pool).not.toContain('Prismatic Scales');
  expect(
    evaluate('Dragon Dreams', {
      'complication.dragon-dreams.traits': ['Prismatic Scales', 'Draconian Guard'],
    }).status,
  ).toBe('invalid');
  const valid = baseline('Dragon Dreams', { 'complication.dragon-dreams.traits': ['Wings'] });
  expect(valid.speed!.value).toBe(6);
});

test('Following in the Footsteps choices distinguish future class abilities from known ones', () => {
  const defs = definitions();
  const decisions = indexDecisions(defs);
  const values = selections('Following in the Footsteps');
  const future = poolOf(
    decisions.get('complication.following-in-the-footsteps.futureAbility')!,
    values,
    defs,
  ).values;
  expect(future).toContain('Wrecking Ball');
  expect(future).not.toContain('Out of the Way!');
  const known = poolOf(
    decisions.get('complication.following-in-the-footsteps.costlierAbility')!,
    values,
    defs,
  ).values;
  expect(known.sort()).toEqual(['Out of the Way!', 'Thunder Roar']);
});

test('Shared Spirit keeps exclusive skill sets conditional and rejects already-known new skills', () => {
  const extra = {
    'complication.shared-spirit.selfSkills': ['Blacksmithing', 'Climb', 'Nature'],
    'complication.shared-spirit.spiritSkills': ['Alchemy', 'Cooking', 'Magic'],
  };
  const built = baseline('Shared Spirit', extra);
  const names = built.skills!.map(skill => skill.name);
  expect(names).toContain('Persuade'); // A common skill, outside either exclusive set.
  expect(
    ['Blacksmithing', 'Climb', 'Nature', 'Alchemy', 'Cooking', 'Magic'].every(name =>
      names.includes(name),
    ),
  ).toBe(false);
  expect(
    evaluate('Shared Spirit', {
      ...extra,
      'complication.shared-spirit.spiritSkills': ['Nature', 'Cooking', 'Magic'],
    }).status,
  ).toBe('invalid');
});

test('Raised by Beasts removes culture selections without removing Caelian or career/class grants', () => {
  const defs = definitions();
  const pruned = pruneUnavailable(
    selections('Raised by Beasts', { 'complication.raised-by-beasts.animalType': 'wolf' }),
    defs,
  );
  expect(pruned.selections['culture.environment']).toBeUndefined();
  const result = evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: fixture.compendiumRevision,
      level: 1,
      selections: pruned.selections,
    },
    defs,
  );
  expect(result.status, JSON.stringify(result.diagnostics)).toBe('complete');
  const built = result.baseline!;
  expect(built.skills.map(skill => skill.name)).toContain('Handle Animals');
  expect(built.skills.map(skill => skill.name)).toContain('Nature');
  expect(built.skills.map(skill => skill.name)).not.toContain('Blacksmithing');
  expect(built.languages.map(language => language.name)).toContain('Caelian');
  expect(built.languages.map(language => language.name)).not.toContain('Anjali');
});

test('Strange Inheritance does not expose an owner item-selection pool', () => {
  const choice = indexDecisions(definitions()).get(
    'complication.strange-inheritance.secretTrinket',
  )!;
  expect(choice.kind).toBe('automatic');
  expect(choice.options).toBeUndefined();
  expect(choice.decisionActor).toBe('Director');
  expect(choice.note).toContain('private Director');
});

test('embedded source abilities retain distinctive effects and complete tier text', () => {
  const ability = (name: string) => COMPLICATION_ABILITIES.find(record => record.name === name)!;
  const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  expect(plain(ability('Corrupt Spirit').text)).toContain('Until the end of your turn');
  expect(ability('Psychic Blast').text).toContain('Special Heroic Resource Cost');
  expect(plain(ability('Psychic Blast').text)).toContain('maximum equal to your level');
  expect(ability('Issue Order').text).toContain('Strike Now');
  expect(ability('Stone Eyes').text).toContain('inanimate stone');
  expect(ability('Dragon Breath').condition).toBe('5 or more Victories');
  expect(COMPLICATION_EFFECTS['Shadow Born'].fullText).toContain('Whenever you start your');
  expect(COMPLICATION_EFFECTS['Shadow Born'].conditionalText).toContain('not once per round');
});
