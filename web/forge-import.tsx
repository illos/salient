// SPDX-License-Identifier: GPL-3.0-only
/**
 * Forge Steel import in the characters list (V182; docs/character-wizard-spec.md#required-import).
 * The file is read in the browser and previewed through `characterImport.previewForge`, which runs
 * the same adapter as the import without writing; Import then calls `characterImport.importForge`
 * and opens the new draft. The CLI equivalents are `pnpm character:import <file> [--dry-run]`.
 * `ImportDiagnostics` lists an imported character's diagnostics to its owner (Q-V-5 default).
 * All translation and checking happen on the server; these components only display results.
 */
import { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { ErrorNotice, Notice, errorMessage, useCommand } from './ui';

interface Diagnostic {
  path: string;
  forgeId?: string;
  name?: string;
  reason: string;
}
interface Preview {
  error: string | null;
  name: string | null;
  level: number | null;
  className: string | null;
  diagnostics: Diagnostic[];
}

/** Mirrors MAX_FORGE_PAYLOAD_BYTES; the server enforces the limit, this only avoids an upload. */
const MAX_FILE_BYTES = 512 * 1024;

function DiagnosticList({ diagnostics }: { diagnostics: Diagnostic[] }) {
  if (diagnostics.length === 0)
    return <p className="m-0 text-sm text-muted-foreground">Every choice in the file was read.</p>;
  return (
    <ul
      className="m-0 flex max-h-72 list-none flex-col gap-2 overflow-y-auto p-0"
      aria-label="Import diagnostics"
    >
      {diagnostics.map((diagnostic, index) => (
        <li key={index} className="rounded-md bg-muted px-3 py-2 text-sm">
          {diagnostic.name && <span className="font-medium">{diagnostic.name}: </span>}
          {diagnostic.reason}
          <span className="block text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {diagnostic.path}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ForgeImportCard() {
  const convex = useConvex();
  const navigate = useNavigate();
  const importForge = useMutation(api.characterImport.importForge);
  const command = useCommand();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; payload: string } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  async function choose(chosen: File) {
    setFile(null);
    setPreview(null);
    setError(null);
    if (!/\.(ds-hero|drawsteel-hero)$/.test(chosen.name)) {
      setError('Choose a .ds-hero or .drawsteel-hero file exported from Forge Steel.');
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      setError('Forge Steel hero files up to 512 KB are supported.');
      return;
    }
    setReading(true);
    try {
      const payload = await chosen.text();
      const result = await convex.query(api.characterImport.previewForge, { payload });
      setFile({ name: chosen.name, payload });
      setPreview(result);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setReading(false);
    }
  }

  async function runImport() {
    if (!file) return;
    const created: { id?: Id<'characters'> } = {};
    const done = await command.run(
      async commandId => {
        created.id = (await importForge({ commandId, payload: file.payload })).characterId;
      },
      JSON.stringify(['character.importForge', file.name, file.payload.length]),
    );
    if (done && created.id)
      void navigate({ to: '/characters/$characterId', params: { characterId: created.id } });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <h2>Import from Forge Steel</h2>
        <p className="text-base text-muted-foreground">
          Bring in a hero exported from Forge Steel as a new draft. You see what will be imported
          before anything is saved.
        </p>
        <input
          ref={input}
          type="file"
          accept=".ds-hero,.drawsteel-hero"
          aria-label="Forge Steel hero file"
          className="hidden"
          onChange={event => {
            const chosen = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (chosen) void choose(chosen);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={reading || command.pending}
          onClick={() => input.current?.click()}
        >
          {reading ? 'Reading…' : file ? 'Choose another file' : 'Choose a hero file'}
        </Button>
        <ErrorNotice error={error} />
        {preview && file && (
          <section aria-label="Import preview" className="flex flex-col gap-3">
            <div>
              <p className="m-0 text-lg font-medium">{preview.name ?? file.name}</p>
              {preview.level !== null && (
                <p className="m-0 text-sm text-muted-foreground">
                  Level {preview.level} {preview.className ?? 'hero without a class'}
                </p>
              )}
            </div>
            <ErrorNotice error={preview.error} />
            {!preview.error && (
              <>
                <p className="m-0 text-sm text-muted-foreground">
                  {preview.diagnostics.length === 0
                    ? 'Nothing needs attention.'
                    : `${preview.diagnostics.length} ${preview.diagnostics.length === 1 ? 'item needs' : 'items need'} attention after import:`}
                </p>
                <DiagnosticList diagnostics={preview.diagnostics} />
                <Button
                  type="button"
                  className="w-fit"
                  disabled={command.pending}
                  onClick={() => void runImport()}
                >
                  {command.pending ? 'Importing…' : 'Import'}
                </Button>
              </>
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}

/** The owner's view of what an import could not carry over; nothing for other viewers. */
export function ImportDiagnostics({ characterId }: { characterId: Id<'characters'> }) {
  const record = useQuery(api.characterImport.importDiagnostics, { characterId });
  if (!record) return null;
  const seed = record.liveSeed;
  return (
    <details className="mb-6 rounded-lg bg-card p-4">
      <summary className="cursor-pointer text-base">
        Imported from Forge Steel ·{' '}
        <span className="text-muted-foreground">
          {record.diagnostics.length === 0
            ? 'nothing needs attention'
            : `${record.diagnostics.length} ${record.diagnostics.length === 1 ? 'item needs' : 'items need'} attention`}
        </span>
      </summary>
      <div className="mt-4 flex flex-col gap-3">
        {seed && (
          <Notice>
            The file recorded Stamina {seed.stamina} of {seed.staminaMaximum} and Recoveries{' '}
            {seed.recoveries} of {seed.recoveriesMaximum}
            {seed.temporaryStamina > 0 && `, ${seed.temporaryStamina} temporary Stamina`}
            {seed.surges > 0 && `, ${seed.surges} surges`}. These are kept with the import and are
            not applied: joining a campaign starts at full.
          </Notice>
        )}
        <DiagnosticList diagnostics={record.diagnostics} />
      </div>
    </details>
  );
}
