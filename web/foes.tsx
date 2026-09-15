// SPDX-License-Identifier: GPL-3.0-only
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Button } from './components/ui/button';
import { ErrorNotice, SectionHeading, useCommand } from './ui';
import { RuleLink } from './rules/link';

function FoeReference({ sourceSnapshot }: { sourceSnapshot: string }) {
  const source = JSON.parse(sourceSnapshot) as { id: string; name: string; sourcePath: string };
  return <RuleLink id={source.id} sourcePath={source.sourcePath} label={source.name} />;
}
function FoeSource({ campaignId, foeId }: { campaignId: Id<'campaigns'>; foeId: Id<'foes'> }) {
  const source = useQuery(api.foes.detail, { campaignId, foeId });
  return source ? (
    <FoeReference sourceSnapshot={source.sourceSnapshot} />
  ) : (
    <p role="status" className="text-sm text-muted-foreground">
      Loading source…
    </p>
  );
}
function DirectorFoe({
  campaignId,
  foe,
}: {
  campaignId: Id<'campaigns'>;
  foe: { id: Id<'foes'>; name: string; visible: boolean; stamina: number; maxStamina: number };
}) {
  // Foe hiding is deferred (Q-REC-1): foes.setVisible stays in code, dormant, with no control here.
  const remove = useMutation(api.foes.remove);
  const deletion = useCommand();
  return (
    <div className="rule-soft flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <strong>{foe.name}</strong>
        <span className="text-sm">
          {foe.stamina} / {foe.maxStamina} Stamina
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FoeSource campaignId={campaignId} foeId={foe.id} />
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={deletion.pending}
          onClick={() =>
            void deletion.run(
              commandId => remove({ campaignId, foeId: foe.id, commandId }),
              JSON.stringify(['foes.remove', campaignId, foe.id]),
            )
          }
        >
          Remove
        </Button>
      </div>
      <ErrorNotice error={deletion.error} />
    </div>
  );
}
function AddFoe({ campaignId }: { campaignId: Id<'campaigns'> }) {
  // foes.setDefaultVisible stays in code, dormant (Q-REC-1): every loaded foe is shown to all roles.
  const source = useQuery(api.foes.catalog, { campaignId });
  const add = useMutation(api.foes.add);
  const addition = useCommand();
  return (
    <div className="flex flex-col gap-3">
      {source ? (
        <>
          <div className="flex items-center justify-between gap-3 border border-rule-strong bg-card px-3 py-2">
            <span className="text-sm font-bold">
              {source.name} <FoeReference sourceSnapshot={source.sourceSnapshot} />
            </span>
            <Button
              type="button"
              size="sm"
              disabled={addition.pending}
              onClick={() =>
                void addition.run(
                  commandId => add({ campaignId, definitionId: source.definitionId, commandId }),
                  JSON.stringify(['foes.add', campaignId, source.definitionId]),
                )
              }
            >
              {addition.pending ? 'Adding…' : 'Add foe'}
            </Button>
          </div>
        </>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          Loading available foe…
        </p>
      )}
      <ErrorNotice error={addition.error} />
    </div>
  );
}
export function FoesPanel({
  campaignId,
  director,
}: {
  campaignId: Id<'campaigns'>;
  director: boolean;
}) {
  const roster = useQuery(api.foes.list, { campaignId });
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading aside={roster ? `${roster.rows.length} loaded` : undefined} className="mb-0">
        Foes
      </SectionHeading>
      {!roster ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading foes…
        </p>
      ) : (
        <>
          {director && roster.director && <AddFoe campaignId={campaignId} />}
          {roster.rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {roster.director ? 'No foes loaded yet.' : 'No foes are loaded.'}
            </p>
          )}
          {roster.rows.map(foe =>
            'visible' in foe ? (
              <DirectorFoe key={foe.id} campaignId={campaignId} foe={foe} />
            ) : (
              <div className="rule-soft flex flex-col gap-2 py-3" key={foe.id}>
                <strong className="text-sm">{foe.name}</strong>
                {foe.health.mode === 'bar' ? (
                  <progress
                    aria-label={`${foe.name} Stamina`}
                    value={foe.health.fraction}
                    max={1}
                  />
                ) : foe.health.mode === 'numerical' ? (
                  <span>{foe.health.stamina} Stamina</span>
                ) : foe.health.mode === 'winded' ? (
                  <span>{foe.health.winded ? 'Winded' : 'Not winded'}</span>
                ) : null}
              </div>
            ),
          )}
          <p className="text-sm text-muted-foreground">Foes stay in this campaign until removed.</p>
        </>
      )}
    </section>
  );
}
