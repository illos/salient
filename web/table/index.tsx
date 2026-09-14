// SPDX-License-Identifier: GPL-3.0-only
/**
 * The table: the three-pane running-session layout. Director pane (foes roster, Malice, quick
 * actions), center game log with the A01 command console, heroes pane. Every control submits a
 * registered operation as slash text through `commands.submit`; nothing here resolves a rule, and
 * what each role may see is decided by `table.roster` on the server, not by hiding fields here.
 *
 * Owning specifications: docs/table-spec.md#3-table-surfaces, #confirmed-combat-layout (the same
 * layout hosts FreePlay), #foes-roster, #party-sheets-and-resource-visibility, #game-log-and-chat-scope,
 * #malice-visibility, #monster-visibility-and-health-display, #4-session-status-and-play-mode.
 */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { FunctionReturnType } from 'convex/server';
import conditions from '../../shared/content/core-conditions.json';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { CommandConsole } from '../command-input';
import { ErrorNotice, Eyebrow, Loading, SectionHeading, useCommand } from '../ui';

type Roster = FunctionReturnType<typeof api.table.roster>;
type Foe = Roster['foes'][number];
type Hero = Roster['heroes'][number];

const CONDITION_NAMES = (conditions as { conditions: { id: string; name: string }[] }).conditions;

/** Submits one slash command through the shared path; the label is the button text. */
function QuickAction({
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
      <ErrorNotice error={command.error} />
    </span>
  );
}

/** Prompted numeric edit: the Director types a value, the page submits `/adjust <field>`. */
function AdjustAction({
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
      <ErrorNotice error={command.error} />
    </span>
  );
}

function actorRef(kind: 'character' | 'foe', id: string) {
  return `@{${kind}:${id}}`;
}

function ConditionBadges({ conditions }: { conditions: Record<string, boolean> }) {
  const active = CONDITION_NAMES.filter(c => conditions[c.id]);
  if (!active.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {active.map(c => (
        <Badge key={c.id} variant="outline">
          {c.name}
        </Badge>
      ))}
    </span>
  );
}

function ConditionControls({
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
      <ErrorNotice error={command.error} />
    </label>
  );
}

function FoeHealth({ foe }: { foe: Foe }) {
  const health = foe.health;
  switch (health.mode) {
    case 'director':
      return (
        <span className="text-sm">
          {health.stamina} / {health.maxStamina} Stamina
          {health.temporaryStamina ? ` (+${health.temporaryStamina} temporary)` : ''}
          {health.winded ? ' · Winded' : ''}
        </span>
      );
    case 'numerical':
      return <span className="text-sm">{health.stamina} Stamina</span>;
    case 'bar':
      return <progress aria-label={`${foe.name} health`} value={health.fraction} max={1} />;
    case 'winded':
      return (
        <span className="caps text-muted-foreground">
          {health.winded ? 'Winded' : 'Not winded'}
        </span>
      );
  }
}

function FoeStatBlock({ campaignId, foeId }: { campaignId: Id<'campaigns'>; foeId: Id<'foes'> }) {
  const detail = useQuery(api.foes.detail, { campaignId, foeId });
  if (!detail) return <Loading>Loading stat block…</Loading>;
  const source = JSON.parse(detail.sourceSnapshot) as { name: string; text: string };
  return (
    <pre className="mt-2 border-l-2 border-rule-strong pl-3 text-xs font-sans whitespace-pre-wrap [overflow-wrap:anywhere]">
      {source.text}
    </pre>
  );
}

function FoeRow({
  campaignId,
  foe,
  director,
  running,
}: {
  campaignId: Id<'campaigns'>;
  foe: Foe;
  director: boolean;
  running: boolean;
}) {
  const remove = useMutation(api.commands.invoke);
  const deletion = useCommand();
  const [open, setOpen] = useState(false);
  const actor = actorRef('foe', foe.id);
  return (
    <li className="rule-soft flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <strong className={foe.slain ? 'line-through' : ''}>{foe.name}</strong>
        {foe.slain && <Badge>Slain</Badge>}
        <FoeHealth foe={foe} />
      </div>
      <ConditionBadges conditions={foe.conditions} />
      {director && (
        <div className="flex flex-wrap items-center gap-2">
          {running && (
            <>
              <AdjustAction
                campaignId={campaignId}
                actor={actor}
                field="stamina"
                label="Stamina"
                current={foe.health.mode === 'director' ? foe.health.stamina : null}
              />
              <ConditionControls
                campaignId={campaignId}
                actor={actor}
                conditions={foe.conditions}
              />
            </>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(!open)}>
            {open ? 'Close stat block' : 'Stat block'}
          </Button>
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
          <ErrorNotice error={deletion.error} />
        </div>
      )}
      {open && director && <FoeStatBlock campaignId={campaignId} foeId={foe.id} />}
    </li>
  );
}

function DirectorPane({ campaignId, roster }: { campaignId: Id<'campaigns'>; roster: Roster }) {
  const director = roster.role === 'director';
  const running = roster.session?.status === 'running';
  const catalog = useQuery(api.foes.catalog, director ? { campaignId } : 'skip');
  const add = useMutation(api.commands.invoke);
  const addition = useCommand();
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <SectionHeading aside={`${roster.foes.length} loaded`} className="mb-0">
          Foes
        </SectionHeading>
        {roster.foes.length === 0 && (
          <p className="text-sm text-muted-foreground">No foes are loaded.</p>
        )}
        <ul className="m-0 list-none p-0">
          {roster.foes.map(foe => (
            <FoeRow
              key={foe.id}
              campaignId={campaignId}
              foe={foe}
              director={director}
              running={running}
            />
          ))}
        </ul>
        {director && catalog && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{catalog.name}</span>
            <Button
              type="button"
              size="sm"
              disabled={addition.pending || !running}
              onClick={() =>
                void addition.run(
                  commandId =>
                    add({
                      campaignId,
                      operation: 'foe.add',
                      arguments: { definition: catalog.definitionId },
                      commandId,
                    }),
                  JSON.stringify(['foes.add', campaignId, catalog.definitionId]),
                )
              }
            >
              Add foe
            </Button>
          </div>
        )}
        <ErrorNotice error={addition.error} />
        <div className="rule-soft border-t pt-4">
          <SectionHeading className="mb-2">Malice</SectionHeading>
          {roster.malice === null ? (
            <p className="text-sm text-muted-foreground">The Director is not showing Malice.</p>
          ) : (
            <p className="text-2xl font-bold">{roster.malice}</p>
          )}
          {director && roster.settings && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {running && (
                <AdjustAction
                  campaignId={campaignId}
                  actor={null}
                  field="malice"
                  label="Malice"
                  current={roster.malice}
                />
              )}
              <QuickAction
                campaignId={campaignId}
                text={`/campaign malice-visible state=${roster.settings.showMalice ? 'off' : 'on'}`}
                label={roster.settings.showMalice ? 'Hide Malice from players' : 'Show Malice'}
              />
            </div>
          )}
        </div>
        {director && roster.settings && (
          <div className="rule-soft border-t pt-4">
            <QuickAction
              campaignId={campaignId}
              text={`/campaign test-difficulty-visible state=${roster.settings.showTestDifficulty ? 'off' : 'on'}`}
              label={
                roster.settings.showTestDifficulty ? 'Hide test difficulty' : 'Show test difficulty'
              }
            />
            <SectionHeading className="mb-2 mt-4">Monster health display</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {(['bar', 'numerical', 'winded'] as const).map(mode => (
                <QuickAction
                  key={mode}
                  campaignId={campaignId}
                  text={`/campaign health-display mode=${mode}`}
                  label={mode}
                  disabled={roster.settings!.healthDisplay === mode}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function value(n: number | null) {
  return n === null ? '—' : String(n);
}

function HeroRow({
  campaignId,
  hero,
  director,
  running,
}: {
  campaignId: Id<'campaigns'>;
  hero: Hero;
  director: boolean;
  running: boolean;
}) {
  const actor = actorRef('character', hero.id);
  const live = hero.live;
  const full = live && 'conditions' in live ? live : null;
  const canAct = hero.controlled && running;
  const fields: [string, string, number | null][] = [
    ['stamina', 'Stamina', live?.stamina ?? null],
    ['stamina-maximum', 'Stamina maximum', full?.staminaMaximum ?? null],
    ['temporary-stamina', 'Temporary Stamina', full?.temporaryStamina ?? null],
    ['recoveries', 'Recoveries', live?.recoveries ?? null],
    ['recoveries-maximum', 'Recoveries maximum', full?.recoveriesMaximum ?? null],
    [
      'heroic-resource',
      full?.heroicResource.name ?? 'Heroic Resource',
      full?.heroicResource.current ?? null,
    ],
    ['surges', 'Surges', full?.surges ?? null],
    ['victories', 'Victories', full?.victories ?? null],
  ];
  return (
    <li className="rule-soft flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <strong>{hero.name}</strong>
        <span className="caps text-muted-foreground">{hero.ownerName}</span>
      </div>
      {live ? (
        <dl className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0.5 text-sm">
          {fields
            .filter(([field]) => full || field === 'stamina' || field === 'recoveries')
            .map(([field, label, current]) => (
              <div key={field} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="m-0">{value(current)}</dd>
                <dd className="m-0">
                  {director && running && (
                    <AdjustAction
                      campaignId={campaignId}
                      actor={actor}
                      field={field}
                      label={`${hero.name} ${label}`}
                      current={current}
                    />
                  )}
                </dd>
              </div>
            ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          No live values recorded yet; the first table action records them.
        </p>
      )}
      {full && <ConditionBadges conditions={full.conditions} />}
      {canAct && (
        <div className="flex flex-wrap items-center gap-2">
          <QuickAction
            campaignId={campaignId}
            text={`${actor} /hero recover`}
            label="Spend a Recovery"
          />
          <ConditionControls
            campaignId={campaignId}
            actor={actor}
            conditions={full?.conditions ?? {}}
          />
        </div>
      )}
      {canAct && (
        <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
          Test: <code>{`${actor} /test roll characteristic=M value=2 difficulty=medium`}</code>
        </p>
      )}
    </li>
  );
}

function HeroesPane({ campaignId, roster }: { campaignId: Id<'campaigns'>; roster: Roster }) {
  const director = roster.role === 'director';
  const running = roster.session?.status === 'running';
  const mine = roster.heroes.filter(h => h.ownerId === roster.viewerId);
  const others = roster.heroes.filter(h => h.ownerId !== roster.viewerId);
  const ordered = [...mine, ...others];
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <SectionHeading aside={`${roster.heroes.length} at the table`} className="mb-0">
          Heroes
        </SectionHeading>
        {roster.role === 'observer' && (
          <p className="text-sm text-muted-foreground">
            You are observing; the panes are read-only.
          </p>
        )}
        {ordered.length === 0 && (
          <p className="text-sm text-muted-foreground">No heroes are attached to this campaign.</p>
        )}
        <ul className="m-0 list-none p-0">
          {ordered.map(hero => (
            <HeroRow
              key={hero.id}
              campaignId={campaignId}
              hero={hero}
              director={director}
              running={running}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Verbatim source text carried by an event (a used action) or the Catch Breath reference. */
type EventSourceRecord = {
  id?: string;
  text?: string;
  note?: string;
  revision?: string;
  sourcePath?: string;
  supporting?: EventSourceRecord[];
};
function EventSource({ payload }: { payload: unknown }) {
  const source = (payload as { data?: { source?: EventSourceRecord } })?.data?.source;
  if (!source) return null;
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer text-muted-foreground">Source</summary>
      {[source, ...(source.supporting ?? [])].map((entry, index) => (
        <div key={entry.id ?? index}>
          <p className="mt-1 text-muted-foreground">{entry.id}</p>
          {entry.text && (
            <pre className="mt-1 border-l-2 border-rule-strong pl-3 font-sans whitespace-pre-wrap">
              {entry.text}
            </pre>
          )}
          {entry.sourcePath && (
            <p className="mt-1 text-muted-foreground">
              {entry.sourcePath} · {entry.revision}
            </p>
          )}
        </div>
      ))}
      {source.note && <p className="mt-1 text-muted-foreground">{source.note}</p>}
    </details>
  );
}

function boundActorName(payload: unknown): string | null {
  const envelope = (payload as { envelope?: { boundActor?: { name?: string } | null } })?.envelope;
  return envelope?.boundActor?.name ?? null;
}

function GameLog({
  campaignId,
  sessionId,
}: {
  campaignId: Id<'campaigns'>;
  sessionId?: Id<'sessions'>;
}) {
  const [before, setBefore] = useState<number | undefined>();
  const result = useQuery(api.events.list, {
    campaignId,
    ...(sessionId ? { sessionId } : {}),
    ...(before === undefined ? {} : { before }),
  });
  if (!result) return <Loading>Loading the log…</Loading>;
  return (
    <>
      {result.events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No recorded activity yet.</p>
      ) : (
        <ol className="m-0 list-none p-0">
          {result.events.map(event => {
            const actor = boundActorName(event.payload);
            return (
              <li key={event.id} className="rule-soft flex items-start gap-4 py-3 text-sm">
                <span className="w-10 shrink-0 text-xs text-muted-foreground">
                  #{event.sequence}
                </span>
                <div className="flex-1">
                  <strong>{event.description}</strong>
                  {event.dice && (
                    <small className="mt-0.5 block text-xs text-muted-foreground">
                      Dice: {event.dice.map(die => `d${die.sides}=${die.value}`).join(' ')}
                    </small>
                  )}
                  <small className="mt-0.5 block text-xs text-muted-foreground">
                    {event.actorName ?? (event.origin === 'clock' ? 'Game clock' : 'Engine')}
                    {actor ? ` as ${actor}` : ''} · {new Date(event.createdAt).toLocaleString()}
                  </small>
                  <EventSource payload={event.payload} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-4 flex items-center gap-3">
        {before !== undefined && (
          <Button variant="outline" onClick={() => setBefore(undefined)}>
            Latest activity
          </Button>
        )}
        {result.nextBefore !== null && (
          <Button variant="outline" onClick={() => setBefore(result.nextBefore!)}>
            Older activity
          </Button>
        )}
      </div>
    </>
  );
}

export function TablePage({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const roster = useQuery(api.table.roster, { campaignId });
  const campaign = useQuery(api.campaigns.get, { campaignId });
  if (!roster || !campaign) return <Loading>Opening the table…</Loading>;
  const status = roster.session?.status ?? 'none';
  return (
    <>
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId }}
        className="mb-4 inline-block text-sm text-muted-foreground"
      >
        ← {campaign.name}
      </Link>
      <div className="rule-strong mb-6 flex items-end justify-between gap-6 pb-4">
        <div>
          <Eyebrow>The table</Eyebrow>
          <h1>{campaign.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {status === 'running'
              ? 'Session running · FreePlay'
              : status === 'paused'
                ? 'Session paused · gameplay waits for the Director'
                : 'No active session · read-only'}
          </p>
        </div>
        <Badge
          variant={roster.role === 'director' ? 'default' : 'outline'}
          className="h-9 px-4 text-xs"
        >
          {roster.role === 'director'
            ? 'Director'
            : roster.role === 'player'
              ? 'Player'
              : 'Observer'}
        </Badge>
      </div>
      <div className="grid grid-cols-[340px_minmax(0,1fr)_340px] items-start gap-6">
        <DirectorPane campaignId={campaignId} roster={roster} />
        <div className="flex flex-col gap-6">
          {roster.role !== 'observer' && (
            <CommandConsole campaignId={campaignId} sessionRevision={roster.session?.revision} />
          )}
          <Card>
            <CardContent className="flex flex-col gap-3">
              <h2>Game log</h2>
              <GameLog campaignId={campaignId} sessionId={roster.session?.id} />
            </CardContent>
          </Card>
        </div>
        <HeroesPane campaignId={campaignId} roster={roster} />
      </div>
    </>
  );
}
