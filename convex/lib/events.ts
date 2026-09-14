// SPDX-License-Identifier: GPL-3.0-only
// The one writer of game-log events. Owning specification:
// docs/table-spec.md#confirmed-action-and-log-contract (ordered attributed entries; engine activity
// never invents a user invocation) and docs/data-architecture-spec.md#5-encounter-actions-and-undo.
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { DieResult, EventDisposition, EventOrigin } from '../../shared/contracts/history';

export interface EventInput {
  campaignId: Id<'campaigns'>;
  sessionId?: Id<'sessions'> | null;
  encounterId?: Id<'encounters'> | null;
  origin: EventOrigin;
  /** The invoking user. Required when `origin` is `user`. */
  actor?: Doc<'users'>;
  /** The undo unit: the user command this event belongs to. */
  commandId: string;
  /** For engine/clock consequences: the event that caused this one. */
  causeEventId?: Id<'events'> | null;
  disposition?: EventDisposition;
  kind: string;
  description: string;
  dice?: DieResult[];
  payload?: unknown;
}

/**
 * Appends one event with the next per-campaign sequence number. The counter lives on the campaign
 * document, so two mutations appending to one campaign conflict and one of them re-runs: sequences
 * are distinct and consecutive without a separate allocator.
 */
export async function appendEvent(ctx: MutationCtx, input: EventInput): Promise<Id<'events'>> {
  const campaign = await ctx.db.get(input.campaignId);
  if (!campaign) throw new ConvexError('Campaign unavailable.');
  if (input.origin === 'user' && !input.actor)
    throw new ConvexError('A user-originated event must name the invoking user.');
  const sessionId = input.sessionId ?? null;
  if (sessionId) {
    const session = await ctx.db.get(sessionId);
    if (!session || session.campaignId !== input.campaignId || session.status === 'closed')
      throw new ConvexError('Closed sessions are read-only.');
  }
  const encounterId = input.encounterId ?? null;
  if (encounterId) {
    const encounter = await ctx.db.get(encounterId);
    if (!encounter || encounter.campaignId !== input.campaignId)
      throw new ConvexError('Encounter unavailable.');
    if (encounter.archivedAt !== null) throw new ConvexError('Archived encounters are read-only.');
  }
  if (input.causeEventId) {
    const cause = await ctx.db.get(input.causeEventId);
    if (!cause || cause.campaignId !== input.campaignId)
      throw new ConvexError('Cause event unavailable.');
  }
  const sequence = campaign.eventSequence + 1;
  await ctx.db.patch(input.campaignId, { eventSequence: sequence });
  return ctx.db.insert('events', {
    campaignId: input.campaignId,
    sessionId,
    encounterId,
    sequence,
    origin: input.origin,
    ...(input.actor ? { actorId: input.actor._id, actorName: input.actor.displayName } : {}),
    commandId: input.commandId,
    causeEventId: input.causeEventId ?? null,
    disposition: input.disposition ?? 'applied',
    kind: input.kind,
    description: input.description,
    ...(input.dice ? { dice: input.dice } : {}),
    ...(input.payload !== undefined ? { payload: input.payload } : {}),
    createdAt: Date.now(),
  });
}
