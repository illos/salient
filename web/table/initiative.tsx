// SPDX-License-Identifier: GPL-3.0-only
/**
 * The initiative group list and the turn controls: groups of actor-linked turn entries (spent
 * entries grayed, surprised and Slain marked, the turn in progress highlighted), Take turn / End
 * turn, and Director regrouping of one selected entry. Every control submits a registered
 * operation; the server decides who may act. The invoking user's pane switches to the hero whose
 * turn they took (confirmed explicit Take turn navigation); nobody else's view changes.
 *
 * V21: the segmented initiative bar (web/table/initiative-bar.tsx) is the shared presentation;
 * this list is the Director's regroup view opened from the bar's GROUPS control, rendered without
 * a card wrapper (docs/build/V21-desktop-layout-fidelity.md item 7).
 *
 * Owning specifications: docs/table-spec.md#initiative-groups-confirmed-app-model, #taking-a-turn,
 * #player-sheet-actions-and-explicit-end-turn (advisory graying, explicit End turn),
 * #mid-combat-additions-and-regrouping, docs/table-spec.md#freeplay-baseline-and-combat-transition
 * (explicit Take turn switches the invoking user's pane).
 */
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { ErrorNotice, useCommand } from '../ui';
import { CommandButton, type Encounter } from './setup-card';

type Group = Encounter['groups'][number];
type Entry = Group['entries'][number];

function ref(actor: { kind: 'character' | 'foe'; id: string }) {
  return `@{${actor.kind}:${actor.id}}`;
}

/** Take turn / End turn for one actor, shared by the initiative panel and the hero rows. */
export function TurnControls({
  campaignId,
  encounter,
  actor,
  running,
  onTurnTaken,
  entryId,
}: {
  campaignId: Id<'campaigns'>;
  encounter: Encounter;
  actor: { kind: 'character' | 'foe'; id: string; name: string };
  running: boolean;
  entryId?: string;
  onTurnTaken?: (actor: { kind: 'character' | 'foe'; id: string }) => void;
}) {
  if (encounter.phase !== 'turns' || !running) return null;
  const entries = encounter.groups.flatMap(g => g.entries).filter(e => e.actor.id === actor.id);
  if (!entries.length) return null;
  const active = encounter.activeTurn;
  if (active && active.actor.id === actor.id && (!entryId || active.entryId === entryId))
    return active.mayEnd ? (
      <CommandButton
        campaignId={campaignId}
        text={`${ref(actor)} /turn end`}
        label="End turn"
        variant="default"
      />
    ) : (
      <Badge>Taking their turn</Badge>
    );
  const entry = entryId
    ? entries.find(e => e.id === entryId)
    : (entries.find(e => !e.spent) ?? entries[0]);
  if (!entry || !entry.controlled) return null;
  return (
    <CommandButton
      campaignId={campaignId}
      text={`${ref(actor)} /turn take entry="${entry.id}"`}
      label="Take turn"
      disabled={active !== null}
      onDone={() => onTurnTaken?.(actor)}
    />
  );
}

function MoveControl({
  campaignId,
  entry,
  groups,
  currentGroupId,
}: {
  campaignId: Id<'campaigns'>;
  entry: Entry;
  groups: Group[];
  currentGroupId: Id<'initiativeGroups'>;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  return (
    <label className="flex items-center gap-1 text-xs">
      <span className="caps text-muted-foreground">Move to</span>
      <select
        className="native-select"
        value=""
        disabled={command.pending}
        onChange={e => {
          const target = e.target.value;
          if (!target) return;
          const text = `/group move entry="${entry.id}" group="${target}"`;
          void command.run(
            commandId => submit({ campaignId, text, commandId }),
            JSON.stringify(['group.move', campaignId, text]),
          );
        }}
      >
        <option value="">Group…</option>
        {groups
          .filter(g => g.id !== currentGroupId)
          .map(g => (
            <option key={g.id} value={g.id}>
              Group {g.order}
              {g.completed ? ' (finished)' : g.active ? ' (active)' : ''}
            </option>
          ))}
        <option value="new">New group at the bottom</option>
      </select>
      <ErrorNotice error={command.error} />
    </label>
  );
}

function EntryRow({
  campaignId,
  encounter,
  group,
  entry,
  director,
  running,
  onTurnTaken,
}: {
  campaignId: Id<'campaigns'>;
  encounter: Encounter;
  group: Group;
  entry: Entry;
  director: boolean;
  running: boolean;
  onTurnTaken: (actor: { kind: 'character' | 'foe'; id: string }) => void;
}) {
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-2 py-1 text-sm ${
        entry.spent && !entry.active ? 'text-muted-foreground' : ''
      } ${entry.active ? 'font-semibold' : ''}`}
      aria-current={entry.active ? 'true' : undefined}
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className={entry.slain ? 'line-through' : ''}>{entry.actor.name}</span>
        {entry.active && <Badge>Acting</Badge>}
        {entry.spent && !entry.active && <Badge variant="outline">Acted</Badge>}
        {entry.surprised && <Badge variant="outline">Surprised</Badge>}
        {entry.slain && <Badge variant="outline">Slain</Badge>}
        {entry.source === 'granted' && <Badge variant="outline">Granted turn</Badge>}
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <TurnControls
          campaignId={campaignId}
          encounter={encounter}
          actor={entry.actor}
          entryId={entry.id}
          running={running}
          onTurnTaken={onTurnTaken}
        />
        {director && running && (
          <MoveControl
            campaignId={campaignId}
            entry={entry}
            groups={encounter.groups.filter(g => g.side === group.side)}
            currentGroupId={group.id}
          />
        )}
      </span>
    </li>
  );
}

export function sideName(side: 'heroes' | 'director') {
  return side === 'heroes' ? 'Heroes' : 'Foes';
}

/**
 * The regroup list: both sides' groups and entries with Take turn / End turn and the Director's
 * Move-to control. One column so it fits the centre pane; no card wrapper.
 */
export function InitiativeGroups({
  campaignId,
  encounter,
  director,
  running,
  onTurnTaken,
}: {
  campaignId: Id<'campaigns'>;
  encounter: Encounter;
  director: boolean;
  running: boolean;
  onTurnTaken: (actor: { kind: 'character' | 'foe'; id: string }) => void;
}) {
  if (encounter.status !== 'committed') return null;
  return (
    <div className="flex flex-col gap-4" data-initiative-groups>
      {encounter.startingSide && (
        <p className="m-0 text-xs text-muted-foreground">
          {sideName(encounter.startingSide)} went first in round 1 and go first in every round.
          {director && ' Move to changes only the selected turn entry.'}
        </p>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 @lg:grid-cols-2">
        {(['heroes', 'director'] as const).map(side => (
          <div key={side}>
            <h3 className="caps rule-strong mb-2 pb-1 text-muted-foreground">{sideName(side)}</h3>
            {encounter.groups
              .filter(g => g.side === side)
              .map(group => (
                <div
                  key={group.id}
                  className={`rule-soft mb-2 border-l-2 pl-2 ${
                    group.active
                      ? 'border-l-primary'
                      : group.completed
                        ? 'border-l-rule-strong text-muted-foreground'
                        : 'border-l-transparent'
                  }`}
                  data-group-order={group.order}
                >
                  <p className="caps m-0 text-muted-foreground">
                    Group {group.order}
                    {group.active ? ' · active' : group.completed ? ' · finished' : ''}
                  </p>
                  <ul className="m-0 list-none p-0">
                    {group.entries.map(entry => (
                      <EntryRow
                        key={entry.id}
                        campaignId={campaignId}
                        encounter={encounter}
                        group={group}
                        entry={entry}
                        director={director}
                        running={running}
                        onTurnTaken={onTurnTaken}
                      />
                    ))}
                    {group.entries.length === 0 && (
                      <li className="text-xs text-muted-foreground">Empty</li>
                    )}
                  </ul>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
