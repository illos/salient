// SPDX-License-Identifier: GPL-3.0-only
/**
 * V02 minion squads in the Director pane: the compact squad card with its nested minion rows
 * (each minion keeps its own target reticle; the squad itself is never a target), and the
 * Director's squad sheet: the shared Stamina pool with its step and carried damage, proportional
 * EV, captain attachment, owed casualty choices, per-minion participation, the coordinated squad
 * action builder and Free Strike Together. Every control submits a registered squad operation
 * through `commands.invoke`; nothing here resolves a rule, and the audience projection comes from
 * `table.roster`.
 *
 * Owning specifications: docs/table-spec.md#minion-squads-and-captain-state (subgroup with member
 * reticles, add flow, coordinated actions, captain provision, 2026-09-20 user decisions),
 * docs/table-spec.md#roster-targeting-controls, docs/table-command-spec.md#minion-squad-additions-and-state.
 */
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Disc } from '../components/disc';
import { HealthBar } from '../components/health-bar';
import { useCommand } from '../ui';
import type { Encounter } from './setup-card';
import { TurnControls } from './initiative';
import { AdjustAction, ConditionBadges, foeRoleLine, type Foe, type Roster } from './foe-sheet';
import { RosterCard, turnStateOf, type CardHealth } from './roster-card';

export type Squad = Roster['squads'][number];
type Reference = { refKind: 'foe' | 'character'; id: string };

const SQUAD_MANEUVERS = ['Grab', 'Knockback', 'Hide', 'Search for Hidden Creatures'];

/** Squad pool presentation for the viewer: the server decided the mode. */
function squadHealth(squad: Squad): CardHealth {
  const health = squad.health;
  switch (health.mode) {
    case 'director':
      return {
        kind: 'bar',
        value: health.pool,
        max: health.poolMax,
        tone: 'foe',
        text: `${health.pool} / ${health.poolMax}`,
        label: `${squad.name} pool`,
      };
    case 'bar':
      return {
        kind: 'bar',
        value: health.fraction,
        max: 1,
        tone: 'foe',
        label: `${squad.name} pool`,
      };
    case 'numerical':
      return { kind: 'text', text: `${health.pool} pooled Stamina` };
    case 'winded':
      // Minions cannot be winded; the living count is the only Winded-mode fact.
      return { kind: 'text', text: `${squad.living} of ${squad.total} minions` };
  }
}

function squadState(squad: Squad, encounter: Encounter | null) {
  const out = squad.living === 0 && (!squad.captain || squad.captain.slain);
  if (out) return 'slain' as const;
  const turn = turnStateOf(encounter, squad.id);
  return turn.acting ? ('acting' as const) : turn.spent ? ('spent' as const) : ('idle' as const);
}

/** The squad card and its minion rows for the roster list (every role). */
export function SquadCard({
  campaignId,
  squad,
  members,
  director,
  encounter,
  running,
  mayTarget,
  onOpen,
  onOpenMember,
}: {
  campaignId: Id<'campaigns'>;
  squad: Squad;
  members: Foe[];
  director: boolean;
  encounter: Encounter | null;
  running: boolean;
  mayTarget: boolean;
  onOpen?: () => void;
  onOpenMember?: (foe: Foe) => void;
}) {
  const state = squadState(squad, encounter);
  const summary = squad.director?.summary;
  const subtitle = [
    `${squad.living}/${squad.total} minions`,
    summary ? foeRoleLine({ level: summary.level, role: summary.role }, { compact: true }) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <li className="flex flex-col" data-squad-card data-squad-id={squad.id}>
      <ul className="m-0 list-none p-0">
        <RosterCard
          campaignId={campaignId}
          actor={{ kind: 'squad', id: squad.id, name: squad.name }}
          subtitle={subtitle}
          health={squadHealth(squad)}
          badges={
            <span className="flex flex-wrap gap-1">
              {squad.captain && (
                <Badge variant="outline">
                  Captain {squad.captain.name}
                  {squad.captain.slain ? ' (slain)' : ''}
                </Badge>
              )}
              {squad.pending && (
                <Badge>
                  {squad.pending.count} {squad.pending.count === 1 ? 'casualty' : 'casualties'} to
                  name
                </Badge>
              )}
            </span>
          }
          state={state}
          mayTarget={false}
          aside={
            director && encounter ? (
              <TurnControls
                campaignId={campaignId}
                encounter={encounter}
                actor={{ kind: 'squad', id: squad.id, name: squad.name }}
                running={running}
              />
            ) : undefined
          }
          onOpen={onOpen}
        />
      </ul>
      <ul className="m-0 list-none p-0 pl-6" aria-label={`${squad.name} minions`}>
        {members.map(foe => (
          <RosterCard
            key={foe.id}
            campaignId={campaignId}
            actor={{ kind: 'foe', id: foe.id, name: foe.name }}
            health={null}
            badges={<ConditionBadges conditions={foe.conditions} readable={false} />}
            state={foe.slain ? 'slain' : 'idle'}
            mayTarget={mayTarget && running && !foe.slain}
            onOpen={director && onOpenMember ? () => onOpenMember(foe) : undefined}
            className="squad-member"
          />
        ))}
      </ul>
    </li>
  );
}

/** Submits one squad operation with structured arguments through the shared invoke path. */
function useSquadCommand(campaignId: Id<'campaigns'>) {
  const invoke = useMutation(api.commands.invoke);
  const command = useCommand();
  return {
    pending: command.pending,
    run: (operation: string, squadId: string | null, args: Record<string, unknown>, key: string) =>
      command.run(
        commandId =>
          invoke({
            campaignId,
            operation,
            ...(squadId ? { actor: { refKind: 'squad', id: squadId } } : {}),
            arguments: args,
            commandId,
          }),
        JSON.stringify([key, campaignId, squadId, args]),
      ),
  };
}

function Picker({
  label,
  options,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  options: { id: string; name: string; note?: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  disabled?: (id: string) => boolean;
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
      <legend className="caps text-muted-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <label key={option.id} className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={selected.has(option.id)}
              disabled={disabled?.(option.id)}
              onChange={() => onToggle(option.id)}
            />
            {option.name}
            {option.note && <span className="text-muted-foreground">({option.note})</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Owed casualties: the Director (or the attacking player, through the same operation) names them. */
export function CasualtyPicker({
  campaignId,
  squad,
  members,
}: {
  campaignId: Id<'campaigns'>;
  squad: Squad;
  members: Foe[];
}) {
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const squadCommand = useSquadCommand(campaignId);
  const pending = squad.pending;
  if (!pending) return null;
  const owed = Math.min(pending.count, pending.candidates.length);
  const candidates = pending.candidates.map(id => ({
    id,
    name: members.find(m => m.id === id)?.name ?? id,
  }));
  return (
    <section
      className="flex flex-col gap-2 rounded-md border border-rule-strong bg-card px-3 py-2"
      aria-label={`${squad.name} casualties`}
    >
      <p className="m-0 text-sm">
        <strong>
          {owed} {owed === 1 ? 'minion' : 'minions'} to name
        </strong>{' '}
        {pending.reason === 'nearest'
          ? '(the minions nearest those already taken out; the pool loss is already applied)'
          : '(among the minions that took the damage; the pool loss is already applied)'}
      </p>
      <Picker
        label="Drop"
        options={candidates}
        selected={chosen}
        onToggle={id =>
          setChosen(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else if (next.size < owed) next.add(id);
            return next;
          })
        }
      />
      <div>
        <Button
          type="button"
          size="sm"
          disabled={chosen.size !== owed || squadCommand.pending}
          onClick={() =>
            void squadCommand
              .run(
                'squad.casualties',
                null,
                {
                  squad: squad.id,
                  casualties: [...chosen].map(id => ({ refKind: 'foe', id })),
                },
                'squad.casualties',
              )
              .then(ok => ok && setChosen(new Set()))
          }
        >
          Confirm casualties
        </Button>
      </div>
    </section>
  );
}

type TargetOption = { key: string; ref: Reference; name: string };

function targetOptions(roster: Roster, squad: Squad): TargetOption[] {
  const heroes = roster.heroes.map(h => ({
    key: `character:${h.id}`,
    ref: { refKind: 'character' as const, id: h.id },
    name: h.name,
  }));
  const foes = roster.foes
    .filter(f => !f.slain && f.squadId !== squad.id)
    .map(f => ({ key: `foe:${f.id}`, ref: { refKind: 'foe' as const, id: f.id }, name: f.name }));
  return [...heroes, ...foes];
}

function SquadActionBuilder({
  campaignId,
  squad,
  members,
  roster,
}: {
  campaignId: Id<'campaigns'>;
  squad: Squad;
  members: Foe[];
  roster: Roster;
}) {
  const squadCommand = useSquadCommand(campaignId);
  const [ability, setAbility] = useState<string>('');
  const [targetKey, setTargetKey] = useState<string>('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<
    { target: TargetOption; minions: Foe[]; edges: number; banes: number }[]
  >([]);
  const targets = targetOptions(roster, squad);
  const participation = squad.director?.participation;
  const available = members.filter(
    m =>
      !m.slain &&
      !participation?.optedOut.includes(m.id) &&
      !assignments.some(a => a.minions.some(x => x.id === m.id)),
  );
  const signature = ability === '';
  const limit = signature ? 3 : Infinity;
  const target = targets.find(t => t.key === targetKey);
  const add = () => {
    if (!target || !picked.size) return;
    setAssignments(prev => [
      ...prev,
      {
        target,
        minions: members.filter(m => picked.has(m.id)),
        edges: 0,
        banes: 0,
      },
    ]);
    setPicked(new Set());
    setTargetKey('');
  };
  const resolve = () =>
    void squadCommand
      .run(
        'squad.act',
        squad.id,
        {
          ...(ability ? { ability } : {}),
          assignments: assignments.map(a => ({
            target: a.target.ref,
            minions: a.minions.map(m => ({ refKind: 'foe', id: m.id })),
            edges: a.edges,
            banes: a.banes,
          })),
        },
        'squad.act',
      )
      .then(ok => ok && setAssignments([]));
  return (
    <section className="flex flex-col gap-2" aria-label={`${squad.name} squad action`}>
      <span className="caps text-muted-foreground">Squad action</span>
      <label className="flex items-center gap-2 text-xs">
        <span className="caps text-muted-foreground">Ability</span>
        <select
          className="native-select"
          value={ability}
          onChange={e => {
            setAbility(e.target.value);
            setAssignments([]);
          }}
        >
          <option value="">Signature ability (one roll, up to 3 per target)</option>
          {SQUAD_MANEUVERS.map(name => (
            <option key={name} value={name}>
              {name} together
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-2">
        <label className="flex items-center gap-2 text-xs">
          <span className="caps text-muted-foreground">Target</span>
          <select
            className="native-select"
            value={targetKey}
            onChange={e => setTargetKey(e.target.value)}
          >
            <option value="">Choose…</option>
            {targets
              .filter(t => !assignments.some(a => a.target.key === t.key))
              .map(t => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
        <Picker
          label={`Minions${signature ? ` (${picked.size}/${limit})` : ''}`}
          options={available.map(m => ({
            id: m.id,
            name: m.name,
            ...(participation?.individual.includes(m.id) ? { note: 'acted alone' } : {}),
          }))}
          selected={picked}
          onToggle={id =>
            setPicked(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else if (next.size < limit) next.add(id);
              return next;
            })
          }
        />
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!target || !picked.size}
            onClick={add}
          >
            Assign
          </Button>
        </div>
      </div>
      {assignments.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs">
          {assignments.map((a, index) => (
            <li key={a.target.key} className="flex flex-wrap items-center gap-2">
              <strong>{a.target.name}</strong>
              <span>← {a.minions.map(m => m.name).join(', ')}</span>
              <label className="flex items-center gap-1">
                <span className="caps text-muted-foreground">Edges</span>
                <input
                  className="w-10 rounded border px-1"
                  type="number"
                  min={0}
                  value={a.edges}
                  onChange={e =>
                    setAssignments(prev =>
                      prev.map((x, i) =>
                        i === index ? { ...x, edges: Number(e.target.value) || 0 } : x,
                      ),
                    )
                  }
                  aria-label={`Edges against ${a.target.name}`}
                />
                <span className="caps text-muted-foreground">Banes</span>
                <input
                  className="w-10 rounded border px-1"
                  type="number"
                  min={0}
                  value={a.banes}
                  onChange={e =>
                    setAssignments(prev =>
                      prev.map((x, i) =>
                        i === index ? { ...x, banes: Number(e.target.value) || 0 } : x,
                      ),
                    )
                  }
                  aria-label={`Banes against ${a.target.name}`}
                />
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAssignments(prev => prev.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button
          type="button"
          size="sm"
          disabled={!assignments.length || squadCommand.pending}
          onClick={resolve}
        >
          Resolve squad action
        </Button>
      </div>
    </section>
  );
}

function FreeStrikeTogether({
  campaignId,
  squad,
  members,
  roster,
}: {
  campaignId: Id<'campaigns'>;
  squad: Squad;
  members: Foe[];
  roster: Roster;
}) {
  const squadCommand = useSquadCommand(campaignId);
  const [targetKey, setTargetKey] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const targets = targetOptions(roster, squad);
  const target = targets.find(t => t.key === targetKey);
  return (
    <section className="flex flex-col gap-2" aria-label={`${squad.name} free strike together`}>
      <span className="caps text-muted-foreground">Free Strike Together</span>
      <label className="flex items-center gap-2 text-xs">
        <span className="caps text-muted-foreground">Target</span>
        <select
          className="native-select"
          value={targetKey}
          onChange={e => setTargetKey(e.target.value)}
        >
          <option value="">Choose…</option>
          {targets.map(t => (
            <option key={t.key} value={t.key}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <Picker
        label="Minions striking"
        options={members.filter(m => !m.slain).map(m => ({ id: m.id, name: m.name }))}
        selected={picked}
        onToggle={id =>
          setPicked(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
      />
      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!target || !picked.size || squadCommand.pending}
          onClick={() =>
            void squadCommand
              .run(
                'squad.free-strike',
                squad.id,
                { target: target!.ref, minions: [...picked].map(id => ({ refKind: 'foe', id })) },
                'squad.free-strike',
              )
              .then(ok => ok && setPicked(new Set()))
          }
        >
          Free strike as one
        </Button>
      </div>
    </section>
  );
}

/** The Director's squad sheet (the roster drill-in for a squad card). */
export function SquadSheet({
  campaignId,
  squad,
  members,
  roster,
  running,
  onOpenMember,
}: {
  campaignId: Id<'campaigns'>;
  squad: Squad;
  members: Foe[];
  roster: Roster;
  running: boolean;
  onOpenMember: (foe: Foe) => void;
}) {
  const squadCommand = useSquadCommand(campaignId);
  const facts = squad.director;
  const health = squad.health;
  const captainIds = new Set(roster.squads.map(s => s.captain?.id).filter(Boolean) as string[]);
  const eligibleCaptains = roster.foes.filter(
    f => !f.squadId && !f.slain && !captainIds.has(f.id) && f.summary?.role !== 'Mount',
  );
  const summary = facts?.summary;
  return (
    <article className="flex flex-col gap-4" aria-label={`${squad.name} squad sheet`}>
      <header className="flex items-start gap-3">
        <Disc name={squad.name} size="md" muted={squad.living === 0} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="m-0 truncate">{squad.name}</h3>
          <p className="caps m-0 text-muted-foreground">
            {squad.living}/{squad.total} minions
            {summary
              ? ` · ${foeRoleLine({ level: summary.level, role: summary.role, organization: 'Minion' })}`
              : ''}
          </p>
        </div>
      </header>
      {health.mode === 'director' && facts && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <HealthBar
              value={health.pool}
              max={health.poolMax}
              tone="foe"
              label={`${squad.name} pool`}
              className="min-w-0 flex-1"
            />
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {health.pool} / {health.poolMax}
            </span>
            {running && (
              <AdjustAction
                campaignId={campaignId}
                actor={`@{squad:${squad.id}}`}
                field="stamina"
                label="Squad pool"
                current={health.pool}
              />
            )}
          </div>
          <p className="caps m-0 text-muted-foreground">
            Shared pool · step {health.step}
            {facts.captainBenefit?.stamina && squad.captain
              ? ` (${facts.memberStamina} + ${facts.captainBenefit.stamina} captain)`
              : ''}
            {' · '}carried {health.carried} · EV{' '}
            {facts.ev.derived === null
              ? `${facts.ev.printed ?? 'not read'} (not derived)`
              : `${facts.ev.derived} (${squad.total} × ${facts.ev.amount} ÷ ${facts.ev.quantity})`}
          </p>
        </div>
      )}
      {squad.pending && <CasualtyPicker campaignId={campaignId} squad={squad} members={members} />}
      <div className="rule-soft flex flex-col gap-2 pb-3">
        <span className="caps text-muted-foreground">Captain</span>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {squad.captain ? (
            <>
              <span>
                <strong>{squad.captain.name}</strong>
                {squad.captain.slain ? ' (slain)' : ''}
                {facts?.captainBenefit ? ` · With Captain: ${facts.captainBenefit.text}` : ''}
              </span>
              {running && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={squadCommand.pending}
                  onClick={() =>
                    void squadCommand.run(
                      'squad.captain',
                      squad.id,
                      { captain: 'none' },
                      'squad.captain',
                    )
                  }
                >
                  Detach
                </Button>
              )}
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                None{facts?.captainBenefit ? ` · With Captain: ${facts.captainBenefit.text}` : ''}
              </span>
              {running && (
                <select
                  className="native-select"
                  value=""
                  aria-label="Attach a captain"
                  disabled={squadCommand.pending}
                  onChange={e => {
                    const id = e.target.value;
                    if (!id) return;
                    void squadCommand.run(
                      'squad.captain',
                      squad.id,
                      { captain: { refKind: 'foe', id } },
                      'squad.captain',
                    );
                  }}
                >
                  <option value="">Attach…</option>
                  {eligibleCaptains.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
        {facts?.captainBenefit?.manual && (
          <p className="m-0 text-xs text-muted-foreground">
            This benefit is shown for manual play; the app applies Stamina, strike damage and strike
            edge benefits only.
          </p>
        )}
      </div>
      <div className="rule-soft flex flex-col gap-2 pb-3">
        <span className="caps text-muted-foreground">Minions</span>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
          {members.map(foe => {
            const out = facts?.participation.optedOut.includes(foe.id) ?? false;
            const alone = facts?.participation.individual.includes(foe.id) ?? false;
            return (
              <li key={foe.id} className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`cursor-pointer border-0 bg-transparent p-0 text-left font-semibold hover:underline ${foe.slain ? 'text-muted-foreground' : ''}`}
                  onClick={() => onOpenMember(foe)}
                >
                  {foe.name}
                </button>
                {foe.slain && <span className="caps text-muted-foreground">Slain</span>}
                <ConditionBadges conditions={foe.conditions} readable={false} />
                {alone && <Badge variant="outline">acted alone this turn</Badge>}
                {out && <Badge variant="outline">sitting out</Badge>}
                {running && !foe.slain && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={squadCommand.pending}
                    onClick={() =>
                      void squadCommand.run(
                        'squad.participation',
                        squad.id,
                        { member: { refKind: 'foe', id: foe.id }, participating: out },
                        'squad.participation',
                      )
                    }
                  >
                    {out ? 'Rejoin' : 'Sit out'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {running && squad.living > 0 && (
        <>
          <SquadActionBuilder
            campaignId={campaignId}
            squad={squad}
            members={members}
            roster={roster}
          />
          <FreeStrikeTogether
            campaignId={campaignId}
            squad={squad}
            members={members}
            roster={roster}
          />
        </>
      )}
      <div className="flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={squadCommand.pending}
          onClick={() => void squadCommand.run('squad.remove', squad.id, {}, 'squad.remove')}
        >
          Remove squad
        </Button>
      </div>
    </article>
  );
}
