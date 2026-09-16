// SPDX-License-Identifier: GPL-3.0-only
/**
 * The shared pieces of the A06 history surface: the `history.status` view type and the slash text
 * each control submits. Nothing here resolves whether a control is available — that comes from
 * `history.status` on the server, and the operation checks again when it runs, so a stale control
 * cannot bypass a seam.
 *
 * Placement, corrected by the user in V31 (docs/build/V31-history-control-placement.md): only
 * `Enable user undo` is a settings pop-up row, because it is a campaign setting. Rewind and Redo
 * are actions taken during play, so they stay in the table as the discreet icon pair below,
 * rendered at the right-hand end of the LOG / RULES / ROLLS tab row — not the caps buttons V21
 * drew, and not a row of their own. Undo and Redo also stay inline on the entry they would act on
 * (web/table/log-entry.tsx), which is the confirmed placement beside a result.
 *
 * Owning specification: docs/table-spec.md#undo-permissions-and-proposed-campaign-control (an Undo
 * button accompanies inline results under existing player/Director permissions; Enable user undo).
 */
import { Redo2Icon, Undo2Icon } from 'lucide-react';
import { useId } from 'react';
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

/** The slash text that restores the top of the redo path; the same operation for every role. */
export function redoCommand(eventId?: string): string {
  return eventId ? `/history redo event="${eventId}"` : '/history redo';
}

/** The label the viewer's undo carries: the Director rewinds, everyone else undoes. */
export function undoLabel(role: HistoryStatus['role']): string {
  return role === 'director' ? 'Rewind' : 'Undo';
}

/** One line: what the control would act on, or why it is unavailable. */
function availability(label: string, entry: HistoryStatus['undo']): string {
  return entry.available && entry.target
    ? `${label}: #${entry.target.sequence} ${entry.target.description}`
    : `${label}: ${entry.reason ?? 'unavailable'}`;
}

/**
 * The icon pair. What each control would act on, and why it is unavailable, comes from
 * `history.status` on the server and lives in the tooltip; the operation checks again when it
 * runs, so a stale control cannot bypass a seam. Nothing renders for an observer.
 */
export function HistoryControls({
  campaignId,
  className,
}: {
  campaignId: Id<'campaigns'>;
  className?: string;
}) {
  const view = useQuery(api.history.status, { campaignId });
  const ids = useId();
  if (!view || view.role === 'observer') return null;
  const label = undoLabel(view.role);
  const undoText = availability(label, view.undo);
  const redoText = availability('Redo', view.redo);
  // The reason is described, not only hovered: a disabled button is out of the tab order and its
  // tooltip never opens, so an icon control that says nothing else would leave a keyboard or
  // screen-reader user with no way to learn why it is unavailable (V31 review, finding 1).
  return (
    <span className={className} role="group" aria-label="History" data-history-controls>
      <span className="flex items-center gap-0.5">
        <CommandButton
          campaignId={campaignId}
          text={undoCommand(view.role)}
          label={label}
          title={undoText}
          describedBy={`${ids}-undo`}
          icon={<Undo2Icon aria-hidden />}
          variant="ghost"
          disabled={!view.undo.available}
        />
        <CommandButton
          campaignId={campaignId}
          text={redoCommand()}
          label="Redo"
          title={redoText}
          describedBy={`${ids}-redo`}
          icon={<Redo2Icon aria-hidden />}
          variant="ghost"
          disabled={!view.redo.available}
        />
      </span>
      <span className="sr-only" id={`${ids}-undo`}>
        {undoText}
      </span>
      <span className="sr-only" id={`${ids}-redo`}>
        {redoText}
      </span>
    </span>
  );
}
