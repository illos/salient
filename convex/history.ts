// SPDX-License-Identifier: GPL-3.0-only
/**
 * A06 read side: what the viewer may undo, rewind or redo right now, so the table's history
 * controls and inline Undo markers show the same answer the shared operations enforce. The
 * operations themselves are `history.undo`, `history.rewind`, `history.redo` and
 * `campaign.user-undo` in convex/lib/history.ts, reachable through commands.submit/invoke.
 *
 * Owning specification: docs/table-spec.md#undo-permissions-and-proposed-campaign-control.
 */
import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireUser } from './lib/access';
import { settingsOf } from './lib/audience';
import { tableContext } from './lib/registry';
import { directorWindow, loadHistory, playerWindow, redoWindow, type Window } from './lib/history';

const availability = v.object({
  available: v.boolean(),
  reason: v.union(v.string(), v.null()),
  target: v.union(
    v.null(),
    v.object({ eventId: v.id('events'), sequence: v.number(), description: v.string() }),
  ),
});

function project(window: Window) {
  return window.allowed
    ? {
        available: true,
        reason: null,
        target: {
          eventId: window.unit.head._id,
          sequence: window.unit.head.sequence,
          description: window.unit.head.description,
        },
      }
    : { available: false, reason: window.reason, target: null };
}

export const status = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.object({
    role: v.union(v.literal('director'), v.literal('player'), v.literal('observer')),
    enableUserUndo: v.boolean(),
    /** Player undo (or the Director's rewind, which is what the Director's Undo means). */
    undo: availability,
    redo: availability,
    /** Where the current encounter or FreePlay stretch begins; nothing at or before it is reachable. */
    floor: v.object({ sequence: v.number(), label: v.string() }),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    const enableUserUndo = settingsOf(context.campaign).enableUserUndo;
    const closed = (reason: string) => ({ available: false, reason, target: null });
    if (!context.session || context.session.status !== 'running')
      return {
        role: context.role,
        enableUserUndo,
        undo: closed('History needs a running session.'),
        redo: closed('History needs a running session.'),
        floor: { sequence: 0, label: 'no running session' },
      };
    const scope = await loadHistory(ctx, context);
    const floor = { sequence: scope.floorSequence, label: scope.floorLabel };
    if (context.role === 'observer')
      return {
        role: context.role,
        enableUserUndo,
        undo: closed('Observers cannot undo.'),
        redo: closed('Observers cannot redo.'),
        floor,
      };
    if (context.role === 'player' && !enableUserUndo)
      return {
        role: context.role,
        enableUserUndo,
        undo: closed('Enable user undo is off for this campaign.'),
        redo: closed('Enable user undo is off for this campaign.'),
        floor,
      };
    const undo =
      context.role === 'director'
        ? directorWindow(scope)
        : await playerWindow(ctx, scope, context.user);
    const redo = await redoWindow(ctx, scope, context);
    return { role: context.role, enableUserUndo, undo: project(undo), redo: project(redo), floor };
  },
});
