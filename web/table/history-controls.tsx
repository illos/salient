// SPDX-License-Identifier: GPL-3.0-only
/**
 * History controls: Undo (player) or Rewind (Director), Redo, and the Director's Enable user undo
 * toggle. Every button submits a registered operation as slash text through the shared path; what
 * is available, and why not, comes from `history.status` on the server, so a stale control cannot
 * bypass a seam (the operation checks again when it runs).
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

function Availability({ label, entry }: { label: string; entry: HistoryStatus['undo'] }) {
  return (
    <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
      {entry.available && entry.target
        ? `${label}: #${entry.target.sequence} ${entry.target.description}`
        : `${label}: ${entry.reason ?? 'unavailable'}`}
    </p>
  );
}

export function HistoryControls({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const view = useQuery(api.history.status, { campaignId });
  if (!view || view.role === 'observer') return null;
  const director = view.role === 'director';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <CommandButton
          campaignId={campaignId}
          text={undoCommand(view.role)}
          label={director ? 'Rewind' : 'Undo'}
          disabled={!view.undo.available}
        />
        <CommandButton
          campaignId={campaignId}
          text="/history redo"
          label="Redo"
          disabled={!view.redo.available}
        />
        {director && (
          <CommandButton
            campaignId={campaignId}
            text={`/campaign user-undo state=${view.enableUserUndo ? 'off' : 'on'}`}
            label={view.enableUserUndo ? 'Disable user undo' : 'Enable user undo'}
            variant="ghost"
          />
        )}
      </div>
      <Availability label={director ? 'Rewind' : 'Undo'} entry={view.undo} />
      <Availability label="Redo" entry={view.redo} />
      <p className="text-xs text-muted-foreground">
        History does not cross {view.floor.label}.
        {!view.enableUserUndo && ' Player undo is off for this campaign.'}
      </p>
    </div>
  );
}
