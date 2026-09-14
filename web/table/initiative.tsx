// SPDX-License-Identifier: GPL-3.0-only
/**
 * The initiative panel and the turn controls: groups of actor-linked turn entries (spent entries
 * grayed, surprised and Slain marked, the turn in progress highlighted), Take turn / End turn, and
 * Director regrouping of one selected entry. Every control submits a registered operation; the
 * server decides who may act. The invoking user's pane switches to the hero whose turn they took
 * (confirmed explicit Take turn navigation); nobody else's view changes.
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
import { Card, CardContent } from '../components/ui/card';
import { ErrorNotice, SectionHeading, useCommand } from '../ui';
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
}: {
  campaignId: Id<'campaigns'>;
  encounter: Encounter;
  actor: { kind: 'character' | 'foe'; id: string; name: string };
  running: boolean;
  onTurnTaken?: (actor: { kind: 'character' | 'foe'; id: string }) => void;
}) {
  if (encounter.phase !== 'turns' || !running) return null;
  const entries = encounter.groups.flatMap(g => g.entries).filter(e => e.actor.id === actor.id);
  if (!entries.length) return null;
  const active = encounter.activeTurn;
  if (active && active.actor.id === actor.id)
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
  const entry = entries.find(e => !e.spent);
  if (!entry || !entry.controlled) return null;
  return (
    <CommandButton
      campaignId={campaignId}
      text={`${ref(actor)} /turn take`}
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

function sideName(side: 'heroes' | 'director') {
  return side === 'heroes' ? 'Heroes' : 'Foes';
}

export function InitiativePanel({
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
  const status =
    encounter.phase !== 'turns'
      ? 'Opening'
      : encounter.activeTurn
        ? `Round ${encounter.round} · ${encounter.activeTurn.actor.name} is acting`
        : `Round ${encounter.round} · ${encounter.activeSide ? `${sideName(encounter.activeSide)} to act` : 'awaiting a turn'}`;
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <SectionHeading aside={status} className="mb-0">
          Initiative
        </SectionHeading>
        {encounter.startingSide && (
          <p className="text-xs text-muted-foreground">
            {sideName(encounter.startingSide)} went first in round 1 and go first in every round.
          </p>
        )}
        <div className="grid grid-cols-2 gap-6">
          {(['heroes', 'director'] as const).map(side => (
            <div key={side}>
              <SectionHeading as="h3" className="mb-1">
                {sideName(side)}
              </SectionHeading>
              {encounter.groups
                .filter(g => g.side === side)
                .map(group => (
                  <div
                    key={group.id}
                    className={`rule-soft mb-2 border-l-2 pl-2 ${
                      group.active
                        ? 'border-primary'
                        : group.completed
                          ? 'border-rule-strong text-muted-foreground'
                          : 'border-transparent'
                    }`}
                  >
                    <p className="caps text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
