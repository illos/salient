// SPDX-License-Identifier: GPL-3.0-only
/**
 * V185 build-history wording shared by the History page and the headless CLI, so both describe a
 * recorded revision the same way (docs/character-wizard-spec.md#5-progression-history).
 */
import type { BuildHistoryEntry } from '../contracts/characterSheet.ts';

/**
 * User ruling 2026-09-25 (V189): "Let's defer restoring for now. Just make the historical copies
 * viewable." Restore is deferred and History is view-only. The History page's restore panel and
 * `pnpm app restore` stay in the code behind this switch; the server's `characters.restore`
 * mutation is unchanged. Re-enabling restore is this one line.
 */
export const BUILD_RESTORE_ENABLED = false;

/** What produced a revision: creation, an edit, a level-up, a respite kit change or a restore. */
export function historyKindLabel(
  entry: Pick<BuildHistoryEntry, 'kind' | 'restoredFromRevision'>,
): string {
  switch (entry.kind) {
    case 'creation':
      return 'Created';
    case 'full-edit':
      return 'Edited';
    case 'level-up':
      return 'Level-up';
    case 'respite-kit':
      return 'Kit changed at a respite';
    case 'restore':
      return entry.restoredFromRevision === null
        ? 'Restored'
        : `Restored from revision ${entry.restoredFromRevision}`;
  }
}

/** One line per entry: `Revision 3 · Level 2 · Level-up`. */
export function historyEntryTitle(entry: BuildHistoryEntry): string {
  return `Revision ${entry.revision} · Level ${entry.level} · ${historyKindLabel(entry)}`;
}

/**
 * What "Restore this build" does, stated before the owner confirms: the server's restore copies
 * the recorded build into a new latest revision and then applies the ordinary review rules.
 */
export function restoreOutcome(complete: boolean, attached: boolean): string {
  if (!complete)
    return 'This build is unfinished. Restoring it creates a new private draft; it is not submitted or activated. Continue its choices in Edit.';
  if (attached)
    return 'Restoring creates a new revision and submits it for Director review. Your active build changes only after approval. A Director restoring their own character is approved on submission, unless private Director setup (such as a Strange Inheritance trinket) is still needed: then the restored build is saved unsubmitted until that setup is done.';
  return 'Restoring creates a new revision and makes it your active build.';
}
