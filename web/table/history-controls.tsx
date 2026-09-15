// SPDX-License-Identifier: GPL-3.0-only
/**
 * History controls: Undo (player) or Rewind (Director), Redo, and the Director's Enable user undo
 * toggle. Every button submits a registered operation as slash text through the shared path; what
 * is available, and why not, comes from `history.status` on the server, so a stale control cannot
 * bypass a seam (the operation checks again when it runs).
 *
 * V21 presentation: a compact caps toolbar directly under the LOG / RULES / ROLLS tabs
 * (docs/build/V21-desktop-layout-fidelity.md item 5; the mockup omits the controls, A06 requires
 * them). The explanation of what each control would act on, and the history floor, collapse into
 * the buttons' tooltips and one grey line.
 *
 * Owning specification: docs/table-spec.md#undo-permissions-and-proposed-campaign-control (an Undo
 * button accompanies inline results under existing player/Director permissions; Enable user undo).
 */
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { FunctionReturnType } from 'convex/server';
import { CommandButton } from './setup-card';

export type HistoryStatus = FunctionReturnType<typeof api.history.status>;

/** The slash text that undoes the latest unit for this role; the Director's undo is a rewind. */
export function undoCommand(role: HistoryStatus['role'], eventId?: string): string {
  const verb = role === 'director' ? '/history rewind' : '/history undo';
  return eventId ? `${verb} event="${eventId}"` : verb;
}

/** One line: what the control would act on, or why it is unavailable. */
function availability(label: string, entry: HistoryStatus['undo']): string {
  return entry.available && entry.target
    ? `${label}: #${entry.target.sequence} ${entry.target.description}`
    : `${label}: ${entry.reason ?? 'unavailable'}`;
}

export function HistoryControls({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const view = useQuery(api.history.status, { campaignId });
  if (!view || view.role === 'observer') return null;
  const director = view.role === 'director';
  const undoLabel = director ? 'Rewind' : 'Undo';
  const undoText = availability(undoLabel, view.undo);
  const redoText = availability('Redo', view.redo);
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1"
      role="toolbar"
      aria-label="History"
      data-history-toolbar
    >
      <span className="flex items-center gap-1.5" title={undoText}>
        <CommandButton
          campaignId={campaignId}
          text={undoCommand(view.role)}
          label={undoLabel}
          disabled={!view.undo.available}
        />
      </span>
      <span className="flex items-center gap-1.5" title={redoText}>
        <CommandButton
          campaignId={campaignId}
          text="/history redo"
          label="Redo"
          disabled={!view.redo.available}
        />
      </span>
      {director && (
        <CommandButton
          campaignId={campaignId}
          text={`/campaign user-undo state=${view.enableUserUndo ? 'off' : 'on'}`}
          label={view.enableUserUndo ? 'Disable user undo' : 'Enable user undo'}
          variant="ghost"
        />
      )}
      <p
        className="m-0 w-full basis-full truncate text-xs text-muted-foreground"
        title={`${undoText}\n${redoText}\nHistory does not cross ${view.floor.label}.`}
      >
        {view.undo.available && view.undo.target
          ? `${undoLabel}: ${view.undo.target.description}`
          : `Nothing to ${undoLabel.toLowerCase()} · history does not cross ${view.floor.label}.`}
        {!view.enableUserUndo && ' Player undo is off.'}
      </p>
    </div>
  );
}
