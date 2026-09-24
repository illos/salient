// SPDX-License-Identifier: GPL-3.0-only
/**
 * R03 live-state contract: the changeable play values of a hero or foe, their first-admission
 * initial values and the labels derived from them. Types only, no logic.
 *
 * Owning document: docs/live-state-initialization.md (every initial value with its source sentence
 * or ruling, the draft-save/re-evaluation rule, and the worked examples).
 * Owning specifications: docs/character-wizard.md#character-model-direction (baseline versus live
 * values), docs/table-spec.md#persistent-values-and-manual-adjustment-entries (which values are
 * Director-editable), docs/table-spec.md#v001-temporary-stamina, docs/table-spec.md#v001-surge-tracking,
 * docs/table-spec.md#v001-manual-condition-tracking (toggles), and
 * docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope (class resources are
 * editable counters with no automated class logic in v0.01).
 * Pinned source: vendor/steel-compendium @ fb83a789da8f0327a389c277a0c790b1648d5810.
 *
 * Live values are never read or written by draft save or build re-evaluation
 * (docs/live-state-initialization.md, section 3). They change only through registered shared
 * operations, each of which appends a history event (shared/contracts/history.ts).
 */

import type { Provenance } from './characterEvaluation.ts';
import type { CampaignId } from './history.ts';

/**
 * The nine core conditions of the v0.01 toggle list, in the Compendium condition index order
 * (shared/content/core-conditions.json, docs/conditions-and-clock.md#1-core-conditions). Ids are the
 * `id` values of that file. Winded, dying and unconscious are not conditions in the source's sense
 * and are labels (see `HealthLabels`), never toggles.
 */
export type ConditionId =
  | 'bleeding'
  | 'dazed'
  | 'frightened'
  | 'grabbed'
  | 'prone'
  | 'restrained'
  | 'slowed'
  | 'taunted'
  | 'weakened';

/** One on/off toggle per core condition (docs/table-spec.md#v001-manual-condition-tracking). */
export type ConditionToggles = Record<ConditionId, boolean>;

export type SavingThrowSource =
  { kind: 'hero-baseline'; provenance: Provenance[] } | { kind: 'printed'; sourcePath: string };

/**
 * V88 source-linked condition effect; ended instances retain save evidence for corrections.
 * V113 durations: `eot` expires at the affected creature's next turn end (rule/combat/end-of-turn.md);
 * `none` has no printed duration and ends by the condition's own rules (prone: Stand Up).
 */
export interface ConditionInstance {
  id: string;
  condition: ConditionId;
  duration: 'save-ends' | 'eot' | 'none';
  /** V113: the imposing creature, for condition/taunted.md source replacement. */
  sourceActorId?: string;
  sourceUseEventId: string;
  abilityName: string;
  actorLabel: string;
  sourcePath: string;
  status: 'active' | 'ended';
  registrationId?: string;
  lastSave?: {
    roll: number;
    success: boolean;
    boundaryEventId: string;
    threshold: number;
    thresholdSource: SavingThrowSource;
  };
  endedReason?: string;
  /** V113: the occurrence whose taunt replaced this one (condition/taunted.md). */
  replacedBy?: string;
  /**
   * V153: the first occurrence of a compound effect ("dazed and slowed (save ends)"). One saving
   * throw removes the whole effect (rule/general/saving-throw.md), so members share each roll.
   */
  saveGroup?: string;
  /**
   * V155: a timed restriction on standing (condition `prone`). While it is active the creature
   * can't use Stand Up; ending it leaves the creature prone (automation rulings, section 5).
   */
  restriction?: 'cant-stand';
}

/**
 * V158 printed duration of a lasting effect (docs/lasting-effects-design.md#durations). Relative
 * anchors ("your", "their") are bound to creatures when the effect is applied (`BoundDuration`).
 */
export type EffectDuration =
  | { kind: 'start-of-next-turn'; anchor: 'owner' }
  | { kind: 'end-of-next-turn'; anchor: 'owner' | 'subject' }
  | { kind: 'encounter' }
  | { kind: 'save-ends' }
  | { kind: 'eot' }
  | { kind: 'maintained' }
  | { kind: 'none' };

/** V158: a duration with its anchor bound to one creature id at application. */
export type BoundDuration =
  | { kind: 'start-of-next-turn'; creatureId: string }
  | { kind: 'end-of-next-turn'; creatureId: string }
  | { kind: 'encounter' }
  | { kind: 'save-ends'; creatureId: string }
  | { kind: 'eot'; creatureId: string }
  | { kind: 'maintained'; creatureId: string }
  | { kind: 'none' };

/**
 * V158 extra printed end conditions: `owner-dying` ("until you are dying", rule/health/dying.md),
 * `reused` ("until you use this ability again") and `willingly-ended` (no action required).
 */
export type EffectEndTrigger = 'owner-dying' | 'reused' | 'willingly-ended';

/** A creature an effect names. Objects and squads carry no live record of their own. */
export interface EffectParty {
  kind: 'character' | 'foe' | 'squad' | 'object';
  id: string;
  name: string;
}

/**
 * V158 effect instance (docs/lasting-effects-design.md#1-effect-instances). Only `instruction`
 * instances exist in V158: printed table work the engine tracks and ends, never executes. The other
 * kinds are reserved for later slices; condition instances keep their own V88 shape.
 */
export interface EffectInstance {
  /** The occurrence id of the compiled use that created it. */
  id: string;
  kind: 'instruction' | 'modifier' | 'aura' | 'mark' | 'watcher' | 'maintained';
  sourceUseEventId: string;
  sourceActorId: string;
  /** Ability identity for stacking and `reused` (the content id). */
  abilityId: string;
  abilityName: string;
  actorLabel: string;
  sourcePath: string;
  /** The printed clause, display markup removed. */
  clause: string;
  /** The creature "you" refers to: the user of the ability, bound at use. */
  owner: EffectParty;
  /** The creature the effect applies to (the target, or the owner for self effects). */
  subject: EffectParty;
  payload: { kind: 'instruction'; text: string };
  printedDuration: EffectDuration;
  duration: BoundDuration;
  endsWhen: EffectEndTrigger[];
  /** `consumed` is reserved for consumable effects (design section 5a). */
  status: 'active' | 'ended' | 'consumed';
  endedReason?: string;
  /** The log entry of the operation that ended it. */
  endedEventId?: string;
  registrationIds: string[];
  /**
   * V158 (QC1 R1b): part of a same-ability overlap the engine can't resolve by "Stacking Unique
   * Effects". The table resolves it: no clock work ends it, it stays visible, and later uses of the
   * ability on the subject join the manual group rather than re-entering automatic tracking.
   */
  manualStacking?: true;
  /** Shared end (as V153 saveGroup): one save ends every member. */
  group?: string;
  /** Reserved for consumable effects (design section 5a). */
  consumeOn?: { event: 'power-roll' | 'ability-roll' };
  /** The source use's log sequence: the most recent use sets the duration when stacking. */
  appliedSequence: number;
  /** A save-ends instance keeps its last saving throw, as condition instances do. */
  lastSave?: ConditionInstance['lastSave'];
}

/**
 * V158: where the owner's instances held by other creatures are, so `owner-dying` and `reused`
 * find them without scanning the campaign. Only active instances are listed.
 */
export interface OwnedEffect {
  id: string;
  holder: { kind: 'character' | 'foe'; id: string };
  abilityId: string;
}

/** Every toggle off: the first-admission state of a hero and the loaded state of a foe. */
export type NoConditions = Record<ConditionId, false>;

/**
 * A hero's heroic resource pool. `name` comes from the derived baseline
 * (`DerivedBaseline.heroicResource.name`, R02); `current` is the live counter. It changes through
 * fixed-cost payment, Manual adjustment and, for classes with a V120 generation profile
 * (shared/resolve/heroicResourceGeneration.ts), the combat clock and table-confirmed claims.
 */
export interface HeroicResourcePool {
  name: string;
  current: number;
}

/**
 * The live play values of a hero (docs/live-state-initialization.md, section 2). Maxima and derived
 * values live in the baseline (`DerivedBaseline`, R02); this record holds only what play changes.
 */
export interface HeroLiveState {
  /** Ordinary Stamina. May be negative for a hero: no clamp, no dying automation in v0.01 (R04 6.4). */
  stamina: number;
  /** Separate pool consumed before Stamina (R04 6.1); never included in winded or recovery values. */
  temporaryStamina: number;
  /** Recoveries remaining; each Catch Breath spends one (R04 section 7). */
  recoveries: number;
  heroicResource: HeroicResourcePool;
  /** Surge counter (docs/table-spec.md#v001-surge-tracking); gains and spends are manual in v0.01. */
  surges: number;
  /** Campaign value; granted by the Director at closeout (docs/table-spec.md#formal-encounter-closeout). */
  victories: number;
  /** Campaign value; nothing in v0.01 changes it (respite and advancement are V01/V08). */
  xp: number;
  conditions: ConditionToggles;
  manualConditions?: ConditionToggles;
  conditionInstances?: ConditionInstance[];
  /** V158: lasting effects held by this hero, and pointers to the ones it owns elsewhere. */
  effectInstances?: EffectInstance[];
  ownedEffects?: OwnedEffect[];
  /** V120: table-confirmed class resource triggers claimed this encounter; cleared at encounter end. */
  resourceClaims?: ResourceClaim[];
  /** V148: persistent abilities maintained this encounter (Elementalist Persistent Magic). */
  maintained?: { ability: string; value: number; encounterId: string }[];
  /** V148: damage taken during the current turn, for Persistent Magic's break. */
  turnDamage?: { turnId: string; amount: number };
  /**
   * V150 (complication/self-taught.md): forgo gaining the Heroic Resource at the next turn start
   * (`forgoNext`); while `forgoing`, no gain applies until the start of the hero's next turn.
   */
  forgoNext?: boolean;
  forgoing?: boolean;
  /** V150: the latest automatic turn-start gain, so a forgo at that turn start can reverse it. */
  lastTurnGain?: {
    encounterId: string;
    turnId: string;
    delta: number;
    after: number;
    /** The operation whose turn start wrote the gain (its journal rows carry this id). */
    eventId: string;
  };
  /** V149: the encounter in which generation is suspended (still dead from an earlier encounter). */
  generationSuspended?: string;
  /** V147: pray before the next turn-start resource roll (the Conduit's piety prayer). */
  prayNext?: boolean;
}

/** One claimed class resource trigger and the window (round or turn) its limit applies to. */
export interface ResourceClaim {
  triggerId: string;
  encounterId: string;
  round?: number;
  turnId?: string;
  /** The `resource.claim` log entry. */
  eventId: string;
}

/**
 * The first-admission values (docs/live-state-initialization.md, section 2). Fields that the
 * baseline sets (`stamina`, `recoveries`, `heroicResource`) are typed as numbers because their values
 * are the baseline's; the literal fields are the source-backed zeros and the all-off toggles.
 */
export interface InitialHeroLiveState extends HeroLiveState {
  /** Equals `DerivedBaseline.staminaMaximum.value`. */
  stamina: number;
  temporaryStamina: 0;
  /** Equals `DerivedBaseline.recoveriesMaximum.value`. */
  recoveries: number;
  /** `name` and `current` equal `DerivedBaseline.heroicResource.name/startingValue` (Fury: ferocity, Elementalist: essence, Shadow: insight; 0). */
  heroicResource: HeroicResourcePool;
  surges: 0;
  victories: 0;
  xp: 0;
  conditions: NoConditions;
}

/** The live play values of a Director-controlled creature. No Recoveries, surges, Victories or XP. */
export interface FoeLiveState {
  /** Ordinary Stamina; the arithmetic value is recorded, it may be negative (R04 6.4 interpretation). */
  stamina: number;
  temporaryStamina: number;
  conditions: ConditionToggles;
  manualConditions?: ConditionToggles;
  conditionInstances?: ConditionInstance[];
  effectInstances?: EffectInstance[];
  ownedEffects?: OwnedEffect[];
}

/** The loaded-foe values: printed Stamina, no temporary Stamina, every toggle off. */
export interface InitialFoeLiveState extends FoeLiveState {
  /** Equals the stat block's printed Stamina (`FoeMaxima.staminaMaximum`). */
  stamina: number;
  temporaryStamina: 0;
  conditions: NoConditions;
}

/**
 * Labels computed from live values and maxima whenever they are read; never stored, never toggled
 * (R04 sections 6.3 and 6.4; docs/live-state-initialization.md, section 2.3).
 */
export interface HealthLabels {
  /** floor(staminaMaximum / 2). */
  windedValue: number;
  /** `stamina <= windedValue`, on ordinary Stamina only. */
  winded: boolean;
  /** Hero only: `stamina <= 0`. A label; hero dying automation is deferred. */
  dying?: boolean;
  /** Hero only: `stamina <= -windedValue`. A label; no automation. */
  deadThresholdReached?: boolean;
  /** Ordinary foe only: `stamina <= 0` (ruling: Slain). Derivation on a later Director edit: Q-R-200. */
  slain?: boolean;
}

/**
 * The persistent fields a Director may set through the numeric Manual adjustment operation
 * (docs/table-spec.md#persistent-values-and-manual-adjustment-entries, #v001-temporary-stamina,
 * #v001-surge-tracking; the sheet spec's resource list). Malice is a shared encounter pool, not a
 * creature field. Conditions use the toggle operation, not this list.
 */
export type HeroAdjustableField =
  'stamina' | 'temporaryStamina' | 'recoveries' | 'heroicResource' | 'surges' | 'victories';

export type FoeAdjustableField = 'stamina' | 'temporaryStamina';

/** Which activation created the live record and against which definitions it was evaluated. */
export interface LiveStateOrigin {
  /** Only first admission initializes; every later activation leaves live values untouched (section 3). */
  kind: 'first-admission';
  /** The effective build revision whose baseline supplied the initial values. */
  buildRevisionId: string;
  evaluatedAgainst: { definitionsSchemaVersion: 'r01.1'; compendiumRevision: string };
  /** Epoch milliseconds of the activation that initialized the record. */
  initializedAt: number;
}

/** A hero's live record as the application keeps it: one per character per campaign attachment. */
export interface HeroLiveRecord {
  characterId: string;
  campaignId: CampaignId;
  origin: LiveStateOrigin;
  live: HeroLiveState;
}

/** Shared preview and recorded result of the Q-CHAR-2 activation policy (revised 2026-09-24). */
export interface BuildReconciliation {
  changes: {
    field: 'stamina' | 'recoveries';
    maximumBefore: number | null;
    maximumAfter: number;
    currentBefore: number;
    currentAfter: number;
  }[];
  /** No implicit conversion exists; activation is refused until explicitly reconciled. */
  incompatibleResource: { before: string; after: string } | null;
}
