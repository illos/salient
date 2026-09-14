import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function appendEvent(ctx: MutationCtx, campaignId: Id<"campaigns">, user: Doc<"users">, kind: string, description: string, sessionId: Id<"sessions"> | null = null) {
  const campaign = await ctx.db.get(campaignId);
  if (!campaign) throw new ConvexError("Campaign unavailable.");
  if (sessionId) {
    const session = await ctx.db.get(sessionId);
    if (!session || session.campaignId !== campaignId || session.status === "closed") throw new ConvexError("Closed sessions are read-only.");
  }
  const sequence = campaign.eventSequence + 1;
  await ctx.db.patch(campaignId, { eventSequence: sequence });
  await ctx.db.insert("events", { campaignId, sessionId, sequence, actorId: user._id, actorName: user.displayName, kind, description, createdAt: Date.now() });
}
