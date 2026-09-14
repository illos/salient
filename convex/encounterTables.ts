// SPDX-License-Identifier: GPL-3.0-only
// Storage contracts for encounter runs, the change journal, start-state snapshots and shared dice.
// Owning specification: docs/data-architecture-spec.md#5-encounter-actions-and-undo (journal, undo
// unit, dice retry) and #6-session-closure-and-compression (archive boundary fields). No operation in
// this module has gameplay meaning; later slices write these rows through convex/lib/journal.ts,
// convex/lib/events.ts and convex/lib/dice.ts.
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/** An encounter run inside one session. Archived when `closed-out` or `voided`; nothing crosses that. */
export const encounterStatus = v.union(
  v.literal('draft'),
  v.literal('committed'),
  v.literal('closed-out'),
  v.literal('voided'),
);
/** Where an event came from. `user` requires an actor; engine and clock entries carry their cause. */
export const eventOrigin = v.union(v.literal('user'), v.literal('engine'), v.literal('clock'));
/** Effective status of an event on the current history branch. Records are never rewritten. */
export const eventDisposition = v.union(
  v.literal('applied'),
  v.literal('undone'),
  v.literal('redone'),
  v.literal('corrected'),
  v.literal('archived'),
);
/** A recorded field value; absence is explicit so undo can remove fields it restores from. */
export const journalValue = v.union(
  v.object({ present: v.literal(false) }),
  v.object({ present: v.literal(true), value: v.any() }),
);
/** One die as requested and as accepted (dice-roller-spec section 4). */
export const dieSpec = v.object({ id: v.string(), sides: v.number() });
export const dieResult = v.object({ id: v.string(), sides: v.number(), value: v.number() });

export const encounterTables = {
  encounters: defineTable({
    campaignId: v.id('campaigns'),
    sessionId: v.id('sessions'),
    status: encounterStatus,
    /** Start-state snapshot taken when the Director commits setup; null while a draft. */
    precombatSnapshotId: v.union(v.id('snapshots'), v.null()),
    createdAt: v.number(),
    /** Set once by Finish cleanup or Void; the encounter is a read-only archive from then on. */
    archivedAt: v.union(v.number(), v.null()),
  })
    .index('by_campaign', ['campaignId'])
    .index('by_session', ['sessionId']),
  snapshots: defineTable({
    campaignId: v.id('campaigns'),
    encounterId: v.id('encounters'),
    kind: v.union(v.literal('encounter-start'), v.literal('checkpoint')),
    /** Event this snapshot was taken at, so history can place it in the sequence. */
    eventId: v.union(v.id('events'), v.null()),
    /** Recorded entity values keyed by table then document id; the operation taking it owns the shape. */
    state: v.any(),
    createdAt: v.number(),
  }).index('by_encounter', ['encounterId']),
  changes: defineTable({
    campaignId: v.id('campaigns'),
    eventId: v.id('events'),
    /** The undo unit: the user command whose event (or automatic consequence) made this change. */
    commandId: v.string(),
    /** Order of this change within its event; the journal for a command is (event sequence, ordinal). */
    ordinal: v.number(),
    entityTable: v.string(),
    entityId: v.string(),
    /** Dotted field path within the document; "" for creating or deleting the whole document. */
    path: v.string(),
    before: journalValue,
    after: journalValue,
  })
    .index('by_event', ['eventId', 'ordinal'])
    .index('by_campaign_command', ['campaignId', 'commandId'])
    .index('by_entity', ['entityTable', 'entityId']),
  /** Per-campaign generator state: a secret seed and the number of values drawn so far. */
  diceStates: defineTable({
    campaignId: v.id('campaigns'),
    seed: v.string(),
    counter: v.number(),
  }).index('by_campaign', ['campaignId']),
  /** Accepted rolls, one per command; a retry with the same commandId returns this row. */
  rolls: defineTable({
    campaignId: v.id('campaigns'),
    commandId: v.string(),
    fingerprint: v.string(),
    dice: v.array(dieResult),
    /** Public is the confirmed default; the tower audience is outside v0.01. */
    audience: v.literal('public'),
    counterStart: v.number(),
    createdAt: v.number(),
  }).index('by_campaign_command', ['campaignId', 'commandId']),
};
