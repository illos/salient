// SPDX-License-Identifier: GPL-3.0-only
/**
 * V96, after UI3's audit: the wizard autosaves while the hero is edited, so an edit regularly
 * lands while a save is in flight. These are the three ways that loses work, each of which the
 * first implementation allowed.
 */
import { expect, test } from 'vitest';
import { createSaveQueue } from '../../web/wizard/save-queue';

/** A persist that resolves when the test says so, recording the state it was handed. */
function controllable(state: { value: string }) {
  const calls: string[] = [];
  let release: (() => void) | undefined;
  const persist = () => {
    calls.push(state.value);
    return new Promise<void>(resolve => {
      release = () => {
        release = undefined;
        resolve();
      };
    });
  };
  return { calls, persist, finish: () => release?.() };
}

test('an edit made during a save is still saved, and the queue is not clean until it is', async () => {
  const state = { value: 'first' };
  const saver = controllable(state);
  const queue = createSaveQueue();

  queue.edit();
  const running = queue.run(saver.persist);
  await Promise.resolve();
  expect(saver.calls).toEqual(['first']);

  // The hero is edited while that save is still in flight.
  state.value = 'second';
  queue.edit();
  saver.finish();
  await Promise.resolve();
  await Promise.resolve();

  // The queue must not report clean on the strength of the older snapshot.
  expect(queue.outstanding()).toBe(true);
  expect(saver.calls).toEqual(['first', 'second']);
  saver.finish();
  await running;
  expect(queue.outstanding()).toBe(false);
});

test('overlapping runs do not start a second save', async () => {
  const state = { value: 'only' };
  const saver = controllable(state);
  const queue = createSaveQueue();
  queue.edit();
  const first = queue.run(saver.persist);
  const second = queue.run(saver.persist);
  expect(second).toBe(first);
  await Promise.resolve();
  expect(saver.calls).toEqual(['only']);
  saver.finish();
  await first;
});

test('a failed save leaves the work outstanding for the next attempt', async () => {
  let attempts = 0;
  const persist = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('offline');
  };
  const queue = createSaveQueue();
  queue.edit();
  await expect(queue.run(persist)).rejects.toThrow('offline');
  expect(queue.outstanding()).toBe(true);
  await queue.run(persist);
  expect(attempts).toBe(2);
  expect(queue.outstanding()).toBe(false);
});
