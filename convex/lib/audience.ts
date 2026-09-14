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
  /** A06: player undo is on for new campaigns (confirmed 2026-09-11); off keeps Director rewind/redo. */
  enableUserUndo: true,
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
  if (event.kind === 'clock.malice' && !settings.showMalice && data) {
    // A04 automatic Malice changes: the cause and step stay public; the pool values do not.
    const change = record(data.change);
    if (change)
      data.change = {
        step: change.step,
        ...(change.round === undefined ? {} : { round: change.round }),
      };
    description = description.replace(/ — .*$/, ' applied.');
  }
  if (
    (event.kind === 'ability.use' || event.kind === 'ability.correction') &&
    data &&
    settings.healthDisplay !== 'numerical'
  ) {
    // A05: damage arithmetic and winded/Slain stay public; a foe's resulting Stamina values follow
    // the health-display setting (docs/table-spec.md#monster-visibility-and-health-display).
    const strip = (application: unknown) => {
      const app = record(application);
      if (!app) return application;
      const {
        staminaBefore,
        staminaAfter,
        temporaryStaminaBefore,
        temporaryStaminaAfter,
        ...rest
      } = app;
      void staminaBefore;
      void staminaAfter;
      void temporaryStaminaBefore;
      void temporaryStaminaAfter;
      return rest;
    };
    const foeIds = new Set<string>();
    for (const item of Array.isArray(data.damage) ? data.damage : []) {
      const row = record(item);
      const target = record(row?.target);
      if (target?.kind === 'foe') foeIds.add(String(target.id));
    }
    const target = record(data.target);
    if (target?.kind === 'foe') foeIds.add(String(target.id));
    if (Array.isArray(data.damage))
      data.damage = data.damage.map(item => {
        const row = record(item);
        const t = record(row?.target);
        return row && t?.kind === 'foe' ? { ...row, application: strip(row.application) } : item;
      });
    const result = record(data.result);
    if (result && Array.isArray(result.damageApplications))
      data.result = {
        ...result,
        damageApplications: result.damageApplications.map(item => {
          const row = record(item);
          return row && foeIds.has(String(row.targetId)) ? strip(row) : item;
        }),
      };
    const correction = record(data.correction);
    if (correction && target?.kind === 'foe') {
      data.correction = { ...correction, damageAfter: strip(correction.damageAfter) };
      description = description.replace(/; [^;]* Stamina -?\d+ → -?\d+[^.]*\./, '.');
    }
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
