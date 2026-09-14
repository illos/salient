/** Shared, JSON-serializable prototype boundary. No UI, Convex, filesystem, or RNG. */
export type Characteristic = 'M' | 'A' | 'R' | 'I' | 'P';
export interface SourceRef {
  path: string;
  revision: string;
  id: string;
}
export interface AbilitySource {
  id: string;
  name: string;
  source: SourceRef;
  /** Complete original ability text, not only an effects projection. */
  text: string;
  usage: string;
  distance: string;
  target: string;
  keywords: string[];
  /** Kit signature damage already includes the originating kit's bonus. */
  kitBonusesIncluded?: boolean;
  cost?: string;
  roll?: string;
  tiers?: [string, string, string];
}
export interface Expression {
  constant: number;
  characteristic?: Characteristic;
}
export type EffectDefinition =
  | { kind: 'damage'; amount: Expression; damageType?: string }
  | { kind: 'push'; distance: number }
  | {
      kind: 'condition';
      condition: string;
      characteristic: Characteristic;
      threshold: number;
      duration: string;
    };
export interface ParsedAbility {
  source: AbilitySource;
  roll?: Expression;
  cost?: { resource: string; amount: number };
  tiers: [EffectDefinition[], EffectDefinition[], EffectDefinition[]];
  diagnostics: string[];
}
export interface Condition {
  name: string;
  sourceId: string;
  duration: string;
}
export interface Entity {
  id: string;
  name: string;
  definitionId: string;
  kind: 'hero' | 'monster';
  side: 'heroes' | 'foes';
  level: number;
  stamina: number;
  maxStamina: number;
  temporaryStamina: number;
  characteristics: Record<Characteristic, number>;
  size: number;
  /** Preserve distinctions among size-one creatures for rules that compare sizes. */
  sizeCategory?: '1T' | '1S' | '1M' | '1L';
  stability: number;
  abilities: string[];
  resources: Record<string, number>;
  conditions: Condition[];
  traits: string[];
  meleeDamageBonus: [number, number, number];
  freeStrikeDamage?: number;
  squadId?: string;
  defeated?: boolean;
  fury?: { firstDamageRound?: number; windedTriggered: boolean };
}
export interface Squad {
  id: string;
  memberIds: string[];
  stamina: number;
  maxStamina: number;
  memberStamina: number;
}
export interface PendingEffect {
  id: string;
  actionId: string;
  targetId?: string;
  kind: 'movement' | 'manual';
  text: string;
  maxDistance?: number;
}
export interface GameState {
  entities: Record<string, Entity>;
  squads: Record<string, Squad>;
  round: number;
  malice: number;
  pending: PendingEffect[];
}
export interface AbilityCommand {
  kind: 'use-ability';
  id: string;
  actorId: string;
  abilityId: string;
  targetIds: string[];
  /** Supplied d10 faces. The resolver does not generate randomness. */
  roll: [number, number];
  /** Extra supplied d3 when an implemented Fury trigger needs it. */
  ferocityRoll?: number;
  facts: {
    /** Table attests target eligibility and any unmodeled positioning prerequisites. */
    targetsConfirmed?: boolean;
    distances?: Record<string, number>;
    /** This slice resolves unmodified rolls; edges/banes must be explicitly absent. */
    edges?: number;
    banes?: number;
    /** Record selected movement; omission leaves a table instruction pending. */
    movement?: Record<
      string,
      {
        distance: number;
        stabilityReduction: number;
        collision: boolean;
        /** Table confirms route legality and that external terrain/fall/trigger effects are handled. */
        effectsConfirmed?: boolean;
      }
    >;
    casualtyOrder?: string[];
    /** Number participating in a minion squad attack; requires squad validation. */
    squadAttackers?: string[];
    /** Table-supplied peak for this turn; Growing Ferocity persists after spending. */
    furyFerocityPeak?: number;
  };
}
export type ManualChange =
  | { kind: 'stamina'; entityId: string; value: number }
  | { kind: 'fury-triggers'; entityId: string; firstDamageRound?: number; windedTriggered: boolean }
  | { kind: 'resource'; entityId: string; resource: string; value: number }
  | { kind: 'condition-add'; entityId: string; condition: string; duration: string }
  | { kind: 'condition-remove'; entityId: string; condition: string }
  | { kind: 'squad-stamina'; squadId: string; value: number; defeatedIds: string[] }
  | { kind: 'round'; value: number }
  | { kind: 'malice'; value: number };
export interface ManualCommand {
  kind: 'manual';
  id: string;
  reason: string;
  changes: ManualChange[];
  completePendingIds?: string[];
}
export type Command = AbilityCommand | ManualCommand;
export interface AppliedEffect {
  kind: string;
  targetId?: string;
  before?: number;
  after?: number;
  text: string;
}
export interface Resolution {
  status: 'resolved' | 'needs-input' | 'manual-required' | 'rejected';
  state: GameState;
  effects: AppliedEffect[];
  messages: string[];
  /** Explicit unresolved mechanics/facts; never inferred to have happened. */
  unresolved: string[];
}
export interface Scenario {
  name: string;
  sourceRevision: string;
  state: GameState;
  abilities: Record<string, AbilitySource>;
  notes: string[];
}
