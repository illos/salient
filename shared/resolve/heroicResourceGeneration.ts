// SPDX-License-Identifier: GPL-3.0-only
/**
 * V120: per-class heroic-resource generation profiles. The shared engine (clock work registered at
 * combat commit, and the `resource.claim` operation) reads these; a class with no profile keeps
 * fully manual generation. Profiles are keyed by the evaluated class, never by the resource name:
 * ferocity (Fury, Beastheart) and essence (Elementalist, Summoner) each belong to two classes.
 *
 * Decision: docs/decisions/2026-09-24-heroic-resource-automation.md. Each class is enabled by its own
 * slice with an independent rules review; the source ledgers are in docs/build/evidence/V120/.
 * Every clause carries its pinned Compendium path and the quoted sentence (link markup removed).
 */
import type { DerivedBaseline, HeroicResourceName } from '../contracts/characterEvaluation.ts';

export interface SourcedClause {
  /** Repo-relative pinned Compendium path. */
  sourcePath: string;
  /** The quoted rule sentence, with Markdown link markup removed. */
  quote: string;
}

export type TurnStartGain =
  | ({ kind: 'fixed'; amount: number } & SourcedClause)
  | ({ kind: 'dice'; sides: number } & SourcedClause);

/** How often a triggered gain may apply: "the first time each combat round", and so on. */
/** `each`: no limit ("Whenever …"); every confirmed occurrence applies. */
export type TriggerLimit = 'round' | 'turn' | 'encounter' | 'each';

export interface ResourceTrigger extends SourcedClause {
  /** Stable id used by `resource.claim trigger=<id>`: `<class>-<trigger>`, no dots (slash syntax). */
  id: string;
  /** Short label for the claim control. */
  label: string;
  /** The amount at the lowest level; `levelAmounts` replace it from their level on. */
  amount: number;
  /** Later features that change the amount ("you gain 2 insight instead of 1"), ascending. */
  levelAmounts?: ({ fromLevel: number; amount: number } & SourcedClause)[];
  limit: TriggerLimit;
  /** A dice gain ("you gain 1d3 ferocity"); replaces `amount`, which is then 0. */
  dice?: { sides: number };
  /**
   * Applied automatically when the app records the event, within the same limit; the claim stays
   * available for what the app does not record.
   * - `damage-taken`: a recorded damage write lowered the hero's Stamina or temporary Stamina.
   * - `winded-or-dying`: a recorded damage write took Stamina from above the winded value to at
   *   or below it (dying is Stamina 0 or lower, always at or below the winded value).
   * - `malice-ability`: a creature ability's own Malice cost was paid through `ability.use`.
   */
  observe?:
    | 'damage-taken'
    | 'winded-or-dying'
    | 'malice-ability'
    /** V149: any participating hero (including this one) is made winded by recorded damage. */
    | 'any-hero-winded'
    /** V149: any participating hero dies from recorded damage (Stamina at −winded value). */
    | 'any-hero-dies';
  /** Why the table confirms it: what the app cannot observe. */
  confirmation: string;
  /**
   * Only for a hero whose evaluated subclass includes this value (a Conduit domain; the subclass
   * reads "Creation / Life").
   */
  subclass?: string;
}

export interface GenerationProfile {
  /** Evaluated `baseline.class.value`. */
  className: string;
  /**
   * The highest level whose features were checked against this profile. A hero above it keeps
   * manual generation: a later feature (for example a larger turn-start gain) is not modelled.
   */
  verifiedThroughLevel: number;
  resource: HeroicResourceName;
  /** "At the start of a combat encounter … you gain <resource> equal to your Victories." */
  combatStart: { kind: 'victories' } & SourcedClause;
  turnStart: TurnStartGain;
  /** `lose`: remaining resource is lost (to 0); `reset`: any value, negative included, returns to 0. */
  encounterEnd: { kind: 'lose' | 'reset' } & SourcedClause;
  /**
   * Damage at the end of each of the hero's turns for each negative point of the resource (the
   * Talent's strain). Registered as its own clock step when present.
   */
  turnEndStrain?: SourcedClause & {
    /**
     * Features whose damage immunity the table tracks by hand and which can reduce the strain; for a
     * hero with one, the strain is logged as due and left to the table instead of applied.
     */
    heldBy?: { name: string; sourcePath: string }[];
    /** Features the strain damage can set off; named in the log when the hero has one. */
    notedBy?: { name: string; sourcePath: string }[];
  };
  /**
   * An optional prayer declared before the turn-start roll (the Conduit): 1 adds 1 and deals
   * 1d6 + level unreducible psychic damage, 2 adds 1, 3 adds 2 and allows a domain prayer effect.
   */
  prayer?: SourcedClause & {
    /** `conduit`: piety prayer; `appeal`: the Troubadour's Appeal to the Muses. */
    kind: 'conduit' | 'appeal';
    /** Control label ("Pray", "Appeal to the Muses"). */
    label: string;
    /** The level the feature is gained at, when above 1. */
    fromLevel?: number;
  };
  triggers: ResourceTrigger[];
  /**
   * A hero still dead when a later encounter starts gains nothing in it (the Troubadour: "If you are
   * still dead after the encounter in which you died, you can't gain drama during future
   * encounters.").
   */
  deadStaysSilent?: SourcedClause;
}

const SHADOW_INSIGHT = 'vendor/steel-compendium/en/unified/md/feature/shadow/level-1/insight.md';

const TACTICIAN_FOCUS = 'vendor/steel-compendium/en/unified/md/feature/tactician/level-1/focus.md';

const CENSOR_WRATH = 'vendor/steel-compendium/en/unified/md/feature/censor/level-1/wrath.md';

const SUMMONER_ESSENCE =
  'vendor/steel-compendium/en/unified/md/feature/summoner/level-1/essence.md';

const BEASTHEART_FEROCITY =
  'vendor/steel-compendium/en/unified/md/feature/beastheart/level-1/ferocity.md';

const TALENT_CLARITY =
  'vendor/steel-compendium/en/unified/md/feature/talent/level-1/clarity-and-strain.md';

const FURY_FEROCITY = 'vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md';

const NULL_DISCIPLINE = 'vendor/steel-compendium/en/unified/md/feature/null/level-1/discipline.md';

const CONDUIT_PIETY = 'vendor/steel-compendium/en/unified/md/feature/conduit/level-1/piety.md';
const CONDUIT_DOMAINS =
  'vendor/steel-compendium/en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md';
/**
 * feature/conduit/level-4/blessed-domain.md: "Whenever you gain piety from a domain effect, you gain
 * 1 additional piety." Labelled interpretation (Q-RES-11): it raises each domain piety trigger to 3.
 * Read literally, "domain effect" is the prayer effect, which grants no piety, so it would do
 * nothing. The other alternative adds 1 to the prayer's roll-of-3 outcome.
 */
const BLESSED_DOMAIN = {
  fromLevel: 4,
  amount: 3,
  sourcePath: 'vendor/steel-compendium/en/unified/md/feature/conduit/level-4/blessed-domain.md',
  quote: 'Whenever you gain piety from a domain effect, you gain 1 additional piety.',
};

const TROUBADOUR_DRAMA =
  'vendor/steel-compendium/en/unified/md/feature/troubadour/level-1/drama.md';

/** Enabled classes. Each entry is added by its own class slice (V120 Shadow, V140 Tactician, V145 Censor; the rest in V141–V149). */
export const GENERATION_PROFILES: readonly GenerationProfile[] = [
  {
    className: 'Shadow',
    // feature/shadow/level-7/keen-insight.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'insight',
    combatStart: {
      kind: 'victories',
      sourcePath: SHADOW_INSIGHT,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain insight equal to your Victories.',
    },
    turnStart: {
      kind: 'dice',
      sides: 3,
      sourcePath: SHADOW_INSIGHT,
      quote: 'At the start of each of your turns during combat, you gain 1d3 insight.',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: SHADOW_INSIGHT,
      quote: 'You lose any remaining insight at the end of the encounter.',
    },
    triggers: [
      {
        id: 'shadow-surge-damage',
        label: 'Dealt damage with surges',
        amount: 1,
        levelAmounts: [
          {
            fromLevel: 4,
            amount: 2,
            sourcePath:
              'vendor/steel-compendium/en/unified/md/feature/shadow/level-4/surge-of-insight.md',
            quote:
              'The first time each combat round that you deal damage incorporating 1 or more surges, you gain 2 insight instead of 1.',
          },
        ],
        limit: 'round',
        sourcePath: SHADOW_INSIGHT,
        quote:
          'Additionally, the first time each combat round that you deal damage incorporating 1 or more surges, you gain 1 insight.',
        confirmation: 'Surge spending on damage is not recorded; the table confirms it.',
      },
    ],
  },
  {
    className: 'Tactician',
    // feature/tactician/level-7/heightened-focus.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'focus',
    combatStart: {
      kind: 'victories',
      sourcePath: TACTICIAN_FOCUS,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain focus equal to your Victories.',
    },
    turnStart: {
      kind: 'fixed',
      amount: 2,
      sourcePath: TACTICIAN_FOCUS,
      quote: 'At the start of each of your turns during combat, you gain 2 focus.',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: TACTICIAN_FOCUS,
      quote: 'You lose any remaining focus at the end of the encounter.',
    },
    triggers: [
      {
        id: 'tactician-marked-damage',
        label: 'You or an ally damaged a creature you marked',
        amount: 1,
        levelAmounts: [
          {
            fromLevel: 4,
            amount: 2,
            sourcePath:
              'vendor/steel-compendium/en/unified/md/feature/tactician/level-4/focus-on-their-weaknesses.md',
            quote:
              'The first time each combat round that you or any ally damages a target marked by you, you gain 2 focus instead of 1.',
          },
        ],
        limit: 'round',
        sourcePath: TACTICIAN_FOCUS,
        quote:
          'Additionally, the first time each combat round that you or any ally damages a creature marked by you (see Mark below), you gain 1 focus.',
        confirmation:
          'Marks are not tracked; the table confirms the damaged creature was marked by you.',
      },
      {
        id: 'tactician-ally-heroic',
        label: 'An ally within 10 squares used a heroic ability',
        amount: 1,
        limit: 'round',
        sourcePath: TACTICIAN_FOCUS,
        quote:
          'The first time in a combat round that any ally within 10 squares of you uses a heroic ability, you gain 1 focus.',
        confirmation:
          'Distance is not tracked; the table confirms an ally (not you) within 10 squares used a heroic ability: one that cannot be used at all without spending its Heroic Resource, not an optional spend.',
      },
    ],
  },
  {
    className: 'Censor',
    // feature/censor/level-7/focused-wrath.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'wrath',
    combatStart: {
      kind: 'victories',
      sourcePath: CENSOR_WRATH,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain wrath equal to your Victories.',
    },
    turnStart: {
      kind: 'fixed',
      amount: 2,
      sourcePath: CENSOR_WRATH,
      quote: 'At the start of each of your turns during combat, you gain 2 wrath.',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: CENSOR_WRATH,
      quote: 'You lose any remaining wrath at the end of the encounter.',
    },
    triggers: [
      {
        id: 'censor-judged-damaged-you',
        label: 'A creature you judged damaged you',
        amount: 1,
        limit: 'round',
        sourcePath: CENSOR_WRATH,
        quote:
          'Additionally, the first time each combat round that a creature judged by you (see Judgment below) deals damage to you, you gain 1 wrath.',
        confirmation:
          'Judgment is not tracked; the table confirms the creature that damaged you is judged by you.',
      },
      {
        id: 'censor-damaged-judged',
        label: 'You damaged a creature you judged',
        amount: 1,
        levelAmounts: [
          {
            fromLevel: 4,
            amount: 2,
            sourcePath:
              'vendor/steel-compendium/en/unified/md/feature/censor/level-4/wrath-beyond-wrath.md',
            quote:
              'The first time each combat round that you deal damage to a creature judged by you, you gain 2 wrath instead of 1.',
          },
        ],
        limit: 'round',
        sourcePath: CENSOR_WRATH,
        quote:
          'The first time each combat round that you deal damage to a creature judged by you, you gain 1 wrath.',
        confirmation:
          'Judgment is not tracked; the table confirms the creature you damaged is judged by you.',
      },
    ],
  },
  {
    className: 'Summoner',
    // feature/summoner/level-7/font-of-creation.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'essence',
    combatStart: {
      kind: 'victories',
      sourcePath: SUMMONER_ESSENCE,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain essence equal to your Victories.',
    },
    turnStart: {
      kind: 'fixed',
      amount: 2,
      sourcePath: SUMMONER_ESSENCE,
      quote: 'At the start of each of your turns during combat, you gain 2 essence.',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: SUMMONER_ESSENCE,
      quote: 'You lose any remaining essence at the end of the encounter.',
    },
    triggers: [
      {
        id: 'summoner-minion-death',
        label: 'A minion died unwillingly within your Summoner’s Range',
        amount: 1,
        levelAmounts: [
          {
            fromLevel: 4,
            amount: 2,
            sourcePath:
              'vendor/steel-compendium/en/unified/md/feature/summoner/level-4/essence-salvage.md',
            quote:
              "The first time each combat round that any minion unwillingly dies within your Summoner's Range, you gain 2 essence instead of 1.",
          },
        ],
        limit: 'round',
        sourcePath: SUMMONER_ESSENCE,
        quote:
          "The first time each round that any minion (either yours or an enemy) dies unwillingly within your Summoner's Range, you gain 1 essence.",
        confirmation:
          'Your minions and positions are not tracked; the table confirms an unwilling death in range. Sacrifices, and deaths from abilities that say you gain no essence from them (Explosive Parade, Cavalry Call, Essence Funnel), do not count.',
      },
    ],
  },
  {
    className: 'Beastheart',
    // feature/beastheart/level-7/feral-heart.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'ferocity',
    combatStart: {
      kind: 'victories',
      sourcePath: BEASTHEART_FEROCITY,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain ferocity equal to your Victories.',
    },
    turnStart: {
      kind: 'dice',
      sides: 3,
      sourcePath: BEASTHEART_FEROCITY,
      quote: 'At the start of each of your turns during combat, you gain 1d3 ferocity.',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: BEASTHEART_FEROCITY,
      quote: 'You lose any remaining ferocity at the end of the encounter.',
    },
    triggers: [
      {
        id: 'beastheart-companion-adjacent-damage',
        label: 'A creature adjacent to your companion took damage',
        amount: 2,
        levelAmounts: [
          {
            fromLevel: 4,
            amount: 3,
            sourcePath:
              'vendor/steel-compendium/en/unified/md/feature/beastheart/level-4/unleash-the-beast.md',
            quote:
              'The first time each combat round that a creature adjacent to your companion takes damage, you gain 3 ferocity instead of 2 ferocity.',
          },
        ],
        limit: 'round',
        sourcePath: BEASTHEART_FEROCITY,
        quote:
          'Additionally, the first time each combat round that a creature adjacent to your companion takes damage, you gain 2 ferocity.',
        confirmation:
          'Your companion and positions are not tracked; the table confirms a creature adjacent to your companion took damage.',
      },
    ],
  },
  {
    className: 'Talent',
    // feature/talent/level-7/lucid-mind.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'clarity',
    combatStart: {
      kind: 'victories',
      sourcePath: TALENT_CLARITY,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain clarity equal to your Victories.',
    },
    turnStart: {
      kind: 'dice',
      sides: 3,
      sourcePath: TALENT_CLARITY,
      quote: 'At the start of each of your turns during combat, you gain 1d3 clarity.',
    },
    encounterEnd: {
      kind: 'reset',
      sourcePath: TALENT_CLARITY,
      quote:
        'You lose any remaining clarity or reset any negative clarity at the end of the encounter.',
    },
    turnEndStrain: {
      sourcePath: TALENT_CLARITY,
      quote:
        'At the end of each of your turns, you take 1 damage for each negative point of clarity.',
      // Steel Ward: "damage immunity equal to your Reason score until the end of your next turn"
      // after any damage; Force Orbs also grants immunity. Both are tracked by hand.
      heldBy: [
        {
          name: 'Steel Ward',
          sourcePath: 'vendor/steel-compendium/en/unified/md/feature/talent/level-1/steel-ward.md',
        },
        {
          name: 'Force Orbs',
          sourcePath:
            'vendor/steel-compendium/en/unified/md/feature/ability/talent/level-3/force-orbs.md',
        },
      ],
      notedBy: [
        {
          name: 'Vanishing Ward',
          sourcePath:
            'vendor/steel-compendium/en/unified/md/feature/talent/level-1/vanishing-ward.md',
        },
      ],
    },
    triggers: [
      {
        id: 'talent-forced-movement',
        label: 'A creature was force moved',
        amount: 1,
        levelAmounts: [
          {
            fromLevel: 4,
            amount: 2,
            sourcePath:
              'vendor/steel-compendium/en/unified/md/feature/talent/level-4/mind-recovery.md',
            quote:
              'Additionally, the first time each combat round that a creature is force moved, you gain 2 clarity instead of 1.',
          },
        ],
        limit: 'round',
        sourcePath: TALENT_CLARITY,
        quote:
          'Additionally, the first time each combat round that a creature is force moved, you gain 1 clarity.',
        confirmation:
          'Movement is not executed by the app; the table confirms a creature was actually force moved (any creature, by anyone).',
      },
    ],
  },
  {
    className: 'Fury',
    // feature/fury/level-7/greater-ferocity.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'ferocity',
    combatStart: {
      kind: 'victories',
      sourcePath: FURY_FEROCITY,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain ferocity equal to your Victories.',
    },
    turnStart: {
      kind: 'dice',
      sides: 3,
      sourcePath: FURY_FEROCITY,
      quote: 'At the start of each of your turns during combat, you gain 1d3 ferocity.',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: FURY_FEROCITY,
      quote: 'You lose any remaining ferocity at the end of the encounter.',
    },
    triggers: [
      {
        id: 'fury-first-damage',
        label: 'You took damage',
        amount: 1,
        levelAmounts: [
          {
            fromLevel: 4,
            amount: 2,
            sourcePath:
              'vendor/steel-compendium/en/unified/md/feature/fury/level-4/damaging-ferocity.md',
            quote:
              'The first time you take damage each combat round, you gain 2 ferocity instead of 1.',
          },
        ],
        limit: 'round',
        observe: 'damage-taken',
        sourcePath: FURY_FEROCITY,
        quote:
          'Additionally, the first time each combat round that you take damage, you gain 1 ferocity.',
        confirmation:
          'Applied automatically when the app records damage to you. Claim it for damage the app did not record (for example falling, or Blood for Blood self-damage entered by hand). Stamina loss that is not damage (Q-RES-3) and damage reduced to 0 (Q-RES-4) are the table’s call.',
      },
      {
        id: 'fury-winded-or-dying',
        label: 'You became winded or are dying',
        amount: 0,
        dice: { sides: 3 },
        limit: 'encounter',
        observe: 'winded-or-dying',
        sourcePath: FURY_FEROCITY,
        quote:
          'The first time you become winded or are dying in an encounter, you gain 1d3 ferocity.',
        confirmation:
          'Applied automatically the first time recorded damage takes you to your winded value or lower, or to 0 or lower. Once per encounter for either (Q-RES-2); claim it if it happened another way (for example Blood for Blood self-damage entered by hand).',
      },
    ],
  },
  {
    className: 'Null',
    // feature/null/level-7/improved-body.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'discipline',
    combatStart: {
      kind: 'victories',
      sourcePath: NULL_DISCIPLINE,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain discipline equal to your Victories.',
    },
    turnStart: {
      kind: 'fixed',
      amount: 2,
      sourcePath: NULL_DISCIPLINE,
      quote: 'At the start of each of your turns during combat, you gain 2 discipline.',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: NULL_DISCIPLINE,
      quote: 'You lose any remaining discipline at the end of the encounter.',
    },
    triggers: [
      {
        id: 'null-field-main-action',
        label: 'An enemy in your Null Field used a main action',
        amount: 1,
        levelAmounts: [
          {
            fromLevel: 4,
            amount: 2,
            sourcePath:
              'vendor/steel-compendium/en/unified/md/feature/null/level-4/regenerative-field.md',
            quote:
              'The first time each combat round that an enemy in the area of your Null Field ability uses a main action, you gain 2 discipline instead of 1.',
          },
        ],
        limit: 'round',
        sourcePath: NULL_DISCIPLINE,
        quote:
          'Additionally, the first time each combat round that an enemy in the area of your Null Field ability (see below) uses a main action, you gain 1 discipline.',
        confirmation:
          'Positions and your Null Field area are not tracked; the table confirms an enemy in the field used a main action.',
      },
      {
        id: 'null-director-malice',
        label: 'The Director used an ability that costs Malice',
        amount: 1,
        limit: 'round',
        observe: 'malice-ability',
        sourcePath: NULL_DISCIPLINE,
        quote:
          'The first time each combat round that the Director uses an ability that costs Malice (see *Draw Steel: Monsters*), you gain 1 discipline.',
        confirmation:
          'Applied automatically when a creature ability’s own Malice cost is paid. Claim it for other Malice spending the table counts as an ability (Q-RES-5).',
      },
    ],
  },
  {
    className: 'Conduit',
    // feature/conduit/level-7/faithfuls-reward.md changes the turn-start gain; levels 1–6 are checked.
    verifiedThroughLevel: 6,
    resource: 'piety',
    combatStart: {
      kind: 'victories',
      sourcePath: CONDUIT_PIETY,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain piety equal to your Victories.',
    },
    turnStart: {
      kind: 'dice',
      sides: 3,
      sourcePath: CONDUIT_PIETY,
      quote: 'At the start of each of your turns during combat, you gain 1d3 piety.',
    },
    prayer: {
      kind: 'conduit',
      label: 'Pray',
      sourcePath: CONDUIT_PIETY,
      quote:
        'Before you roll to gain piety at the start of your turn, you can pray (no action required).',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: CONDUIT_PIETY,
      quote: 'You lose any remaining piety at the end of the encounter.',
    },
    // feature/conduit/level-1/domain-piety-and-effects.md: each domain's piety, first time in an
    // encounter, for the hero's two domains only.
    triggers: [
      {
        id: 'conduit-creation',
        label: 'A creature within 10 squares used an area ability',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Creation',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that a creature within 10 squares uses an area ability.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-death-zero',
        label: 'A non-minion within 10 squares was reduced to 0 Stamina',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Death',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          "the first time in an encounter that a creature within 10 squares who isn't a minion is reduced to 0 Stamina",
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-death-solo-winded',
        label: 'A solo creature within 10 squares became winded',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Death',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'the first time in an encounter that a solo creature within 10 squares becomes winded',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-fate',
        label: 'An ally got tier 3 or an enemy got tier 1 within 10 squares',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Fate',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that an ally within 10 squares obtains a tier 3 outcome on a power roll, or an enemy within 10 squares obtains a tier 1 outcome on a power roll.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-knowledge',
        label: 'The Director spent Malice',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        observe: 'malice-ability',
        subclass: 'Knowledge',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that the Director spends Malice (see *Draw Steel: Monsters*).',
        confirmation:
          "Applied automatically when a creature ability's own Malice cost is paid; claim it for other Malice spending.",
      },
      {
        id: 'conduit-life',
        label: 'A creature within 10 squares regained Stamina',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Life',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that a creature within 10 squares regains Stamina.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-love',
        label: 'You or an ally within 10 squares used Aid Attack or an ally-targeting ability',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Love',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that you or any ally within 10 squares uses the Aid Attack maneuver or an ability that targets an ally.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-nature',
        label:
          'You or a creature within 10 squares took acid, cold, fire, lightning, poison or sonic damage',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Nature',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that you or a creature within 10 squares takes acid, cold, fire, lightning, poison, or sonic damage.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-protection',
        label:
          'You or an ally within 10 squares gained temporary Stamina or used a protective triggered action',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Protection',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          "You gain 2 piety the first time in an encounter that you or any ally within 10 squares gains temporary Stamina, or uses a triggered action to reduce incoming damage or to impose a bane or double bane on an enemy's power roll.",
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-storm',
        label: 'An enemy within 10 squares was force moved',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Storm',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that an enemy within 10 squares is force moved.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-sun',
        label: 'An enemy within 10 squares took fire or holy damage',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Sun',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that an enemy within 10 squares takes fire or holy damage.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-trickery',
        label: 'You or a creature within 10 squares took the Aid Attack or Hide maneuver',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'Trickery',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that you or a creature within 10 squares takes the Aid Attack or Hide maneuver.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
      {
        id: 'conduit-war',
        label:
          'You or a creature within 10 squares took more than 10 + your level damage in one turn',
        amount: 2,
        levelAmounts: [BLESSED_DOMAIN],
        limit: 'encounter',
        subclass: 'War',
        sourcePath: CONDUIT_DOMAINS,
        quote:
          'You gain 2 piety the first time in an encounter that you or a creature within 10 squares takes damage greater than 10 + your level in a single turn.',
        confirmation:
          'Positions and this event are not tracked; the table confirms it (within 10 squares where the text says so).',
      },
    ],
  },
  {
    className: 'Troubadour',
    deadStaysSilent: {
      sourcePath: TROUBADOUR_DRAMA,
      quote:
        "If you are still dead after the encounter in which you died, you can't gain drama during future encounters.",
    },
    // feature/troubadour/level-4/melodrama.md adds new drama triggers that are not modelled, so only
    // levels 1–3 are checked; level 7 (a-muses-muse.md) also changes the turn-start gain.
    verifiedThroughLevel: 3,
    resource: 'drama',
    combatStart: {
      kind: 'victories',
      sourcePath: TROUBADOUR_DRAMA,
      quote:
        'At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain drama equal to your Victories.',
    },
    turnStart: {
      kind: 'dice',
      sides: 3,
      sourcePath: TROUBADOUR_DRAMA,
      quote: 'At the start of each of your turns during combat, you gain 1d3 drama.',
    },
    prayer: {
      kind: 'appeal',
      label: 'Appeal to the Muses',
      fromLevel: 2,
      sourcePath:
        'vendor/steel-compendium/en/unified/md/feature/troubadour/level-2/appeal-to-the-muses.md',
      quote:
        'Before you roll to gain drama at the start of your turn, you can make your appeal (no action required).',
    },
    encounterEnd: {
      kind: 'lose',
      sourcePath: TROUBADOUR_DRAMA,
      quote: 'You lose any remaining drama at the end of the encounter.',
    },
    triggers: [
      {
        id: 'troubadour-three-heroes',
        label: 'Three or more heroes used an ability on the same turn',
        amount: 2,
        limit: 'encounter',
        sourcePath: TROUBADOUR_DRAMA,
        quote:
          'The first time three or more heroes use an ability on the same turn, you gain 2 drama.',
        confirmation:
          'Confirm that three or more heroes used an ability on one turn (triggered actions and free strikes count). Once per encounter (Q-RES-12).',
      },
      {
        id: 'troubadour-hero-winded',
        label: 'A hero was made winded',
        amount: 2,
        limit: 'encounter',
        observe: 'any-hero-winded',
        sourcePath: TROUBADOUR_DRAMA,
        quote: 'The first time any hero is made winded during the encounter, you gain 2 drama.',
        confirmation:
          'Applied automatically when recorded damage takes a hero to their winded value or lower; claim it if a hero was made winded another way.',
      },
      {
        id: 'troubadour-natural-roll',
        label: 'A creature in your line of effect rolled a natural 19 or 20',
        amount: 3,
        limit: 'each',
        sourcePath: TROUBADOUR_DRAMA,
        quote:
          'Whenever a creature within your line of effect rolls a natural 19 or 20, you gain 3 drama.',
        confirmation:
          'Line of effect is not tracked; claim it once for each natural 19 or 20 the table confirms.',
      },
      {
        id: 'troubadour-hero-dies',
        label: 'You or another hero died',
        amount: 10,
        limit: 'each',
        observe: 'any-hero-dies',
        sourcePath: TROUBADOUR_DRAMA,
        quote: 'When you or another hero dies, you gain 10 drama.',
        confirmation:
          'Applied automatically when recorded damage takes a hero to the death threshold; claim it for a death the app did not record.',
      },
    ],
  },
];

/** complication/self-taught.md: the forgo option, keyed by the complication feature's name. */
export const SELF_TAUGHT = {
  sourcePath: 'vendor/steel-compendium/en/unified/md/complication/self-taught.md',
  quote:
    'At the start of each of your turns during combat, you can forgo gaining your Heroic Resource until the start of your next turn.',
};

/** Whether the hero has the Self-Taught complication, which lets them forgo resource gains. */
export function canForgo(baseline: Pick<DerivedBaseline, 'features'> | null | undefined): boolean {
  return (baseline?.features ?? []).some(
    feature => feature.kind === 'complication' && feature.name === 'Self-Taught',
  );
}

/**
 * The profile that applies to an evaluated hero: its class has one and its level is within the
 * profile's verified range. Otherwise generation stays manual.
 */
export function generationProfile(
  baseline: Pick<DerivedBaseline, 'class' | 'level'> | null | undefined,
): GenerationProfile | undefined {
  const className = baseline?.class.value;
  const level = baseline?.level.value;
  const profile = className ? GENERATION_PROFILES.find(p => p.className === className) : undefined;
  return profile && level !== undefined && level >= 1 && level <= profile.verifiedThroughLevel
    ? profile
    : undefined;
}

/** The profile's triggers that apply to this hero (subclass-bound ones only for that subclass). */
export function triggersFor(
  profile: GenerationProfile,
  baseline: Pick<DerivedBaseline, 'subclass'> | null | undefined,
): ResourceTrigger[] {
  const subclasses = (baseline?.subclass?.value ?? '').split(' / ').map(part => part.trim());
  return profile.triggers.filter(
    trigger => !trigger.subclass || subclasses.includes(trigger.subclass),
  );
}

/** The hero's turn-start prayer, if their class has one and they have reached its level. */
export function prayerFor(
  profile: GenerationProfile,
  baseline: Pick<DerivedBaseline, 'level'> | null | undefined,
): GenerationProfile['prayer'] {
  const prayer = profile.prayer;
  return prayer && (baseline?.level.value ?? 0) >= (prayer.fromLevel ?? 1) ? prayer : undefined;
}

/** A trigger's amount and the clause it comes from at the hero's level. */
export function triggerAmount(
  trigger: ResourceTrigger,
  level: number,
): SourcedClause & { amount: number } {
  const later = (trigger.levelAmounts ?? []).filter(entry => entry.fromLevel <= level).at(-1);
  return later ?? { amount: trigger.amount, sourcePath: trigger.sourcePath, quote: trigger.quote };
}

/**
 * The claim key that enforces a trigger's limit within one encounter, or null when the limit can't
 * be placed (a per-turn trigger while no turn is active).
 */
export function claimWindow(
  limit: TriggerLimit,
  at: { round: number; turnId?: string },
): { round?: number; turnId?: string } | null {
  switch (limit) {
    case 'round':
      return { round: at.round };
    case 'turn':
      return at.turnId ? { turnId: at.turnId } : null;
    case 'encounter':
    case 'each':
      return {};
  }
}
