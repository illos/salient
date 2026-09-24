// Game-clock contract types for scheduled rules work: registration and dispatch. Types only, no logic.
//
// Owning specification: docs/table-spec.md#game-clock-and-scheduled-rules-work and
// docs/table-command-spec.md#clock-driven-operations. Sourced definitions and the worked example are in
// docs/conditions-and-clock.md (slice R05). A04 implements dispatch against these types.
//
// Standing user policy (2026-09-12/13, table-spec): at a boundary, resolve due work in enqueue order with
// save-ends rolls last; global "every turn" effects fire once per actual turn, not per participant.
// Q-TS-1 (answered 2026-09-14): no save-ends roll is automatic in v0.01; nothing registers a
// `saving-throw` work item in v0.01. The type exists so the V1 path needs no contract change.

/** Opaque identifiers owned by the persistence layer. Strings here; A04 may narrow them to Convex ids. */
export type EncounterId = string;
export type CreatureId = string;
/** One actual turn. A turn entry in an initiative group is not a turn until it is started. */
export type TurnId = string;
export type TurnEntryId = string;
export type InitiativeGroupId = string;
export type RegistrationId = string;
export type LogEntryId = string;
export type OperationId = string;

/**
 * Distinct boundaries. They never collapse into a generic tick (table-spec, confirmed 2026-09-12).
 * `combat-start` and `combat-end` exist for the Malice lifecycle; End combat does not synthesize a
 * final turn or round boundary (closeout contract).
 */
export type BoundaryKind =
  'combat-start' | 'round-start' | 'turn-start' | 'turn-end' | 'round-end' | 'combat-end';

/** Which side acts. Source: vendor/steel-compendium/en/unified/md/rule/combat/side.md. */
export type Side = 'heroes' | 'director';

/**
 * A concrete boundary event that the clock dispatches. Exactly one event exists per actual boundary;
 * resuming an interrupted turn or changing the selected participant of a shared turn creates none.
 */
export interface BoundaryEvent {
  encounterId: EncounterId;
  kind: BoundaryKind;
  /** 1-based combat round number; also the "combat round number" term in the Malice growth rule. */
  round: number;
  /** Present for `turn-start` and `turn-end`. */
  turn?: TurnRef;
  /** Log entry of the user-initiated operation that caused this boundary (Take turn, End turn, OK). */
  causeLogEntryId: LogEntryId;
}

/** Identifies one actual turn and the creature whose turn it is. */
export interface TurnRef {
  turnId: TurnId;
  turnEntryId: TurnEntryId;
  groupId: InitiativeGroupId;
  side: Side;
  /** The creature taking the turn. For a squad/captain shared turn (V02) this is the squad's turn owner. */
  creatureId: CreatureId;
  /** Every creature participating in this actual turn; length 1 for ordinary turns. */
  participantIds: CreatureId[];
}

/**
 * When registered work is due. Relative references ("your next turn") are bound at registration
 * (table-spec: "an effect on Goblin 5 lasting until the start of Thorn's next turn is anchored to Thorn").
 */
export type TimingClause =
  /** Every actual turn boundary of the given kind, for any creature (global work, fires once per actual turn). */
  | { scope: 'every-turn'; boundary: 'turn-start' | 'turn-end' }
  /** A boundary of the named creature's turns, either each of them or the next one only. */
  | {
      scope: 'creature-turn';
      boundary: 'turn-start' | 'turn-end';
      creatureId: CreatureId;
      occurrence: 'each' | 'next';
    }
  /** The end of the affected creature's current turn if imposed during it, else its next turn end. Source: rule/combat/end-of-turn.md. */
  | { scope: 'end-of-next-turn'; creatureId: CreatureId; imposedDuringTurnId?: TurnId }
  /** A round boundary: each round, or a specific round only (for example surprise ends at the end of round 1). */
  | { scope: 'round'; boundary: 'round-start' | 'round-end'; round?: number }
  /** Combat lifecycle boundaries (Malice start grant, encounter-end loss). */
  | { scope: 'combat'; boundary: 'combat-start' | 'combat-end' };

/** What the clock must do when the registration is due. The source supplies behavior; the clock owns when. */
export type ScheduledWorkKind =
  /** Remove an effect or condition instance. */
  | { kind: 'expire-effect'; effectInstanceId: string }
  /** Reset a limited-use allowance (for example once per round). */
  | { kind: 'reset-allowance'; allowanceId: string }
  /** Apply a recurring effect through a registered shared operation with its own inputs. */
  | { kind: 'recurring-effect'; operationId: OperationId }
  /**
   * A due saving throw for one effect instance on one creature. Source: rule/general/saving-throw.md
   * (d10, 6 or higher ends the effect, at the end of each of the affected creature's turns).
   * Dispatched in the final save phase. Not registered by anything in v0.01 (Q-TS-1).
   */
  | { kind: 'saving-throw'; effectInstanceId: string; creatureId: CreatureId }
  /** Common Malice lifecycle grants and loss. Source: rule/monster/malice.md#earning-malice. */
  | { kind: 'malice'; step: 'combat-start-grant' | 'round-start-gain' | 'encounter-end-loss' }
  /**
   * V120 class heroic-resource lifecycle for one hero, from its generation profile
   * (shared/resolve/heroicResourceGeneration.ts).
   */
  | {
      kind: 'heroic-resource';
      step: 'combat-start-grant' | 'turn-start-gain' | 'encounter-end-loss' | 'turn-end-strain';
      characterId: CreatureId;
    }
  /**
   * V171: a watcher effect instance of a turn boundary (docs/lasting-effects-design.md#3-watchers)
   * fires its responses at each of the watched creature's turn starts or ends.
   */
  | { kind: 'watcher'; effectInstanceId: string }
  /** Any other source-backed operation registered by A04/A05; must name its registered operation. */
  | { kind: 'operation'; operationId: OperationId };

/** Where the work came from, for the game log and for retiring registrations when their source ends. */
export interface WorkSource {
  /** The registering operation's log entry (ability use, encounter OK, condition toggle with timing, ...). */
  logEntryId: LogEntryId;
  /** Creature or object whose effect this is, when applicable. */
  originId?: CreatureId | string;
  /** Repo-relative pinned Compendium path for the timing clause, when source-backed. */
  sourcePath?: string;
  /** Human-readable summary shown in the log ("Malice: round-start gain"). */
  label: string;
}

/** A registration placed into the clock's queue. Enqueue order is the dispatch order within a boundary. */
export interface ScheduledWorkRegistration {
  id: RegistrationId;
  encounterId: EncounterId;
  timing: TimingClause;
  work: ScheduledWorkKind;
  source: WorkSource;
  /** Creatures the work affects when known at registration; a firing may collect more through spatial input. */
  affectedIds?: CreatureId[];
  /** Monotonic position in the encounter's registration sequence; ties are impossible by construction. */
  enqueueSeq: number;
  /** `active` until fired for a one-shot timing, retired when its effect ends, or superseded by undo. */
  status: 'active' | 'retired';
}

/**
 * Dispatch phases at one boundary (standing policy): everything due in enqueue order, then the save phase.
 * Save eligibility is determined from state after the ordinary phase, so effects imposed by earlier queued
 * work at the same boundary are included (standing save-phase policy, 2026-09-12).
 */
export type DispatchPhase = 'ordinary' | 'saves';

/** The plan for one boundary: what will fire and in what order. Produced before any work executes. */
export interface DispatchPlan {
  event: BoundaryEvent;
  /** Ordinary-phase items in enqueueSeq order. */
  ordinary: RegistrationId[];
  /** Save-phase items in enqueueSeq order; empty in v0.01. */
  saves: RegistrationId[];
}

/** Outcome of firing one registration. Each firing produces its own ordered log entry linked to the cause. */
export interface DispatchRecord {
  registrationId: RegistrationId;
  phase: DispatchPhase;
  logEntryId: LogEntryId;
  outcome:
    | { status: 'applied' }
    | { status: 'save'; roll: number; success: boolean }
    | { status: 'needs-input'; interactionId: string }
    | { status: 'unsupported'; reason: string };
}

/** Everything the clock did at one boundary, in order. Retries must return the same records, not refire. */
export interface DispatchResult {
  event: BoundaryEvent;
  records: DispatchRecord[];
}

/** Malice bookkeeping recorded with each automatic pool change (fury-goblin-automation.md#malice-lifecycle). */
export interface MaliceChange {
  step: 'combat-start-grant' | 'round-start-gain' | 'encounter-end-loss';
  round?: number;
  /** Inputs the source formula used, recorded for the log. */
  inputs: {
    /** Hero participants generating Malice (see Q-R-50 for the v0.01 counting default). */
    heroCount?: number;
    /** Sum of participating heroes' recorded Victories and the resulting average before any rounding. */
    victoriesTotal?: number;
    averageVictories?: number;
    /** Set when the average is fractional; see Q-R-51. */
    rounding?: 'none' | 'down';
  };
  before: number;
  delta: number;
  after: number;
}
