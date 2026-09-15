// SPDX-License-Identifier: GPL-3.0-only
/**
 * The centre pane: LOG / RULES / ROLLS tabs, the compact history toolbar, the shared game-log
 * feed in the mockup presentation (session-free-play-director.png, combat-table-*.png; docs/build/
 * V21-desktop-layout-fidelity.md item 5) and the interactive cards index.tsx mounts beneath it.
 * The feed is chronological, oldest at the top, pinned to the newest entry unless the viewer has
 * scrolled up; the bounded window and its Older / Latest controls are unchanged. ROLLS filters
 * the same subscription to entries with dice; RULES opens the reference library in the shared
 * overlay card. Every control here submits a registered operation; nothing resolves a rule.
 *
 * Owning specifications: docs/table-spec.md#game-log-and-chat-scope,
 * #confirmed-action-and-log-contract, #inline-interaction-cards-in-the-game-log,
 * docs/reference-library-spec.md#app-wide-rule-cards.
 */
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { RuleSummary } from '../../shared/contracts/rules';
import { OverlayCard } from '../components/overlay-card';
import { Button } from '../components/ui/button';
import { useRulesCatalog } from '../rules/content';
import { Loading } from '../ui';
import { HistoryControls } from './history-controls';
import { InitiativeBar } from './initiative-bar';
import { hasDice, LogEntry, type LogEvent } from './log-entry';
import type { Roster } from './director-pane';
import type { Encounter } from './setup-card';
import '../rules/reference.css';

const RuleArticleView = lazy(() =>
  import('../rules/article').then(module => ({ default: module.RuleArticleView })),
);

export function boundActorName(payload: unknown): string | null {
  const envelope = (payload as { envelope?: { boundActor?: { name?: string } | null } })?.envelope;
  return envelope?.boundActor?.name ?? null;
}

/** Event kinds that carry an inline interaction card in the feed. */
export const CARD_KINDS = new Set(['ability.use']);

export type LogTab = 'log' | 'rolls';

/**
 * Keeps the pane scrolled to the newest entry while the viewer is at the bottom; a viewer who
 * scrolls up keeps their place until they return to the bottom.
 */
function usePinnedToBottom(anchor: React.RefObject<HTMLElement | null>, active: boolean) {
  const pinned = useRef(true);
  useEffect(() => {
    const pane = anchor.current?.closest<HTMLElement>('.session-pane-scroll');
    if (!pane) return;
    const onScroll = () => {
      pinned.current = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 48;
    };
    pane.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(() => {
      if (active && pinned.current) pane.scrollTop = pane.scrollHeight;
    });
    for (const child of Array.from(pane.children)) observer.observe(child);
    return () => {
      pane.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [anchor, active]);
  useLayoutEffect(() => {
    const pane = anchor.current?.closest<HTMLElement>('.session-pane-scroll');
    if (pane && active && pinned.current) pane.scrollTop = pane.scrollHeight;
  });
}

export function GameLog({
  campaignId,
  sessionId,
  director,
  running,
  tab = 'log',
  ownActorIds,
}: {
  campaignId: Id<'campaigns'>;
  sessionId?: Id<'sessions'>;
  director: boolean;
  running: boolean;
  tab?: LogTab;
  /** Heroes the viewer owns; their entries get the ink disc. */
  ownActorIds?: ReadonlySet<string>;
}) {
  const [before, setBefore] = useState<number | undefined>();
  const results = useQuery(api.abilities.results, { campaignId });
  const result = useQuery(api.events.list, {
    campaignId,
    ...(sessionId ? { sessionId } : {}),
    ...(before === undefined ? {} : { before }),
  });
  // A06: which entry the viewer's Undo/Rewind would act on; the operation checks again when run.
  const history = useQuery(api.history.status, { campaignId });
  const list = useRef<HTMLOListElement>(null);
  usePinnedToBottom(list, before === undefined);
  const own = useMemo(() => ownActorIds ?? new Set<string>(), [ownActorIds]);
  if (!result) return <Loading>Loading the log…</Loading>;
  const undoTarget = history?.undo.available ? history.undo.target?.eventId : undefined;
  // The read returns newest first; the feed reads oldest to newest.
  const ordered: LogEvent[] = [...result.events].reverse();
  const shown = tab === 'rolls' ? ordered.filter(hasDice) : ordered;
  return (
    <div className="flex flex-col" data-log-feed data-tab={tab}>
      {(result.nextBefore !== null || before !== undefined) && (
        <div className="flex items-center justify-center gap-2 py-2">
          {result.nextBefore !== null && (
            <Button variant="outline" size="xs" onClick={() => setBefore(result.nextBefore!)}>
              Older activity
            </Button>
          )}
          {before !== undefined && (
            <Button variant="outline" size="xs" onClick={() => setBefore(undefined)}>
              Latest activity
            </Button>
          )}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tab === 'rolls' ? 'No rolls in this stretch of the log.' : 'No recorded activity yet.'}
        </p>
      ) : (
        <ol ref={list} className="m-0 flex list-none flex-col p-0">
          {shown.map(event => (
            <LogEntry
              key={event.id}
              campaignId={campaignId}
              event={event}
              history={history}
              undoTarget={undoTarget}
              result={results?.find(r => r.eventId === event.id)}
              director={director}
              running={running}
              ownActorIds={own}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

/** A brick-red caps status at the top right of an interactive card (`AWAITING INPUT`). */
export function Callout({
  status,
  children,
  className,
}: {
  status?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative [&_.eyebrow]:text-primary ${className ?? ''}`}
      data-callout
      data-status={status}
    >
      {status && (
        <span className="caps pointer-events-none absolute top-5 right-5 z-1 text-primary">
          {status}
        </span>
      )}
      {children}
    </div>
  );
}

/** The closeout card's status, read from the same closeout projection the card uses. */
export function CloseoutCallout({
  campaignId,
  children,
}: {
  campaignId: Id<'campaigns'>;
  children: React.ReactNode;
}) {
  const closeout = useQuery(api.closeout.current, { campaignId });
  const status =
    !closeout || closeout.phase !== 'closeout'
      ? undefined
      : !closeout.victory.confirmed
        ? 'Awaiting input'
        : closeout.mayFinish
          ? 'Ready to finish'
          : 'Cleanup';
  return <Callout status={status}>{children}</Callout>;
}

function LogTabs({
  tab,
  onTab,
  rulesOpen,
  onRules,
}: {
  tab: LogTab;
  onTab: (tab: LogTab) => void;
  rulesOpen: boolean;
  onRules: () => void;
}) {
  const item = (selected: boolean) =>
    `caps relative -mb-px h-9 border-0 border-b-2 bg-transparent px-1 transition-colors duration-(--motion-fast) ${
      selected
        ? 'border-b-primary text-foreground'
        : 'border-b-transparent text-muted-foreground hover:text-foreground'
    }`;
  return (
    <div
      className="rule-strong flex items-end justify-center gap-7"
      role="tablist"
      aria-label="Log"
    >
      <h2 className="sr-only">Game log</h2>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'log' && !rulesOpen}
        className={item(tab === 'log' && !rulesOpen)}
        onClick={() => onTab('log')}
      >
        Log
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={rulesOpen}
        aria-haspopup="dialog"
        className={item(rulesOpen)}
        onClick={onRules}
      >
        Rules
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'rolls' && !rulesOpen}
        className={item(tab === 'rolls' && !rulesOpen)}
        onClick={() => onTab('rolls')}
      >
        Rolls
      </button>
    </div>
  );
}

/**
 * The reference library inside the shared overlay card: the core books' chapters, each opening
 * inside the card with a Back control, and a link to the full searchable library.
 */
function RulesCard({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { catalog, error } = useRulesCatalog();
  const [history, setHistory] = useState<{ entry: RuleSummary; section?: string }[]>([]);
  const current = history.at(-1);
  const bookName = (id: string) => catalog?.books.find(b => b.id === id)?.name ?? 'Draw Steel';
  return (
    <OverlayCard
      open={open}
      onOpenChange={next => {
        onOpenChange(next);
        if (!next) setHistory([]);
      }}
      className="rule-preview"
      backdropClassName="rule-preview-backdrop"
      bodyClassName="rule-preview-scroll"
      bodyKey={current ? `${current.entry.id}#${current.section ?? ''}` : 'library'}
      closeLabel="Close rules"
      eyebrow={current ? `Draw Steel: ${bookName(current.entry.book)}` : 'Reference library'}
      title={current ? current.entry.name : 'Rules'}
      leading={
        current ? (
          <button
            type="button"
            className="rulebook-link"
            aria-label="Back to the library"
            onClick={() => setHistory(h => h.slice(0, -1))}
          >
            <ArrowLeftIcon size={18} />
          </button>
        ) : undefined
      }
    >
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!catalog && !error && <Loading>Opening the compendium…</Loading>}
      {catalog && current && (
        <Suspense fallback={<Loading>Opening {current.entry.name}…</Loading>}>
          <RuleArticleView
            catalog={catalog}
            entry={current.entry}
            section={current.section}
            onFollow={(path, section) => {
              const entry = catalog.entries.find(e => e.path === path);
              if (entry) setHistory(h => [...h, { entry, section }]);
            }}
          />
        </Suspense>
      )}
      {catalog && !current && (
        <div className="flex flex-col gap-6">
          <p className="m-0 text-sm text-muted-foreground">
            Read a chapter here, or open the full library with search in a new tab.
            <a
              href="/rules"
              target="_blank"
              rel="noopener"
              className="ml-2 inline-flex items-center gap-1 font-semibold"
            >
              Open the library <ExternalLinkIcon size={13} aria-hidden />
            </a>
          </p>
          {catalog.books.map(book => (
            <section key={book.id} aria-label={book.name}>
              <h3 className="rule-strong mb-2 pb-1 text-lg">{book.name}</h3>
              <ol className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-1 p-0 sm:grid-cols-2">
                {catalog.entries
                  .filter(e => e.kind === 'chapter' && e.book === book.id)
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map(chapter => (
                    <li key={chapter.id} className="m-0 p-0">
                      <button
                        type="button"
                        className="w-full border-0 bg-transparent px-0 py-1 text-left text-sm hover:text-primary hover:underline"
                        onClick={() => setHistory([{ entry: chapter }])}
                      >
                        {chapter.name}
                      </button>
                    </li>
                  ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </OverlayCard>
  );
}

/**
 * The whole centre column: in combat the initiative bar, then the tabs and the history toolbar
 * (sticky at the top of the pane), the feed, and the interactive cards index.tsx passes as
 * children beneath the feed.
 */
export function LogPane({
  campaignId,
  roster,
  encounter,
  running,
  onTurnTaken,
  children,
}: {
  campaignId: Id<'campaigns'>;
  roster: Roster;
  encounter: Encounter | null;
  running: boolean;
  onTurnTaken: (actor: { kind: 'character' | 'foe'; id: string }) => void;
  children?: React.ReactNode;
}) {
  const [tab, setTab] = useState<LogTab>('log');
  const [rulesOpen, setRulesOpen] = useState(false);
  const director = roster.role === 'director';
  const ownActorIds = useMemo(
    () => new Set(roster.heroes.filter(h => h.ownerId === roster.viewerId).map(h => h.id)),
    [roster.heroes, roster.viewerId],
  );
  return (
    <div className="flex min-h-full flex-col" data-log-pane>
      <div className="sticky -top-(--pane-padding-y) z-10 -mx-(--pane-padding-x) -mt-(--pane-padding-y) flex flex-col gap-3 bg-background px-(--pane-padding-x) pt-(--pane-padding-y) pb-3">
        {encounter && encounter.status === 'committed' && encounter.phase === 'turns' && (
          <InitiativeBar
            campaignId={campaignId}
            encounter={encounter}
            director={director}
            running={running}
            onTurnTaken={onTurnTaken}
          />
        )}
        <LogTabs
          tab={tab}
          onTab={setTab}
          rulesOpen={rulesOpen}
          onRules={() => setRulesOpen(true)}
        />
        {running && roster.role !== 'observer' && <HistoryControls campaignId={campaignId} />}
      </div>
      <RulesCard open={rulesOpen} onOpenChange={setRulesOpen} />
      <GameLog
        campaignId={campaignId}
        sessionId={roster.session?.id}
        director={director}
        running={running}
        tab={tab}
        ownActorIds={ownActorIds}
      />
      {children && <div className="mt-3 flex flex-col gap-4">{children}</div>}
    </div>
  );
}
