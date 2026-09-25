// SPDX-License-Identifier: GPL-3.0-only
/**
 * V185 headless build history: the CLI (`pnpm app history|history-sheet|restore`) and the
 * `history` headless cohort list revisions, summarize a recorded revision's sheet and restore it
 * through the same public operations as the History page (docs/character-wizard-spec.md#5-progression-history).
 */
import type { BuildHistoryEntry, HistorySheet } from '../../shared/contracts/characterSheet.ts';
import { historyEntryTitle } from '../../shared/presentation/buildHistory.ts';

export interface HistoryCaller {
  query<T>(name: string, args: Record<string, unknown>): Promise<T>;
  mutation<T>(name: string, args: Record<string, unknown>): Promise<T>;
}
export interface HistoryPage {
  page: BuildHistoryEntry[];
  continueCursor: string;
  isDone: boolean;
}

/** One page of revisions, newest first, each with the History page's title. */
export async function listHistory(
  caller: HistoryCaller,
  characterId: string,
  cursor: string | null = null,
  numItems = 20,
) {
  const page = await caller.query<HistoryPage>('characters:history', {
    characterId,
    paginationOpts: { cursor, numItems },
  });
  return { ...page, page: page.page.map(entry => ({ ...entry, title: historyEntryTitle(entry) })) };
}

export function historySheet(caller: HistoryCaller, characterId: string, revisionId: string) {
  return caller.query<HistorySheet>('characters:historySheet', { characterId, revisionId });
}

/** The recorded sheet in brief: identity, maxima, granted names and the difference. */
export function sheetSummary(history: HistorySheet) {
  const build = history.sheet.build;
  const baseline = build?.baseline ?? build?.partial ?? null;
  return {
    title: historyEntryTitle(history.entry),
    entry: history.entry,
    status: build?.status ?? null,
    level: baseline?.level?.value ?? null,
    ancestry: baseline?.ancestry?.value ?? null,
    class: baseline?.class?.value ?? null,
    staminaMaximum: baseline?.staminaMaximum?.value ?? null,
    recoveriesMaximum: baseline?.recoveriesMaximum?.value ?? null,
    features: history.sheet.features.map(feature => feature.name),
    abilities: history.sheet.abilities.map(ability => ability.name),
    live: history.sheet.live
      ? { stamina: history.sheet.live.stamina, recoveries: history.sheet.live.recoveries }
      : null,
    difference: history.difference,
  };
}

/**
 * Restores a recorded revision as the owner, with the concurrency values read just before; the
 * server then submits it for review, activates it or keeps it as a private draft.
 */
export async function restoreRevision(
  caller: HistoryCaller,
  characterId: string,
  sourceRevisionId: string,
  commandId: string = crypto.randomUUID(),
) {
  const character = await caller.query<{
    revision: number;
    effectiveRevisionId: string | null;
  }>('characters:get', { characterId });
  return caller.mutation<string>('characters:restore', {
    commandId,
    characterId,
    sourceRevisionId,
    expectedRevision: character.revision,
    expectedEffectiveRevisionId: character.effectiveRevisionId,
  });
}
