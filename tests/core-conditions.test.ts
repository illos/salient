import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// R05 acceptance check 1: every entry in shared/content/core-conditions.json cites a source file that
// exists in the pinned Compendium and carries that file's effect text verbatim. Expected values come
// from the source files, not from application code. Source: docs/build/R05-conditions-clock-malice.md.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

interface CoreCondition {
  id: string;
  name: string;
  scc: string;
  sourcePath: string;
  saveEndsDefault: boolean;
  text: string;
}
interface CoreConditionsFile {
  compendiumRevision: string;
  conditions: CoreCondition[];
}

const file = JSON.parse(
  readFileSync(join(root, 'shared/content/core-conditions.json'), 'utf8'),
) as CoreConditionsFile;

// The Condition Index in the pinned Compendium lists exactly these nine entries
// (vendor/steel-compendium/en/unified/md/_index/condition.md, "Total: 9").
const expectedIds = [
  'bleeding',
  'dazed',
  'frightened',
  'grabbed',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
];

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  assert.ok(match, 'source file has YAML frontmatter');
  return { frontmatter: match[1], body: match[2] };
}

test('the JSON lists exactly the nine conditions in the Compendium condition index', () => {
  assert.deepEqual(
    file.conditions.map(c => c.id),
    expectedIds,
  );
  const index = readFileSync(
    join(root, 'vendor/steel-compendium/en/unified/md/_index/condition.md'),
    'utf8',
  );
  assert.match(index, /^Total: 9$/m);
  for (const c of file.conditions)
    assert.ok(index.includes(`(../condition/${c.id}.md)`), `index links ${c.id}`);
});

test('the JSON records the pinned Compendium revision', () => {
  assert.equal(file.compendiumRevision, 'fb83a789da8f0327a389c277a0c790b1648d5810');
});

for (const condition of file.conditions) {
  test(`${condition.id}: cited source exists and its effect text matches verbatim`, () => {
    const path = join(root, condition.sourcePath);
    assert.ok(existsSync(path), `source file exists: ${condition.sourcePath}`);
    const { frontmatter, body } = splitFrontmatter(readFileSync(path, 'utf8'));
    assert.ok(
      frontmatter.includes(`name: ${condition.name}`),
      'name matches the source frontmatter',
    );
    assert.ok(
      frontmatter.includes(`scc: ${condition.scc}`),
      'scc id matches the source frontmatter',
    );
    assert.ok(frontmatter.includes('type: condition'), 'source entry is a condition');
    assert.ok(body.includes(condition.text), 'verbatim text is found in the source body');
    assert.equal(condition.text, body.trim(), 'text is the complete source body, not an excerpt');
    assert.equal(
      condition.saveEndsDefault,
      false,
      'no condition entry defines a save-ends default',
    );
    assert.ok(!/\(save ends\)/i.test(body), 'source body itself contains no "(save ends)" clause');
  });
}
