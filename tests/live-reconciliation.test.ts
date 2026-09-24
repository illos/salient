// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { reconciledCurrent } from '../shared/evaluate/liveReconciliation.ts';

// docs/character-wizard-spec.md#current-values-when-a-build-changes (Q-CHAR-2 revised 2026-09-24).
test('edge cases of keeping the damage taken', () => {
  // No previous maximum: no known deficit, the amount stays within the new maximum.
  assert.equal(reconciledCurrent('stamina', 25, null, 20), 20);
  assert.equal(reconciledCurrent('stamina', 15, null, 20), 15);
  // Above the old maximum: not carried above the new one.
  assert.equal(reconciledCurrent('stamina', 33, 30, 36), 36);
  // Exactly 0 stays 0; an existing negative is not pushed down; a positive stops at 1.
  assert.equal(reconciledCurrent('stamina', 0, 30, 18), 0);
  assert.equal(reconciledCurrent('stamina', 2, 30, 18), 1);
  assert.equal(reconciledCurrent('recoveries', 2, 10, 6), 0);
});
