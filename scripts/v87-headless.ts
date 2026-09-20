// SPDX-License-Identifier: GPL-3.0-only
/** Public API proof after content:seed on this slice's isolated local backend. */
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { createActor, type ActorSession } from './headless/character-client.ts';

const target = process.env.SALIENT_V87_TARGET;
assert.equal(target, 'http://127.0.0.1:3260', 'Explicit V87 isolated target required');
const started = Date.now();
const runId = crypto.randomUUID();
const sessions: ActorSession[] = [];
const manifest = JSON.parse(readFileSync('shared/content/compendium/manifest.json', 'utf8'));
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceDirty = execFileSync(
  'git',
  ['diff', '--name-only', '--', 'convex', 'shared', 'scripts'],
  { encoding: 'utf8' },
).trim();
const deadline = setTimeout(() => {
  process.stderr.write('V87 proof deadline\n');
  process.exit(1);
}, 60_000);
try {
  const actor = await createActor(
    'foes-reader',
    runId,
    {
      url: target,
      siteUrl: 'http://127.0.0.1:3261',
      origin: 'http://127.0.0.1:5180',
      active: () => true,
    },
    session => sessions.push(session),
  );
  const status = await actor.query<{ entryCount: number; contentHash: string }>(
    'content:status',
    {},
  );
  assert.equal(status.entryCount, manifest.entryCount);
  assert.equal(status.contentHash, manifest.contentHash);
  const catalog = await actor.query<{ id: string }[]>('content:list', { kind: 'statblock' });
  assert.equal(catalog.length, 438);
  const id = 'mcdm.monsters.v1/monster.undead.1st-echelon.statblock/ghoul';
  const row = await actor.query<{
    text: string;
    features: { name: string }[];
    sourcePath: string;
    jsonPath: string;
  }>('content:get', { id });
  assert.equal(row.text, readFileSync(row.sourcePath, 'utf8'));
  assert.deepEqual(row.features, JSON.parse(readFileSync(row.jsonPath, 'utf8')).features);
  assert.ok(row.features.some(feature => feature.name === 'Razor Claws'));
  const campaignId = await actor.mutation<string>('campaigns:create', {
    name: `V87 ${runId}`,
    commandId: `${runId}-campaign`,
  });
  const definitionsStarted = Date.now();
  const definitions = await actor.query<{ definitionId: string; name: string }[]>(
    'foes:definitions',
    {
      campaignId,
    },
  );
  const definitionsMs = Date.now() - definitionsStarted;
  assert.equal(definitions.length, 438);
  assert.ok(definitions.some(entry => entry.definitionId === id));
  await actor.mutation('sessions:start', {
    campaignId,
    selectedPlayerIds: [],
    commandId: `${runId}-session`,
  });
  const blocks = JSON.parse(readFileSync('shared/content/compendium/statblock.json', 'utf8')) as {
    id: string;
    name: string;
    text: string;
    sourcePath: string;
  }[];
  const witnesses = [['Compulsion Eye', 'Xorannox the Tyract: Compulsion Eye']];
  const headingChecks: string[] = [];
  // Cover each repaired source heading through the persisted API sheet.
  for (const [name, ability] of [
    ['Angulotl Hopper', 'Leapfrog'],
    ['Gnoll Gnasher', 'Gnash'],
    ['Human Warrior', 'Chop'],
    ['The Nameless', 'Baneful Blade'],
    ['Rival Null', 'Inertial Flow'],
  ]) {
    const entry = blocks.find(
      row =>
        row.name === name &&
        (name === 'Rival Null'
          ? row.sourcePath.includes('3rd-echelon')
          : row.sourcePath.includes('retainer')),
    );
    assert.ok(entry, `Missing source ${name}`);
    const foeId = await actor.mutation<string>('foes:add', {
      campaignId,
      definitionId: entry.id,
      commandId: `${runId}-heading-${name}`,
    });
    const abilitySheet = await actor.query<{ abilities: { name: string; text: string }[] }>(
      'abilities:sheet',
      { campaignId, actor: { kind: 'foe', id: foeId, name } },
    );
    const found = abilitySheet.abilities.find(row => row.name === ability);
    assert.ok(found?.text.trim() && entry.text.includes(found.text), `${name}: ${ability}`);
    headingChecks.push(`${name}: ${ability}`);
  }
  for (const [printedName, displayName] of witnesses) {
    const entry = blocks.find(row => row.name === printedName)!;
    assert.equal(definitions.find(row => row.definitionId === entry.id)?.name, displayName);
    const foeId = await actor.mutation<string>('foes:add', {
      campaignId,
      definitionId: entry.id,
      commandId: `${runId}-eye`,
    });
    const detail = await actor.query<{ name: string; sourceSnapshot: string }>('foes:detail', {
      campaignId,
      foeId,
    });
    assert.equal(detail.name, displayName);
    assert.equal(JSON.parse(detail.sourceSnapshot).text, entry.text);
  }
  const ghoulId = await actor.mutation<string>('foes:add', {
    campaignId,
    definitionId: id,
    commandId: `${runId}-ghoul`,
  });
  const victimId = await actor.mutation<string>('foes:add', {
    campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `${runId}-victim`,
  });
  const loaded = await actor.query<{ sourceSnapshot: string }>('foes:detail', {
    campaignId,
    foeId: ghoulId,
  });
  assert.equal(JSON.parse(loaded.sourceSnapshot).text, row.text);
  const sheet = await actor.query<{ abilities: { name: string; text: string }[] }>(
    'abilities:sheet',
    { campaignId, actor: { kind: 'foe', id: ghoulId, name: 'Ghoul' } },
  );
  assert.ok(
    sheet.abilities.some(a => a.name === 'Leap' && a.text.includes('jumps up to 3 squares')),
  );
  const claws = sheet.abilities.find(a => a.name === 'Razor Claws');
  assert.ok(claws && row.text.includes(claws.text));
  const command = (text: string, suffix: string) =>
    actor.mutation<{ eventId: string }>('commands:submit', {
      campaignId,
      text,
      commandId: `${runId}-${suffix}`,
    });
  const used = await command(
    `@{foe:${ghoulId}} /ability use ability="Razor Claws" targets=[@{foe:${victimId}}]`,
    'claws',
  );
  const results = await actor.query<
    {
      execution: { mode: string };
      dice: { d10a: number; d10b: number };
      targets: { outcome: { tier: number; damage: { rolledDamage: number } } }[];
    }[]
  >('abilities:results', { campaignId, eventIds: [used.eventId] });
  const result = results[0]!;
  assert.equal(result.execution.mode, 'compiled');
  // Pinned Ghoul: Power Roll +2; tiers deal 3/4/5 flat damage. Bleeding remains manual.
  const total = result.dice.d10a + result.dice.d10b + 2;
  const tier = total <= 11 ? 1 : total <= 16 ? 2 : 3;
  const damage = [3, 4, 5][tier - 1]!;
  assert.equal(result.targets[0]!.outcome.tier, tier);
  assert.equal(result.targets[0]!.outcome.damage.rolledDamage, damage);
  const stamina = async () =>
    (
      await actor.query<{ rows: { id: string; stamina: number }[] }>('foes:list', { campaignId })
    ).rows.find(f => f.id === victimId)!.stamina;
  assert.equal(await stamina(), 15 - damage);
  await command('/history undo', 'undo');
  assert.equal(await stamina(), 15);
  await command('/history redo', 'redo');
  assert.equal(await stamina(), 15 - damage);
  const anonymous = new ConvexHttpClient(target, { logger: false });
  await assert.rejects(
    anonymous.query(makeFunctionReference<'query'>('content:get'), { id }),
    /Sign in/,
  );
  const report = {
    runId,
    source,
    sourceDirty: sourceDirty || null,
    target,
    runner: 'local Presidium',
    elapsedMs: Date.now() - started,
    contentHash: status.contentHash,
    entryCount: status.entryCount,
    statblocks: catalog.length,
    definitionsMs,
    headingChecks,
    readback: {
      id,
      textSha256: createHash('sha256').update(row.text).digest('hex'),
      features: row.features.map(f => f.name),
    },
    liveAbility: {
      name: 'Razor Claws',
      dice: result.dice,
      tier,
      damage,
      staminaAfter: await stamina(),
      undoRedo: 'pass',
    },
    checks: [
      'manifest readback',
      '438 statblocks',
      'non-goblin source exact',
      'embedded features exact',
      'anonymous denied',
      '438 table definitions',
      'five repaired source headings through persisted ability sheets',
      'parent name in picker and persisted instance; source unchanged',
      'non-goblin load and ability sheet',
      'Razor Claws compiled damage and undo/redo',
    ],
    status: 'pass',
  };
  mkdirSync('docs/build/evidence/V87', { recursive: true });
  writeFileSync('docs/build/evidence/V87/headless.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  for (const session of sessions) await session.close();
  clearTimeout(deadline);
}
