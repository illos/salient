// SPDX-License-Identifier: GPL-3.0-only
/** Server projections for the table and history. Stored facts stay complete for undo and the
 * Director; current campaign settings also govern historical displayed tests and health.
 * docs/table-spec.md: Malice visibility, monster visibility and health display, public tests. */
import type { Doc } from '../_generated/dataModel';
import { v } from 'convex/values';

export const DEFAULT_SETTINGS = {
  showMalice: false,
  showTestDifficulty: false,
  healthDisplay: 'bar' as const,
};
export const settingsOf = (campaign: Doc<'campaigns'>) => ({
  ...DEFAULT_SETTINGS,
  ...campaign.settings,
});

export const foeHealthValidator = v.union(
  v.object({
    mode: v.literal('director'),
    stamina: v.number(),
    maxStamina: v.number(),
    temporaryStamina: v.number(),
    winded: v.boolean(),
  }),
  v.object({ mode: v.literal('numerical'), stamina: v.number() }),
  v.object({ mode: v.literal('bar'), fraction: v.number() }),
  v.object({ mode: v.literal('winded'), winded: v.boolean() }),
);
export type FoeHealth =
  | {
      mode: 'director';
      stamina: number;
      maxStamina: number;
      temporaryStamina: number;
      winded: boolean;
    }
  | { mode: 'numerical'; stamina: number }
  | { mode: 'bar'; fraction: number }
  | { mode: 'winded'; winded: boolean };

export function projectFoeHealth(
  foe: Doc<'foes'>,
  director: boolean,
  mode: 'bar' | 'numerical' | 'winded',
): FoeHealth {
  const winded = foe.live.stamina <= Math.floor(foe.maxStamina / 2);
  if (director)
    return {
      mode: 'director',
      stamina: foe.live.stamina,
      maxStamina: foe.maxStamina,
      temporaryStamina: foe.live.temporaryStamina,
      winded,
    };
  if (mode === 'numerical') return { mode, stamina: foe.live.stamina };
  if (mode === 'bar')
    return { mode, fraction: Math.max(0, Math.min(1, foe.live.stamina / foe.maxStamina)) };
  return { mode, winded };
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Field-specific projection: public source text, dice, modifiers, total and outcome are untouched.
 * Do not recursively strip arbitrary numbers or resource words from public gameplay records. */
export function projectEvent(event: Doc<'events'>, campaign: Doc<'campaigns'>, director: boolean) {
  if (director) return { description: event.description, payload: event.payload };
  const settings = settingsOf(campaign);
  const original = record(event.payload);
  const payload = original ? { ...original } : undefined;
  if (!payload) return { description: event.description, payload: event.payload };
  const data = record(payload.data) ? { ...record(payload.data) } : undefined;
  const envelope = record(payload.envelope) ? { ...record(payload.envelope) } : undefined;
  const args = record(envelope?.arguments) ? { ...record(envelope?.arguments) } : undefined;
  if (data) payload.data = data;
  if (envelope) payload.envelope = envelope;
  if (envelope && args) envelope.arguments = args;
  let description = event.description;
  if (event.kind === 'test.roll' && !settings.showTestDifficulty) {
    const result = record(data?.result) ? { ...record(data?.result) } : undefined;
    if (data && result) data.result = result;
    const difficulty = result?.difficulty;
    if (typeof difficulty === 'string') {
      // Only the generated trailing result is private. The same words can occur in a public
      // character/skill name, so replacing the first textual match both corrupts it and leaks the result.
      const suffix = `; ${difficulty}: ${result?.outcome}.`;
      if (description.endsWith(suffix))
        description = `${description.slice(0, -suffix.length)}; ${result?.outcome}.`;
      delete result!.difficulty;
    }
    if (args) delete args.difficulty;
  }
  if (event.kind === 'manual.adjustment' && data) {
    const creature = record(data.creature);
    const hiddenMalice = data.field === 'malice' && !settings.showMalice;
    const hiddenFoeHealth =
      creature?.kind === 'foe' &&
      (data.field === 'temporary-stamina' ||
        (data.field === 'stamina' && settings.healthDisplay !== 'numerical'));
    if (hiddenMalice || hiddenFoeHealth) {
      description = description.replace(/ (?:unset|-?\d+) → -?\d+\.$/, ' adjusted.');
      delete data.before;
      delete data.after;
      if (args) delete args.value;
    }
  }
  return { description, payload };
}
