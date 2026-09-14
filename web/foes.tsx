// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Button } from './components/ui/button';
import { ErrorNotice, SectionHeading, useCommand } from './ui';

function SourceText({ sourceSnapshot }: { sourceSnapshot: string }) {
  const source = JSON.parse(sourceSnapshot) as { name: string; text: string };
  return (
    <details className="text-sm">
      <summary className="cursor-pointer py-1 text-muted-foreground">
        Read complete source: {source.name}
      </summary>
      <pre className="mt-2 border-l-2 border-rule-strong pl-3 font-sans whitespace-pre-wrap [overflow-wrap:anywhere]">
        {source.text}
      </pre>
    </details>
  );
}
function FoeSource({ campaignId, foeId }: { campaignId: Id<'campaigns'>; foeId: Id<'foes'> }) {
  const source = useQuery(api.foes.detail, { campaignId, foeId });
  return source ? (
    <SourceText sourceSnapshot={source.sourceSnapshot} />
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
  const setVisible = useMutation(api.foes.setVisible);
  const remove = useMutation(api.foes.remove);
  const visibility = useCommand();
  const deletion = useCommand();
  const [showSource, setShowSource] = useState(false);
  return (
    <div className="rule-soft flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <strong>{foe.name}</strong>
        <span className="text-sm">
          {foe.stamina} / {foe.maxStamina} Stamina
        </span>
        <span className="caps w-full text-muted-foreground">
          {foe.visible ? 'Visible to players' : 'Hidden from players'}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={visibility.pending || deletion.pending}
          onClick={() =>
            void visibility.run(
              commandId =>
                setVisible({ campaignId, foeId: foe.id, visible: !foe.visible, commandId }),
              JSON.stringify(['foes.setVisible', campaignId, foe.id, !foe.visible]),
            )
          }
        >
          {foe.visible ? 'Hide' : 'Show'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setShowSource(!showSource)}
        >
          {showSource ? 'Close source' : 'Inspect source'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={visibility.pending || deletion.pending}
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
      <ErrorNotice error={visibility.error} />
      <ErrorNotice error={deletion.error} />
      {showSource && <FoeSource campaignId={campaignId} foeId={foe.id} />}
    </div>
  );
}
function AddFoe({ campaignId, addVisible }: { campaignId: Id<'campaigns'>; addVisible: boolean }) {
  const source = useQuery(api.foes.catalog, { campaignId });
  const add = useMutation(api.foes.add);
  const setDefaultVisible = useMutation(api.foes.setDefaultVisible);
  const addition = useCommand();
  const defaults = useCommand();
  const [pendingVisibility, setPendingVisibility] = useState<boolean | null>(null);
  async function changeDefault(visible: boolean) {
    // Reflect this control's pending choice immediately; roster data remains server-owned.
    setPendingVisibility(visible);
    try {
      await defaults.run(
        commandId => setDefaultVisible({ campaignId, visible, commandId }),
        JSON.stringify(['foes.setDefaultVisible', campaignId, visible]),
      );
    } finally {
      setPendingVisibility(null);
    }
  }
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-secondary"
          checked={pendingVisibility ?? addVisible}
          disabled={pendingVisibility !== null || defaults.pending || addition.pending}
          onChange={event => void changeDefault(event.target.checked)}
        />
        Show newly added foes to players
      </label>
      <p className="text-sm text-muted-foreground">
        This campaign remembers the setting. Each foe’s visibility can also be changed individually.
      </p>
      {source ? (
        <>
          <div className="flex items-center justify-between gap-3 border border-rule-strong bg-card px-3 py-2">
            <span className="text-sm font-bold">{source.name}</span>
            <Button
              type="button"
              size="sm"
              disabled={addition.pending || defaults.pending}
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
          <SourceText sourceSnapshot={source.sourceSnapshot} />
        </>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          Loading available foe…
        </p>
      )}
      <ErrorNotice error={addition.error} />
      <ErrorNotice error={defaults.error} />
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
          {director && roster.director && (
            <AddFoe campaignId={campaignId} addVisible={roster.addVisible ?? false} />
          )}
          {roster.rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {roster.director ? 'No foes loaded yet.' : 'No foes are visible.'}
            </p>
          )}
          {roster.rows.map(foe =>
            'visible' in foe ? (
              <DirectorFoe key={foe.id} campaignId={campaignId} foe={foe} />
            ) : (
              <div className="rule-soft flex flex-col gap-2 py-3" key={foe.id}>
                <strong className="text-sm">{foe.name}</strong>
                <progress aria-label={`${foe.name} Stamina`} value={foe.healthFraction} max={1} />
              </div>
            ),
          )}
          <p className="text-sm text-muted-foreground">
            Foes stay in this campaign until removed. Combat actions are not available yet.
          </p>
        </>
      )}
    </section>
  );
}
