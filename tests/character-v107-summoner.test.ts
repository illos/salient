// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v107-summoner-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { summonerAbilitySource } from '../shared/evaluate/summonerAbilities.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const evaluate = (selections: Selections, level = 1) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: ledger.compendiumRevision,
      level,
      selections,
    },
    getDefinitions(level),
  );
test('Summoner source builds preserve circle, formation, all portfolio statistics and actor-scoped manual grants', () => {
  const seen = new Set<string>(),
    minions = new Set<string>();
  for (const w of ledger.witnesses) {
    const result = evaluate(w.selections as unknown as Selections);
    assert.equal(result.status, 'complete', `${w.id} ${JSON.stringify(result.diagnostics)}`);
    const h = result.baseline!,
      e = w.expected;
    for (const k of [
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'disengage',
    ] as const)
      assert.equal(h[k].value, e[k], `${w.id} ${k}`);
    assert.deepEqual(
      Object.fromEntries(Object.entries(h.characteristics).map(([k, v]) => [k, v.value])),
      e.characteristics,
    );
    assert.deepEqual(h.skills.map(s => s.name).sort(), e.skills);
    assert.equal(h.kit, null);
    assert.equal(h.heroicResource.name.value, 'essence');
    assert.deepEqual(
      [h.potency.weak.value, h.potency.average.value, h.potency.strong.value],
      [0, 1, 2],
    );
    assert.ok(h.summoner);
    const { portfolio, provenance, ...summary } = h.summoner;
    assert.deepEqual(summary, (({ portfolio: _, ...rest }) => rest)(e.summoner));
    if (summary.formation === 'Horde')
      assert.ok(provenance.some(p => p.source.path.endsWith('horde-formation.md')));
    for (const [i, m] of portfolio.entries()) {
      minions.add(m.name);
      const { text, provenance, ...value } = m;
      assert.deepEqual(value, e.summoner.portfolio[i], `${w.id} ${m.name}`);
      assert.ok(text.length);
      assert.ok(provenance.some(p => p.source.path === m.sourcePath));
    }
    assert.ok(!h.abilities.some(a => a.kind === 'free-strike' || a.kind === 'kit-signature'));
    assert.deepEqual(
      h.abilities
        .filter(a => a.provenance.decisionId.startsWith('class.summoner.'))
        .map(a => a.name)
        .sort(),
      Object.keys(w.actions).sort(),
    );
    for (const [name, cost] of Object.entries(w.actions)) {
      seen.add(name);
      const a = h.abilities.find(a => a.name === name)!;
      assert.deepEqual(a.cost, cost ? { resource: 'essence', amount: cost } : undefined, name);
      assert.match(summonerAbilitySource(a)!.text, /Record and resolve manually/);
      assert.ok(!a.provenance.source.quote.includes('Record and resolve manually'));
    }
  }
  assert.equal(minions.size, 25);
  assert.equal(seen.size, ledger.actionCount);
});
test('circle edits prune learned minions, reject cross-circle species and do not enable level two', () => {
  const selections = ledger.witnesses[0]!.selections as unknown as Selections;
  const changed = changeChoice(
    selections,
    getDefinitions(1),
    'class.summoner.circle',
    'Graves',
  ).selections;
  assert.equal(changed['class.summoner.portfolio.blight.1'], undefined);
  assert.equal(changed['class.summoner.portfolio.blight.3'], undefined);
  const out = evaluate(changed);
  assert.equal(out.status, 'incomplete');
  assert.ok(!out.partial?.abilities?.some(a => a.name.includes('Ensnarer')));
  assert.notEqual(
    evaluate({ ...selections, 'class.summoner.portfolio.blight.1': ['Skeleton', 'Husk'] }).status,
    'complete',
  );
  assert.notEqual(evaluate(selections, 2).status, 'complete');
});
