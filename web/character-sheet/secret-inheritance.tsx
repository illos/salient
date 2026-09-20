// SPDX-License-Identifier: GPL-3.0-only
/** This control reads a Director-only endpoint; public character payloads contain no secret item. */
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import {
  COMPLICATION_ITEM_SOURCES,
  SECOND_ECHELON_TRINKETS,
} from '../../shared/content/supporting-complications';
import { Button } from '../components/ui/button';
import { SelectedRuleSource } from '../wizard/supporting-components';
import { Loading, Notice, useCommand } from '../ui';

type Inheritance = NonNullable<FunctionReturnType<typeof api.characterSecrets.inheritance>>;

function InheritanceEditor({
  characterId,
  inheritance,
}: {
  characterId: Id<'characters'>;
  inheritance: Inheritance;
}) {
  const [base] = useState({
    campaignId: inheritance.campaignId,
    revision: inheritance.characterRevision,
    build: inheritance.buildRevisionId,
    view: inheritance.view,
  });
  const [version, setVersion] = useState(inheritance.version);
  const [name, setName] = useState(inheritance.item?.name ?? '');
  const [saved, setSaved] = useState(false);
  const save = useMutation(api.characterSecrets.saveInheritance);
  const command = useCommand();
  const stale =
    base.campaignId !== inheritance.campaignId ||
    base.revision !== inheritance.characterRevision ||
    base.build !== inheritance.buildRevisionId ||
    inheritance.version > version;
  return (
    <section
      className="mt-4 space-y-3 rounded-md bg-muted p-4 text-base"
      aria-label="Private inheritance"
    >
      <h4 className="m-0 text-base font-medium">Strange Inheritance · Director only</h4>
      <p className="m-0 text-base">
        Privately choose one second-echelon trinket. The hero’s build and shared history do not
        reveal its identity or powers.
      </p>
      <p className="m-0 text-base">
        Editing the {inheritance.view} build, revision {inheritance.buildRevision}.
      </p>
      {inheritance.view === 'draft' && (
        <p className="m-0 text-base">
          Save this private setup before submitting your own hero to the campaign you direct.
        </p>
      )}
      <select
        aria-label="Private inherited trinket"
        className="native-select max-w-full bg-placeholder"
        value={name}
        disabled={command.pending || stale || inheritance.combatLocked}
        onChange={event => {
          setName(event.target.value);
          setSaved(false);
        }}
      >
        <option value="">Choose a trinket…</option>
        {SECOND_ECHELON_TRINKETS.map(item => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {stale && (
        <Notice className="bg-placeholder">
          The character or private choice changed. Reload this page before saving.
        </Notice>
      )}
      {inheritance.combatLocked && (
        <Notice className="bg-placeholder">Character choices are locked during combat.</Notice>
      )}
      <Button
        disabled={!name || stale || inheritance.combatLocked || command.pending}
        onClick={async () => {
          const args = {
            characterId,
            itemName: name,
            expectedCampaignId: base.campaignId,
            expectedCharacterRevision: base.revision,
            expectedBuildRevisionId: base.build,
            expectedVersion: version,
            expectedView: base.view,
          };
          const ok = await command.run(
            async commandId => {
              setVersion(await save({ ...args, commandId }));
            },
            JSON.stringify(['private-inheritance', args]),
          );
          if (ok) setSaved(true);
        }}
      >
        Save private inheritance
      </Button>
      {saved && (
        <p role="status" className="text-base">
          Private inheritance saved.
        </p>
      )}
      {name && COMPLICATION_ITEM_SOURCES[name] && (
        <SelectedRuleSource sourcePath={COMPLICATION_ITEM_SOURCES[name]!} name={name} />
      )}
    </section>
  );
}

export function SecretInheritance({
  characterId,
  view,
  displayedRevision,
  campaignId,
}: {
  characterId: Id<'characters'>;
} & (
  | { view: 'effective' | 'proposed'; displayedRevision: number; campaignId?: never }
  | { view: 'draft'; displayedRevision?: never; campaignId: Id<'campaigns'> }
)) {
  const inheritance = useQuery(api.characterSecrets.inheritance, {
    characterId,
    view,
    displayedRevision,
    campaignId,
  });
  if (inheritance === undefined) return <Loading>Loading Director choices…</Loading>;
  if (!inheritance) return null;
  return (
    <InheritanceEditor
      key={`${characterId}:${view}:${campaignId ?? ''}`}
      characterId={characterId}
      inheritance={inheritance}
    />
  );
}
