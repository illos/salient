// SPDX-License-Identifier: GPL-3.0-only
/** Explicit state choice shared by table Void and session closure. No default is submitted. */
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { SectionHeading, useCommand } from '../ui';

export function VoidCard({
  campaignId,
  encounterId,
  session,
  paused,
  onCancel,
  onDone,
}: {
  campaignId: Id<'campaigns'>;
  encounterId: Id<'encounters'>;
  session?: { id: Id<'sessions'>; revision: number };
  paused: boolean;
  onCancel: () => void;
  onDone: () => void;
}) {
  const invoke = useMutation(api.commands.invoke);
  const transition = useMutation(api.sessions.transition);
  const command = useCommand();
  const choose = (mode: 'keep' | 'reset') => {
    void command
      .run(
        commandId =>
          session
            ? transition({
                sessionId: session.id,
                expectedRevision: session.revision,
                action: 'close',
                voidMode: mode,
                expectedEncounterId: encounterId,
                commandId,
              })
            : invoke({
                campaignId,
                operation: 'combat.void',
                arguments: { mode, encounter: encounterId },
                commandId,
              }),
        JSON.stringify(['void', campaignId, encounterId, session, mode]),
      )
      .then(ok => {
        if (ok) onDone();
      });
  };
  return (
    <div className="rounded-md bg-muted p-5">
      <div className="flex flex-col gap-3">
        <SectionHeading className="mb-0">
          {session ? 'End session · Void active combat' : 'Void combat'}
        </SectionHeading>
        <p className="text-base">
          Choose the state to keep before archiving this encounter. Void skips rewards and normal
          cleanup.
        </p>
        <p className="text-sm text-muted-foreground">
          Keep current state retains current hero values and foes. Restore starting state restores
          their recorded combat-start values and the original foes roster, removing later additions.
          {session
            ? ' The session then closes.'
            : paused
              ? ' The session stays paused and both rosters stay locked until resume.'
              : ' The table then returns to FreePlay.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={command.pending} onClick={() => choose('keep')}>
            Keep current state
          </Button>
          <Button size="sm" disabled={command.pending} onClick={() => choose('reset')}>
            Restore starting state
          </Button>
          <Button size="sm" variant="ghost" disabled={command.pending} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
