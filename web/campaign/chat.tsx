// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Table chat" pane of the campaign home (V68; docs/table-spec.md#game-log-and-chat-scope,
 * docs/build/V12-campaign-chat.md): the light campaign chat. Header with the connected count,
 * messages oldest to newest (disc, name, relative time, text), OLDER MESSAGES paging, and the
 * composer that submits `chat.send`. No editing, no deletion, no roll results: chat is separate
 * from the game log, and the future log/chat hybrid is not this pane.
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ArrowUp } from 'lucide-react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Disc } from '../components/disc';
import { Loading, useCommand } from '../ui';
import { relativeTime, useNow } from './header';

export function ChatPane({
  campaignId,
  viewerId,
  onlineCount,
}: {
  campaignId: Id<'campaigns'>;
  viewerId: Id<'users'>;
  onlineCount: number;
}) {
  const now = useNow();
  const [before, setBefore] = useState<number | undefined>();
  const page = useQuery(api.chat.list, {
    campaignId,
    ...(before === undefined ? {} : { before }),
  });
  const send = useMutation(api.chat.send);
  const command = useCommand();
  const [text, setText] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const count = page?.messages.length ?? 0;
  // Keep the newest message in view without scrolling the page itself.
  useEffect(() => {
    const element = scroller.current;
    if (element && before === undefined) element.scrollTop = element.scrollHeight;
  }, [count, before]);
  return (
    <section
      aria-labelledby="chat-heading"
      className="flex flex-col rounded-md border border-rule-strong bg-card"
      data-testid="table-chat"
    >
      <div className="rule-soft flex items-baseline justify-between px-5 py-4">
        <h2 id="chat-heading" className="text-2xl">
          Table chat
        </h2>
        <span className="eyebrow mb-0" data-testid="online-count">
          {onlineCount} online
        </span>
      </div>
      <div
        ref={scroller}
        className="flex max-h-[420px] min-h-[280px] flex-col overflow-y-auto bg-muted/40 px-5 py-4"
      >
        {!page ? (
          <Loading>Loading the chat…</Loading>
        ) : (
          <>
            {(page.nextBefore !== null || before !== undefined) && (
              <div className="mb-3 flex gap-2">
                {page.nextBefore !== null && (
                  <Button
                    variant="link"
                    className="text-xs"
                    onClick={() => setBefore(page.nextBefore ?? undefined)}
                  >
                    Older messages
                  </Button>
                )}
                {before !== undefined && (
                  <Button variant="link" className="text-xs" onClick={() => setBefore(undefined)}>
                    Latest messages
                  </Button>
                )}
              </div>
            )}
            {page.messages.length === 0 ? (
              <p className="m-auto text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {page.messages.map(m => {
                  const own = m.authorId === viewerId;
                  return (
                    <li key={m.id} className="flex items-start gap-3" data-testid="chat-message">
                      <span aria-hidden>
                        <Disc name={m.authorName} size="sm" variant={own ? 'ink' : 'grey'} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-baseline gap-2">
                          <span className="text-xs font-bold">{m.authorName}</span>
                          <span className="text-2xs text-muted-foreground">
                            {relativeTime(m.createdAt, now)}
                          </span>
                        </span>
                        <span className={cn('text-sm break-words whitespace-pre-wrap')}>
                          {m.text}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </div>
      <form
        className="rule-soft flex items-stretch gap-2 border-t px-5 py-4"
        onSubmit={e => {
          e.preventDefault();
          const message = text.trim();
          if (!message) return;
          void command
            .run(
              commandId => send({ campaignId, text: message, commandId }),
              JSON.stringify(['chat.send', { campaignId, text: message }]),
            )
            .then(ok => {
              if (ok) {
                setText('');
                setBefore(undefined);
              }
            });
        }}
      >
        <Input
          aria-label="Message the table"
          placeholder="Message the table…"
          className="h-10 min-w-0 flex-1"
          maxLength={2000}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <Button
          type="submit"
          variant="secondary"
          size="icon-lg"
          className="size-10"
          aria-label="Send"
          disabled={command.pending || text.trim().length === 0}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
      </form>
    </section>
  );
}
