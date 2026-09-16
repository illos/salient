// SPDX-License-Identifier: GPL-3.0-only
/** V25 additions to the stable R01 decision IDs. Source: the pinned Compendium, not Forge data. */
import fury from './fury-level-one-decisions.json' with { type: 'json' };
import type {
  Decision,
  DecisionDefinitions,
  DecisionOption,
  OptionGrant,
} from '../evaluate/definitions.ts';
import { SENTENCES } from '../evaluate/sources.ts';

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
const path = (relative: string) => `en/unified/md/${relative}.md`;
const elementalist = path('class/elementalist');
const feature = (slug: string) => path(`feature/elementalist/level-1/${slug}`);
const ability = (slug: string) => path(`feature/ability/elementalist/level-1/${slug}`);
const trait = (slug: string) => path(`feature/trait/polder/${slug}`);
const career = path('career/mages-apprentice');
const option = (
  value: string,
  source: string,
  extra: Partial<DecisionOption> = {},
): DecisionOption => ({
  id: value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  value,
  source,
  supportedInV001: true,
  ...extra,
});
const append = (step: string, rows: Decision[]) =>
  definitions.steps.find(s => s.id === step)!.decisions.push(...rows);
const auto = (
  id: string,
  parent: string,
  value: string,
  source: string,
  quote: string,
  grants: OptionGrant[] = [],
): Decision => ({
  id,
  kind: 'automatic',
  shape: { type: 'none' },
  availableWhen: { decision: parent, value },
  source,
  quote,
  grants,
});
const choice = (
  id: string,
  parent: string,
  value: string,
  source: string,
  quote: string,
  options: DecisionOption[],
  extra: Partial<Decision> = {},
): Decision => ({
  id,
  kind: 'choice',
  shape: { type: 'single', count: 1 },
  availableWhen: { decision: parent, value },
  source,
  quote,
  options,
  ...extra,
});
const grant = (kind: string, value: string, source: string, quote?: string): OptionGrant => ({
  kind,
  value,
  source,
  ...(quote ? { quote } : {}),
});

allow('ancestry.choice', ['Polder']);
allow('career.choice', ["Mage's Apprentice"]);
allow('class.choice', ['Elementalist']);
allow('culture.environment', ['Urban']);
allow('culture.environment.skill', ['Alertness']);
allow('culture.organization.skill', ['Gymnastics']);
allow('culture.upbringing', ['Creative']);
allow('culture.upbringing.skill', ['Tailoring']);

const characteristicsQuote =
  'You start with a Reason of 2, and you can choose one of the following arrays for your other characteristic scores:';
definitions.classProfiles = {
  Fury: {
    fixedCharacteristics: { Might: 2, Agility: 2 },
    assignmentDecisionId: 'class.fury.array-assignment',
    arrayDecisionId: 'class.fury.characteristic-array',
    fixedDecisionId: 'class.fury.fixed-characteristics',
    baselineDecisionId: 'class.fury.baseline',
    subclassDecisionId: 'class.fury.aspect',
    source: path('class/fury'),
    characteristicsQuote: SENTENCES.characteristicArray.quote,
    startingStamina: 21,
    recoveries: 10,
    potencyCharacteristic: 'M',
    resource: 'ferocity',
    resourceSource: SENTENCES.ferocityName.path,
    resourceQuote: SENTENCES.ferocityName.quote,
    resourceOutsideCombatQuote: SENTENCES.ferocityOutsideCombat.quote,
    kit: 'required',
  },
  Elementalist: {
    fixedCharacteristics: { Reason: 2 },
    assignmentDecisionId: 'class.elementalist.array-assignment',
    arrayDecisionId: 'class.elementalist.characteristic-array',
    fixedDecisionId: 'class.elementalist.fixed-characteristics',
    baselineDecisionId: 'class.elementalist.baseline',
    subclassDecisionId: 'class.elementalist.specialization',
    source: elementalist,
    characteristicsQuote,
    startingStamina: 18,
    recoveries: 8,
    potencyCharacteristic: 'R',
    resource: 'essence',
    resourceSource: feature('essence'),
    resourceQuote:
      'You channel the substance of creation in the form of a Heroic Resource called essence, gathering and burning it to cast and maintain spells.',
    resourceOutsideCombatQuote:
      "Though you can't gain essence outside of combat, you can use your heroic abilities and effects that cost essence without spending it.",
    kit: 'none',
  },
};

append('step.ancestry', [
  auto(
    'ancestry.polder.base-statistics',
    'ancestry.choice',
    'Polder',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.polder.signature-trait',
    'ancestry.choice',
    'Polder',
    trait('polder-traits'),
    'Polder heroes have access to the following traits.',
    [
      grant('ancestry-signature-trait', 'Shadowmeld', path('feature/ability/polder/shadowmeld')),
      grant('ancestry-signature-trait', 'Small!', trait('small')),
      grant('ancestry-ability', 'Shadowmeld', path('feature/ability/polder/shadowmeld')),
    ],
  ),
  choice(
    'ancestry.polder.purchased-traits',
    'ancestry.choice',
    'Polder',
    trait('polder-traits'),
    'You have 4 ancestry points to spend on the following traits.',
    [
      option('Corruption Immunity', trait('corruption-immunity'), { cost: 1 }),
      option('Fearless', trait('fearless'), { cost: 2 }),
      option('Graceful Retreat', trait('graceful-retreat'), { cost: 1 }),
      option('Nimblestep', trait('nimblestep'), { cost: 2, supportedInV001: false }),
      option('Polder Geist', trait('polder-geist'), { cost: 1, supportedInV001: false }),
      option('Reactive Tumble', trait('reactive-tumble'), { cost: 1, supportedInV001: false }),
    ],
    { shape: { type: 'points', budget: 4, costField: 'cost' } },
  ),
]);
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
append('step.class', [
  auto(
    'class.elementalist.fixed-characteristics',
    'class.choice',
    'Elementalist',
    elementalist,
    'You start with a Reason of 2',
    [grant('characteristic', 'Reason 2', elementalist)],
  ),
  choice(
    'class.elementalist.characteristic-array',
    'class.choice',
    'Elementalist',
    elementalist,
    characteristicsQuote,
    ['2, 2, −1, −1', '2, 1, 1, −1', '2, 1, 0, 0', '1, 1, 1, 0'].map(value =>
      option(value, elementalist),
    ),
  ),
  {
    id: 'class.elementalist.array-assignment',
    kind: 'choice',
    shape: { type: 'assignment', targets: ['Might', 'Agility', 'Intuition', 'Presence'] },
    dependsOn: ['class.elementalist.characteristic-array'],
    source: elementalist,
    quote: characteristicsQuote,
  },
  auto(
    'class.elementalist.baseline',
    'class.choice',
    'Elementalist',
    elementalist,
    'Starting Stamina at 1st Level: 18',
  ),
  auto(
    'class.elementalist.skill.magic',
    'class.choice',
    'Elementalist',
    elementalist,
    'You gain the Magic skill',
    [grant('skill', 'Magic', elementalist)],
  ),
  choice(
    'class.elementalist.skills',
    'class.choice',
    'Elementalist',
    elementalist,
    'Then choose any three skills from the crafting or lore skill groups.',
    [],
    {
      options: undefined,
      shape: { type: 'multi', count: 3 },
      optionsFrom: ['pool.skills.crafting', 'pool.skills.lore'],
      supportedInV001: ['Alchemy', 'Blacksmithing', 'History'],
    },
  ),
  choice(
    'class.elementalist.magic-replacement',
    'career.choice',
    "Mage's Apprentice",
    path('chapter/making-a-hero'),
    'If you gain the same specific skill from two different sources (for instance, from a career and a class), you can pick a different skill from any skill group.',
    [],
    {
      options: undefined,
      dependsOn: ['class.elementalist.skill.magic'],
      replacesDuplicateSkill: 'Magic',
      optionsFrom: Object.keys(definitions.pools).filter(id => id.startsWith('pool.skills.')),
      supportedInV001: ['Empathize'],
    },
  ),
  auto(
    'class.elementalist.features',
    'class.choice',
    'Elementalist',
    elementalist,
    'Elementalist Advancement Table',
    [
      ...[
        'Elemental Specialization',
        'Essence',
        'Hurl Element',
        'Persistent Magic',
        'Practical Magic',
        'Enchantment',
        'Elementalist Ward',
        'Elementalist Abilities',
      ].map(name => grant('class-feature', name, feature(name.toLowerCase().replaceAll(' ', '-')))),
      grant('class-ability', 'Hurl Element', ability('hurl-element')),
      grant('class-ability', 'Practical Magic', ability('practical-magic')),
    ],
  ),
  choice(
    'class.elementalist.specialization',
    'class.choice',
    'Elementalist',
    feature('elemental-specialization'),
    'You choose an elemental specialization from the following options: earth, fire, green, or void.',
    [
      option('Fire', feature('elemental-specialization'), {
        grants: [
          grant('class-feature', 'Fire: Acolyte of Fire', feature('fire-acolyte-of-fire')),
          grant(
            'class-ability',
            'Return to Formlessness',
            ability('return-to-formlessness'),
            'You have the following ability.',
          ),
          grant(
            'aspect-ability',
            'Explosive Assistance',
            ability('explosive-assistance'),
            'Your elemental specialization grants you a triggered action',
          ),
        ],
      }),
    ],
  ),
  choice(
    'class.elementalist.enchantment',
    'class.choice',
    'Elementalist',
    feature('enchantment'),
    'Choose one of the following enchantments.',
    [
      option('Enchantment of Destruction', feature('enchantment-of-destruction'), {
        grants: [
          grant(
            'class-feature',
            'Enchantment of Destruction',
            feature('enchantment-of-destruction'),
          ),
        ],
      }),
    ],
  ),
  choice(
    'class.elementalist.ward',
    'class.choice',
    'Elementalist',
    feature('elementalist-ward'),
    'Choose one of the following wards.',
    [
      option('Ward of Delightful Consequences', feature('ward-of-delightful-consequences'), {
        grants: [
          grant(
            'class-feature',
            'Ward of Delightful Consequences',
            feature('ward-of-delightful-consequences'),
          ),
        ],
      }),
    ],
  ),
  choice(
    'class.elementalist.signature-abilities',
    'class.choice',
    'Elementalist',
    feature('elementalist-abilities'),
    'Choose two signature abilities from the following options.',
    [
      option('Bifurcated Incineration', ability('bifurcated-incineration'), {
        abilityKind: 'signature',
      }),
      option('Viscous Fire', ability('viscous-fire'), { abilityKind: 'signature' }),
    ],
    { shape: { type: 'multi', count: 2 } },
  ),
  choice(
    'class.elementalist.ability-3',
    'class.choice',
    'Elementalist',
    feature('elementalist-abilities'),
    'Choose one heroic ability from the following options, each of which costs 3 essence to use.',
    [
      option('The Flesh, a Crucible', ability('the-flesh-a-crucible'), {
        abilityKind: 'heroic',
        costQuote: 'cost: 3 Essence',
      }),
    ],
  ),
  choice(
    'class.elementalist.ability-5',
    'class.choice',
    'Elementalist',
    feature('elementalist-abilities'),
    'Choose one heroic ability from the following options, each of which costs 5 essence to use.',
    [
      option('Conflagration', ability('conflagration'), {
        abilityKind: 'heroic',
        costQuote: 'cost: 5 Essence',
      }),
    ],
  ),
]);
export default definitions;
