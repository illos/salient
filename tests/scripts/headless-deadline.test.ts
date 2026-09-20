// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, expect, test, vi } from 'vitest';
import { bounded, failureCode } from '../../scripts/headless/character-client';

afterEach(() => vi.useRealTimers());

// Failure caught: exhausting the suite budget used to look like a slow individual API request,
// sending diagnosis toward backend infrastructure even when all requests completed promptly.
test('suite exhaustion is distinguished from the unchanged per-request deadline', async () => {
  vi.useFakeTimers();
  const pending = new Promise<never>(() => {});
  const request = bounded(pending).catch(failureCode);
  const suite = bounded(pending, 240_000, 'headless-deadline').catch(failureCode);
  await vi.advanceTimersByTimeAsync(15_000);
  expect(await request).toBe('request-timeout');
  expect(vi.getTimerCount()).toBe(1);
  await vi.advanceTimersByTimeAsync(225_000);
  expect(await suite).toBe('run-deadline');
  expect(vi.getTimerCount()).toBe(0);
});
