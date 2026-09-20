// SPDX-License-Identifier: GPL-3.0-only
/**
 * The heroes pane. Director: every hero as the same compact card as the foes (Stamina bar and
 * numbers, Recoveries, Heroic Resource by its real name, Surges, Victories) with a drill-in to
 * the compact character sheet. Player: the viewer's own hero card first, expanded into the
 * compact sheet inside the Selected sheet callout, then the Party roster as compact cards that
 * carry only what the server projects for peers (Stamina and Recoveries, never Heroic Resource).
 * Observer: read-only cards. Take turn / End turn keep their component (TurnControls).
 *
 * Owning specifications: docs/table-spec.md#party-sheets-and-resource-visibility,
 * #confirmed-combat-layout (2026-09-15 decisions), #roster-targeting-controls;
 * docs/character-sheet-spec.md#layout-and-content.
 */
import { useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { Chip } from '../components/chip';
import { PaneHeading } from '../components/pane-heading';
import { CharacterSheet } from '../character-sheet';
import type { Encounter } from './setup-card';
import { TurnControls } from './initiative';
import type { Roster } from './foe-sheet';
import { RosterCard, turnStateOf, type CardHealth } from './roster-card';
import { RosterSection } from './roster-section';
import { AbilityPanel } from './targeting';
import { HeroRingRow } from './hero-ring-row';

export type Hero = Roster['heroes'][number];

function HeroCard({
  campaignId,
  hero,
  own,
  running,
  encounter,
  mayTarget,
  mayAct,
  current,
  onOpen,
  onTurnTaken,
}: {
  campaignId: Id<'campaigns'>;
  hero: Hero;
  own: boolean;
  running: boolean;
  encounter: Encounter | null;
  mayTarget: boolean;
  mayAct: boolean;
  current: boolean;
  onOpen?: () => void;
  onTurnTaken: (actor: { kind: 'character' | 'foe' | 'squad'; id: string }) => void;
}) {
  const facts = hero.facts;
  const live = hero.live;
  const turn = turnStateOf(encounter, hero.id);
  const state = turn.acting ? 'acting' : turn.spent ? 'spent' : 'idle';
  const abilitiesAllowed = running && encounter?.phase !== 'closeout';
  let health: CardHealth = null;
  if (live && live.stamina !== null) {
    const max = facts?.staminaMax ?? null;
    health =
      max !== null
        ? {
            kind: 'bar',
            value: live.stamina,
            max,
            tone: 'hero',
            low: facts?.windedValue ?? undefined,
            text: `${live.stamina} / ${max}`,
            temporary: 'temporaryStamina' in live ? live.temporaryStamina : undefined,
            label: `${hero.name} Stamina`,
          }
        : { kind: 'text', text: `${live.stamina} Stamina` };
  }
  const full = live && 'heroicResource' in live ? live : null;
  const resources = live ? (
    <>
      {live.recoveries !== null && (
        // Recoveries read as a count on a 424px card; the pips belong to the sheet's Stamina
        // block, where the mockup puts them and there is room for ten of them on one line.
        <span
          className="inline-flex items-center gap-1.5"
          title={
            facts?.recoveriesMax !== null && facts?.recoveriesMax !== undefined
              ? `Recoveries ${live.recoveries} of ${facts.recoveriesMax}`
              : undefined
          }
        >
          <span className="caps text-muted-foreground">Recoveries</span>
          <span className="text-xs font-semibold tabular-nums">
            {live.recoveries}
            {facts?.recoveriesMax !== null && facts?.recoveriesMax !== undefined
              ? ` / ${facts.recoveriesMax}`
              : ''}
          </span>
        </span>
      )}
      {full && (
        <>
          <Chip
            kind="accent"
            caps
            title={`${full.heroicResource.name} ${full.heroicResource.current}`}
          >
            {full.heroicResource.name} {full.heroicResource.current}
          </Chip>
          <Chip caps>Surges {full.surges}</Chip>
          <Chip caps>Victories {full.victories}</Chip>
        </>
      )}
    </>
  ) : (
    <span className="text-xs text-muted-foreground">
      No live values: admission initializes them.
    </span>
  );
  return (
    <RosterCard
      campaignId={campaignId}
      actor={{ kind: 'character', id: hero.id, name: hero.name }}
      subtitle={facts?.subtitle ?? hero.ownerName}
      discVariant={own ? 'ink' : 'grey'}
      own={own}
      health={health}
      resources={resources}
      state={state}
      mayTarget={mayTarget && abilitiesAllowed}
      aside={
        mayAct && encounter ? (
          <TurnControls
            campaignId={campaignId}
            encounter={encounter}
            actor={{ kind: 'character', id: hero.id, name: hero.name }}
            running={running}
            onTurnTaken={onTurnTaken}
          />
        ) : undefined
      }
      current={current}
      onOpen={onOpen}
    />
  );
}

export function HeroesPane({
  campaignId,
  roster,
  encounter,
  viewedHeroId,
  onTurnTaken,
}: {
  campaignId: Id<'campaigns'>;
  roster: Roster;
  encounter: Encounter | null;
  viewedHeroId: Id<'characters'> | null;
  onTurnTaken: (actor: { kind: 'character' | 'foe' | 'squad'; id: string }) => void;
}) {
  const director = roster.role === 'director';
  const observer = roster.role === 'observer';
  const running = roster.session?.status === 'running';
  const mayTarget = !observer;
  const mine = roster.heroes.filter(h => h.ownerId === roster.viewerId);
  const others = roster.heroes.filter(h => h.ownerId !== roster.viewerId);
  // The viewed hero (the one whose turn this user last took) leads the pane.
  const ordered = [...mine, ...others].sort((a, b) =>
    a.id === viewedHeroId ? -1 : b.id === viewedHeroId ? 1 : 0,
  );
  // A02: one own sheet is open at a time; a text selector switches between eligible heroes.
  const [chosen, setChosen] = useState<Id<'characters'> | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const selectedId =
    mine.find(h => h.id === chosen)?.id ??
    mine.find(h => h.id === viewedHeroId)?.id ??
    mine[0]?.id ??
    null;
  // Victories are projected per hero only (heroLiveValidator), so the heading carries no aside;
  // a shared party count would need a projection field, never a sum computed here.
  const heading = (
    <PaneHeading
      className="mb-0"
      actions={
        !director && mine.length > 1 ? (
          <select
            className="native-select"
            aria-label="Viewed hero"
            value={selectedId ?? ''}
            onChange={e => {
              setChosen(e.target.value as Id<'characters'>);
              setCollapsed(false);
            }}
          >
            {mine.map(hero => (
              <option key={hero.id} value={hero.id}>
                {hero.name} · {hero.ownerName}
              </option>
            ))}
          </select>
        ) : undefined
      }
    >
      Heroes
    </PaneHeading>
  );
  const card = (hero: Hero, onOpen?: () => void) => (
    <HeroCard
      key={hero.id}
      campaignId={campaignId}
      hero={hero}
      own={hero.ownerId === roster.viewerId}
      running={running}
      encounter={encounter}
      mayTarget={mayTarget}
      mayAct={!observer && hero.controlled}
      current={hero.id === viewedHeroId}
      onOpen={onOpen}
      onTurnTaken={onTurnTaken}
    />
  );
  return (
    <div className="flex flex-col gap-4">
      {heading}
      {encounter?.status === 'committed' && (
        <HeroRingRow
          campaignId={campaignId}
          encounter={encounter}
          heroes={roster.heroes}
          selectedId={viewedHeroId}
          onSelect={id => onTurnTaken({ kind: 'character', id })}
        />
      )}
      {observer && (
        <p className="m-0 text-sm text-muted-foreground">
          You are observing; the panes are read-only.
        </p>
      )}
      {roster.heroes.length === 0 && (
        <p className="m-0 text-sm text-muted-foreground">
          No heroes are attached to this campaign.
        </p>
      )}
      {director ? (
        <RosterSection
          label="Heroes"
          renderDetail={id => {
            const hero = roster.heroes.find(h => h.id === id);
            return (
              <>
                {/* A02: the character sheet, fed by the audience-projected characters.sheet read. */}
                <CharacterSheet characterId={id as Id<'characters'>} compact />
                {/* The Director may act for any character, so the drill-in keeps the panel. */}
                {running && hero?.controlled && (
                  <AbilityPanel
                    campaignId={campaignId}
                    actor={{ kind: 'character', id: hero.id, name: hero.name }}
                    running={running}
                  />
                )}
              </>
            );
          }}
        >
          {open => (
            <ul className="m-0 list-none p-0">
              {ordered.map(hero => card(hero, () => open(hero.id, hero.name)))}
            </ul>
          )}
        </RosterSection>
      ) : (
        <>
          {mine.map(hero => (
            <div key={hero.id} className="flex flex-col gap-3 pb-1">
              <ul className="m-0 list-none p-0">
                {card(hero, () => {
                  if (hero.id === selectedId) setCollapsed(open => !open);
                  else {
                    setChosen(hero.id);
                    setCollapsed(false);
                  }
                })}
              </ul>
              {hero.id === selectedId && !collapsed && (
                <section
                  className="flex flex-col gap-3 rounded-md border border-rule-strong bg-card px-5 py-4 shadow-hard"
                  aria-label="Selected sheet"
                >
                  <span className="caps text-muted-foreground">Selected sheet</span>
                  <CharacterSheet key={hero.id} characterId={hero.id} compact />
                  {/* The ability Use controls and their target flow stay with the selected hero:
                      the sheet's cards are readable presentation, the panel is the operation. */}
                  {running && hero.controlled && (
                    <AbilityPanel
                      campaignId={campaignId}
                      actor={{ kind: 'character', id: hero.id, name: hero.name }}
                      running={running}
                    />
                  )}
                </section>
              )}
            </div>
          ))}
          {others.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="rule-soft flex items-baseline justify-between pb-1">
                <span className="caps text-muted-foreground">Party</span>
                <span className="caps text-muted-foreground">{others.length}</span>
              </div>
              <ul className="m-0 list-none p-0">{others.map(hero => card(hero))}</ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
