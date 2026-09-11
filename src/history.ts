import { randomUUID } from 'node:crypto';
import { open, readFile, rename, mkdir, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { Command, GameState, Resolution, Scenario } from './contracts.ts';

export interface HistoryEntry {
  command: Command;
  requestedAt: string;
  status: 'requested' | 'completed' | 'failed';
  before: GameState;
  after: GameState;
  output?: Resolution;
  error?: string;
}
export interface Run {
  format: 'draw-steel-local-experiment-v1';
  scenario: Scenario;
  entries: HistoryEntry[];
  /** Number of entries whose recorded after-state is currently selected. */
  cursor: number;
}
export type Evaluator = (state: GameState, command: Command) => Resolution | Promise<Resolution>;
const clone = <T>(value: T): T => structuredClone(value);
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function object(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function validateState(state: unknown): asserts state is GameState {
  check(object(state), 'Invalid game state');
  check(object(state.entities) && object(state.squads) && Array.isArray(state.pending), 'Invalid state collections');
  check(Number.isInteger(state.round) && state.round >= 1 && Number.isFinite(state.malice), 'Invalid round or Malice');
  for (const [id, e] of Object.entries(state.entities)) {
    check(object(e) && e.id === id && typeof e.name === 'string', 'Invalid entity identity');
    check(['hero', 'monster'].includes(e.kind) && ['heroes', 'foes'].includes(e.side), 'Invalid entity kind');
    for (const key of ['stamina', 'maxStamina', 'temporaryStamina', 'size', 'stability', 'level']) check(Number.isFinite(e[key]), `Invalid entity ${key}`);
    check(object(e.characteristics) && ['M', 'A', 'R', 'I', 'P'].every(k => Number.isFinite(e.characteristics[k])), 'Invalid characteristics');
    check(object(e.resources) && Object.values(e.resources).every(Number.isFinite), 'Invalid resources');
    check(Array.isArray(e.abilities) && e.abilities.every((a: unknown) => typeof a === 'string') && Array.isArray(e.traits) && Array.isArray(e.conditions), 'Invalid entity lists');
    check(Array.isArray(e.meleeDamageBonus) && e.meleeDamageBonus.length === 3 && e.meleeDamageBonus.every(Number.isFinite), 'Invalid damage bonuses');
  }
  for (const [id, s] of Object.entries(state.squads)) {
    check(object(s) && s.id === id && Array.isArray(s.memberIds) && s.memberIds.every((m: string) => state.entities[m]?.squadId === id), 'Invalid squad members');
    check(['stamina', 'maxStamina', 'memberStamina'].every(k => Number.isFinite(s[k])), 'Invalid squad values');
  }
  check(state.pending.every((p: any) => object(p) && typeof p.id === 'string' && typeof p.actionId === 'string' && typeof p.text === 'string' && ['movement', 'manual'].includes(p.kind)), 'Invalid pending effects');
  check(new Set(state.pending.map((p: any) => p.id)).size === state.pending.length, 'Duplicate pending effect IDs');
}
function validateCommand(command: unknown): asserts command is Command {
  check(object(command) && typeof command.id === 'string' && command.id.trim().length > 0, 'Command requires a nonempty id');
  check(command.kind === 'manual' || command.kind === 'use-ability', 'Unknown command kind');
  if (command.kind === 'manual') check(typeof command.reason === 'string' && command.reason.trim() && Array.isArray(command.changes), 'Invalid manual command');
  else check(typeof command.actorId === 'string' && typeof command.abilityId === 'string' && Array.isArray(command.targetIds) && Array.isArray(command.roll) && object(command.facts), 'Invalid ability command');
}
export function validateRun(value: unknown): asserts value is Run {
  check(object(value) && value.format === 'draw-steel-local-experiment-v1', 'Unknown run format');
  check(object(value.scenario) && typeof value.scenario.name === 'string' && typeof value.scenario.sourceRevision === 'string' && Array.isArray(value.scenario.notes) && object(value.scenario.abilities), 'Invalid saved scenario');
  validateState(value.scenario.state);
  for (const [id, a] of Object.entries(value.scenario.abilities)) check(object(a) && a.id === id && typeof a.text === 'string' && typeof a.name === 'string' && object(a.source) && typeof a.source.path === 'string', 'Invalid saved ability');
  check(Array.isArray(value.entries) && Number.isInteger(value.cursor) && value.cursor >= 0 && value.cursor <= value.entries.length, 'Invalid history cursor');
  let previous = value.scenario.state;
  const ids = new Set<string>();
  for (const [index, entry] of value.entries.entries()) {
    check(object(entry) && ['requested', 'completed', 'failed'].includes(entry.status) && typeof entry.requestedAt === 'string', 'Invalid history entry');
    validateCommand(entry.command);
    check(!ids.has(entry.command.id), 'Duplicate command ID in saved history'); ids.add(entry.command.id);
    validateState(entry.before); validateState(entry.after);
    check(isDeepStrictEqual(entry.before, previous), 'Broken history state continuity');
    if (entry.status === 'completed') {
      check(object(entry.output) && ['resolved', 'needs-input', 'manual-required', 'rejected'].includes(entry.output.status) && Array.isArray(entry.output.effects) && Array.isArray(entry.output.messages) && Array.isArray(entry.output.unresolved), 'Invalid modifier output');
      check(isDeepStrictEqual(entry.output.state, entry.after), 'Output and recorded state disagree');
      if (entry.output.status === 'rejected') check(isDeepStrictEqual(entry.before, entry.after), 'Rejected command changed state');
    } else {
      check(entry.output === undefined && isDeepStrictEqual(entry.before, entry.after), 'Unfinished/failed entry changed state');
      if (entry.status === 'requested') check(index === value.entries.length - 1, 'Unfinished request must be last');
      if (entry.status === 'failed') check(typeof entry.error === 'string', 'Missing failure reason');
    }
    previous = entry.after;
  }
}
export function createRun(scenario: Scenario): Run {
  const run: Run = { format: 'draw-steel-local-experiment-v1', scenario: clone(scenario), entries: [], cursor: 0 };
  validateRun(run); return run;
}
export function currentState(run: Run): GameState {
  return clone(run.cursor === 0 ? run.scenario.state : run.entries[run.cursor - 1]!.after);
}
export function navigate(run: Run, delta: number): GameState {
  check(Number.isInteger(delta) && run.cursor + delta >= 0 && run.cursor + delta <= run.entries.length, 'History position out of range');
  run.cursor += delta;
  return currentState(run);
}
/** persist is awaited before evaluator runs; CLI always supplies durable persistence. */
export async function submitCommand(run: Run, command: Command, evaluator: Evaluator, options: { persist?: (run: Run) => Promise<void> } = {}): Promise<HistoryEntry> {
  validateCommand(command);
  const existing = run.entries.find(e => e.command.id === command.id);
  if (existing) {
    check(isDeepStrictEqual(existing.command, command), 'Command ID conflict: payload differs');
    return clone(existing);
  }
  check(run.cursor === run.entries.length, 'History is in the past; move forward before submitting a new action');
  check(!run.entries.some(e => e.status === 'requested'), 'An unfinished request exists; explicitly abandon it before continuing');
  const before = currentState(run);
  const entry: HistoryEntry = { command: clone(command), requestedAt: new Date().toISOString(), status: 'requested', before, after: clone(before) };
  run.entries.push(entry); run.cursor++;
  try { await options.persist?.(run); } catch (error) { run.entries.pop(); run.cursor--; throw error; }
  try {
    const output = await evaluator(clone(before), clone(command));
    const candidate = clone(run);
    Object.assign(candidate.entries.at(-1)!, { status: 'completed', output: clone(output), after: clone(output.state) });
    validateRun(candidate);
    Object.assign(entry, candidate.entries.at(-1));
  } catch (error) {
    entry.status = 'failed'; entry.error = error instanceof Error ? error.message : String(error);
  }
  await options.persist?.(run);
  return clone(entry);
}
export function abandonRequest(run: Run, id: string, reason: string): void {
  const entry = run.entries.at(-1);
  check(entry?.status === 'requested' && entry.command.id === id && reason.trim(), 'Expected last unfinished request ID and a reason');
  entry.status = 'failed'; entry.error = `Explicitly abandoned: ${reason}`;
}
export async function readRun(path: string): Promise<Run> {
  const value: unknown = JSON.parse(await readFile(path, 'utf8'));
  validateRun(value); return value;
}
/** Caller holds withRunFile lock when updating a shared file. */
export async function writeRun(path: string, run: Run): Promise<void> {
  validateRun(run);
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temp, 'wx', 0o600);
    try { await file.writeFile(JSON.stringify(run, null, 2) + '\n'); await file.sync(); } finally { await file.close(); }
    await rename(temp, path);
    const directory = await open(dirname(path), 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  } finally { await unlink(temp).catch((e: NodeJS.ErrnoException) => { if (e.code !== 'ENOENT') throw e; }); }
}
/** Fail fast on concurrent writers. A crashed process may leave a lock for explicit cleanup. */
export async function withRunFile<T>(path: string, fn: () => Promise<T>): Promise<T> {
  await mkdir(dirname(path), { recursive: true });
  const lockPath = `${path}.lock`;
  let file;
  try { file = await open(lockPath, 'wx', 0o600); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error(`Run is locked: ${lockPath}. If its process crashed, remove this lock only after confirming no writer is running.`);
    throw error;
  }
  try { await file.writeFile(JSON.stringify({ pid: process.pid })); return await fn(); }
  finally { await file.close(); await unlink(lockPath); }
}
