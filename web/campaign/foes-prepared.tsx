// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Foes prepared" section of the campaign home (campaign-home.png; V21 item 11): hard-rule
 * heading (Encounter Value is deferred to V06, so the heading carries no value), the add-foe
 * control as an input plus an ink square button, and the loaded foes as outline chips with the
 * rulebook icon, a `×n` count when the same stat block is loaded more than once, and a small
 * remove control for the Director. Members who are not the Director see one row per loaded foe
 * with the campaign's health display (journey.spec.ts asserts one `<name> Stamina` progressbar
 * per foe). Operations are unchanged: `foes.catalog`, `foes.add`, `foes.detail`, `foes.remove`,
 * `foes.list`, with the same payload keys web/foes.tsx uses. `foes.list` rows carry no
 * definition id, so chips group by the stat-block name the projection supplies.
 */
import { Plus, X } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { HealthBar } from '../components/health-bar';
import { Loading, SectionHeading, useCommand } from '../ui';
import { RuleLink } from '../rules/link';

function FoeReference({ sourceSnapshot }: { sourceSnapshot: string }) {
  const source = JSON.parse(sourceSnapshot) as { id: string; name: string; sourcePath: string };
  return <RuleLink id={source.id} sourcePath={source.sourcePath} label={source.name} />;
}
function FoeSource({ campaignId, foeId }: { campaignId: Id<'campaigns'>; foeId: Id<'foes'> }) {
  const source = useQuery(api.foes.detail, { campaignId, foeId });
  return source ? (
    <FoeReference sourceSnapshot={source.sourceSnapshot} />
  ) : (
    <span className="rulebook-link" aria-hidden="true" title="Loading source" />
  );
}

function AddFoe({ campaignId }: { campaignId: Id<'campaigns'> }) {
  // foes.setDefaultVisible stays dormant (Q-REC-1): every loaded foe is shown to all roles.
  const source = useQuery(api.foes.catalog, { campaignId });
  const add = useMutation(api.foes.add);
  const addition = useCommand();
  return (
    <div className="flex flex-col gap-2">
      {source ? (
        <div className="flex items-stretch gap-2">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm">
            <span className="truncate font-semibold">{source.name}</span>
            <FoeReference sourceSnapshot={source.sourceSnapshot} />
            <span className="caps ml-auto text-muted-foreground">Core</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="size-10 shrink-0"
            aria-label="Add foe"
            title={`Add ${source.name}`}
            disabled={addition.pending}
            onClick={() =>
              void addition.run(
                commandId => add({ campaignId, definitionId: source.definitionId, commandId }),
                JSON.stringify(['foes.add', campaignId, source.definitionId]),
              )
            }
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <Loading>Loading available foe…</Loading>
      )}
    </div>
  );
}

function FoeChip({
  campaignId,
  name,
  ids,
}: {
  campaignId: Id<'campaigns'>;
  name: string;
  ids: Id<'foes'>[];
}) {
  const remove = useMutation(api.foes.remove);
  const deletion = useCommand();
  const last = ids[ids.length - 1]!;
  return (
    <li className="flex flex-col gap-1" data-testid="foe-chip" data-count={ids.length}>
      <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background pr-1 pl-3 text-sm">
        <span className="font-semibold">{name}</span>
        <FoeSource campaignId={campaignId} foeId={ids[0]!} />
        <span className="text-xs text-muted-foreground" data-testid="foe-count">
          ×{ids.length}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${name}`}
          title={ids.length > 1 ? `Remove one ${name}` : `Remove ${name}`}
          disabled={deletion.pending}
          onClick={() =>
            void deletion.run(
              commandId => remove({ campaignId, foeId: last, commandId }),
              JSON.stringify(['foes.remove', campaignId, last]),
            )
          }
        >
          <X aria-hidden="true" />
        </Button>
      </span>
    </li>
  );
}

function groupByName(rows: { id: Id<'foes'>; name: string }[]) {
  const groups = new Map<string, Id<'foes'>[]>();
  for (const row of rows) groups.set(row.name, [...(groups.get(row.name) ?? []), row.id]);
  return [...groups.entries()];
}

export function FoesPrepared({
  campaignId,
  director,
}: {
  campaignId: Id<'campaigns'>;
  director: boolean;
}) {
  const roster = useQuery(api.foes.list, { campaignId });
  return (
    <section className="flex flex-col gap-3" aria-labelledby="foes-heading">
      <SectionHeading className="mb-0" aside={roster ? `${roster.rows.length} loaded` : undefined}>
        <span id="foes-heading">Foes prepared</span>
      </SectionHeading>
      {!roster ? (
        <Loading>Loading foes…</Loading>
      ) : (
        <>
          {director && roster.director && <AddFoe campaignId={campaignId} />}
          {roster.rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {roster.director ? 'No foes loaded yet.' : 'No foes are loaded.'}
            </p>
          )}
          {roster.director ? (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {groupByName(roster.rows.filter(row => 'visible' in row)).map(([name, ids]) => (
                <FoeChip key={name} campaignId={campaignId} name={name} ids={ids} />
              ))}
            </ul>
          ) : (
            <ul className="m-0 list-none p-0">
              {roster.rows.map(foe =>
                'health' in foe ? (
                  <li key={foe.id} className="rule-soft flex flex-col gap-2 py-3">
                    <span className="text-sm font-semibold">{foe.name}</span>
                    {foe.health.mode === 'bar' ? (
                      <HealthBar
                        label={`${foe.name} Stamina`}
                        value={foe.health.fraction}
                        max={1}
                        tone="foe"
                      />
                    ) : foe.health.mode === 'numerical' ? (
                      <span className="text-sm">{foe.health.stamina} Stamina</span>
                    ) : foe.health.mode === 'winded' ? (
                      <span className="text-sm">{foe.health.winded ? 'Winded' : 'Not winded'}</span>
                    ) : null}
                  </li>
                ) : null,
              )}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">Foes stay in this campaign until removed.</p>
        </>
      )}
    </section>
  );
}
