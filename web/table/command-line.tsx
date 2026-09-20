// SPDX-License-Identifier: GPL-3.0-only
/**
 * The command line pinned to the bottom of the log pane (docs/design-mockups/quiet/README.md,
 * table screen): a 48px `sub` inset with the muted `/` prefix and no border or top rule, Enter
 * submits the slash text through `commands.submit` exactly as the A01 console did, and the
 * palette control at the right of the input opens web/palette.tsx (unchanged) above it. Up and
 * Down step through the last few commands this viewer submitted in this browser session (client
 * memory only). Errors show above the input inside the footer. No parsing or rules live here.
 *
 * Owning specifications: docs/table-spec.md#confirmed-action-and-log-contract,
 * docs/engine-architecture.md#command-registry-and-palette.
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { ListIcon } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Notice, useCommand } from '../ui';
import { Palette } from '../palette';

/** How many submitted commands Up / Down can recall. */
const HISTORY_LIMIT = 20;

export function CommandLine({
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Recall: newest last; `cursor` is the index being viewed, `history.length` when composing.
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const draft = useRef('');
  const palette = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  // The palette keeps its own disclosure; opening the panel expands it so one click reaches it.
  useEffect(() => {
    if (paletteOpen) palette.current?.querySelector('details')?.setAttribute('open', '');
  }, [paletteOpen]);
  const recall = (direction: -1 | 1) => {
    if (!history.length) return;
    if (cursor === history.length) draft.current = text;
    const next = Math.min(history.length, Math.max(0, cursor + direction));
    if (next === cursor) return;
    setCursor(next);
    setText(next === history.length ? draft.current : history[next]!);
  };
  return (
    <div className="bg-card px-(--pane-padding-x) pt-3 pb-5" data-command-line>
      {paletteOpen && (
        <div
          ref={palette}
          className="mb-3 max-h-[50vh] overflow-y-auto rounded-md bg-popover p-3 text-sm shadow-[0_16px_48px_rgb(0_0_0/0.35)]"
        >
          <Palette
            campaignId={campaignId}
            onPick={syntax => {
              setText(syntax);
              setPaletteOpen(false);
              input.current?.focus();
            }}
          />
        </div>
      )}
      <form
        className="flex flex-col gap-2"
        onSubmit={async e => {
          e.preventDefault();
          const trimmed = text.trim();
          if (!trimmed || command.pending) return;
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
          if (ok) {
            setText('');
            setHistory(previous => {
              const kept = previous.filter(entry => entry !== trimmed);
              const next = [...kept, trimmed].slice(-HISTORY_LIMIT);
              setCursor(next.length);
              return next;
            });
            draft.current = '';
          } else {
            // A failure now raises a toast (V29 item 2); the last success line must not outlive it.
            setLast(null);
          }
        }}
      >
        {last && (
          <Notice role="status" className="text-sm">
            Recorded: {last}
          </Notice>
        )}
        <div className="flex h-12 items-center gap-3 rounded-md bg-muted px-4 transition-colors duration-(--motion-fast) focus-within:bg-accent">
          <span aria-hidden className="text-base text-muted-foreground">
            /
          </span>
          <input
            ref={input}
            name="command"
            aria-label="Slash command"
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-foreground caret-primary outline-none placeholder:text-muted-foreground disabled:opacity-40"
            value={text}
            onChange={e => {
              setText(e.target.value);
              setCursor(history.length);
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowUp' && cursor > 0) {
                e.preventDefault();
                recall(-1);
              } else if (e.key === 'ArrowDown' && cursor < history.length) {
                e.preventDefault();
                recall(1);
              }
            }}
            placeholder='/session note text="..."  ·  Enter runs the command'
            maxLength={4000}
            autoComplete="off"
            spellCheck={false}
            disabled={command.pending}
          />
          <button
            type="button"
            className="rulebook-link"
            aria-label="Command palette"
            aria-expanded={paletteOpen}
            title="Command palette"
            onClick={() => setPaletteOpen(open => !open)}
          >
            <ListIcon size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
