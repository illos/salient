import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { characterTables } from './characterTables';
import { contentTables } from './contentTables';
import { foeTables } from './foeTables';
import { dieResult, encounterTables, eventDisposition, eventOrigin } from './encounterTables';

export default defineSchema({
  ...characterTables,
  ...contentTables,
  ...foeTables,
  ...encounterTables,
  users: defineTable({ authId: v.string(), displayName: v.string() }).index('by_authId', [
    'authId',
  ]),
  campaigns: defineTable({
    name: v.string(),
    ownerId: v.id('users'),
    shareCode: v.string(),
    activeSessionId: v.union(v.id('sessions'), v.null()),
    eventSequence: v.number(),
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
    .index('by_campaign_command', ['campaignId', 'commandId']),
  commands: defineTable({
    userId: v.id('users'),
    commandId: v.string(),
    fingerprint: v.string(),
    result: v.union(v.string(), v.null()),
  }).index('by_user_command', ['userId', 'commandId']),
});
