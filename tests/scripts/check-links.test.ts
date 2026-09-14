// SPDX-License-Identifier: GPL-3.0-only
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { checkFile } from '../../scripts/check-links';
import { extractLinks, headingAnchors, slugify } from '../../scripts/lib/markdown';

describe('GitHub heading slugs', () => {
  test('lower-cases, drops punctuation, keeps double hyphens from removed dashes', () => {
    expect(slugify('Combat opening — confirmed for v0.01')).toBe(
      'combat-opening--confirmed-for-v001',
    );
    expect(slugify('9. Verification and acceptance')).toBe('9-verification-and-acceptance');
    expect(slugify('Rules-review workflow accepted for trial')).toBe(
      'rules-review-workflow-accepted-for-trial',
    );
    expect(slugify('Use `pnpm check` **now**')).toBe('use-pnpm-check-now');
    expect(slugify('Initiative groups (confirmed app model)')).toBe(
      'initiative-groups-confirmed-app-model',
    );
  });
  test('duplicate headings get numeric suffixes; fenced code is ignored', () => {
    const anchors = headingAnchors('# Top\n\n## Same\n\n```\n## Not a heading\n```\n\n## Same\n');
    expect([...anchors]).toEqual(['top', 'same', 'same-1']);
  });
});

describe('link extraction', () => {
  test('finds inline links and reference definitions, skips code and footnotes', () => {
    const links = extractLinks(
      'See [a](x.md#h) and `[no](code.md)`\n![img](pic.png)\n[ref]: other.md\n[^1]: footnote [b](y.md)\n```\n[c](z.md)\n```\n',
    );
    expect(links).toEqual([
      { line: 1, target: 'x.md#h' },
      { line: 2, target: 'pic.png' },
      { line: 3, target: 'other.md' },
      { line: 4, target: 'y.md' },
    ]);
  });
});

describe('check-links on a fixture tree', () => {
  let root: string;
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'salient-links-'));
    await mkdir(join(root, 'docs'));
    await writeFile(
      join(root, 'docs', 'a.md'),
      '# A\n\n## Section one\n\n[ok](b.md#b-heading) [same](#section-one) [bad](#missing) [gone](c.md) [scheme](scc.v1:x) [web](https://example.com/#x) [out](../../etc/passwd) [dir](../docs)\n',
    );
    await writeFile(join(root, 'docs', 'b.md'), '# B heading\n');
  });
  afterAll(() => rm(root, { recursive: true, force: true }));
  test('reports only the broken relative links with file, line and reason', async () => {
    const broken = await checkFile(join(root, 'docs', 'a.md'), root);
    expect(broken).toEqual([
      {
        file: 'docs/a.md',
        line: 5,
        target: '#missing',
        reason: 'no heading #missing in docs/a.md',
      },
      { file: 'docs/a.md', line: 5, target: 'c.md', reason: 'missing file docs/c.md' },
      {
        file: 'docs/a.md',
        line: 5,
        target: '../../etc/passwd',
        reason: 'points outside the repository',
      },
    ]);
  });
});
