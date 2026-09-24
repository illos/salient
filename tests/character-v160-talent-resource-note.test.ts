// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v105-talent-expected.json' with { type: 'json' };
import ledger from './fixtures/v136-talent-three-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { TALENT_ACTIONS } from '../shared/content/classes/talent/abilities.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;

// QC1 V136 R1: feature/talent/level-1/clarity-and-strain.md gains, end-turn strain and reset are
// automatic at levels 1–6 (shared/resolve/heroicResourceGeneration.ts); cards must not say manual.
test('a level-two Talent ability card defers resource bookkeeping to the automated record', () => {
  for (const [id, w] of Object.entries(ledger.witnesses)) {
    const base = levelOne.witnesses.find(b => b.id === w.base)!;
    const selections: Selections = {
      ...(base.selections as unknown as Selections),
      'class.talent.level-2.perk': w.levelTwo.addedSelections.perk,
      [`class.talent.level-2.${w.tradition.toLowerCase()}-ability`]:
        w.levelTwo.addedSelections.traditionAbility,
    };
    const result = evaluateCharacter(
      {
        definitionsSchemaVersion: 'r01.1',
        compendiumRevision: ledger.compendiumRevision,
        level: 2,
        selections,
      },
      getDefinitions(2),
    );
    assert.equal(result.status, 'complete', id);
    for (const a of result.baseline!.abilities.filter(a =>
      a.provenance.decisionId.startsWith('class.talent.'),
    )) {
      assert.doesNotMatch(
        a.activationCondition ?? '',
        /Resource generation.*manual/,
        `${id} ${a.name}`,
      );
      assert.doesNotMatch(
        a.activationCondition ?? '',
        /end-turn negative damage and encounter reset are manual/,
        `${id} ${a.name}`,
      );
    }
    const chosen = result.baseline!.abilities.find(
      a => a.name === w.levelTwo.addedSelections.traditionAbility,
    )!;
    // Gravitic Burst has no ability-specific note, so it shows the shared fallback (QC1's repro).
    if (chosen.name === 'Gravitic Burst') {
      const note = chosen.activationCondition!;
      assert.match(note, /Clarity and Strain: Turn-End Damage/, id);
      assert.ok(TALENT_ACTIONS.some(a => a.name === 'Clarity and Strain: Turn-End Damage'));
      // The engine holds strain for Steel Ward and Force Orbs and leaves forced movement to a claim.
      assert.match(note, /Steel Ward or Force Orbs/, id);
      assert.match(note, /first forced movement/, id);
      assert.match(note, /levels 1–6 in combat/, id);
    }
  }
});
