import { ConditionSources, type ConditionSource } from '../condition-sources';
// SPDX-License-Identifier: GPL-3.0-only
/**
 * FoeSheet: the Director's live stat block for one foe, shown by the Foes roster drill-in
 * (docs/table-spec.md#confirmed-combat-layout, 2026-09-15 user decision; Q-V21-2 proposed answer:
 * live block with controls above the readable source). Name, role / level / EV line from the
 * pinned source snapshot, the health bar with the existing Stamina Edit, condition toggles, the
 * ability list with Use and the rulebook icon (AbilityPanel, unchanged), the readable stat block
 * through the rule card, and Remove. Players never see this component: `foes.detail` is
 * Director-only on the server.
 *
 * The shared Director helpers (AdjustAction, condition controls, actor refs, roster types) live
 * here so web/table/director-pane.tsx can import them without a module cycle; director-pane
 * re-exports them under their previous names.
 */
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { FunctionReturnType } from 'convex/server';
import conditions from '../../shared/content/core-conditions.json';
import { Disc } from '../components/disc';
import { HealthBar } from '../components/health-bar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { RuleLink } from '../rules/link';
import { Loading, useCommand } from '../ui';
import { AbilityPanel } from './targeting';
import { TargetReticle } from './roster-card';
import { CoreSource } from '../components/core-content';

export type Roster = FunctionReturnType<typeof api.table.roster>;
export type Foe = Roster['foes'][number];

const CONDITION_NAMES = (conditions as { conditions: { id: string; name: string }[] }).conditions;

export function actorRef(kind: 'character' | 'foe' | 'squad', id: string) {
  return `@{${kind}:${id}}`;
}

/** Submits one slash command through the shared path; the label is the button text. */
export function QuickAction({
  campaignId,
  text,
  label,
  disabled,
}: {
  campaignId: Id<'campaigns'>;
  text: string;
  label: string;
  disabled?: boolean;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || command.pending}
        title={text}
        onClick={() =>
          void command.run(
            commandId => submit({ campaignId, text, commandId }),
            JSON.stringify(['quick', campaignId, text]),
          )
        }
      >
        {label}
      </Button>
    </span>
  );
}

/** Prompted numeric edit: the Director types a value, the page submits `/adjust <field>`. */
export function AdjustAction({
  campaignId,
  actor,
  field,
  label,
  current,
}: {
  campaignId: Id<'campaigns'>;
  actor: string | null;
  field: string;
  label: string;
  current: number | null;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={command.pending}
        onClick={() => {
          const answer = window.prompt(`${label}${current === null ? '' : ` (now ${current})`}`);
          if (answer === null || !answer.trim()) return;
          const text = `${actor ? `${actor} ` : ''}/adjust ${field} value=${answer.trim()}`;
          void command.run(
            commandId => submit({ campaignId, text, commandId }),
            JSON.stringify(['adjust', campaignId, text]),
          );
        }}
      >
        Edit
      </Button>
    </span>
  );
}

/** Active conditions as small caps badges; `readable` adds the rulebook icon (not inside a card button). */
export function ConditionBadges({
  conditions,
  readable = true,
  instances,
}: {
  conditions: Record<string, boolean>;
  readable?: boolean;
  instances?: readonly ConditionSource[];
}) {
  const active = CONDITION_NAMES.filter(c => conditions[c.id]);
  if (!active.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {active.map(c => (
        <span key={c.id} className="flex flex-col gap-1">
          <Badge variant="outline">
            {c.name}
            {readable && <RuleLink id={`mcdm.heroes.v1/condition/${c.id}`} label={c.name} />}
          </Badge>
          <ConditionSources condition={c.id} instances={instances} />
        </span>
      ))}
    </span>
  );
}

export function ConditionControls({
  campaignId,
  actor,
  conditions,
}: {
  campaignId: Id<'campaigns'>;
  actor: string;
  conditions: Record<string, boolean>;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="caps text-muted-foreground">Condition</span>
      <select
        className="native-select"
        value=""
        disabled={command.pending}
        onChange={e => {
          const id = e.target.value;
          if (!id) return;
          const verb = conditions[id] ? 'off' : 'on';
          const text = `${actor} /condition ${verb} name=${id}`;
          void command.run(
            commandId => submit({ campaignId, text, commandId }),
            JSON.stringify(['condition', campaignId, text]),
          );
        }}
      >
        <option value="">Toggle…</option>
        {CONDITION_NAMES.map(c => (
          <option key={c.id} value={c.id}>
            {conditions[c.id] ? `Remove ${c.name}` : `Apply ${c.name}`}
          </option>
        ))}
      </select>
    </label>
  );
}

type Snapshot = {
  id: string;
  name: string;
  sourcePath: string;
  text?: string;
  structured?: Record<string, unknown> | null;
};

function parseSnapshot(sourceSnapshot: string): Snapshot {
  return JSON.parse(sourceSnapshot) as Snapshot;
}

/** Printed role / level / EV facts from the pinned source frontmatter; missing facts are omitted. */
export function foeRoleLine(
  structured: Record<string, unknown> | null | undefined,
  options: { compact?: boolean } = {},
): string {
  if (!structured) return '';
  const parts: string[] = [];
  const level = structured.level;
  const organization = structured.organization;
  const role = structured.role;
  const ev = structured.ev;
  if (typeof level === 'number' || typeof level === 'string') parts.push(`Level ${level}`);
  // A roster card is 424px wide: the organization and encounter value would push the creature's
  // own name out of the row, so the card takes the short form and the stat block the full one.
  const kind = [options.compact ? undefined : organization, role]
    .filter(v => typeof v === 'string' && v)
    .join(' ');
  if (kind) parts.push(kind);
  if (!options.compact && (typeof ev === 'number' || typeof ev === 'string'))
    parts.push(`EV ${ev}`);
  return parts.join(' · ');
}

/** The rulebook link to the foe's readable stat block (the pinned source snapshot). */
export function FoeStatBlock({
  campaignId,
  foeId,
}: {
  campaignId: Id<'campaigns'>;
  foeId: Id<'foes'>;
}) {
  const detail = useQuery(api.foes.detail, { campaignId, foeId });
  if (!detail) return <Loading>Loading stat block…</Loading>;
  const source = parseSnapshot(detail.sourceSnapshot);
  return <RuleLink id={source.id} sourcePath={source.sourcePath} label={source.name} />;
}

export function FoeSheet({
  campaignId,
  foe,
  squadName,
  running,
  abilitiesAllowed,
  mayTarget,
}: {
  campaignId: Id<'campaigns'>;
  foe: Foe;
  /** V02: set for a squad minion; its Stamina is the squad's pool and it is removed with the squad. */
  squadName?: string;
  running: boolean;
  abilitiesAllowed: boolean;
  mayTarget: boolean;
}) {
  const detail = useQuery(api.foes.detail, { campaignId, foeId: foe.id });
  const remove = useMutation(api.commands.invoke);
  const deletion = useCommand();
  const actor = actorRef('foe', foe.id);
  const source = detail ? parseSnapshot(detail.sourceSnapshot) : null;
  const health = foe.health;
  return (
    <article className="flex flex-col gap-4" aria-label={`${foe.name} stat block`}>
      <header className="flex items-start gap-3">
        <Disc name={foe.name} size="md" muted={foe.slain} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className={`m-0 truncate ${foe.slain ? 'text-muted-foreground' : ''}`}>
              {foe.name}
            </h3>
            {foe.slain && <span className="caps text-muted-foreground">Slain</span>}
          </div>
          <p className="caps m-0 text-muted-foreground">
            {source ? foeRoleLine(source.structured) || 'Monster' : 'Loading source…'}
          </p>
        </div>
        {mayTarget && (
          <TargetReticle
            campaignId={campaignId}
            target={{ kind: 'foe', id: foe.id, name: foe.name }}
            className="pt-2.5"
          />
        )}
      </header>
      {squadName && (
        <p className="m-0 text-sm text-muted-foreground" data-squad-member-note>
          Minion of <strong>{squadName}</strong>: damage goes to the squad's shared pool and the
          squad card shows it; this minion leaves with its squad or when the pool drops it.
        </p>
      )}
      {health.mode === 'director' && !squadName && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <HealthBar
              value={health.stamina}
              max={health.maxStamina}
              tone="foe"
              label={`${foe.name} health`}
              className="min-w-0 flex-1"
            />
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {health.stamina} / {health.maxStamina}
            </span>
            {running && (
              <AdjustAction
                campaignId={campaignId}
                actor={actor}
                field="stamina"
                label="Stamina"
                current={health.stamina}
              />
            )}
          </div>
          <p className="caps m-0 text-muted-foreground">
            Stamina
            {health.temporaryStamina ? ` · +${health.temporaryStamina} temporary` : ''}
            {health.winded ? ' · Winded' : ''}
          </p>
        </div>
      )}
      <div className="rule-soft flex flex-col gap-2 pb-3">
        <span className="caps text-muted-foreground">Conditions</span>
        <ConditionBadges conditions={foe.conditions} instances={foe.conditionInstances} />
        {running && (
          <ConditionControls campaignId={campaignId} actor={actor} conditions={foe.conditions} />
        )}
      </div>
      {running && abilitiesAllowed && (
        <div className="flex flex-col gap-2">
          <span className="caps text-muted-foreground">Abilities</span>
          <AbilityPanel
            campaignId={campaignId}
            actor={{ kind: 'foe', id: foe.id, name: foe.name }}
            running={running}
          />
        </div>
      )}
      <div className="rule-soft flex items-center gap-2 pb-3 text-sm">
        <span className="caps text-muted-foreground">Stat block</span>
        {source ? (
          <span className="flex items-center gap-1">
            <span className="font-semibold">{source.name}</span>
            <RuleLink id={source.id} sourcePath={source.sourcePath} label={source.name} />
          </span>
        ) : (
          <Loading>Loading stat block…</Loading>
        )}
      </div>
      {source?.text && (
        <section aria-label="Printed reference">
          <CoreSource source={source.text} title={source.name} />
        </section>
      )}
      {!squadName && (
        <div className="flex flex-col items-start gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={deletion.pending}
            onClick={() =>
              void deletion.run(
                commandId =>
                  remove({
                    campaignId,
                    operation: 'foe.remove',
                    actor: { refKind: 'foe', id: foe.id },
                    arguments: {},
                    commandId,
                  }),
                JSON.stringify(['foes.remove', campaignId, foe.id]),
              )
            }
          >
            Remove
          </Button>
        </div>
      )}
    </article>
  );
}
