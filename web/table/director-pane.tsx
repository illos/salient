// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Director pane (the Foes pane for every role): heading with `MALICE n`, the settings gear,
 * the add-foe control, the Encounter ready callout, and the foes roster as compact cards with a
 * drill-in to the Director's live stat block (V21 phase 2). Every control submits the operation
 * it did before the redesign; audience decisions come from `table.roster` on the server.
 *
 * Owning specifications: docs/table-spec.md#foes-roster, #malice-visibility,
 * #monster-visibility-and-health-display, #confirmed-combat-layout (2026-09-15 decisions:
 * identical compact cards, drill-in, settings pop-up), #roster-targeting-controls.
 */
import { useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { PlusIcon, SettingsIcon } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { PaneHeading } from '../components/pane-heading';
import { useCommand } from '../ui';
import { CommandButton, type Encounter } from './setup-card';
import { TurnControls } from './initiative';
import { VoidCard } from './void-card';
import { RespiteDirectorCard } from './respite-card';
import {
  AdjustAction,
  ConditionBadges,
  FoeSheet,
  foeRoleLine,
  type Foe,
  type Roster,
} from './foe-sheet';
import { RosterCard, turnStateOf, type CardHealth } from './roster-card';
import { RosterSection } from './roster-section';
import { SettingsPopup } from './settings-popup';
import { SquadCard, SquadSheet } from './squad-sheet';

export {
  AdjustAction,
  ConditionBadges,
  ConditionControls,
  FoeStatBlock,
  QuickAction,
  actorRef,
  type Foe,
  type Roster,
} from './foe-sheet';

/** The health presentation the projection allows for this viewer (mode decided on the server). */
function foeCardHealth(foe: Foe): CardHealth {
  const health = foe.health;
  switch (health.mode) {
    case 'director':
      return {
        kind: 'bar',
        value: health.stamina,
        max: health.maxStamina,
        tone: 'foe',
        text: `${health.stamina} / ${health.maxStamina}`,
        temporary: health.temporaryStamina,
        label: `${foe.name} health`,
      };
    case 'bar':
      return {
        kind: 'bar',
        value: health.fraction,
        max: 1,
        tone: 'foe',
        label: `${foe.name} health`,
      };
    case 'numerical':
      return { kind: 'text', text: `${health.stamina} Stamina` };
    case 'winded':
      return { kind: 'winded', winded: health.winded };
  }
}

function FoeCard({
  campaignId,
  foe,
  director,
  encounter,
  running,
  mayTarget,
  onOpen,
}: {
  campaignId: Id<'campaigns'>;
  foe: Foe;
  director: boolean;
  encounter: Encounter | null;
  running: boolean;
  mayTarget: boolean;
  onOpen?: () => void;
}) {
  const turn = turnStateOf(encounter, foe.id);
  const state = foe.slain ? 'slain' : turn.acting ? 'acting' : turn.spent ? 'spent' : 'idle';
  return (
    <RosterCard
      campaignId={campaignId}
      actor={{ kind: 'foe', id: foe.id, name: foe.name }}
      subtitle={director ? foeRoleLine(foe.summary, { compact: true }) || undefined : undefined}
      health={foeCardHealth(foe)}
      badges={
        <ConditionBadges
          conditions={foe.conditions}
          instances={foe.conditionInstances}
          readable={false}
        />
      }
      state={state}
      mayTarget={mayTarget && running}
      aside={
        director && encounter ? (
          <TurnControls
            campaignId={campaignId}
            encounter={encounter}
            actor={{ kind: 'foe', id: foe.id, name: foe.name }}
            running={running}
          />
        ) : undefined
      }
      onOpen={onOpen}
    />
  );
}

/**
 * The add control: every seeded stat block (V02), grouped by monster family. A Minion stat block
 * adds a squad with a count from 1 to 8 (default 4) and an optional captain among the loaded
 * non-minion foes; anything else adds an ordinary foe. Same operations as /foe add and /squad add.
 */
function AddFoe({
  campaignId,
  running,
  roster,
}: {
  campaignId: Id<'campaigns'>;
  running: boolean;
  roster: Roster;
}) {
  const definitions = useQuery(api.foes.definitions, { campaignId });
  const add = useMutation(api.commands.invoke);
  const addition = useCommand();
  const [definitionId, setDefinitionId] = useState<string>('');
  const [count, setCount] = useState(4);
  const [captain, setCaptain] = useState<string>('');
  if (!definitions) return null;
  const selected =
    definitions.find(d => d.definitionId === definitionId) ??
    definitions.find(d => d.definitionId.endsWith('goblin-warrior')) ??
    definitions[0];
  if (!selected) return null;
  const minion = selected.organization === 'Minion';
  const groups = new Map<string, typeof definitions>();
  for (const d of definitions) {
    const key = d.group ?? 'other';
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  const captainIds = new Set(roster.squads.map(s => s.captain?.id).filter(Boolean) as string[]);
  const captains = roster.foes.filter(
    f => !f.squadId && !f.slain && !captainIds.has(f.id) && f.summary?.role !== 'Mount',
  );
  const submit = () =>
    void addition.run(
      commandId =>
        add({
          campaignId,
          operation: minion ? 'squad.add' : 'foe.add',
          arguments: minion
            ? {
                definition: selected.definitionId,
                count,
                ...(captain ? { captain: { refKind: 'foe', id: captain } } : {}),
              }
            : { definition: selected.definitionId },
          commandId,
        }),
      JSON.stringify(['foes.add', campaignId, selected.definitionId, count, captain]),
    );
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-stretch gap-2">
        <select
          className="native-select min-w-0 flex-1"
          aria-label="Foe to add"
          value={selected.definitionId}
          onChange={e => setDefinitionId(e.target.value)}
        >
          {[...groups.entries()].map(([group, list]) => (
            <optgroup key={group} label={group.replace(/-/g, ' ')}>
              {list.map(d => (
                <option key={d.definitionId} value={d.definitionId}>
                  {d.name}
                  {d.organization ? ` · ${d.organization}` : ''}
                  {d.level !== null ? ` L${d.level}` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={minion ? 'Add squad' : 'Add foe'}
          title={minion ? `Add a squad of ${count} × ${selected.name}` : `Add ${selected.name}`}
          disabled={addition.pending || !running}
          onClick={submit}
        >
          <PlusIcon aria-hidden />
        </Button>
      </div>
      {minion && (
        <div
          className="inset-controls flex min-h-11 flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm"
          data-squad-add
        >
          <span className="text-sm text-muted-foreground">Squad</span>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Fewer minions"
            disabled={count <= 1}
            onClick={() => setCount(c => Math.max(1, c - 1))}
          >
            −
          </Button>
          <span className="tabular-nums" aria-live="polite">
            {count} minion{count === 1 ? '' : 's'}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="More minions"
            disabled={count >= 8}
            onClick={() => setCount(c => Math.min(8, c + 1))}
          >
            +
          </Button>
          <label className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Captain</span>
            <select
              className="native-select h-8"
              value={captain}
              onChange={e => setCaptain(e.target.value)}
              aria-label="Captain for the new squad"
            >
              <option value="">None</option>
              {captains.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          {selected.withCaptain && (
            <span className="text-muted-foreground">With Captain: {selected.withCaptain}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** The Encounter ready callout: loaded foes with counts and the full-width Start combat. */
function EncounterReady({ campaignId, foes }: { campaignId: Id<'campaigns'>; foes: Foe[] }) {
  const counts = new Map<string, number>();
  for (const foe of foes) counts.set(foe.name, (counts.get(foe.name) ?? 0) + 1);
  return (
    <section className="flex flex-col gap-3 rounded-md bg-muted p-5" aria-label="Encounter ready">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="m-0">Encounter ready</h3>
        {/* Encounter Value is V06: the slot stays empty rather than showing a zero. */}
        <span className="text-sm text-muted-foreground" aria-hidden />
      </div>
      {counts.size === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">No foes are loaded.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-base">
          {[...counts.entries()].map(([name, count]) => (
            <li key={name} className="flex items-baseline justify-between gap-3">
              <span>{name}</span>
              <span className="text-muted-foreground tabular-nums">×{count}</span>
            </li>
          ))}
        </ul>
      )}
      {/* A04: opens the staged setup card; nothing is committed until OK. */}
      <div className="flex flex-col pt-1 [&>span]:flex [&_button]:h-10 [&_button]:w-full [&_button]:text-base">
        <CommandButton
          campaignId={campaignId}
          text="/combat start"
          label="Start combat"
          variant="default"
        />
      </div>
    </section>
  );
}

function MaliceAside({
  campaignId,
  malice,
  running,
}: {
  campaignId: Id<'campaigns'>;
  malice: number;
  running: boolean;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent p-0 text-base font-medium text-primary tabular-nums hover:underline"
        aria-label={`Malice ${malice}: edit`}
        aria-expanded={editing}
        onClick={() => setEditing(open => !open)}
      >
        {malice}
      </button>
      {editing && running && (
        <AdjustAction
          campaignId={campaignId}
          actor={null}
          field="malice"
          label="Malice"
          current={malice}
        />
      )}
      {editing && !running && <Badge variant="outline">Session paused</Badge>}
    </span>
  );
}

export function DirectorPane({
  campaignId,
  roster,
  encounter,
}: {
  campaignId: Id<'campaigns'>;
  roster: Roster;
  encounter: Encounter | null;
}) {
  const director = roster.role === 'director';
  const running = roster.session?.status === 'running';
  const abilitiesAllowed = encounter?.phase !== 'closeout';
  const mayTarget = roster.role !== 'observer';
  const [voiding, setVoiding] = useState<Id<'encounters'> | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const foesById = new Map(roster.foes.map(foe => [foe.id as string, foe]));
  const openDetail = useRef<((id: string, name: string) => void) | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <PaneHeading
        className="mb-0"
        asideLabel={roster.malice === null ? undefined : 'Malice'}
        asideTone="accent"
        asideValue={
          roster.malice === null ? undefined : director ? (
            <MaliceAside campaignId={campaignId} malice={roster.malice} running={running} />
          ) : (
            roster.malice
          )
        }
        actions={
          director && roster.settings ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Table settings"
              aria-haspopup="dialog"
              onClick={() => setSettingsOpen(true)}
            >
              <SettingsIcon aria-hidden />
            </Button>
          ) : undefined
        }
      >
        Foes
      </PaneHeading>
      {director && roster.settings && (
        <SettingsPopup
          campaignId={campaignId}
          settings={roster.settings}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
      <RosterSection
        label="Foes"
        renderDetail={id => {
          const squad = roster.squads.find(s => s.id === id);
          if (squad)
            return (
              <SquadSheet
                campaignId={campaignId}
                squad={squad}
                members={roster.foes.filter(foe => foe.squadId === squad.id)}
                roster={roster}
                running={running}
                onOpenMember={foe => openDetail.current?.(foe.id, foe.name)}
              />
            );
          const foe = foesById.get(id);
          return foe ? (
            <FoeSheet
              campaignId={campaignId}
              foe={foe}
              squadName={
                foe.squadId ? roster.squads.find(s => s.id === foe.squadId)?.name : undefined
              }
              running={running}
              abilitiesAllowed={abilitiesAllowed}
              mayTarget={mayTarget && running}
            />
          ) : (
            <p className="text-sm text-muted-foreground">This foe is no longer loaded.</p>
          );
        }}
      >
        {open => {
          openDetail.current = open;
          return (
            <div className="flex flex-col gap-4">
              {director && <AddFoe campaignId={campaignId} running={running} roster={roster} />}
              {director && running && !encounter && !roster.session?.respite && (
                <EncounterReady campaignId={campaignId} foes={roster.foes} />
              )}
              {/* V167: combat cannot start while a respite is open, so its card takes the slot. */}
              {director && running && !encounter && (
                <RespiteDirectorCard campaignId={campaignId} roster={roster} />
              )}
              {director && encounter?.status === 'committed' && (
                <div className="flex flex-wrap items-center gap-2">
                  {running && encounter.phase !== 'closeout' && (
                    <CommandButton
                      campaignId={campaignId}
                      text={`/combat end encounter=${encounter.id}`}
                      label="End combat"
                      variant="default"
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                    onClick={() => setVoiding(encounter.id)}
                  >
                    Void combat
                  </Button>
                  {voiding === encounter.id && (
                    <VoidCard
                      key={encounter.id}
                      campaignId={campaignId}
                      encounterId={encounter.id}
                      paused={!running}
                      onCancel={() => setVoiding(null)}
                      onDone={() => setVoiding(null)}
                    />
                  )}
                </div>
              )}
              {roster.foes.length === 0 && roster.squads.length === 0 && (
                <p className="m-0 text-sm text-muted-foreground">No foes are loaded.</p>
              )}
              <ul className="m-0 list-none p-0">
                {roster.squads.map(squad => (
                  <SquadCard
                    key={squad.id}
                    campaignId={campaignId}
                    squad={squad}
                    members={roster.foes.filter(foe => foe.squadId === squad.id)}
                    director={director}
                    encounter={encounter}
                    running={running}
                    mayTarget={mayTarget}
                    onOpen={director ? () => open(squad.id, squad.name) : undefined}
                    onOpenMember={director ? foe => open(foe.id, foe.name) : undefined}
                  />
                ))}
                {roster.foes
                  .filter(foe => !foe.squadId)
                  .map(foe => (
                    <FoeCard
                      key={foe.id}
                      campaignId={campaignId}
                      foe={foe}
                      director={director}
                      encounter={encounter}
                      running={running}
                      mayTarget={mayTarget}
                      onOpen={director ? () => open(foe.id, foe.name) : undefined}
                    />
                  ))}
              </ul>
            </div>
          );
        }}
      </RosterSection>
    </div>
  );
}
