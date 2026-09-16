// SPDX-License-Identifier: GPL-3.0-only
// The command console: a text input that submits slash text through `commands.submit`, the same
// mutation the CLI calls, plus the palette. No parsing or rules live here; the server parses the
// text with shared/commands/parse.ts and the registry decides everything else.
// Owning specification: docs/table-spec.md#confirmed-action-and-log-contract (slash commands and
// buttons invoke the same shared operations) and docs/engine-architecture.md#command-registry-and-palette.
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Field, Notice, useCommand } from './ui';
import { Palette } from './palette';

export function CommandConsole({
  campaignId,
  sessionRevision,
}: {
  campaignId: Id<'campaigns'>;
  /** Revision of the active session the viewer sees; a stale submission is refused server-side. */
  sessionRevision?: number;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const [text, setText] = useState('');
  const [last, setLast] = useState<string | null>(null);
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <h2>Command</h2>
        <form
          className="flex flex-col gap-3"
          onSubmit={async e => {
            e.preventDefault();
            const trimmed = text.trim();
            if (!trimmed) return;
            const ok = await command.run(
              async commandId => {
                const result = await submit({
                  campaignId,
                  text: trimmed,
                  commandId,
                  ...(sessionRevision === undefined ? {} : { expectedRevision: sessionRevision }),
                });
                setLast(
                  result.interactionId
                    ? `${result.description} (card ${result.interactionId})`
                    : result.description,
                );
              },
              JSON.stringify(['command.submit', { campaignId, text: trimmed, sessionRevision }]),
            );
            // A failure now raises a toast (V29 item 2); the last success line must not outlive it.
            if (ok) setText('');
            else setLast(null);
          }}
        >
          <Field
            label="Slash command"
            hint='For example /table roll dice="2d10". The palette lists what is registered.'
          >
            <Input
              name="command"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder='/session note text="..."'
              maxLength={4000}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <div>
            <Button type="submit" disabled={command.pending || !text.trim()}>
              {command.pending ? 'Sending…' : 'Run'}
            </Button>
          </div>
          {last && <Notice role="status">Recorded: {last}</Notice>}
        </form>
        <Palette campaignId={campaignId} onPick={syntax => setText(syntax)} />
      </CardContent>
    </Card>
  );
}
