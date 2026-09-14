import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { characterTables } from "./characterTables";
import { foeTables } from "./foeTables";

export default defineSchema({
  ...characterTables,
  ...foeTables,
  users: defineTable({ authId: v.string(), displayName: v.string() }).index("by_authId", ["authId"]),
  campaigns: defineTable({ name: v.string(), ownerId: v.id("users"), shareCode: v.string(), activeSessionId: v.union(v.id("sessions"), v.null()), eventSequence: v.number() }).index("by_shareCode", ["shareCode"]),
  memberships: defineTable({ campaignId: v.id("campaigns"), userId: v.id("users") }).index("by_campaign_user", ["campaignId", "userId"]).index("by_user", ["userId"]),
  joinRequests: defineTable({ campaignId: v.id("campaigns"), userId: v.id("users"), status: v.union(v.literal("pending"), v.literal("approved"), v.literal("declined"), v.literal("withdrawn")) }).index("by_campaign_user", ["campaignId", "userId"]).index("by_campaign_status", ["campaignId", "status"]).index("by_user", ["userId"]),
  sessions: defineTable({ campaignId: v.id("campaigns"), status: v.union(v.literal("running"), v.literal("paused"), v.literal("closed")), revision: v.number(), selectedPlayerIds: v.array(v.id("users")), combatActive: v.boolean(), startedAt: v.number(), closedAt: v.union(v.number(), v.null()) }).index("by_campaign", ["campaignId"]),
  events: defineTable({ campaignId: v.id("campaigns"), sessionId: v.union(v.id("sessions"), v.null()), sequence: v.number(), actorId: v.id("users"), actorName: v.string(), kind: v.string(), description: v.string(), createdAt: v.number() }).index("by_campaign_sequence", ["campaignId", "sequence"]).index("by_session_sequence", ["sessionId", "sequence"]),
  commands: defineTable({ userId: v.id("users"), commandId: v.string(), fingerprint: v.string(), result: v.union(v.string(), v.null()) }).index("by_user_command", ["userId", "commandId"]),
});
