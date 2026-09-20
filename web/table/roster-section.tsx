// SPDX-License-Identifier: GPL-3.0-only
/**
 * RosterSection: the roster list of one pane with its drill-in state. Clicking a card replaces
 * the list with a detail view (a slim sticky Back row, then the sheet or stat block); Back and
 * Escape restore the list with its scroll position. The selection is per-browser state, never
 * persisted (docs/table-spec.md#confirmed-combat-layout, 2026-09-15 user decision: a drill-in
 * that replaces the roster section, not an accordion).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeftIcon } from 'lucide-react';

export type OpenDetail = (id: string, name: string) => void;

export function RosterSection({
  label,
  children,
  renderDetail,
}: {
  /** The list's name for the Back control: `Foes`, `Heroes`. */
  label: string;
  /** The roster list; receives the opener for the cards. */
  children: (open: OpenDetail) => React.ReactNode;
  renderDetail: (id: string) => React.ReactNode;
}) {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const restore = useRef(false);
  // The list's scroll offset is tracked continuously so opening a detail needs no ref read
  // during render; the pane is the scroll container the session shell provides.
  useEffect(() => {
    if (selected) return;
    const pane = root.current?.closest<HTMLElement>('.session-pane-scroll') ?? null;
    if (!pane) return;
    const onScroll = () => {
      savedScroll.current = pane.scrollTop;
    };
    savedScroll.current = pane.scrollTop;
    pane.addEventListener('scroll', onScroll, { passive: true });
    return () => pane.removeEventListener('scroll', onScroll);
  }, [selected]);
  const open = useCallback<OpenDetail>((id, name) => setSelected({ id, name }), []);
  const back = useCallback(() => {
    restore.current = true;
    setSelected(null);
  }, []);
  useLayoutEffect(() => {
    const pane = root.current?.closest<HTMLElement>('.session-pane-scroll') ?? null;
    if (!pane) return;
    if (selected) pane.scrollTop = 0;
    else if (restore.current) {
      restore.current = false;
      pane.scrollTop = savedScroll.current;
    }
  }, [selected]);
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      // An open rule card or settings pop-up owns Escape.
      if (event.key !== 'Escape' || document.querySelector('[role="dialog"]')) return;
      back();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected, back]);
  if (!selected) return <div ref={root}>{children(open)}</div>;
  return (
    <div ref={root} className="flex flex-col gap-4">
      <div className="roster-back-row sticky -top-(--pane-padding-y) z-10 -mx-(--pane-padding-x) flex items-center gap-3 bg-card px-(--pane-padding-x) py-2">
        <button
          type="button"
          onClick={back}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border-0 bg-muted pr-3 pl-2 text-sm text-foreground transition-colors duration-(--motion-fast) hover:bg-accent"
        >
          <ChevronLeftIcon size={14} aria-hidden />
          {label}
        </button>
        <span className="truncate text-base font-medium">{selected.name}</span>
      </div>
      <div key={selected.id}>{renderDetail(selected.id)}</div>
    </div>
  );
}
