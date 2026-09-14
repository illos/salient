import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { abilityTables } from './abilityTables';
import { characterTables } from './characterTables';
import { contentTables } from './contentTables';
import { foeTables } from './foeTables';
import { historyTables } from './historyTables';
import { dieResult, encounterTables, eventDisposition, eventOrigin } from './encounterTables';
import { initiativeTables } from './initiativeTables';

export default defineSchema({
  ...characterTables,
  ...contentTables,
  ...foeTables,
  ...encounterTables,
  ...initiativeTables,
  ...historyTables,
  ...abilityTables,
  users: defineTable({ authId: v.string(), displayName: v.string() }).index('by_authId', [
    'authId',
  ]),
  campaigns: defineTable({
    name: v.string(),
    ownerId: v.id('users'),
    shareCode: v.string(),
    activeSessionId: v.union(v.id('sessions'), v.null()),
    eventSequence: v.number(),
    /** A03 display settings; absent means the specified defaults (Show Malice off, Bar). */
    settings: v.optional(
      v.object({
        showMalice: v.boolean(),
        showTestDifficulty: v.optional(v.boolean()),
        healthDisplay: v.union(v.literal('bar'), v.literal('numerical'), v.literal('winded')),
        /** A06 "Enable user undo" (docs/table-spec.md#undo-permissions-and-proposed-campaign-control); absent means on. */
        enableUserUndo: v.optional(v.boolean()),
      }),
    ),
    /** The shared Malice pool; absent means no pool has been recorded yet (read as 0). */
    malice: v.optional(v.number()),
  }).index('by_shareCode', ['shareCode']),
  memberships: defineTable({ campaignId: v.id('campaigns'), userId: v.id('users') })
    .index('by_campaign_user', ['campaignId', 'userId'])
    .index('by_user', ['userId']),
  joinRequests: defineTable({
    campaignId: v.id('campaigns'),
    userId: v.id('users'),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('declined'),
      v.literal('withdrawn'),
    ),
  })
    .index('by_campaign_user', ['campaignId', 'userId'])
    .index('by_campaign_status', ['campaignId', 'status'])
    .index('by_user', ['userId']),
  sessions: defineTable({
    campaignId: v.id('campaigns'),
    status: v.union(v.literal('running'), v.literal('paused'), v.literal('closed')),
    revision: v.number(),
    selectedPlayerIds: v.array(v.id('users')),
    /** The session's current encounter run (draft or committed); combat locks apply once committed. */
    encounterId: v.union(v.id('encounters'), v.null()),
    startedAt: v.number(),
    closedAt: v.union(v.number(), v.null()),
  }).index('by_campaign', ['campaignId']),
  // Shape documented in shared/contracts/history.ts (HistoryEvent). Written only by lib/events.ts.
  events: defineTable({
    campaignId: v.id('campaigns'),
    sessionId: v.union(v.id('sessions'), v.null()),
    encounterId: v.union(v.id('encounters'), v.null()),
    /** Monotonic per campaign, allocated from campaigns.eventSequence inside the writing mutation. */
    sequence: v.number(),
    origin: eventOrigin,
    /** Required for origin "user" (enforced in lib/events.ts); optional for engine and clock. */
    actorId: v.optional(v.id('users')),
    actorName: v.optional(v.string()),
    /** The undo unit; automatic consequences reuse the id of the user command that caused them. */
    commandId: v.string(),
    commandKey: v.optional(v.string()),
    causeEventId: v.union(v.id('events'), v.null()),
    disposition: eventDisposition,
    kind: v.string(),
    description: v.string(),
    dice: v.optional(v.array(dieResult)),
    payload: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_campaign_sequence', ['campaignId', 'sequence'])
    .index('by_session_sequence', ['sessionId', 'sequence'])
    .index('by_encounter_sequence', ['encounterId', 'sequence'])
    .index('by_campaign_command', ['campaignId', 'commandId'])
    .index('by_campaign_command_key', ['campaignId', 'commandKey']),
  // Pending interactions (action cards) as data; written by lib/registry.ts and lib/interactions.ts.
  interactions: defineTable({
    campaignId: v.id('campaigns'),
    sessionId: v.union(v.id('sessions'), v.null()),
    status: v.union(v.literal('awaiting-input'), v.literal('resolved'), v.literal('closed')),
    /** `guided-input` in A01; later slices add mid-operation and cross-user kinds. */
    kind: v.string(),
    operation: v.string(),
    /** The character the card acts for, shown before anyone interacts; null for Director-only cards. */
    actorLabel: v.union(v.string(), v.null()),
    boundActor: v.any(),
    requesterId: v.id('users'),
    requiredInputs: v.any(),
    /** The envelope (without command id) that resumes the operation once answered. */
    continuation: v.any(),
    revision: v.number(),
    openedEventId: v.id('events'),
    resolvedEventId: v.union(v.id('events'), v.null()),
    answer: v.any(),
    createdAt: v.number(),
    resolvedAt: v.union(v.number(), v.null()),
  }).index('by_campaign_status', ['campaignId', 'status']),
  commands: defineTable({
    userId: v.id('users'),
    commandId: v.string(),
    fingerprint: v.string(),
    result: v.union(v.string(), v.null()),
  }).index('by_user_command', ['userId', 'commandId']),
});
