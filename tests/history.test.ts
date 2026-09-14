import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  abandonRequest,
  createRun,
  currentState,
  navigate,
  readRun,
  submitCommand,
  withRunFile,
  writeRun,
} from '../src/history.ts';
import type { ManualCommand, Resolution, Scenario } from '../src/contracts.ts';

const scenario: Scenario = {
  name: 'history-only fixture',
  sourceRevision: 'test',
  notes: [],
  abilities: {},
  state: { entities: {}, squads: {}, pending: [], round: 1, malice: 0 },
};
const command: ManualCommand = {
  kind: 'manual',
  id: 'one',
  reason: 'Test history storage independently of rules',
  changes: [{ kind: 'malice', value: 3 }],
};
test('input is durable before evaluation; navigation and reopening never evaluate; dedupe and future protection', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-history-'));
  const path = join(dir, 'run.json');
  let calls = 0;
  try {
    const run = createRun(scenario);
    await withRunFile(path, async () => {
      await writeRun(path, run);
      const evaluate = async (state: Scenario['state']): Promise<Resolution> => {
        calls++;
        const saved = await readRun(path);
        assert.equal(saved.entries[0]!.status, 'requested');
        assert.deepEqual(saved.entries[0]!.command, command);
        assert.equal(currentState(saved).malice, 0);
        state.malice = 3;
        return {
          status: 'resolved',
          state,
          effects: [{ kind: 'malice', before: 0, after: 3, text: 'Recorded manual change' }],
          messages: [],
          unresolved: [],
        };
      };
      await submitCommand(run, command, evaluate, { persist: r => writeRun(path, r) });
      await submitCommand(run, structuredClone(command), evaluate);
      assert.equal(calls, 1);
      await assert.rejects(
        submitCommand(run, { ...command, reason: 'Different' }, evaluate),
        /conflict/,
      );
      const reopened = await readRun(path);
      assert.equal(currentState(reopened).malice, 3);
      assert.equal(navigate(reopened, -1).malice, 0);
      await assert.rejects(submitCommand(reopened, { ...command, id: 'two' }, evaluate), /past/);
      await writeRun(path, reopened);
      const past = await readRun(path);
      assert.equal(currentState(past).malice, 0);
      assert.equal(navigate(past, 1).malice, 3);
      assert.equal(calls, 1);
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('failed modifier and interrupted request are explicit and never rerun on reopen', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-history-'));
  const path = join(dir, 'run.json');
  try {
    const run = createRun(scenario);
    const failed = await submitCommand(run, command, () => {
      throw new Error('Example failure');
    });
    assert.equal(failed.status, 'failed');
    assert.match(failed.error!, /Example failure/);
    assert.equal(currentState(run).malice, 0);
    const pending = createRun(scenario);
    pending.entries.push({
      command,
      status: 'requested',
      requestedAt: new Date().toISOString(),
      before: scenario.state,
      after: scenario.state,
    });
    pending.cursor = 1;
    await writeRun(path, pending);
    const reopened = await readRun(path);
    let calls = 0;
    const unreachable = (): Resolution => {
      calls++;
      throw new Error('Must not execute');
    };
    assert.equal((await submitCommand(reopened, command, unreachable)).status, 'requested');
    await assert.rejects(
      submitCommand(reopened, { ...command, id: 'two' }, unreachable),
      /unfinished/,
    );
    assert.equal(calls, 0);
    abandonRequest(reopened, 'one', 'Confirmed worker exited before writing a result');
    await writeRun(path, reopened);
    assert.equal((await readRun(path)).entries[0]!.status, 'failed');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('reject corrupt history and concurrent writers; failed pre-save never invokes modifier', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-history-'));
  const path = join(dir, 'run.json');
  try {
    const run = createRun(scenario);
    let calls = 0;
    await assert.rejects(
      submitCommand(
        run,
        command,
        () => {
          calls++;
          throw new Error('Never called');
        },
        {
          persist: async () => {
            throw new Error('Disk full');
          },
        },
      ),
      /Disk full/,
    );
    assert.equal(calls, 0);
    assert.equal(run.cursor, 0);
    assert.equal(run.entries.length, 0);
    await withRunFile(path, async () => {
      await assert.rejects(
        withRunFile(path, async () => {}),
        /locked/,
      );
    });
    await writeRun(path, run);
    await writeFile(path, JSON.stringify({ ...run, cursor: 2 }));
    await assert.rejects(readRun(path), /cursor/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
