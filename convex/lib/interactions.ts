// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pending interactions (action cards) as data: a row with a status, the labeled bound actor and the
 * operation continuation. Cards render this row; they contain no parsing or engine logic. Responding
 * resumes the continuation through the shared runner under the responder's command id.
 *
 * Owning specification: docs/table-command-spec.md#results-and-pending-interactions (stable id,
 * originating event, kind, required inputs, responder scope, revision, status) and
 * docs/table-spec.md#confirmed-action-and-log-contract (headless inspection and response).
 * The full completion-policy state machine remains open; this slice delivers the skeleton with
 * statuses `awaiting-input | resolved | closed` and one answer per interaction.
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor, CommandEnvelope } from '../../shared/commands/envelope';
import type { OperationResult, Outcome, RespondsTo, TableContext } from './registry';

export type Runner = (
  ctx: MutationCtx,
  context: TableContext,
  envelope: CommandEnvelope,
  respondsTo: RespondsTo | null,
) => Promise<OperationResult>;

/** The requester or the Director may answer or close a card. Visibility never grants permission. */
export function mayAnswer(interaction: Doc<'interactions'>, context: TableContext): boolean {
  return (
    (context.role === 'director' || interaction.requesterId === context.user._id) &&
    interaction.status === 'awaiting-input' &&
    interaction.sessionId === (context.session?._id ?? null) &&
    context.session?.status !== 'closed'
  );
}

export async function scopedInteraction(
  ctx: MutationCtx,
  context: TableContext,
  interactionId: Id<'interactions'>,
) {
  const interaction = await ctx.db.get(interactionId);
  if (!interaction || interaction.campaignId !== context.campaign._id)
    throw new ConvexError('Interaction unavailable.');
  return interaction;
}

/** A historical card is inspectable, but neither answer nor closure can move it to another session. */
function requireOwningSession(interaction: Doc<'interactions'>, context: TableContext): void {
  if (
    interaction.sessionId !== (context.session?._id ?? null) ||
    context.session?.status === 'closed'
  )
    throw new ConvexError(
      'This card’s owning session is no longer active. Closed sessions are read-only.',
    );
}

export async function respondToInteraction(
  ctx: MutationCtx,
  input: {
    context: TableContext;
    interactionId: Id<'interactions'>;
    answer: unknown;
    commandId: string;
    actor: BoundActor | null;
    expectedRevision?: number;
    run: Runner;
  },
): Promise<OperationResult> {
  const { context } = input;
  const interaction = await scopedInteraction(ctx, context, input.interactionId);
  requireOwningSession(interaction, context);
  if (interaction.status !== 'awaiting-input')
    throw new ConvexError(`This card is already ${interaction.status}.`);
  if (input.expectedRevision !== undefined && interaction.revision !== input.expectedRevision)
    throw new ConvexError('This card changed. Refresh and try again.');
  if (!mayAnswer(interaction, context))
    throw new ConvexError('Only the person who opened this card or the Director can answer it.');
  const bound = interaction.boundActor as BoundActor | null;
  if (input.actor && (!bound || input.actor.id !== bound.id || input.actor.kind !== bound.kind))
    throw new ConvexError(
      `This card is bound to ${bound?.name ?? 'no character'}; it does not act for ${input.actor.name}.`,
    );
  if (typeof input.answer !== 'object' || input.answer === null || Array.isArray(input.answer))
    throw new ConvexError('The answer must be an object of the card’s inputs.');
  const answer = input.answer as Record<string, unknown>;
  const required = interaction.requiredInputs as { name: string; required: boolean }[];
  const missing = required.filter(field => field.required && !Object.hasOwn(answer, field.name));
  if (missing.length)
    throw new ConvexError(`The card still needs: ${missing.map(field => field.name).join(', ')}.`);
  const continuation = interaction.continuation as Omit<CommandEnvelope, 'commandId'>;
  const envelope: CommandEnvelope = {
    ...continuation,
    commandId: input.commandId,
    // Stable identity is authoritative, including the absence of an actor. The runner rechecks
    // current table membership and control of that same entity, even after a rename.
    actor: bound ? { refKind: bound.kind, id: bound.id } : null,
    arguments: { ...continuation.arguments, ...(answer as CommandEnvelope['arguments']) },
  };
  const result = await input.run(ctx, context, envelope, {
    interactionId: interaction._id,
    openedEventId: interaction.openedEventId,
    answer,
  });
  await ctx.db.patch(interaction._id, {
    status: 'resolved',
    revision: interaction.revision + 1,
    resolvedEventId: result.eventId,
    answer,
    resolvedAt: Date.now(),
  });
  return result;
}

/** Validate closure now; the runner records an attributed event before committing the status. */
export async function closeInteraction(
  ctx: MutationCtx,
  context: TableContext,
  interactionId: Id<'interactions'>,
  expectedRevision?: number,
): Promise<Outcome> {
  const interaction = await scopedInteraction(ctx, context, interactionId);
  requireOwningSession(interaction, context);
  if (interaction.status !== 'awaiting-input')
    throw new ConvexError(`This card is already ${interaction.status}.`);
  if (expectedRevision !== undefined && interaction.revision !== expectedRevision)
    throw new ConvexError('This card changed. Refresh and try again.');
  if (!mayAnswer(interaction, context))
    throw new ConvexError('Only the person who opened this card or the Director can close it.');
  return {
    kind: 'interaction.closed',
    description: `${interaction.actorLabel ?? 'Table roll'} — card closed without an answer.`,
    causeEventId: interaction.openedEventId,
    data: { interactionId: interaction._id, status: 'closed' },
    commit: async ctx => {
      await ctx.db.patch(interaction._id, {
        status: 'closed',
        revision: interaction.revision + 1,
        resolvedAt: Date.now(),
      });
    },
  };
}
