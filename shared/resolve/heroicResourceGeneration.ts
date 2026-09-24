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
export type TriggerLimit = 'round' | 'turn' | 'encounter';

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
  /** Why the table confirms it: what the app cannot observe. */
  confirmation: string;
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
  triggers: ResourceTrigger[];
}

const SHADOW_INSIGHT = 'vendor/steel-compendium/en/unified/md/feature/shadow/level-1/insight.md';

const TACTICIAN_FOCUS = 'vendor/steel-compendium/en/unified/md/feature/tactician/level-1/focus.md';

const CENSOR_WRATH = 'vendor/steel-compendium/en/unified/md/feature/censor/level-1/wrath.md';

const BEASTHEART_FEROCITY =
  'vendor/steel-compendium/en/unified/md/feature/beastheart/level-1/ferocity.md';

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
      return {};
  }
}
