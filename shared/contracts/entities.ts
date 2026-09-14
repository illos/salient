// SPDX-License-Identifier: GPL-3.0-only
/**
 * R03 engine projection contract: the combat entity the engine consumes for a hero (effective build
 * plus live state) and for a Director-controlled creature (content entry plus live state). Types
 * only, no logic.
 *
 * Owning document: docs/live-state-initialization.md (sections 4 and 5, with the hero-fixture and
 * Goblin Warrior worked projections). Owning specifications:
 * docs/engine-architecture.md#proposed-boundaries (engine-owned ids and entity contract),
 * docs/character-wizard.md#character-model-direction (the existing `src/contracts.ts` Entity is a
 * bounded projection; a future adapter supplies its combat inputs from the character system).
 * Field names follow `src/contracts.ts` (`Entity`, `AbilitySource`) where the meaning is the same so
 * A01/A03 can adopt the projection without a rewrite; the mapping table is in the document.
 * Pinned source: vendor/steel-compendium @ fb83a789da8f0327a389c277a0c790b1648d5810.
 */

import type { CreatureId, Side } from './clock.ts';
import type { CampaignId } from './history.ts';
import type {
  ActionType,
  Characteristic,
  DamageModifierEntry,
  ResourceCost,
  SourceRef,
} from './rollResolution.ts';
import type {
  GrantedAbility,
  GrantedFeature,
  UncertaintyId as EvaluationUncertaintyId,
} from './characterEvaluation.ts';
import type { FoeLiveState, HealthLabels, HeroLiveState } from './liveState.ts';

/** Sub-categories of size 1 (rule/character/size.md); `size` stays numeric for size comparisons. */
export type SizeCategory = '1T' | '1S' | '1M' | '1L';

/**
 * Structured ability facts the source states in its frontmatter or stat-block table, in the shape
 * R04's resolver reads (`AbilityRollMetadata`). Tier text is carried verbatim on the projection;
 * parsing tiers into damage expressions is the A05 parser's work, not part of the projection.
 */
export interface AbilityMetadata {
  actionType: ActionType;
  /** Keywords with the source's link markup removed, e.g. ["Melee", "Strike", "Weapon"]. */
  keywords: string[];
  /** Permitted roll characteristics in printed order; empty for an ability with no power roll. */
  permittedCharacteristics: Characteristic[];
  /** A stat block's printed "Power Roll + N" modifier (R04 1.1). */
  fixedRollBonus?: number;
  /** Fixed activation cost as the source prints it ("3 Ferocity", "2 Malice"); resource lower-cased. */
  fixedCost?: ResourceCost;
  /** True only for a kit's own signature ability (R04 4.2). */
  kitBonusesIncluded: boolean;
}

/**
 * One ability as the engine sees it: verbatim source text plus the printed metadata. Field names
 * `usage`, `distance`, `target`, `keywords`, `cost`, `roll`, `tiers` and `text` are those of
 * `src/contracts.ts` `AbilitySource`, with the same verbatim-string meaning.
 */
export interface AbilityProjection {
  /**
   * Engine ability id. For a content entry it is the entry's SCC id
   * (`mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam`); for an ability embedded in a stat
   * block it is the stat block's SCC id, a slash and the feature name slug
   * (`mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior/spear-charge`).
   */
  abilityId: string;
  name: string;
  /** Hero abilities: the R02 grant kind. Foe abilities: `signature` or `malice` (printed cost). */
  kind: GrantedAbility['kind'] | 'malice';
  /** Repo-relative Markdown path, pinned revision and SCC id of the file that holds the text. */
  source: SourceRef;
  /**
   * Content snapshot entry that carries this text (shared/content/compendium), when one does.
   * A kit signature ability is carried by its kit entry; a stat-block ability by its stat block.
   */
  contentId?: string;
  /**
   * Verbatim source text. For an entry: the complete file, byte-exact, frontmatter included (the
   * snapshot's `ContentEntry.text` convention). For a stat-block ability or trait: its blockquote
   * block, byte-exact, as printed in the stat block file.
   */
  text: string;
  /** Printed action type as written ("Main action", "Triggered"). */
  usage: string;
  distance: string;
  target: string;
  /** Keywords as printed, link markup retained. */
  keywords: string[];
  /** Printed cost line, when the source prints one. */
  cost?: string;
  /** Printed power-roll line, when the ability has one ("Power Roll + Might", "Power Roll + 2"). */
  roll?: string;
  /** Verbatim tier outcomes in tier order, when the ability has a power roll. */
  tiers?: [string, string, string];
  /** Verbatim trigger sentence, for a triggered action. */
  trigger?: string;
  /**
   * Verbatim Effect and spend clauses that follow the tiers or trigger, in printed order. `label` is
   * the printed lead-in ("Effect", "Spend 1 Ferocity"); `text` is the clause as printed.
   */
  effects?: { label: string; text: string }[];
  metadata: AbilityMetadata;
}

/** A feature, trait or perk carried by name and verbatim text; resolved manually in v0.01. */
export interface FeatureProjection {
  /** SCC id of the entry, or `<stat block scc>/<slug>` for a stat-block trait. */
  featureId: string;
  name: string;
  kind: GrantedFeature['kind'] | 'stat-block-trait';
  source: SourceRef;
  contentId?: string;
  /** Verbatim text under the same convention as `AbilityProjection.text`. */
  text: string;
}

/** Plain kit numbers in the shape R04 consumes (`ActorRollFacts.kitMeleeDamageBonus`, ...). */
export interface KitValues {
  name: string;
  contentId: string;
  /** Amount added to the Stamina maximum at the hero's echelon (already inside `staminaMaximum`). */
  staminaBonusApplied: number;
  speedBonus: number;
  stabilityBonus: number;
  meleeDamageBonus: [number, number, number];
  rangedDamageBonus: [number, number, number];
  meleeDistanceBonus: number;
  rangedDistanceBonus: number;
  disengageBonus: number;
}

/** Baseline maxima and fixed values of a hero, as plain numbers copied from `DerivedBaseline`. */
export interface HeroMaxima {
  staminaMaximum: number;
  recoveriesMaximum: number;
  recoveryValue: number;
  windedValue: number;
  speed: number;
  stability: number;
  size: number;
  sizeCategory?: SizeCategory;
  disengage: number;
  potencyCharacteristic: Characteristic;
  potency: { weak: number; average: number; strong: number };
  savingThrowThreshold: number;
}

/** The engine's view of a hero: identity, baseline values, live values, abilities and features. */
export interface HeroEntity {
  kind: 'hero';
  side: Extract<Side, 'heroes'>;
  /** Engine-owned creature id used by the clock and history (`CreatureId`). */
  entityId: CreatureId;
  characterId: string;
  campaignId: CampaignId;
  /** Effective build revision the baseline was evaluated from. */
  buildRevisionId: string;
  name: string;
  level: 1;
  ancestry: string;
  class: string;
  subclass: string;
  characteristics: Record<Characteristic, number>;
  maxima: HeroMaxima;
  /** Absent only when the baseline has no kit (not reachable for a complete v0.01 build). */
  kit: KitValues | null;
  live: HeroLiveState;
  /** Computed from `live` and `maxima` at read time (`HealthLabels`). */
  labels: HealthLabels;
  /** Every ability the baseline grants, in baseline order, and no other. */
  abilities: AbilityProjection[];
  /** Traits, features and perks in baseline order (traits, then features, then perks). */
  features: FeatureProjection[];
  /** Open question ids whose provisional defaults influenced the baseline (R02) or this projection. */
  uncertainties: (EvaluationUncertaintyId | ProjectionUncertaintyId)[];
}

/** Open question ids that label provisional behavior in this contract (docs/rules-questions-for-user.md). */
export type ProjectionUncertaintyId = 'Q-R-200' | 'Q-R-201' | 'Q-CHAR-2';

/** Printed stat-block values of a Director-controlled creature. */
export interface FoeMaxima {
  /** The printed Stamina; also the loaded current value. */
  staminaMaximum: number;
  windedValue: number;
  speed: number;
  stability: number;
  size: number;
  sizeCategory?: SizeCategory;
  /** Printed Free Strike value; a creature free strike never rolls (R04 4.4). */
  freeStrike: number;
  /** Printed immunities and weaknesses; empty when the stat block prints "-". */
  immunities: DamageModifierEntry[];
  weaknesses: DamageModifierEntry[];
}

/** The engine's view of one ordinary foe instance loaded from a content entry. */
export interface FoeEntity {
  kind: 'foe';
  side: Extract<Side, 'director'>;
  entityId: CreatureId;
  /** The roster instance this projection was built from. */
  foeId: string;
  campaignId: CampaignId;
  /** SCC id of the stat block entry in the content snapshot. */
  contentId: string;
  name: string;
  source: SourceRef;
  /** The complete stat block file, byte-exact (Director-only audience is app policy). */
  text: string;
  level: number;
  organization: string;
  role: string;
  /** Printed keywords ("Goblin", "Humanoid"). */
  keywords: string[];
  characteristics: Record<Characteristic, number>;
  maxima: FoeMaxima;
  live: FoeLiveState;
  labels: HealthLabels;
  /** The stat block's abilities in printed order: the signature ability first, then Malice abilities. */
  abilities: AbilityProjection[];
  /** The stat block's traits in printed order. */
  traits: FeatureProjection[];
  uncertainties: ProjectionUncertaintyId[];
}

export type CombatEntity = HeroEntity | FoeEntity;
