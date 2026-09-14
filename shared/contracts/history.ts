// SPDX-License-Identifier: GPL-3.0-only
/**
 * S02 history contracts: the shapes of encounter runs, game-log events, change-journal rows, snapshots
 * and accepted dice rolls as stored by convex/encounterTables.ts. Types only, no logic. A01 writes
 * these records through the shared operations; A06 restores from them without rerunning rules or dice.
 *
 * Owning specifications: docs/data-architecture-spec.md#5-encounter-actions-and-undo,
 * docs/table-spec.md#confirmed-action-and-log-contract, docs/dice-roller-spec.md section 4.
 */
import type { EncounterId, LogEntryId } from './clock.ts';

export type { EncounterId, LogEntryId };
export type CampaignId = string;
export type SessionId = string;
export type UserId = string;
/** The caller-generated command identity; also the undo unit (see `CommandUnit`). */
export type CommandId = string;
export type SnapshotId = string;
export type RollId = string;

/** Encounter lifecycle. `closed-out` and `voided` are archived: undo cannot reopen or cross them. */
export type EncounterStatus = 'draft' | 'committed' | 'closed-out' | 'voided';

export interface EncounterRecord {
  id: EncounterId;
  campaignId: CampaignId;
  sessionId: SessionId;
  status: EncounterStatus;
  /** Present once the Director has committed setup (the precombat restoration snapshot). */
  precombatSnapshotId: SnapshotId | null;
  createdAt: number;
  archivedAt: number | null;
}

/**
 * Who produced an event. `user` entries carry the invoking user separately from any acting character
 * (log contract). `engine` and `clock` entries never invent a user invocation; they link their cause.
 */
export type EventOrigin = 'user' | 'engine' | 'clock';

/** Effective status of an event on the current history branch; corrections and undo append, never rewrite. */
export type EventDisposition = 'applied' | 'undone' | 'redone' | 'corrected' | 'archived';

/** A game-log entry as stored. `sequence` is monotonic per campaign and is the authoritative order. */
export interface HistoryEvent {
  id: LogEntryId;
  campaignId: CampaignId;
  sessionId: SessionId | null;
  encounterId: EncounterId | null;
  sequence: number;
  origin: EventOrigin;
  /** Required when `origin` is `user`; optional otherwise. */
  actorId?: UserId;
  actorName?: string;
  /** The undo unit this event belongs to. Automatic consequences reuse their cause's command id. */
  commandId: CommandId;
  /** For automatic consequences: the event that caused this one. */
  causeEventId: LogEntryId | null;
  disposition: EventDisposition;
  kind: string;
  description: string;
  /** Accepted dice recorded with the event, when the operation rolled. */
  dice?: DieResult[];
  /** Structured inputs/outputs of the operation; shape owned by the registered operation (A01). */
  payload?: unknown;
  createdAt: number;
}

/** A recorded field value. Absence is explicit so undo can remove a field it restores from. */
export type JournalValue = { present: false } | { present: true; value: unknown };

/** One before/after change of one field path, in the order it was applied within its event. */
export interface ChangeRecord {
  id: string;
  campaignId: CampaignId;
  eventId: LogEntryId;
  commandId: CommandId;
  ordinal: number;
  entityTable: string;
  entityId: string;
  /** Dotted path within the document ("live.stamina"); "" for whole-document create or delete. */
  path: string;
  before: JournalValue;
  after: JournalValue;
}

/**
 * The undo unit: one user-initiated command and every automatic consequence recorded under the same
 * `commandId`. Its journal is every `ChangeRecord` with that command id ordered by (event sequence,
 * ordinal); undo reverses the whole list from last to first, redo replays it from first to last.
 */
export interface CommandUnit {
  commandId: CommandId;
  events: HistoryEvent[];
  changes: ChangeRecord[];
}

export type SnapshotKind = 'encounter-start' | 'checkpoint';

export interface SnapshotRecord {
  id: SnapshotId;
  campaignId: CampaignId;
  encounterId: EncounterId;
  kind: SnapshotKind;
  eventId: LogEntryId | null;
  /** Recorded entity values keyed by table then document id; the taking operation owns the shape. */
  state: unknown;
  createdAt: number;
}

/** One die in a request: an id that survives into the result, and its side count. */
export interface DieSpec {
  id: string;
  sides: number;
}

export interface DieResult extends DieSpec {
  /** 1..sides; d10 values are already normalized to 1-10. */
  value: number;
}

/** Roll request accepted by the shared dice operation (dice-roller-spec section 4). */
export interface DiceRollRequest {
  campaignId: CampaignId;
  /** Retrying with the same id and the same dice returns the same accepted roll. */
  commandId: CommandId;
  dice: DieSpec[];
}

/** The accepted roll. `source` is always `generated` in v0.01; supplied dice remain engine fixtures. */
export interface AcceptedRoll {
  rollId: RollId;
  commandId: CommandId;
  dice: DieResult[];
  source: 'generated';
  /** Public is the confirmed default; the tower audience is outside v0.01. */
  audience: 'public';
}
