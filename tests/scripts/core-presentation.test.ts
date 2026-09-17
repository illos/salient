// SPDX-License-Identifier: GPL-3.0-only
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  embeddedAbility,
  presentSourceHtml,
  renderSource,
} from '../../shared/presentation/content';
import { CoreSource, SourceHtml } from '../../web/components/core-content';
import { abilitySource } from '../../shared/presentation/ability';
import { renderArticle } from '../../scripts/ingest-rules';
import catalog from '../../shared/content/foes/catalog.json';
import type { SheetAbility } from '../../shared/contracts/characterSheet';
const revision = 'fb83a789da8f0327a389c277a0c790b1648d5810';
function source(path: string) {
  return execFileSync('git', ['show', `${revision}:en/books/${path}`], {
    cwd: 'vendor/steel-compendium',
    encoding: 'utf8',
  });
}
describe('shared production source presentation', () => {
  it('preserves full Core monster text, special ordering, metadata, stable anchors and real links', () => {
    const raw = source('monsters/md/monster/demon/2nd-echelon/statblock/bale-eye.md');
    const rendered = renderSource(raw);
    expect(rendered).toContain('class="ds-stats"');
    expect(rendered).toContain('class="ds-characteristics"');
    expect(rendered).toContain('class="ds-ability-metadata"');
    expect(rendered).toContain('class="ds-tiers"');
    expect(rendered).toContain('aria-label="Agility less than 2"');
    expect(rendered).toContain('aria-label="Might"');
    const special = rendered.slice(rendered.indexOf('Demonwarp Tears'));
    expect(special.indexOf('Special')).toBeLessThan(special.indexOf('Power Roll'));
    const article = renderArticle(raw.replace(/^---\n[\s\S]*?\n---\n/, ''), url =>
      url.replace('scc.v1:', '/rules/'),
    );
    expect(article.headings.some(h => h.id === 'demonwarp-tears')).toBe(true);
    expect(article.html).toContain('id="demonwarp-tears"');
    expect(rendered).not.toContain('scc.v1:');
    expect(renderToStaticMarkup(createElement(CoreSource, { source: raw }))).toContain(rendered);
  });
  it('projects all immutable Foe edition objects without editing their source HTML', () => {
    const original = JSON.stringify(catalog);
    for (const object of catalog.objects) {
      const html = presentSourceHtml(object.html);
      if (object.kind === 'statblock') expect(html, object.name).toContain('class="ds-stats"');
      if (object.kind === 'ability') expect(html, object.name).toContain('role="img"');
      expect(renderToStaticMarkup(createElement(SourceHtml, { html: object.html }))).toContain(
        html,
      );
    }
    expect(JSON.stringify(catalog)).toBe(original);
  });
  it('renders nested hero tiers and embedded kit sources without truncating effects', () => {
    const raw = source('heroes/md/feature/ability/time-raider/concussive-slam.md');
    const html = renderSource(raw);
    expect(html.match(/aria-label="Reason"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Might less than strong"');
    expect(html).toContain('aria-label="Target"');
    const kit = source('heroes/md/kit/mountain.md');
    const selected = embeddedAbility(kit, 'Pain for Pain');
    expect(selected).toContain('13 + M or A damage');
    expect(selected).not.toContain('Kit Bonuses');
    const ability = {
      name: 'Pain for Pain',
      content: { name: 'Mountain', text: kit },
    } as SheetAbility;
    expect(abilitySource(ability)).toBe(selected);
    expect(renderSource(selected!)).toContain('aria-label="Agility"');
    expect(embeddedAbility(kit, 'unknown')).toBeUndefined();
  });
  it('keeps unknown tables, prose pronouns, code and URL bytes; sanitizes before adding semantics', () => {
    const html = renderSource(
      'I move. A < 0. I < 2.\n\n`A < 2`\n\n[A < 2](https://example.com/A%20%3C%202)\n\n<script>alert(1)</script>\n\n<span class="ds-symbol" role="img" aria-label="spoof" onclick="bad()">A < 3</span>\n\n| Other | Data |\n|---|---|\n| 1 | 2 |',
    );
    expect(html).toContain('I move.');
    expect(html).toContain('aria-label="Agility less than 0"');
    expect(html).toContain('aria-label="Intuition less than 2"');
    expect(html).toContain('<code>A &#x3C; 2</code>');
    expect(html).toContain('href="https://example.com/A%20%3C%202"');
    expect(html).not.toMatch(/script|onclick|spoof/);
    expect(html).toContain('<table>');
  });
});

it('covers every Core glyph family through the production projection and React semantics', async () => {
  const { auditPresentation } = await import('../../scripts/audit-presentation');
  const report = auditPresentation();
  expect(report.recordCount).toBe(2614);
  expect(report.potencies).toBe(1611);
  expect(report.markers).toBe(6020);
  expect(report.tiers).toBe(3780);
  expect(report.characteristics).toBe(2991);
  expect(report.fallbacks).toEqual([]);
  if (process.env.SALIENT_PRESENTATION_REPORT)
    writeFileSync(process.env.SALIENT_PRESENTATION_REPORT, JSON.stringify(report, null, 2));
  expect(report.diagnostics).toEqual([]);
  expect(report.missing).toBe(0);
}, 120_000);

it('recognizes formatted and dice-prefixed characteristic damage without interpreting it', () => {
  const html = renderSource(
    '- **≤11:** 8 + **A** psychic damage\n- **12-16:** 2d6 + 7 + A damage\n- **17+:** M or A damage',
  );
  expect(html.match(/aria-label="Agility"/g)).toHaveLength(3);
  expect(html).toContain('2d6 + 7 +');
  expect(html).toContain('<strong><span class="ds-symbol"');
});

it('reports unfamiliar comparisons and feature markers while retaining source text', async () => {
  const { auditPatternFallbacks } = await import('../../scripts/audit-presentation');
  const source = 'M <= 2. A < ELITE. P < -1. R < 2.5.\n\n💥 **Unfamiliar feature**\n\n`M <= 2`';
  expect(auditPatternFallbacks(source).map(d => d.source)).toEqual([
    'M <= 2',
    'A < ELITE',
    'P < -1',
    'R < 2.5',
    '💥',
  ]);
  const html = renderSource(source);
  expect(html).toContain('ELITE');
  expect(html).toContain('💥');
  expect(html).not.toContain('role="img"');
});
