// SPDX-License-Identifier: GPL-3.0-only
/**
 * The table: composition of the V21 session shell and its three panes. Director pane
 * (web/table/director-pane.tsx), centre column with the combat cards, initiative panel and game
 * log (web/table/log.tsx) over the pinned command line (web/table/command-line.tsx), heroes pane
 * (web/table/heroes-pane.tsx). Every control submits a registered operation through
 * `commands.submit` / `commands.invoke`; nothing here resolves a rule, and what each role may see
 * is decided by `table.roster` on the server, not by hiding fields here.
 *
 * Owning specifications: docs/table-spec.md#3-table-surfaces, #confirmed-combat-layout (the same
 * layout hosts FreePlay), #foes-roster, #party-sheets-and-resource-visibility, #game-log-and-chat-scope,
 * #malice-visibility, #monster-visibility-and-health-display, #4-session-status-and-play-mode.
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Loading, errorMessage } from '../ui';
import { useToast } from '../toast';
import { CombatSetupCard } from './setup-card';
import { CloseoutCard } from './closeout-card';
import { TriggerOffers } from './trigger-offers';
import { CommandLine } from './command-line';
import { DirectorPane } from './director-pane';
import { HeroesPane } from './heroes-pane';
import { LogPane } from './log';
import { SessionHeader, SessionPanes, SessionShell } from './shell';

export { DirectorPane } from './director-pane';
export { HeroesPane } from './heroes-pane';
export { GameLog } from './log';

export function TablePage({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const roster = useQuery(api.table.roster, { campaignId });
  const encounter = useQuery(api.encounters.current, { campaignId });
  const drafts = useQuery(api.targets.drafts, { campaignId });
  const invoke = useMutation(api.commands.invoke);
  const entered = useRef<string | null>(null);
  const showError = useToast();
  useEffect(() => {
    if (!roster || drafts === undefined || entered.current === campaignId) return;
    entered.current = campaignId;
    // A09 reload acceptance: discard only this user's unsubmitted targeting. Persisted input
    // cards and gameplay survive. The registered cancellation also works during a pause.
    if (roster.role === 'observer' || !roster.session || !drafts.mine) return;
    void invoke({
      campaignId,
      commandId: crypto.randomUUID(),
      operation: 'selection.cancel',
      arguments: {},
    }).catch(error => showError(errorMessage(error)));
  }, [campaignId, roster, drafts, invoke, showError]);
  // Explicit Take turn switches only this user's pane to the chosen hero (local state, never shared).
  const [viewedHeroId, setViewedHeroId] = useState<Id<'characters'> | null>(null);
  const running = roster?.session?.status === 'running' && encounter !== undefined;
  const onTurnTaken = (actor: { kind: 'character' | 'foe' | 'squad'; id: string }) => {
    if (actor.kind === 'character') setViewedHeroId(actor.id as Id<'characters'>);
  };
  return (
    <SessionShell
      header={
        roster && encounter !== undefined ? (
          <SessionHeader
            campaignId={campaignId}
            campaignName={roster.campaignName}
            roster={roster}
            encounter={encounter}
          />
        ) : (
          <Loading>Opening the table…</Loading>
        )
      }
    >
      <SessionPanes
        combat={encounter?.status === 'committed'}
        director={
          roster && encounter !== undefined ? (
            <DirectorPane campaignId={campaignId} roster={roster} encounter={encounter} />
          ) : (
            <Loading>Loading foes…</Loading>
          )
        }
        center={
          <LogPane
            campaignId={campaignId}
            roster={roster}
            encounter={encounter}
            running={running}
            onTurnTaken={onTurnTaken}
          >
            {encounter && <CombatSetupCard campaignId={campaignId} encounter={encounter} />}
            {encounter?.phase === 'closeout' && <CloseoutCard campaignId={campaignId} />}
            {encounter?.phase === 'turns' && <TriggerOffers campaignId={campaignId} />}
          </LogPane>
        }
        centerFooter={
          roster && encounter !== undefined && roster.role !== 'observer' ? (
            <CommandLine campaignId={campaignId} sessionRevision={roster.session?.revision} />
          ) : undefined
        }
        heroes={
          roster && encounter !== undefined ? (
            <HeroesPane
              campaignId={campaignId}
              roster={roster}
              encounter={encounter}
              viewedHeroId={viewedHeroId}
              onTurnTaken={onTurnTaken}
            />
          ) : (
            <Loading>Loading heroes…</Loading>
          )
        }
      />
    </SessionShell>
  );
}
