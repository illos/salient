// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Next session" callout card from campaign-home.png (V21 item 11): eyebrow
 * `PLAYERS FOR THIS SESSION · OTHERS OBSERVE`, the caps session status at the right, and the
 * player selection as a row of bordered tiles (checkbox, disc, member name). Between sessions the
 * page holds the selection and START SESSION lives in the header; with an active session the card
 * shows the Director's player management (`sessions.setPlayers`) and the member's status text
 * (docs/table-spec.md#4-session-status-and-play-mode). Presentation only.
 */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Disc } from '../components/disc';
import { ErrorNotice, Notice, useCommand } from '../ui';
import type { Member, Session } from './header';

export function PlayerTiles({
  members,
  selected,
  setSelected,
  disabled,
  viewerId,
}: {
  members: Member[];
  selected: Id<'users'>[];
  setSelected: (ids: Id<'users'>[]) => void;
  disabled?: boolean;
  viewerId: Id<'users'>;
}) {
  return (
    <fieldset disabled={disabled} className="m-0 border-0 p-0">
      <legend className="sr-only">Players for this session</legend>
      <div className="flex flex-wrap gap-3">
        {members.map(m => {
          const checked = selected.includes(m.userId);
          return (
            <label
              key={m.userId}
              className={cn(
                'flex h-14 min-w-[200px] cursor-pointer items-center gap-3 rounded-md border bg-background px-4 text-sm transition-colors duration-(--motion-fast)',
                checked ? 'border-rule-strong' : 'border-input text-muted-foreground',
                disabled && 'cursor-default opacity-60',
              )}
            >
              <input
                type="checkbox"
                /* The wrapping label's text also contains the disc's initials, so the control
                   carries its own name: `getByLabel(displayName)` must match exactly. */
                aria-label={m.displayName}
                className="size-4 shrink-0 accent-secondary"
                checked={checked}
                onChange={e =>
                  setSelected(
                    e.target.checked
                      ? [...selected, m.userId]
                      : selected.filter(id => id !== m.userId),
                  )
                }
              />
              <span aria-hidden>
                <Disc
                  name={m.displayName}
                  size="sm"
                  variant={m.userId === viewerId ? 'ink' : 'grey'}
                />
              </span>
              <span className="truncate font-semibold text-foreground">{m.displayName}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function statusLabel(active: Session | undefined): string {
  if (!active) return 'No active session';
  return active.status === 'paused' ? 'Session paused' : 'Session running';
}

export function NextSessionCard({
  campaignId,
  active,
  director,
  members,
  viewerId,
  selected,
  setSelected,
}: {
  campaignId: Id<'campaigns'>;
  active: Session | undefined;
  director: boolean;
  members: Member[];
  viewerId: Id<'users'>;
  selected: Id<'users'>[];
  setSelected: (ids: Id<'users'>[]) => void;
}) {
  return (
    <Card data-testid="next-session">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl">{active ? 'This session' : 'Next session'}</h2>
          <span className="caps mt-1 text-muted-foreground" role="status">
            {active ? (
              <Link
                to="/campaigns/$campaignId/table"
                params={{ campaignId }}
                className="text-foreground"
              >
                {statusLabel(active)} · Open the table →
              </Link>
            ) : (
              statusLabel(active)
            )}
          </span>
        </div>
        {!active ? (
          director ? (
            <>
              <p className="caps text-muted-foreground">
                Players for this session · others observe
              </p>
              <PlayerTiles
                members={members}
                selected={selected}
                setSelected={setSelected}
                viewerId={viewerId}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your Director will start the next session.
            </p>
          )
        ) : director ? (
          <EditPlayers
            key={`${active.id}:${active.revision}`}
            session={active}
            members={members}
            viewerId={viewerId}
          />
        ) : (
          <Notice>
            {active.status === 'paused'
              ? 'The session is paused. You can still read the table.'
              : 'The session is running. Your selection as a player is managed by the Director.'}
          </Notice>
        )}
      </CardContent>
    </Card>
  );
}

function EditPlayers({
  session,
  members,
  viewerId,
}: {
  session: Session;
  members: Member[];
  viewerId: Id<'users'>;
}) {
  const [selected, setSelected] = useState(session.selectedPlayerIds);
  const save = useMutation(api.sessions.setPlayers);
  const command = useCommand();
  const locked = session.encounter?.status === 'committed';
  const changed =
    selected.length !== session.selectedPlayerIds.length ||
    selected.some(id => !session.selectedPlayerIds.includes(id));
  return (
    <div className="flex flex-col gap-4">
      <p className="caps text-muted-foreground">
        Players for this session · others observe
        {locked ? ' · locked during combat' : ''}
      </p>
      <PlayerTiles
        members={members}
        selected={selected}
        setSelected={setSelected}
        disabled={command.pending || locked}
        viewerId={viewerId}
      />
      {changed && (
        <Button
          variant="outline"
          className="w-fit"
          disabled={command.pending || locked}
          onClick={() =>
            void command.run(
              commandId =>
                save({
                  sessionId: session.id,
                  expectedRevision: session.revision,
                  selectedPlayerIds: selected,
                  commandId,
                }),
              JSON.stringify([
                'session.players',
                {
                  sessionId: session.id,
                  expectedRevision: session.revision,
                  selectedPlayerIds: selected,
                },
              ]),
            )
          }
        >
          Save players
        </Button>
      )}
      <ErrorNotice error={command.error} />
    </div>
  );
}
