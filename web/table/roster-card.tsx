// SPDX-License-Identifier: GPL-3.0-only
/**
 * RosterCard: the compact roster row (docs/design-mockups/quiet/README.md, table screen foe rows),
 * used for foes and heroes alike in the Director's view and for the party roster in the player's
 * view. Tonal 44px disc, name, muted subtitle, 4px health bar, resource chips, the target control
 * at the right edge, and the acting / spent / Slain states; rows are separated by air, not rules.
 *
 * Presentation only. The reticle submits the same `/target toggle` text as TargetControls
 * (web/table/targeting.tsx) and the edge/bane inputs submit the same `/target modifier` text;
 * what the viewer may see comes from the server projections passed in by the panes.
 *
 * Owning specifications: docs/table-spec.md#confirmed-combat-layout (2026-09-15 user decision),
 * #roster-targeting-controls, #v001-edge-and-bane-inputs, #monster-visibility-and-health-display.
 */
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Disc } from '../components/disc';
import { HealthBar } from '../components/health-bar';
import { useCommand } from '../ui';
import type { Encounter } from './setup-card';

export type RosterActor = { kind: 'character' | 'foe' | 'squad'; id: string; name: string };
export type CardState = 'idle' | 'acting' | 'spent' | 'slain' | 'away';

const ref = (actor: { kind: string; id: string }) => `@{${actor.kind}:${actor.id}}`;
const key = (actor: { kind: string; id: string }) => `${actor.kind}:${actor.id}`;

/** Acting / spent state of one actor read from the shared encounter; no rule is derived here. */
export function turnStateOf(
  encounter: Encounter | null,
  actorId: string,
): { inCombat: boolean; acting: boolean; spent: boolean; slain: boolean } {
  if (!encounter || encounter.status !== 'committed' || encounter.phase !== 'turns')
    return { inCombat: false, acting: false, spent: false, slain: false };
  const entries = encounter.groups.flatMap(g => g.entries).filter(e => e.actor.id === actorId);
  if (!entries.length) return { inCombat: false, acting: false, spent: false, slain: false };
  const acting = encounter.activeTurn?.actor.id === actorId || entries.some(e => e.active);
  return {
    inCombat: true,
    acting,
    spent: !acting && entries.every(e => e.spent),
    slain: entries.every(e => e.slain),
  };
}

/**
 * The round target control (28px tonal disc; filled accent while this viewer has the creature
 * selected; an accent outline while another user has it selected). Same operation as
 * TargetControls.
 */
export function TargetReticle({
  campaignId,
  target,
  className,
}: {
  campaignId: Id<'campaigns'>;
  target: RosterActor;
  className?: string;
}) {
  const drafts = useQuery(api.targets.drafts, { campaignId });
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const selected = drafts?.mine?.targets.some(t => key(t) === key(target)) ?? false;
  const others = (drafts?.others ?? []).filter(o => o.targets.some(t => key(t) === key(target)));
  const text = `/target toggle target=${ref(target)}`;
  return (
    <span className={cn('inline-flex flex-col items-end', className)}>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`Target ${target.name}`}
        title={`Target ${target.name} (selecting a target for a pending ability fires it)`}
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => submit({ campaignId, text, commandId }),
            JSON.stringify(['a05', campaignId, text]),
          )
        }
        className={cn(
          'roster-reticle inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-muted p-0 transition-colors duration-(--motion-fast) hover:bg-accent disabled:opacity-40',
          selected && 'bg-primary hover:bg-primary/90',
          others.length > 0 && 'outline-2 outline-offset-2 outline-primary',
        )}
      >
        {selected && <span aria-hidden className="size-2 rounded-full bg-primary-foreground" />}
      </button>
      {others.length > 0 && (
        <span className="sr-only">
          Targeted by{' '}
          {others.map(o => `${o.userName}${o.actor ? ` (${o.actor.name})` : ''}`).join(', ')}
        </span>
      )}
    </span>
  );
}

/** Per-target edge and bane counts, shown under the card only while this viewer has it selected. */
export function TargetModifiers({
  campaignId,
  target,
}: {
  campaignId: Id<'campaigns'>;
  target: RosterActor;
}) {
  const drafts = useQuery(api.targets.drafts, { campaignId });
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const mine = drafts?.mine ?? null;
  const selected = mine?.targets.some(t => key(t) === key(target)) ?? false;
  const counts = mine?.modifiers[key(target)] ?? { edges: 0, banes: 0 };
  const [edges, setEdges] = useState<string | null>(null);
  const [banes, setBanes] = useState<string | null>(null);
  const others = (drafts?.others ?? []).filter(o => o.targets.some(t => key(t) === key(target)));
  if (!selected && others.length === 0) return null;
  const setCounts = () => {
    const e = edges ?? String(counts.edges);
    const b = banes ?? String(counts.banes);
    const text = `/target modifier target=${ref(target)} edges=${Number(e) || 0} banes=${Number(b) || 0}`;
    void command
      .run(
        commandId => submit({ campaignId, text, commandId }),
        JSON.stringify(['mod', campaignId, text]),
      )
      .then(ok => {
        if (ok) {
          setEdges(null);
          setBanes(null);
        }
      });
  };
  const field =
    'h-7 w-12 rounded-full border-0 bg-muted px-2 text-sm text-foreground caret-primary tabular-nums outline-none transition-colors duration-(--motion-fast) focus-visible:bg-accent';
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 pl-14 text-sm">
      {selected && (
        <>
          <span className="text-sm text-primary">Targeted</span>
          <label className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Edges</span>
            <input
              className={field}
              type="number"
              min={0}
              value={edges ?? String(counts.edges)}
              onChange={e => setEdges(e.target.value)}
              onBlur={() => edges !== null && setCounts()}
              aria-label={`Edges against ${target.name}`}
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Banes</span>
            <input
              className={field}
              type="number"
              min={0}
              value={banes ?? String(counts.banes)}
              onChange={e => setBanes(e.target.value)}
              onBlur={() => banes !== null && setCounts()}
              aria-label={`Banes against ${target.name}`}
            />
          </label>
        </>
      )}
      {others.map(o => (
        <span key={o.userName} className="text-sm text-muted-foreground">
          Targeted by {o.userName}
          {o.actor ? ` (${o.actor.name})` : ''}
        </span>
      ))}
    </div>
  );
}

export type CardHealth =
  | {
      kind: 'bar';
      value: number;
      max: number;
      tone: 'foe' | 'hero';
      /** Hero tone turns red at or below this (the projection's winded value). */
      low?: number;
      /** Numeric text beside the bar (Director and own hero); absent in the player's Bar mode. */
      text?: string;
      temporary?: number;
      label: string;
    }
  | { kind: 'text'; text: string }
  | { kind: 'winded'; winded: boolean }
  | null;

export interface RosterCardProps {
  campaignId: Id<'campaigns'>;
  actor: RosterActor;
  /** Muted line at the right of the name: `Fury · Level 1`, `Harrier · Level 1`, or the owner. */
  subtitle?: string;
  /** Ink disc for the viewer's own or the acting creature; grey otherwise. */
  discVariant?: 'ink' | 'grey';
  health: CardHealth;
  /** Second line: Recoveries, Heroic Resource, Surges, Victories chips. */
  resources?: React.ReactNode;
  /** Condition badges. */
  badges?: React.ReactNode;
  state?: CardState;
  /** Whether the viewer may target this creature (the reticle). */
  mayTarget: boolean;
  /** Take turn / End turn, rendered under the reticle. */
  aside?: React.ReactNode;
  /** Drill-in: when given, the card body is a button that opens the detail. */
  onOpen?: () => void;
  /** aria-current for the pane's viewed hero. */
  current?: boolean;
  /** Whether this creature is the viewer's own; drives the disc and the audience assertions. */
  own?: boolean;
  className?: string;
}

export function RosterCard({
  campaignId,
  actor,
  subtitle,
  discVariant = 'grey',
  health,
  resources,
  badges,
  state = 'idle',
  mayTarget,
  aside,
  onOpen,
  current,
  own,
  className,
}: RosterCardProps) {
  const dimmed = state === 'slain' || state === 'away' || state === 'spent';
  const body = (
    <>
      <Disc
        name={actor.name}
        variant={state === 'acting' ? 'ink' : discVariant}
        size="md"
        muted={state === 'slain' || state === 'away'}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {/* The name keeps the room: the muted line at the right yields first in a narrow pane,
            because a truncating name beside a non-shrinking sibling collapses to nothing. */}
        <span className="flex items-baseline justify-between gap-x-3">
          <strong
            className={cn(
              'min-w-0 flex-1 truncate font-medium',
              state === 'slain' && 'text-muted-foreground',
            )}
          >
            {actor.name}
          </strong>
          {state === 'acting' ? (
            <span className="shrink-0 text-sm text-primary">Acting</span>
          ) : (
            subtitle && (
              <span className="max-w-[55%] truncate text-sm text-muted-foreground">{subtitle}</span>
            )
          )}
        </span>
        {state === 'slain' ? (
          <span className="text-sm text-muted-foreground">Slain</span>
        ) : state === 'away' ? (
          <span className="text-sm text-muted-foreground">Away</span>
        ) : (
          <CardHealthView health={health} />
        )}
        {state !== 'slain' && resources && (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">{resources}</span>
        )}
        {badges}
      </span>
    </>
  );
  return (
    <li
      className={cn(
        'relative flex flex-col',
        state === 'acting' && 'roster-card-acting rounded-md bg-muted',
        className,
      )}
      data-roster-card
      data-actor-kind={actor.kind}
      data-own={own === undefined ? undefined : String(own)}
      data-state={state}
      aria-current={current ? 'true' : undefined}
    >
      <div className={cn('flex items-start gap-3 py-3 pr-2 pl-3', dimmed && 'opacity-40')}>
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open ${actor.name}`}
            className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md border-0 bg-transparent p-0 text-left text-inherit hover:[&_strong]:underline"
          >
            {body}
          </button>
        ) : (
          <span className="flex min-w-0 flex-1 items-start gap-3">{body}</span>
        )}
        {mayTarget && (
          <span className="flex shrink-0 flex-col items-end self-stretch pt-2">
            <TargetReticle campaignId={campaignId} target={actor} />
          </span>
        )}
      </div>
      {/* Turn controls sit under the row, not beside it: a button in the right column is as wide
          as its label and squeezes the creature's name out of a 424px pane. */}
      {aside && (
        <div
          className={cn('flex flex-wrap justify-end gap-2 pr-2 pb-3 pl-3', dimmed && 'opacity-40')}
        >
          {aside}
        </div>
      )}
      {mayTarget && <TargetModifiers campaignId={campaignId} target={actor} />}
    </li>
  );
}

function CardHealthView({ health }: { health: CardHealth }) {
  if (!health) return null;
  if (health.kind === 'text') return <span className="text-sm tabular-nums">{health.text}</span>;
  if (health.kind === 'winded')
    return (
      <span className="text-sm text-muted-foreground">
        {health.winded ? 'Winded' : 'Not winded'}
      </span>
    );
  return (
    <span className="flex items-center gap-3">
      <HealthBar
        value={health.value}
        max={health.max}
        tone={health.tone}
        low={health.low}
        label={health.label}
        className="h-1 min-w-0 flex-1"
      />
      {health.text && (
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {health.text}
          {health.temporary ? (
            <span className="ml-1 font-normal text-muted-foreground">+{health.temporary} temp</span>
          ) : null}
        </span>
      )}
    </span>
  );
}
