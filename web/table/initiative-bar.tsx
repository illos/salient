// SPDX-License-Identifier: GPL-3.0-only
/**
 * The segmented initiative bar (combat-table-light.png, combat-table-dark.png; docs/build/
 * V21-desktop-layout-fidelity.md item 7; docs/table-spec.md#confirmed-combat-layout 2026-09-15
 * decision): under the caps eyebrow `ROUND n · HEROES ACTING`, one slim rounded segment per turn
 * entry on each side, grouped by initiative group (a wider gap and a thin bracket under groups
 * of more than one entry), brick red when spent, grey when unspent, the entry in progress ringed
 * in red, surprised entries hatched, Slain entries dimmed, caps side labels beneath. Hovering or
 * focusing a segment names the creature; clicking a segment the viewer may act for submits the
 * same `/turn take` the list submits. GROUPS (Director) opens the regroup list beneath the bar.
 *
 * Presentation only: round, side, spent, surprised, Slain and control facts come from the
 * encounter projection; nothing here resolves a rule.
 *
 * Owning specifications: docs/table-spec.md#initiative-groups-confirmed-app-model,
 * #mid-combat-additions-and-regrouping, #taking-a-turn.
 */
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { ErrorNotice, useCommand } from '../ui';
import { InitiativeGroups, sideName } from './initiative';
import type { Encounter } from './setup-card';

type Group = Encounter['groups'][number];
type Entry = Group['entries'][number];

function ref(actor: { kind: 'character' | 'foe'; id: string }) {
  return `@{${actor.kind}:${actor.id}}`;
}

/** Eyebrow text: `Round 2 · Heroes acting`, or the phase while the opening is unfinished. */
export function initiativeEyebrow(encounter: Encounter): string {
  if (encounter.phase !== 'turns') return 'Opening';
  const round = `Round ${encounter.round}`;
  if (encounter.activeSide) return `${round} · ${sideName(encounter.activeSide)} acting`;
  return `${round} · Awaiting a turn`;
}

function entryState(entry: Entry): string {
  if (entry.active) return 'acting';
  if (entry.slain) return 'Slain';
  if (entry.surprised) return entry.spent ? 'surprised, acted' : 'surprised';
  return entry.spent ? 'acted' : 'unspent';
}

function Segment({
  campaignId,
  entry,
  group,
  encounter,
  running,
  onTurnTaken,
}: {
  campaignId: Id<'campaigns'>;
  entry: Entry;
  group: Group;
  encounter: Encounter;
  running: boolean;
  onTurnTaken: (actor: { kind: 'character' | 'foe'; id: string }) => void;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const state = entryState(entry);
  const actionable =
    running &&
    encounter.phase === 'turns' &&
    entry.controlled &&
    !entry.active &&
    encounter.activeTurn === null;
  const label = `${entry.actor.name} · Group ${group.order} · ${state}${
    entry.source === 'granted' ? ' · granted turn' : ''
  }${actionable ? ' · Take turn' : ''}`;
  const text = `${ref(entry.actor)} /turn take entry="${entry.id}"`;
  const fill = entry.active
    ? 'bg-primary/50'
    : entry.slain
      ? 'bg-border'
      : entry.spent
        ? 'bg-primary'
        : 'bg-placeholder';
  return (
    <li
      className="m-0 min-w-0 flex-1 list-none p-0"
      aria-current={entry.active ? 'true' : undefined}
      data-entry-id={entry.id}
      data-state={state}
      data-actor-kind={entry.actor.kind}
    >
      <button
        type="button"
        className={`group/segment flex h-5 w-full cursor-default items-center border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
          actionable ? 'cursor-pointer' : ''
        }`}
        title={label}
        aria-label={label}
        aria-disabled={actionable ? undefined : 'true'}
        disabled={command.pending}
        data-segment
        onClick={() => {
          if (!actionable) return;
          void command
            .run(
              commandId => submit({ campaignId, text, commandId }),
              JSON.stringify(['combat', campaignId, text]),
            )
            .then(ok => {
              if (ok) onTurnTaken(entry.actor);
            });
        }}
      >
        <span className="sr-only">{entry.actor.name}</span>
        <span
          aria-hidden
          className={`block h-(--bar-thickness) w-full rounded-full transition-colors duration-(--motion-fast) ${fill} ${
            entry.active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
          } ${entry.slain ? 'opacity-50' : ''} ${
            actionable ? 'group-hover/segment:bg-foreground' : ''
          }`}
          style={
            entry.surprised && !entry.slain
              ? {
                  backgroundImage:
                    'repeating-linear-gradient(135deg, transparent 0 3px, var(--background) 3px 5px)',
                }
              : undefined
          }
        />
      </button>
      <ErrorNotice error={command.error} />
    </li>
  );
}

function Side({
  campaignId,
  side,
  encounter,
  running,
  onTurnTaken,
}: {
  campaignId: Id<'campaigns'>;
  side: 'heroes' | 'director';
  encounter: Encounter;
  running: boolean;
  onTurnTaken: (actor: { kind: 'character' | 'foe'; id: string }) => void;
}) {
  const groups = encounter.groups.filter(g => g.side === side);
  const count = groups.reduce((n, g) => n + g.entries.length, 0);
  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 ${encounter.activeSide === side ? '' : 'opacity-80'}`}
      style={{ flexGrow: Math.max(count, 1) }}
      data-side={side}
    >
      <div className="flex items-center gap-4">
        {groups.map(group => (
          <ol
            key={group.id}
            className={`m-0 flex min-w-0 list-none items-center gap-2 p-0 ${
              group.entries.length > 1 ? 'rule-soft pb-1.5' : ''
            }`}
            style={{ flexGrow: Math.max(group.entries.length, 1) }}
            aria-label={`Group ${group.order}${group.active ? ', active' : group.completed ? ', finished' : ''}`}
            data-group-id={group.id}
          >
            {group.entries.map(entry => (
              <Segment
                key={entry.id}
                campaignId={campaignId}
                entry={entry}
                group={group}
                encounter={encounter}
                running={running}
                onTurnTaken={onTurnTaken}
              />
            ))}
            {group.entries.length === 0 && (
              <li
                className="m-0 h-(--bar-thickness) flex-1 list-none rounded-full border border-dashed border-input p-0"
                title={`Group ${group.order} · empty`}
              />
            )}
          </ol>
        ))}
        {groups.length === 0 && (
          <span className="text-xs text-muted-foreground">Nobody on this side.</span>
        )}
      </div>
      <span
        className={`caps text-center ${
          encounter.activeSide === side ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {sideName(side)}
      </span>
    </div>
  );
}

export function InitiativeBar({
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
  const [groupsOpen, setGroupsOpen] = useState(false);
  if (encounter.status !== 'committed' || encounter.phase !== 'turns') return null;
  const eyebrow = initiativeEyebrow(encounter);
  return (
    <section
      className="@container flex flex-col gap-2"
      aria-label="Initiative"
      data-initiative-bar
      data-round={encounter.round}
      data-active-side={encounter.activeSide ?? ''}
    >
      {/* The Groups control sits in its own column so a long eyebrow (round, side and the acting
          creature's name) truncates instead of running under the button. */}
      <div className="flex items-center gap-2">
        <p
          className="caps m-0 min-w-0 flex-1 truncate text-center text-muted-foreground"
          role="status"
          aria-live="polite"
          title={`${eyebrow}${encounter.activeTurn ? ` · ${encounter.activeTurn.actor.name}` : ''}`}
        >
          {eyebrow}
          {encounter.activeTurn ? ` · ${encounter.activeTurn.actor.name}` : ''}
        </p>
        {director && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0 text-2xs"
            aria-expanded={groupsOpen}
            aria-controls="initiative-groups"
            title="Regroup turn entries"
            onClick={() => setGroupsOpen(open => !open)}
          >
            Groups
          </Button>
        )}
      </div>
      <div className="flex items-start gap-6 px-1">
        <Side
          campaignId={campaignId}
          side="heroes"
          encounter={encounter}
          running={running}
          onTurnTaken={onTurnTaken}
        />
        <Side
          campaignId={campaignId}
          side="director"
          encounter={encounter}
          running={running}
          onTurnTaken={onTurnTaken}
        />
      </div>
      {director && groupsOpen && (
        <div id="initiative-groups" className="rule-soft pt-2 pb-3">
          <InitiativeGroups
            campaignId={campaignId}
            encounter={encounter}
            director={director}
            running={running}
            onTurnTaken={onTurnTaken}
          />
        </div>
      )}
    </section>
  );
}
