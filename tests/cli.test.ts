import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runCli } from '../src/cli.ts';
import { currentState, readRun } from '../src/history.ts';

test('CLI persists a real demo, exposes source and applied changes, and restores snapshots', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-cli-'));
  const path = join(dir, 'demo.json');
  try {
    await runCli(['demo', path]);
    const run = await readRun(path);
    assert.equal(run.entries.length, 4);
    assert.ok(run.entries.every(e => e.status === 'completed'));
    // Independently checked fixture arithmetic: Warrior tier 2 damage 4;
    // Brutal Slam roll 10+M2 gives tier 2, damage 6+M2 = 8.
    const state = currentState(run);
    assert.equal(state.entities.fury!.stamina, 26);
    assert.equal(state.entities.fury!.resources.ferocity, 2);
    assert.equal(state.entities.warrior!.stamina, 7);
    assert.equal(state.pending.length, 0);
    const slam = run.entries[2]!;
    assert.equal(slam.output!.status, 'needs-input');
    assert.ok(slam.after.pending.some(p => p.kind === 'movement'));
    assert.match(run.scenario.abilities['fury:brutal-slam']!.text, /Brutal Slam/);
    await runCli(['back', path]);
    assert.ok(currentState(await readRun(path)).pending.length > 0);
    // A fresh process reads this artifact without loading source content.
    const read = spawnSync(process.execPath, [join(process.cwd(), 'src/cli.ts'), 'state', path], {
      cwd: dir,
      encoding: 'utf8',
    });
    assert.equal(read.status, 0, read.stderr);
    assert.ok(JSON.parse(read.stdout).state.pending.length > 0);
    await runCli(['forward', path]);
    assert.deepEqual(currentState(await readRun(path)), state);
    const before = await readFile(path, 'utf8');
    await assert.rejects(runCli(['init', path]), /already exists/);
    await assert.rejects(runCli(['demo', path]), /already exists/);
    assert.equal(await readFile(path, 'utf8'), before);
    const cmd = join(dir, 'correction.json');
    await writeFile(
      cmd,
      JSON.stringify({
        kind: 'manual',
        id: 'correct-stamina',
        reason: 'Table correction example; preserve the already used first-damage trigger',
        changes: [
          { kind: 'stamina', entityId: 'fury', value: 25 },
          { kind: 'fury-triggers', entityId: 'fury', firstDamageRound: 1, windedTriggered: false },
        ],
      }),
    );
    await runCli(['submit', path, cmd]);
    assert.equal(currentState(await readRun(path)).entities.fury!.stamina, 25);
    await runCli(['back', path]);
    assert.equal(currentState(await readRun(path)).entities.fury!.stamina, 26);
    await runCli(['forward', path]);
    assert.equal(currentState(await readRun(path)).entities.fury!.stamina, 25);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
