// SPDX-License-Identifier: GPL-3.0-only
import { beforeAll, describe, expect, it, test } from 'vitest';
import { buildRules, plainText, renderArticle } from '../../scripts/ingest-rules';
import { createRulesSearch } from '../../web/rules/search';

import definitionsJson from '../../shared/content/fury-level-one-decisions.json';
import manifest from '../../shared/content/compendium/manifest.json';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions';
import { resolveRule, readableRuleText, type RuleReference } from '../../web/rules/reference';
import { DECISION_LABELS, decisionReference, stepReference } from '../../web/wizard/presentation';

const definitions = definitionsJson as unknown as DecisionDefinitions;

let built: ReturnType<typeof buildRules>;
beforeAll(() => {
  built = buildRules();
}, 120_000);

test('imports the complete core books with stable IDs and original-page metadata', () => {
  expect(built.catalog.entries).toHaveLength(2614);
  expect(built.catalog.entries.filter(e => e.kind === 'chapter')).toHaveLength(20);
  const classes = built.catalog.entries.filter(e => e.kind === 'class');
  expect(classes).toHaveLength(9);
  expect(classes.some(e => /summoner|beastheart/i.test(e.name))).toBe(false);
  for (const entry of built.catalog.entries) {
    expect(entry.sourceUrl).toBe(`https://steelcompendium.io/v2/scc/${entry.id}/`);
    expect(entry.sourcePath).toMatch(/^en\/books\/(heroes|monsters)\/md\//);
    expect(built.articles[entry.file].some(a => a.id === entry.id)).toBe(true);
  }
  expect(new Set(built.catalog.entries.map(e => e.id)).size).toBe(2614);
  expect(new Set(built.catalog.entries.map(e => e.path)).size).toBe(2614);
  const audit = JSON.parse(built.outputs.get('audit.json')!);
  expect(audit.unresolvedLinks).toEqual([]);
  expect(
    audit.creatureReferences.some((e: { sourcePath: string }) =>
      e.sourcePath.endsWith('/chapter/retainers.md'),
    ),
  ).toBe(true);
});

test('renders readable, sanitized prose, tables, headings and internal links', () => {
  expect(plainText('A **bold** word<br>continues.\n\n| A | B |\n|---|---|\n| 1 | 2 |')).toBe(
    'A bold word continues. A B 1 2',
  );
  const result = renderArticle(
    '# Heading {data-scc="some.id"}\n\n📏 5\n\n# Heading\n\n[Other](scc.v1:other)\n\n<script>alert(1)</script>',
    () => '/rules/heroes/other',
  );
  expect(result.html).toContain('aria-label="Distance"');
  expect(result.html).toContain('</span> 5');
  expect(result.html).toContain('href="/rules/heroes/other"');
  expect(result.html).not.toMatch(/<script|data-scc|scc.v1:/);
  expect(result.headings.map(h => h.id)).toEqual(['heading', 'heading-1']);
  const html = Object.values(built.articles)
    .flat()
    .map(a => a.html)
    .join('');
  expect(html).not.toMatch(/data-scc=|scc\.v1:|<script|onerror=/);
  expect(html).toContain('<table>');
  expect(html).toContain('<br>');
});

test('standalone pages retain source facts stored only in frontmatter', () => {
  // Values checked in the pinned per-book source: Back!, Brutal Slam, Black Ash Dart, Arcane Archer.
  const article = (id: string) =>
    Object.values(built.articles)
      .flat()
      .find(a => a.id === id)!.html;
  expect(article('mcdm.heroes.v1/feature.ability.fury.level-1/back')).toContain(
    '<strong>Cost:</strong> 3 Ferocity',
  );
  expect(article('mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam')).toContain(
    '<strong>Ability type:</strong> Signature',
  );
  expect(article('mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam')).toContain(
    '<strong>Level:</strong> 1',
  );
  const dart = built.catalog.entries.find(e => e.name === 'Black Ash Dart')!;
  expect(article(dart.id)).toContain('<strong>Echelon:</strong> 1');
  expect(article(dart.id)).toContain('<strong>Item type:</strong> Consumable');
  expect(article('mcdm.heroes.v1/kit/arcane-archer')).toContain('<strong>Kit type:</strong> Magic');
});

test('ranks every unique exact title first, supports prefixes, typos and filters', () => {
  const search = createRulesSearch(built.search);
  const names = new Map<string, string[]>();
  for (const doc of built.search)
    names.set(doc.name.toLowerCase(), [...(names.get(doc.name.toLowerCase()) ?? []), doc.id]);
  for (const [name, ids] of names)
    if (ids.length === 1) expect(search(name)[0]?.id, name).toBe(ids[0]);
  expect(search('winded')[0].id).toBe('mcdm.heroes.v1/rule.health/winded');
  expect(search('goblin warr')[0].id).toContain('goblin-warrior');
  expect(search('goblin warior')[0].id).toContain('goblin-warrior');
  const filtered = search('goblin', { book: 'monsters', category: 'monster' });
  expect(filtered.length).toBeGreaterThan(0);
  for (const result of filtered)
    expect(built.catalog.entries.find(e => e.id === result.id)?.book).toBe('monsters');
}, 120_000);

test('regenerates identical articles, metadata and search from the same pin', () => {
  expect(buildRules().outputs).toEqual(built.outputs);
}, 120_000);

function verify(reference: RuleReference) {
  const target = resolveRule(built.catalog, reference);
  expect(target, JSON.stringify(reference)).toBeDefined();
  if (target?.section) {
    const chunk = built.articles[target.entry.file];
    expect(
      chunk.find(a => a.id === target.entry.id)!.headings.map(h => h.id),
      JSON.stringify(reference),
    ).toContain(target.section);
  }
}
describe('app-wide rule references', () => {
  it('resolves every wizard step, decision, option, grant and dependent pool to core content', () => {
    for (const step of definitions.steps.filter(s => s.presentedInV001)) {
      verify(stepReference(step));
      for (const decision of step.decisions) {
        expect(DECISION_LABELS[decision.id]).toBeTruthy();
        verify(decisionReference(decision, step));
        for (const option of decision.options ?? [])
          if (option.source) verify({ sourcePath: option.source });
        for (const path of Object.values(decision.optionSources ?? {}))
          verify({ sourcePath: path });
        for (const grant of decision.grants ?? [])
          if (grant.source) verify({ sourcePath: grant.source });
        for (const pool of Object.values(decision.optionsByParent ?? {}))
          verify({ sourcePath: pool.source });
      }
    }
  });
  it('resolves every runtime source without using editable character or foe names', () => {
    for (const entry of manifest.entries) verify({ id: entry.id, sourcePath: entry.sourcePath });
    for (const name of ['spear-charge', 'bury-the-point', 'crafty'])
      verify({ id: `mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior/${name}` });
    verify({ id: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior/free-strike' });
    expect(resolveRule(built.catalog, { id: 'unknown', label: 'Goblin Warrior' })).toBeUndefined();
  });
  it('renders actionable clauses without source-link syntax or emphasis markers', () => {
    expect(
      readableRuleText(
        '**Effect:** [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)',
      ),
    ).toBe('Effect: bleeding (save ends)');
  });
});
