// SPDX-License-Identifier: GPL-3.0-only
/** Compose independently owned level-one content with stable R01 shared decisions. */
import fury from './fury-level-one-decisions.json' with { type: 'json' };
import type { Decision, DecisionDefinitions } from '../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from './decision-builders.ts';
import { levelOneDecisions as devilDecisions } from './ancestries/devil/level-one.ts';
import { levelOneDecisions as humanDecisions } from './ancestries/human/level-one.ts';
import { levelOneDecisions as polderDecisions } from './ancestries/polder/level-one.ts';
import {
  classProfile as furyProfile,
  levelOneDecisions as furyDecisions,
} from './classes/fury/level-one.ts';
import {
  classProfile as elementalistProfile,
  getLevelOneDecisions as elementalistDecisions,
} from './classes/elementalist/level-one.ts';

export const definitions: DecisionDefinitions = structuredClone(fury) as DecisionDefinitions;
const all = () => definitions.steps.flatMap(step => step.decisions);
const decision = (id: string) => all().find(d => d.id === id)!;
const allow = (id: string, values: string[]) => {
  const d = decision(id);
  if (d.options) {
    for (const option of d.options)
      if (values.includes(option.value)) option.supportedInV001 = true;
  }
  if (!d.options) d.supportedInV001 = [...new Set([...(d.supportedInV001 ?? []), ...values])];
};

const career = path('career/mages-apprentice');
const append = (step: string, rows: Decision[]) =>
  definitions.steps.find(s => s.id === step)!.decisions.push(...rows);

/** Replace the reference rows in their existing position; current modules own their content. */
const replaceFamily = (stepId: string, prefix: string, rows: Decision[]) => {
  const step = definitions.steps.find(candidate => candidate.id === stepId)!;
  const start = step.decisions.findIndex(row => row.id.startsWith(prefix));
  step.decisions = step.decisions.filter(row => !row.id.startsWith(prefix));
  step.decisions.splice(start, 0, ...structuredClone(rows));
};
replaceFamily('step.ancestry', 'ancestry.devil.', devilDecisions);
replaceFamily('step.class', 'class.fury.', furyDecisions);

allow('ancestry.choice', ['Polder', 'Human']);
allow('career.choice', ["Mage's Apprentice"]);
allow('class.choice', ['Elementalist']);
allow('culture.environment', ['Urban']);
allow('culture.environment.skill', ['Alertness']);
allow('culture.organization.skill', ['Gymnastics']);
allow('culture.upbringing', ['Creative']);
allow('culture.upbringing.skill', ['Tailoring']);

definitions.classProfiles = structuredClone({
  Fury: furyProfile,
  Elementalist: elementalistProfile,
});

append('step.ancestry', structuredClone(polderDecisions));
append('step.ancestry', structuredClone(humanDecisions));
const spokenPools = ['pool.languages.by-ancestry', 'pool.languages.vaslorian-human'];
const spoken = [...new Set(spokenPools.flatMap(id => definitions.pools[id]!.values))].filter(
  name => name !== 'Caelian',
);
append('step.career', [
  auto(
    'career.mages-apprentice.skill.magic',
    'career.choice',
    "Mage's Apprentice",
    career,
    'The Magic skill (from the lore skill group), plus two other skills from the lore group',
    [grant('skill', 'Magic', career)],
  ),
  choice(
    'career.mages-apprentice.skills',
    'career.choice',
    "Mage's Apprentice",
    career,
    'The Magic skill (from the lore skill group), plus two other skills from the lore group',
    [],
    {
      options: undefined,
      shape: { type: 'multi', count: 2 },
      optionsFrom: 'pool.skills.lore',
      supportedInV001: ['Monsters', 'Timescape'],
    },
  ),
  choice(
    'career.mages-apprentice.languages',
    'career.choice',
    "Mage's Apprentice",
    career,
    'Languages: One language',
    [],
    {
      options: undefined,
      shape: { type: 'multi', count: 1, deferrable: true },
      optionsFrom: spokenPools,
      supportedInV001: spoken,
    },
  ),
  auto(
    'career.mages-apprentice.renown',
    'career.choice',
    "Mage's Apprentice",
    career,
    'Renown: +1',
  ),
  choice(
    'career.mages-apprentice.perk',
    'career.choice',
    "Mage's Apprentice",
    career,
    'Perk: One supernatural perk',
    [
      option('Arcane Trick', path('perk/arcane-trick'), {
        grants: [grant('perk-ability', 'Arcane Trick', path('perk/arcane-trick'))],
      }),
    ],
  ),
  choice(
    'career.mages-apprentice.inciting-incident',
    'career.choice',
    "Mage's Apprentice",
    career,
    'Forgotten Memories: While practicing a spell, your inexperience caused the magic to backfire and your memories were wiped, leaving you with only fragments of who you once were.',
    [option('Forgotten Memories', career)],
  ),
]);
append('step.class', elementalistDecisions(definitions.pools));
export default definitions;
