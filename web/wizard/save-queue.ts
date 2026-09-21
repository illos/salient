// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard's working-draft save queue (V96, after UI3's audit of 6b2c2bc).
 *
 * The wizard saves continuously while the hero is edited, so a save is often in flight when the
 * next edit lands. Three things have to hold, and a plain "am I dirty" flag gives none of them:
 *
 * 1. Saves are serialized. Two overlapping writes to one character race on `expectedRevision`,
 *    and the loser is rejected.
 * 2. An edit made while a save is in flight is still saved. The queue counts edits, records which
 *    count a completed save covered, and loops until the two agree — so it never reports clean on
 *    the strength of an older snapshot.
 * 3. A failed save leaves the work outstanding rather than swallowing it, so the next edit, the
 *    explicit save or the flush on the way out retries it.
 *
 * Pure and framework-free so the delayed-save case can be proved without a browser
 * (tests/app/wizard-save-queue.test.ts). The caller supplies `persist` on each run, reading
 * whatever the editor holds then; the queue only decides when to call it and when it is done.
 */
export interface SaveQueue {
  /** Record that the hero changed. Returns the edit's number, for callers that want to wait. */
  edit(): number;
  /**
   * Persist everything recorded so far, serializing with any save already running. `persist` is
   * supplied per call rather than held by the queue, so the caller can read the editor as it is
   * at the moment of writing without the queue closing over a stale view of it.
   */
  run(persist: () => Promise<void>): Promise<void>;
  /** Edits recorded but not yet covered by a completed save. */
  outstanding(): boolean;
}

export function createSaveQueue(): SaveQueue {
  let recorded = 0;
  let persisted = 0;
  let running: Promise<void> | null = null;
  return {
    edit() {
      recorded += 1;
      return recorded;
    },
    outstanding() {
      return persisted < recorded;
    },
    run(persist) {
      // Join the save already in flight: its loop picks up whatever has been recorded since.
      if (running) return running;
      running = (async () => {
        try {
          while (persisted < recorded) {
            // Read the counter before the write, not after: edits that land during the await
            // belong to the next pass, and must not be marked as covered by this one.
            const covered = recorded;
            await persist();
            persisted = covered;
          }
        } finally {
          running = null;
        }
      })();
      return running;
    },
  };
}
