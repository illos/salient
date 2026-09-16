// SPDX-License-Identifier: GPL-3.0-only
/**
 * The shared pieces of the A06 history surface: the `history.status` view type and the slash text
 * each control submits. Nothing here resolves whether a control is available — that comes from
 * `history.status` on the server, and the operation checks again when it runs, so a stale control
 * cannot bypass a seam.
 *
 * V29 placement (docs/build/V29-desktop-feedback.md item 1): the Director's Rewind, Redo and
 * Enable user undo are rows in the table settings pop-up (web/table/settings-popup.tsx); a player's
 * Undo and Redo are inline on the entry they would act on (web/table/log-entry.tsx). The compact
 * toolbar V21 put under the LOG / RULES / ROLLS tabs is gone.
 *
 * Owning specification: docs/table-spec.md#undo-permissions-and-proposed-campaign-control (an Undo
 * button accompanies inline results under existing player/Director permissions; Enable user undo).
 */
import { api } from '../../convex/_generated/api';
import type { FunctionReturnType } from 'convex/server';

export type HistoryStatus = FunctionReturnType<typeof api.history.status>;

/** The slash text that undoes the latest unit for this role; the Director's undo is a rewind. */
export function undoCommand(role: HistoryStatus['role'], eventId?: string): string {
  const verb = role === 'director' ? '/history rewind' : '/history undo';
  return eventId ? `${verb} event="${eventId}"` : verb;
}

/** The slash text that restores the top of the redo path; the same operation for every role. */
export function redoCommand(eventId?: string): string {
  return eventId ? `/history redo event="${eventId}"` : '/history redo';
}

/** The label the viewer's undo carries: the Director rewinds, everyone else undoes. */
export function undoLabel(role: HistoryStatus['role']): string {
  return role === 'director' ? 'Rewind' : 'Undo';
}

/** One line: what the control would act on, or why it is unavailable. */
export function availability(label: string, entry: HistoryStatus['undo']): string {
  return entry.available && entry.target
    ? `${label}: #${entry.target.sequence} ${entry.target.description}`
    : `${label}: ${entry.reason ?? 'unavailable'}`;
}
