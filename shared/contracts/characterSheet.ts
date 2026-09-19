// SPDX-License-Identifier: GPL-3.0-only
/**
 * The v0.01 character sheet payload as the shared `characters.sheet` read returns it, projected
 * per audience on the server (docs/character-sheet-spec.md#views-permissions-and-persistence;
 * docs/accounts-and-access-spec.md#7-character-visibility-and-delegated-play). Owner-private notes
 * exist only in the `owner` audience; peers receive Stamina and Recoveries only. Types only.
 */
import type {
  DerivedBaseline,
  Diagnostic,
  EvaluationStatus,
  GrantedAbility,
  GrantedFeature,
  PartialBaseline,
} from './characterEvaluation.ts';
import type { BuildReconciliation, HealthLabels, HeroLiveState } from './liveState.ts';

/** A content snapshot entry carrying verbatim source text (shared/contracts/content.ts). */
export interface SheetContent {
  id: string;
  name: string;
  /** The complete source file, byte-exact. */
  text: string;
  sourcePath: string;
  revision: string;
}

export type ActionGroup = 'main' | 'maneuver' | 'move' | 'triggered' | 'other';

/** Printed ability facts copied from the entry's frontmatter; absent when the source prints none. */
export interface SheetAbilityMetadata {
  actionType?: string;
  keywords: string[];
  distance?: string;
  target?: string;
  cost?: string;
  roll?: string;
  tiers?: [string, string, string];
  trigger?: string;
  effects?: { label: string; text: string }[];
}

export interface SheetAbility extends Omit<GrantedAbility, 'provenance'> {
  content: SheetContent | null;
  group: ActionGroup;
  metadata: SheetAbilityMetadata;
  /** Contributions displayed separately from verbatim printed tiers, never baked into source text. */
  buildModifiers?: {
    label: string;
    amount: number;
    sourcePath: string;
    condition?: string;
  }[];
  /** The source sentence that granted the ability (its provenance). */
  grantedBy: { decisionId: string; selection?: string; quote: string; path: string; note?: string };
}

export interface SheetFeature extends Omit<GrantedFeature, 'provenance'> {
  content: SheetContent | null;
  grantedBy: { decisionId: string; selection?: string; quote: string; path: string; note?: string };
}

export interface CommonAction {
  id: string;
  name: string;
  group: ActionGroup;
  content: SheetContent;
}

export interface SheetBuild {
  /** `effective`: the campaign's build. `draft`: the owner's saved draft. `proposed`: a pending submission. */
  label: 'effective' | 'draft' | 'proposed';
  revision: number;
  status: EvaluationStatus | 'awaiting-rules-evaluation';
  baseline: DerivedBaseline | null;
  partial: PartialBaseline | null;
  diagnostics: Record<string, Diagnostic[]>;
}

export interface SheetReview {
  id: string;
  kind: 'admission' | 'full-edit';
  status: 'pending' | 'approved' | 'declined' | 'withdrawn' | 'logged' | 'stale';
  revision: number;
  campaignId: string;
  campaignName: string;
  submittedAt: number;
}

export interface SheetDetails {
  cultureName: string | null;
  cultureLanguage: string | null;
  environment: string | null;
  organization: string | null;
  upbringing: string | null;
  incitingIncident: string | null;
  whatWasTaken: string | null;
  connections: string | null;
}

export interface HeroSheet {
  audience: 'owner' | 'director';
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  campaign: { id: string; name: string } | null;
  /** The viewer's relation to the attached campaign's table. */
  viewer: {
    role: 'director' | 'player' | 'observer' | null;
    controls: boolean;
    sessionRunning: boolean;
  };
  combatLocked: boolean;
  build: SheetBuild | null;
  /** Every ability the shown build grants, in baseline order, and no other. */
  abilities: SheetAbility[];
  /** Traits, then features, then perks, in baseline order. */
  features: SheetFeature[];
  commonActions: CommonAction[];
  live: (HeroLiveState & { labels: HealthLabels }) | null;
  /** The proposed build's effect on current live values; null for an effective/initial build. */
  activationPreview: BuildReconciliation | null;
  details: SheetDetails;
  authored: { appearance: string; biography: string; notes?: string };
  review: SheetReview | null;
}

export interface PeerSheet {
  audience: 'peer';
  id: string;
  name: string;
  ownerName: string;
  live: { stamina: number; recoveries: number } | null;
  maxima: { staminaMaximum: number; recoveriesMaximum: number } | null;
}

export type CharacterSheet = HeroSheet | PeerSheet;
