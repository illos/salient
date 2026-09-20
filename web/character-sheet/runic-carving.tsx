// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Notice, useCommand } from '../ui';

type Rune = 'Detection' | 'Light' | 'Voice';
export function RunicCarving({ characterId }: { characterId: Id<'characters'> }) {
  const current = useQuery(api.characterRunes.current, { characterId });
  const save = useMutation(api.characterRunes.setActiveRune);
  const [choice, setChoice] = useState<Rune | ''>('');
  const [completed, setCompleted] = useState(false);
  const command = useCommand();
  if (!current) return null;
  return (
    <section aria-label="Runic Carving" className="space-y-3 rounded-md border p-4">
      <h4 className="font-semibold">Runic Carving</h4>
      <p>Active rune: {current.rune ?? 'None'}. Only this rune grants its maneuver.</p>
      <p>
        Changing or removing a rune requires 10 uninterrupted minutes. Resolve its effects from the
        source text.
      </p>
      <select
        aria-label="New rune"
        className="native-select"
        value={choice}
        disabled={!current.canEdit || command.pending}
        onChange={event => {
          setChoice(event.target.value as Rune | '');
          setCompleted(false);
        }}
      >
        <option value="">None (remove rune)</option>
        {(['Detection', 'Light', 'Voice'] as const).map(rune => (
          <option key={rune}>{rune}</option>
        ))}
      </select>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={completed}
          disabled={!current.canEdit || command.pending}
          onChange={event => setCompleted(event.target.checked)}
        />
        I completed 10 uninterrupted minutes of work.
      </label>
      {current.reason && <Notice>{current.reason}</Notice>}
      <Button
        disabled={
          !current.canEdit || !completed || command.pending || (!choice && current.rune === null)
        }
        onClick={async () => {
          const args = {
            characterId,
            rune: choice || null,
            expectedVersion: current.version,
            expectedBuildRevisionId: current.buildRevisionId,
            completedTenMinutes: completed,
          };
          const ok = await command.run(
            async commandId => {
              await save({ ...args, commandId });
            },
            JSON.stringify(['runic-carving', args]),
          );
          if (ok) setCompleted(false);
        }}
      >
        Record carving
      </Button>
    </section>
  );
}
