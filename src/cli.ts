import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { loadScenario } from './content.ts';
import { parseAbility } from './parser.ts';
import { applyManual, resolveAbility } from './engine.ts';
import {
  abandonRequest,
  createRun,
  currentState,
  navigate,
  readRun,
  submitCommand,
  withRunFile,
  writeRun,
} from './history.ts';
import type { Run, HistoryEntry } from './history.ts';
import type { Command, GameState, Resolution } from './contracts.ts';

const help = `Local Draw Steel combat experiment (JSON outputs; supplied dice only)
  init RUN.json [--squad] [--force]
  state RUN.json | log RUN.json | abilities RUN.json
  ability RUN.json ABILITY_ID       Original text and recorded uses; no parsing
  parse RUN.json ABILITY_ID         Explicitly inspect current parser support
  submit RUN.json COMMAND.json      Ability or manual command
  back RUN.json [COUNT] | forward RUN.json [COUNT]
  abandon RUN.json COMMAND_ID REASON  Close a crashed/unfinished request
  demo [RUN.json] [--force]          Save a reproducible small playtest
`;
function evaluator(run: Run) {
  return (state: GameState, command: Command): Resolution => {
    if (command.kind === 'manual') return applyManual(state, command);
    const ability = run.scenario.abilities[command.abilityId];
    if (!ability) throw new Error(`Unknown ability: ${command.abilityId}`);
    return resolveAbility(state, parseAbility(ability), command);
  };
}
async function ensureNew(path: string, force: boolean): Promise<void> {
  try {
    await access(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  if (!force) throw new Error(`Run already exists: ${path}; use --force to explicitly replace it`);
}
async function act(path: string, run: Run, command: Command): Promise<HistoryEntry> {
  return submitCommand(run, command, evaluator(run), { persist: value => writeRun(path, value) });
}
export async function runCli(args: string[]): Promise<unknown> {
  const [operation, suppliedPath, ...rest] = args;
  if (!operation || operation === '--help' || operation === 'help') return help;
  if (!suppliedPath && operation !== 'demo') throw new Error(help);
  const path = resolve(
    suppliedPath && suppliedPath !== '--force'
      ? suppliedPath
      : `.playtest/demo-${randomUUID()}.json`,
  );
  if (operation === 'demo')
    return withRunFile(path, async () => {
      await ensureNew(path, args.includes('--force'));
      const run = createRun(await loadScenario());
      await writeRun(path, run);
      const results: HistoryEntry[] = [];
      results.push(
        await act(path, run, {
          kind: 'manual',
          id: 'start-turn',
          reason:
            'Table supplied the starting turn Ferocity roll of 1; start-of-turn automation is outside this experiment.',
          changes: [{ kind: 'resource', entityId: 'fury', resource: 'ferocity', value: 1 }],
        }),
      );
      results.push(
        await act(path, run, {
          kind: 'use-ability',
          id: 'goblin-strike',
          actorId: 'warrior',
          abilityId: 'warrior:spear-charge',
          targetIds: ['fury'],
          roll: [5, 5],
          facts: { targetsConfirmed: true, edges: 0, banes: 0, distances: { fury: 1 } },
        }),
      );
      results.push(
        await act(path, run, {
          kind: 'use-ability',
          id: 'fury-slam',
          actorId: 'fury',
          abilityId: 'fury:brutal-slam',
          targetIds: ['warrior'],
          roll: [5, 5],
          facts: {
            targetsConfirmed: true,
            edges: 0,
            banes: 0,
            furyFerocityPeak: 2,
            distances: { warrior: 1 },
          },
        }),
      );
      const pending = currentState(run).pending;
      if (pending.length)
        results.push(
          await act(path, run, {
            kind: 'manual',
            id: 'table-movement',
            reason:
              'For this demonstration the table confirms it enacted the requested movement, with no collision or additional triggered effects.',
            changes: [],
            completePendingIds: pending.map(p => p.id),
          }),
        );
      const beforeReopen = currentState(run);
      const reopened = await readRun(path);
      navigate(reopened, -1);
      const previous = currentState(reopened);
      navigate(reopened, 1);
      await writeRun(path, reopened);
      return {
        artifact: path,
        notes: run.scenario.notes,
        abilities: Object.fromEntries(
          ['warrior:spear-charge', 'fury:brutal-slam'].map(id => [id, run.scenario.abilities[id]]),
        ),
        results,
        historyEvidence: {
          previous,
          beforeReopen,
          restored: currentState(reopened),
          explanation:
            'Reopening and navigation read recorded snapshots. They do not invoke the evaluator or parser.',
        },
      };
    });
  if (operation === 'init')
    return withRunFile(path, async () => {
      await ensureNew(path, rest.includes('--force'));
      const run = createRun(await loadScenario({ includeSquad: rest.includes('--squad') }));
      await writeRun(path, run);
      return { artifact: path, scenario: run.scenario };
    });
  // Read-only operations do not acquire locks or rewrite files. Atomic replacement
  // makes a concurrent read see either complete recorded version.
  if (['state', 'log', 'abilities', 'ability', 'parse'].includes(operation)) {
    const run = await readRun(path);
    if (operation === 'state')
      return {
        cursor: run.cursor,
        entries: run.entries.length,
        state: currentState(run),
        unfinished: run.entries.filter(e => e.status === 'requested'),
        notes: run.scenario.notes,
      };
    if (operation === 'log') return run;
    if (operation === 'abilities')
      return Object.values(run.scenario.abilities).map(a => ({
        id: a.id,
        name: a.name,
        usage: a.usage,
        cost: a.cost,
        text: a.text,
        support:
          'Use the explicit parse command to inspect current parser support; recorded outcomes remain in the log.',
      }));
    const ability = run.scenario.abilities[rest[0] ?? ''];
    if (!ability) throw new Error('Unknown ability ID');
    if (operation === 'parse')
      return {
        warning:
          'Current parser analysis, not a replay of recorded actions or a guarantee of complete rules automation.',
        parsed: parseAbility(ability),
        notes: run.scenario.notes,
      };
    return {
      ability,
      uses: run.entries.filter(
        e => e.command.kind === 'use-ability' && e.command.abilityId === ability.id,
      ),
    };
  }
  return withRunFile(path, async () => {
    const run = await readRun(path);
    if (operation === 'submit') {
      if (!rest[0]) throw new Error('Provide a command JSON file');
      const command = JSON.parse(await readFile(rest[0], 'utf8')) as Command;
      const entry = await act(path, run, command);
      return {
        ability:
          command.kind === 'use-ability' ? run.scenario.abilities[command.abilityId] : undefined,
        entry,
        state: currentState(run),
      };
    }
    if (operation === 'back' || operation === 'forward') {
      const count = Number(rest[0] ?? 1);
      if (!Number.isInteger(count) || count < 1)
        throw new Error('Count must be a positive integer');
      const state = navigate(run, operation === 'back' ? -count : count);
      await writeRun(path, run);
      return { cursor: run.cursor, entries: run.entries.length, state };
    }
    if (operation === 'abandon') {
      abandonRequest(run, rest[0] ?? '', rest.slice(1).join(' '));
      await writeRun(path, run);
      return run.entries.at(-1);
    }
    throw new Error(`Unknown command: ${operation}\n${help}`);
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const result = await runCli(process.argv.slice(2));
    process.stdout.write(
      typeof result === 'string' ? result : JSON.stringify(result, null, 2) + '\n',
    );
  } catch (error) {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
    process.exitCode = 1;
  }
}
