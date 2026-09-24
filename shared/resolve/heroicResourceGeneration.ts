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
import type { HeroicResourceName } from '../contracts/characterEvaluation.ts';

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
  amount: number;
  limit: TriggerLimit;
  /** Why the table confirms it: what the app cannot observe. */
  confirmation: string;
}

export interface GenerationProfile {
  /** Evaluated `baseline.class.value`. */
  className: string;
  resource: HeroicResourceName;
  /** "At the start of a combat encounter … you gain <resource> equal to your Victories." */
  combatStart: { kind: 'victories' } & SourcedClause;
  turnStart: TurnStartGain;
  /** `lose`: remaining resource is lost (to 0); `reset`: any value, negative included, returns to 0. */
  encounterEnd: { kind: 'lose' | 'reset' } & SourcedClause;
  triggers: ResourceTrigger[];
}

const SHADOW_INSIGHT = 'vendor/steel-compendium/en/unified/md/feature/shadow/level-1/insight.md';

/** Enabled classes. Each entry is added by its own class slice (V120 Shadow; V140–V149 the rest). */
export const GENERATION_PROFILES: readonly GenerationProfile[] = [
  {
    className: 'Shadow',
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
        limit: 'round',
        sourcePath: SHADOW_INSIGHT,
        quote:
          'Additionally, the first time each combat round that you deal damage incorporating 1 or more surges, you gain 1 insight.',
        confirmation: 'Surge spending on damage is not recorded; the table confirms it.',
      },
    ],
  },
];

export function generationProfile(className: string | undefined): GenerationProfile | undefined {
  return className ? GENERATION_PROFILES.find(p => p.className === className) : undefined;
}

/** The claim key that enforces a trigger's limit within one encounter. */
export function claimWindow(
  limit: TriggerLimit,
  at: { round: number; turnId?: string },
): { round?: number; turnId?: string } {
  switch (limit) {
    case 'round':
      return { round: at.round };
    case 'turn':
      return { turnId: at.turnId ?? `round-${at.round}` };
    case 'encounter':
      return {};
  }
}
