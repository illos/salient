// SPDX-License-Identifier: GPL-3.0-only
// Browser fixtures: a hero admitted through the real A02 path (create, save the hero-fixture
// selections, submit, Director approval) using the headless CLI with each account's own
// credentials, so the table sees an evaluated build and R03 live values, never a seeded row.
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';

export interface Credentials {
  email: string;
  password: string;
}

async function cli(credentials: Credentials, ...args: string[]) {
  const result = await promisify(execFile)('pnpm', ['app', ...args], {
    env: {
      ...process.env,
      SALIENT_EMAIL: credentials.email,
      SALIENT_PASSWORD: credentials.password,
    },
  });
  return JSON.parse(result.stdout);
}

/** R01 Set A (docs/hero-fixture.md) with the given name, as persisted draft selections. */
export function heroFixtureSelections(name: string) {
  const examples = JSON.parse(
    readFileSync('shared/content/character-evaluation-examples.json', 'utf8'),
  ) as { examples: { complete: { input: EvaluationInput } } };
  const definitions = JSON.parse(
    readFileSync('shared/content/fury-level-one-decisions.json', 'utf8'),
  ) as DecisionDefinitions;
  return draftSelectionsFrom(
    { ...examples.examples.complete.input.selections, 'details.name': name },
    definitions,
  );
}

/**
 * Creates `name` for `owner`, submits it to the campaign and approves it as `director` (or logs
 * it without approval when the owner is the Director). Returns the character id.
 */
export async function seedLocalHero(
  campaignId: string,
  name: string,
  owner: Credentials,
  director: Credentials,
): Promise<string> {
  const authored = { name, appearance: '', biography: '', notes: 'Private audit fixture note' };
  const characterId: string = await cli(
    owner,
    'mutation',
    'characters:create',
    JSON.stringify({ commandId: crypto.randomUUID(), authored }),
  );
  await cli(
    owner,
    'mutation',
    'characters:save',
    JSON.stringify({
      commandId: crypto.randomUUID(),
      characterId,
      expectedRevision: 1,
      authored,
      selections: heroFixtureSelections(name),
    }),
  );
  await cli(
    owner,
    'mutation',
    'characters:submit',
    JSON.stringify({ commandId: crypto.randomUUID(), characterId, campaignId }),
  );
  if (owner.email !== director.email)
    await cli(
      director,
      'mutation',
      'characters:approve',
      JSON.stringify({ commandId: crypto.randomUUID(), characterId }),
    );
  return characterId;
}
