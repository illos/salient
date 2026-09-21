// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v106-beastheart-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { beastheartAbilitySource } from '../shared/evaluate/beastheartAbilities.ts';
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
test('Beastheart source witnesses preserve paired builds, skills and all manual action costs', () => {
  const seen = new Set<string>();
  for (const w of ledger.witnesses) {
    const result = evaluate(w.selections as unknown as Selections);
    assert.equal(result.status, 'complete', `${w.id} ${JSON.stringify(result.diagnostics)}`);
    const h = result.baseline!,
      e = w.expected;
    for (const key of [
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'disengage',
    ] as const)
      assert.equal(h[key].value, e[key], `${w.id} ${key}`);
    assert.deepEqual(
      Object.fromEntries(Object.entries(h.characteristics).map(([k, v]) => [k, v.value])),
      e.characteristics,
    );
    assert.deepEqual(h.skills.map(s => s.name).sort(), e.skills);
    assert.equal(h.heroicResource.name.value, 'ferocity');
    assert.ok(h.companion);
    for (const [key, value] of Object.entries(e.companion)) {
      const actual: unknown = (h.companion as unknown as Record<string, unknown>)[key];
      assert.deepEqual(
        key === 'skills' ? (actual as string[]).slice().sort() : actual,
        value,
        `${w.id} companion ${key}`,
      );
    }
    assert.deepEqual(h.companion.potency, { weak: 0, average: 1, strong: 2 });
    assert.deepEqual(
      (h.damageImmunities ?? []).map(i => ({ damageType: i.damageType, value: i.value.value })),
      e.heroImmunity ? [e.heroImmunity] : [],
    );
    assert.deepEqual(
      h.abilities
        .filter(a => a.provenance.decisionId.startsWith('class.beastheart.'))
        .map(a => a.name)
        .sort(),
      Object.keys(w.actions).sort(),
    );
    for (const [name, cost] of Object.entries(w.actions)) {
      seen.add(name);
      const ability = h.abilities.find(a => a.name === name)!;
      assert.deepEqual(
        ability.cost,
        cost ? { resource: 'ferocity', amount: cost } : undefined,
        name,
      );
      assert.match(beastheartAbilitySource(ability)!.text, /Record and resolve manually/);
      assert.ok(!ability.provenance.source.quote.includes('Record and resolve manually'), name);
    }
  }
  assert.equal(seen.size, ledger.actionCount);
});
test('companion edits prune attunement, preserve hero-only kit signature and reject higher levels', () => {
  const w = ledger.witnesses.find(w => w.expected.companion.name === 'Drake')!;
  const selections = w.selections as unknown as Selections;
  const changed = changeChoice(
    selections,
    getDefinitions(1),
    'class.beastheart.companion',
    'Bear',
  ).selections;
  assert.equal(changed['class.beastheart.drake-attunement'], undefined);
  const h = evaluate(changed).baseline!;
  assert.equal(h.companion?.name, 'Bear');
  assert.equal(h.stability.value, 1);
  assert.ok(!h.abilities.some(a => a.name.includes('Drake Breath')));
  assert.ok(h.abilities.some(a => a.name === 'Companion: Backhand'));
  assert.ok(h.abilities.some(a => a.kind === 'kit-signature'));
  assert.ok(
    !h.companion!.abilities.some(n =>
      h.abilities.some(a => a.kind === 'kit-signature' && a.name === n),
    ),
  );
  assert.notEqual(evaluate(selections, 2).status, 'complete');
  assert.notEqual(
    evaluate({ ...selections, 'class.beastheart.companion': 'Dragon' }).status,
    'complete',
  );
});
