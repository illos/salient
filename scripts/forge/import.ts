// SPDX-License-Identifier: GPL-3.0-only
/**
 * CLI route for Forge Steel hero import (V09): `pnpm character:import <file> [--command-id <id>]`.
 * Calls the same `characterImport:importForge` mutation as the app, as the signed-in user, then
 * reads the persisted character back through `characters:get`. Prints one JSON object.
 * `--dry-run` (V182) calls the app's `characterImport:previewForge` query instead: the level, class,
 * name, diagnostics and any refusal, with nothing written.
 * Authentication follows scripts/app.ts (SALIENT_EMAIL/SALIENT_PASSWORD or SALIENT_AUTH_TOKEN).
 */
import { readFileSync } from 'node:fs';
import { makeFunctionReference } from 'convex/server';
import { loadLocalEnvironment, openAppSession, type AppSession } from '../lib/app-client.ts';

const usage =
  'Usage: pnpm character:import <file.ds-hero|file.drawsteel-hero> [--command-id <id>] [--dry-run]\n' +
  'With --dry-run the file is only previewed (level, class, name, diagnostics); nothing is written.\n' +
  'Authenticate with SALIENT_EMAIL and SALIENT_PASSWORD, or SALIENT_AUTH_TOKEN. Pass --command-id\n' +
  'to retry an earlier import exactly.';
const argv = process.argv.slice(2);
const dryRunIndex = argv.indexOf('--dry-run');
const dryRun = dryRunIndex !== -1;
if (dryRun) argv.splice(dryRunIndex, 1);
const commandIndex = argv.indexOf('--command-id');
const commandId =
  commandIndex === -1 ? crypto.randomUUID() : (argv.splice(commandIndex, 2)[1] ?? '');
const [file] = argv;
if (!file || argv.length !== 1 || !commandId || !/\.(ds-hero|drawsteel-hero)$/.test(file)) {
  console.error(usage);
  process.exit(1);
}
loadLocalEnvironment();

interface ImportResult {
  characterId: string;
  diagnostics: { path: string; forgeId?: string; name?: string; reason: string }[];
}
interface Preview {
  error: string | null;
  name: string | null;
  level: number | null;
  className: string | null;
  diagnostics: ImportResult['diagnostics'];
}
interface Character {
  id: string;
  authored: { name: string };
  revision: number;
  level: number;
  status: string;
  campaignId: string | null;
  effectiveRevisionId: string | null;
  review: unknown;
  selections: { decisionId: string; value: unknown }[];
}

let session: AppSession | undefined;
try {
  const payload = readFileSync(file, 'utf8');
  session = await openAppSession();
  if (dryRun) {
    const preview = await session.client.query(
      makeFunctionReference<'query', { payload: string }, Preview>('characterImport:previewForge'),
      { payload },
    );
    console.log(JSON.stringify({ dryRun: true, ...preview }, null, 2));
    if (preview.error) process.exitCode = 1;
  } else {
    const imported = await session.client.mutation(
      makeFunctionReference<'mutation', { commandId: string; payload: string }, ImportResult>(
        'characterImport:importForge',
      ),
      { commandId, payload },
    );
    // Evidence is the persisted draft, not the mutation response.
    const character = await session.client.query(
      makeFunctionReference<'query', { characterId: string }, Character>('characters:get'),
      { characterId: imported.characterId },
    );
    console.log(
      JSON.stringify(
        {
          commandId,
          characterId: character.id,
          name: character.authored.name,
          revision: character.revision,
          level: character.level,
          status: character.status,
          campaignId: character.campaignId,
          effectiveRevisionId: character.effectiveRevisionId,
          review: character.review,
          selections: Object.fromEntries(
            character.selections.map(selection => [selection.decisionId, selection.value]),
          ),
          diagnostics: imported.diagnostics,
        },
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Import failed.');
  process.exitCode = 1;
} finally {
  if (session) {
    try {
      await session.close();
    } catch {
      console.error(
        'Temporary CLI session cleanup failed; sign out that session before reusing this environment.',
      );
      process.exitCode = 1;
    }
  }
}
