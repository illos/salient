// SPDX-License-Identifier: GPL-3.0-only
/**
 * The source sentences the R02 formulas rest on (docs/character-derived-values.md, section 1), as
 * the evaluator cites them in provenance. Every quote is verbatim after the R01 text normalization;
 * `tests/character-derived-values.test.ts` checks the same sentences against the pinned files
 * through the R02 examples, and `tests/character-evaluator.test.ts` checks the evaluator reproduces
 * those examples. Paths are relative to `vendor/steel-compendium/`. No sentence here is a rule the
 * document does not state.
 */
import type { SourceSentence } from '../contracts/characterEvaluation.ts';

type Sentence = Omit<SourceSentence, 'revision'>;

const HERO_STEPS = 'en/unified/md/chapter/making-a-hero.md';
const FURY = 'en/unified/md/class/fury.md';
const KITS = 'en/unified/md/chapter/kits.md';
const HEROES_CLEAN = 'en/books/heroes/clean/Draw Steel Heroes.md';

/** R02 section references are in the comments; the R01 decision ids that supply the input in the evaluator. */
export const SENTENCES = {
  // 1.2 Level and echelon
  level: {
    path: HERO_STEPS,
    quote:
      'Each option you can choose for your hero at 1st level includes a parenthetical selection labeled "Quick Build."',
    heading: 'Step-by-Step Hero Making',
  },
  echelon: {
    path: 'en/unified/md/rule/general/echelon.md',
    quote: '1st Echelon (1st to 3rd Level)',
  },
  // Identity steps (R01 step sentences)
  ancestryStep: {
    path: HERO_STEPS,
    quote:
      "Choose your hero's humanoid ancestry from among the range of ancestries available in the game",
    heading: '2. Ancestry',
  },
  classStep: {
    path: HERO_STEPS,
    quote:
      'You can be a censor, conduit, elementalist, fury, null, shadow, tactician, talent, or troubadour.',
    heading: '5. Class',
  },
  careerStep: {
    path: HERO_STEPS,
    quote:
      "Choose your hero's career, which describes what you did for a living before you became a hero.",
    heading: '4. Career',
  },
  subclass: {
    path: 'en/unified/md/feature/fury/level-1/primordial-aspect.md',
    quote: 'Your primordial aspect is your subclass',
  },
  // 1.1 Characteristics
  fixedCharacteristics: {
    path: FURY,
    quote: 'You start with a Might of 2 and an Agility of 2',
    heading: 'Basics',
  },
  characteristicArray: {
    path: FURY,
    quote: 'you can choose one of the following arrays for your other characteristic scores:',
    heading: 'Basics',
  },
  // 1.3 Stamina maximum
  startingStamina: { path: FURY, quote: 'Starting Stamina at 1st Level: 21', heading: 'Basics' },
  kitStaminaRule: {
    path: KITS,
    quote:
      "Your kit's Stamina bonus is added to your Stamina maximum and scales with your echelon.",
    heading: 'Stamina Bonus',
  },
  // 1.4 Recoveries
  recoveries: { path: FURY, quote: 'Recoveries: 10', heading: 'Basics' },
  recoveryValue: {
    path: 'en/unified/md/rule/health/recoveries.md',
    quote:
      'A hero also has a recovery value that equals one-third of their Stamina maximum, rounded down.',
  },
  // 1.5 Winded
  winded: {
    path: 'en/unified/md/rule/health/winded.md',
    quote: 'Your winded value equals half your Stamina maximum.',
  },
  // 1.6 to 1.8 Speed, stability, size
  baseStatistics: {
    path: 'en/unified/md/rule/character/speed.md',
    quote:
      'Unless otherwise noted, a character of any of these ancestries is size 1M and has speed 5 and stability 0.',
    heading: 'Starting Size and Speed',
  },
  // 1.9 Disengage
  disengage: {
    path: 'en/unified/md/feature/common/move-actions/disengage.md',
    quote: 'When a creature takes the Disengage move action, they can shift 1 square.',
  },
  // 1.10 Potencies
  potencyWeak: { path: FURY, quote: 'Weak Potency: Might − 2', heading: 'Basics' },
  potencyAverage: { path: FURY, quote: 'Average Potency: Might − 1', heading: 'Basics' },
  potencyStrong: { path: FURY, quote: 'Strong Potency: Might', heading: 'Basics' },
  // 1.11 Heroic resource
  ferocityName: {
    path: 'en/unified/md/feature/fury/level-1/ferocity.md',
    quote: 'fueling a Heroic Resource called ferocity',
  },
  ferocityOutsideCombat: {
    path: 'en/unified/md/feature/fury/level-1/ferocity.md',
    quote: "Though you can't gain ferocity outside of combat",
    heading: 'Ferocity Outside of Combat',
  },
  // 1.12 Saving throws
  savingThrow: {
    path: 'en/unified/md/rule/general/saving-throw.md',
    quote: 'On a 6 or higher, the effect ends.',
  },
  // 1.13 Renown and Wealth
  renownBase: {
    path: 'en/unified/md/rule/resource/renown.md',
    quote: 'At the start of character creation, your Renown is 0.',
  },
  wealthBase: {
    path: 'en/unified/md/rule/resource/wealth.md',
    quote: 'Some careers increase your starting Wealth score (from a base score of 1).',
  },
  // 1.14 Kit contributions
  kitSignature: {
    path: KITS,
    quote:
      "Each kit grants a signature ability, whose distance and damage already includes the kit's bonuses.",
    heading: 'Kit Signature Ability',
  },
  // 1.15 Granted content
  ancestryTraits: {
    path: 'en/unified/md/chapter/ancestries.md',
    quote:
      'Each ancestry has one or more signature traits, which your hero gets for free if they take that ancestry.',
    heading: 'Ancestry Traits',
  },
  cultureBenefitSkill: {
    path: HEROES_CLEAN,
    quote: "You can select one skill from each aspect's list of options.",
    heading: 'Culture Benefits',
  },
  cultureLanguage: {
    path: HEROES_CLEAN,
    quote: 'You know the language of your culture, in addition to knowing Caelian.',
    heading: 'Culture Benefits',
  },
  caelian: {
    path: HEROES_CLEAN,
    quote: 'All player characters know Caelian!',
    heading: 'Caelian Empire',
  },
  cultureEdge: {
    path: HEROES_CLEAN,
    quote:
      'You gain an edge on tests made to recall lore about your culture, and on tests made to influence and interact with people of your culture.',
    heading: 'Culture Benefits',
  },
  furyAdvancement: {
    path: FURY,
    quote:
      'Primordial Aspect, Ferocity, Growing Ferocity, Aspect Features, Aspect Triggered Action, Mighty Leaps, Fury Abilities',
    heading: 'Fury Advancement Table',
  },
  natureSkill: { path: FURY, quote: 'You gain the Nature skill', heading: 'Basics' },
  classSkills: {
    path: FURY,
    quote: 'Then choose any two skills from the exploration or intrigue skill groups.',
    heading: 'Basics',
  },
  freeStrikes: {
    path: HERO_STEPS,
    quote: 'Every hero has a melee weapon free strike and a ranged weapon free strike.',
    heading: '7. Add Free Strikes',
  },
} as const satisfies Record<string, Sentence>;

/**
 * Per-kit sentences the Kits table and the kit entry print (R02 section 1.14). Only the v0.01
 * supported kit is listed; another kit's numbers are not derived (its choice is `unsupported-option`).
 */
export interface KitSentences {
  name: string;
  entryPath: string;
  equipmentText: string;
  /** The kit's row in the Kits table (`chapter/kits.md`), verbatim. */
  tableRow: string;
  staminaBonusPerEchelon: { amount: number; quote: string };
  stabilityBonus: { amount: number; quote: string } | null;
  meleeDamageBonus: { value: [number, number, number]; quote: string } | null;
  speedBonus: number;
  rangedDamageBonus: [number, number, number];
  meleeDistanceBonus: number;
  rangedDistanceBonus: number;
  disengageBonus: number;
  signatureAbility: string;
  /** Notes recorded beside the Kits-table cells that print "-" (R02 1.14: a "-" cell is 0). */
  notes: {
    stamina: string;
    stability: string;
    speed: string;
    disengage: string;
    rangedDamage: string;
  };
}

export const KITS_TABLE_HEADING = 'Kits Table';
export const KIT_BONUSES_HEADING = 'Kit Bonuses';
export const KITS_PATH = KITS;

export const KIT_SENTENCES: Record<string, KitSentences> = {
  Mountain: {
    name: 'Mountain',
    entryPath: 'en/unified/md/kit/mountain.md',
    equipmentText: 'You wear heavy armor and wield a heavy weapon.',
    tableRow: '| Mountain | Heavy | Heavy | +9 | - | +2 | +0/+0/+4 | - | - | - | - |',
    staminaBonusPerEchelon: { amount: 9, quote: 'Stamina Bonus: +9 per echelon' },
    stabilityBonus: { amount: 2, quote: 'Stability Bonus: +2' },
    meleeDamageBonus: { value: [0, 0, 4], quote: 'Melee Damage Bonus: +0/+0/+4' },
    speedBonus: 0,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Pain for Pain',
    notes: {
      stamina:
        '1st echelon at level 1 (rule/general/echelon.md); rule: chapter/kits.md, Stamina Bonus',
      stability: 'rule: chapter/kits.md, Stability Bonus',
      speed: 'Kits table speed column "-"; rule: chapter/kits.md, Speed Bonus',
      disengage: 'Kits table Disengage column "-"; rule: chapter/kits.md, Disengage Bonus',
      rangedDamage: 'Kits table Ranged Damage column "-"',
    },
  },
};

/** Headings of the budget-rule sentences R01 cites without a heading (R02 section 4.3). */
export const BUDGET_RULE_HEADINGS: Record<string, string> = {
  'ancestry.devil.purchased-traits': 'Ancestry Traits',
};

/** How a points budget is named in messages, per decision (the source's own words). */
export const BUDGET_WORDS: Record<string, { unit: string; grant: string }> = {
  'ancestry.devil.purchased-traits': { unit: 'ancestry points', grant: 'purchased trait' },
};

/** Entry paths for granted features whose R01 grant cites the granting table rather than the entry. */
export const FEATURE_ENTRY_PATHS: Record<string, string> = {
  Kit: 'en/unified/md/feature/fury/level-1/kit.md',
};

/** Skill-granting decisions whose provenance sentence carries a heading or differs from the decision's own quote. */
export const SKILL_SENTENCES: Record<string, Sentence> = {
  'culture.environment.skill': {
    path: HEROES_CLEAN,
    quote: "You can select one skill from each aspect's list of options.",
    heading: 'Culture Benefits',
  },
  'culture.organization.skill': {
    path: HEROES_CLEAN,
    quote: "You can select one skill from each aspect's list of options.",
    heading: 'Culture Benefits',
  },
  'culture.upbringing.skill': {
    path: HEROES_CLEAN,
    quote: "You can select one skill from each aspect's list of options.",
    heading: 'Culture Benefits',
  },
  'class.fury.skill.nature': { path: FURY, quote: 'You gain the Nature skill', heading: 'Basics' },
  'class.fury.skills': {
    path: FURY,
    quote: 'Then choose any two skills from the exploration or intrigue skill groups.',
    heading: 'Basics',
  },
};

/** Numeric trait effects R02 sections 1.6 and 1.12 read from the devil trait entries. */
const TRAIT = 'en/unified/md/feature/trait/devil/';

/**
 * One source sentence per purchased devil trait. `field` is present only where the source sets a
 * baseline value; a trait whose effect is conditional or manual carries its sentence alone, so a
 * granted feature never claims a numeric contribution it does not make (V46).
 */
export type TraitEffect = { sentence: Sentence } & (
  | { field: 'speed' | 'savingThrowThreshold'; value: number }
  | { field?: undefined; value?: undefined }
);

export const TRAIT_EFFECTS: Record<string, TraitEffect> = {
  'Barbed Tail': {
    sentence: {
      path: `${TRAIT}barbed-tail.md`,
      quote:
        'Once per round when you make a melee strike, you can deal extra damage with the strike equal to your highest characteristic score.',
    },
  },
  'Beast Legs': {
    field: 'speed',
    value: 6,
    sentence: {
      path: `${TRAIT}beast-legs.md`,
      quote: 'You have speed 6.',
    },
  },
  'Glowing Eyes': {
    sentence: {
      path: `${TRAIT}glowing-eyes.md`,
      quote:
        'Whenever you take damage from a creature, you can use a triggered action to deal that creature psychic damage equal to 1d10 + your level.',
    },
  },
  Hellsight: {
    sentence: {
      path: `${TRAIT}hellsight.md`,
      quote: "You don't take a bane on strikes made against creatures with concealment.",
    },
  },
  'Impressive Horns': {
    field: 'savingThrowThreshold',
    value: 5,
    sentence: {
      path: `${TRAIT}impressive-horns.md`,
      quote: 'Whenever you make a saving throw, you succeed on a roll of 5 or higher.',
    },
  },
  'Prehensile Tail': {
    sentence: {
      path: `${TRAIT}prehensile-tail.md`,
      quote: "You can't be flanked.",
    },
  },
  Wings: {
    sentence: {
      path: `${TRAIT}wings.md`,
      quote:
        'While using your wings to fly, you can stay aloft for a number of rounds equal to your Might score (minimum 1 round) before you fall.',
    },
  },
};

/** Wings' second sentence; its weakness is conditional, never a baseline damage weakness (V46). */
export const WINGS_WEAKNESS_SENTENCE: Sentence = {
  path: `${TRAIT}wings.md`,
  quote: 'While using your wings to fly at 3rd level or lower, you have damage weakness 5.',
};

/** Untyped "damage weakness X" applies to damage of any type; Wings states no type. */
export const UNTYPED_DAMAGE_WEAKNESS: Sentence = {
  path: 'en/unified/md/rule/damage/damage-weakness.md',
  quote:
    'A creature who has "damage weakness X" with no specific type or keyword indicated has weakness of the indicated amount when they take damage of any type.',
};

/** The general movement rule Wings links: flying is at full speed, in any direction. */
export const FLY_RULE: Sentence = {
  path: 'en/unified/md/movement/fly.md',
  quote:
    'A creature who has "fly" in their speed entry, or who gains the temporary ability to fly, can move through the air vertically or horizontally at full speed and remain in midair.',
};

/** Aspect grants beyond the R01 option grants: the sentence each grant kind rests on (R02 1.15). */
export const ASPECT_FEATURE_SENTENCE: Sentence = {
  path: 'en/unified/md/feature/fury/level-1/1st-level-aspect-features.md',
  quote:
    'Your primordial aspect grants you two features, as shown on the 1st-Level Aspect Features table.',
};
export const ASPECT_TRIGGERED_SENTENCE: Sentence = {
  path: 'en/unified/md/feature/fury/level-1/aspect-triggered-action.md',
  quote:
    'Your primordial aspect grants you a triggered action, as shown on the Aspect Triggered Actions table.',
};

/** Headings of the three Fury ability choices in the clean Heroes text (R02 1.15, abilities row). */
export const FURY_ABILITY_HEADINGS: Record<string, string> = {
  'class.fury.signature-ability': 'Signature Ability',
  'class.fury.ability-3': '3-Ferocity Ability',
  'class.fury.ability-5': '5-Ferocity Ability',
};

/** Feature entry paths for class features named by the advancement table row (R02 1.15). */
export const CLASS_FEATURE_AFFECTS: Record<string, 'heroicResource'[]> = {
  Ferocity: ['heroicResource'],
};
