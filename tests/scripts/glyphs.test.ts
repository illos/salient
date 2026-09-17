// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Glyph } from '../../web/components/glyph';
import {
  describeGlyph,
  glyphHtml,
  knownGlyphExamples,
  sourceIcon,
  tokenizeGlyphText,
  type Characteristic,
} from '../../shared/presentation/glyphs';

describe('automatic glyph semantics', () => {
  it('names every known potency composition, including zero, as one image', () => {
    const names = { M: 'Might', A: 'Agility', R: 'Reason', I: 'Intuition', P: 'Presence' };
    for (const [letter, name] of Object.entries(names)) {
      for (const value of [0, 1, 2, 3, 4, 5, 6, 'WEAK', 'AVERAGE', 'STRONG'] as const) {
        const token = {
          kind: 'potency' as const,
          characteristic: letter as Characteristic,
          threshold: value,
        };
        const expected = `${name} less than ${String(value).toLowerCase()}`;
        expect(describeGlyph(token).accessibility).toEqual({ role: 'img', 'aria-label': expected });
        for (const html of [
          glyphHtml(token),
          renderToStaticMarkup(createElement(Glyph, { token })),
        ]) {
          expect(html.match(/role="img"/g)).toHaveLength(1);
          expect(html).toContain(`aria-label="${expected}"`);
          expect(html).toContain(`aria-hidden="true">${expected}</span>`);
          expect(html).not.toMatch(/>[mairp]&lt;[0-9wvs]+</);
        }
      }
    }
  });
  it('uses the same role and name policy in React and generated HTML for all 79 examples', () => {
    expect(knownGlyphExamples()).toHaveLength(79);
    for (const token of knownGlyphExamples()) {
      const p = describeGlyph(token);
      const react = renderToStaticMarkup(createElement(Glyph, { token }));
      const html = glyphHtml(token);
      if (token.kind === 'ornament') {
        expect(p.accessibility).toEqual({ 'aria-hidden': true });
        expect(html).not.toContain('role=');
        expect(react).not.toContain('aria-label=');
      } else {
        expect(p.text.length).toBeGreaterThan(0);
        expect(html).toContain(`aria-label="${p.text}"`);
        expect(react).toContain(`aria-label="${p.text}"`);
      }
    }
  });
  it('retains characteristic family, tier names and icon meanings', () => {
    expect(describeGlyph({ kind: 'characteristicName', characteristic: 'M' })).toMatchObject({
      characters: 'M',
      suffix: 'ight',
      text: 'Might',
    });
    expect(
      describeGlyph({ kind: 'potency', characteristic: 'I', threshold: 'AVERAGE' }),
    ).toMatchObject({ characters: 'i<v', text: 'Intuition less than average' });
    expect(describeGlyph({ kind: 'tier', tier: 1 }).text).toBe('Tier 1, 11 or lower');
    expect(describeGlyph({ kind: 'tier', tier: 2 }).text).toBe('Tier 2, 12 to 16');
    expect(describeGlyph({ kind: 'tier', tier: 3 }).text).toBe('Tier 3, 17 or higher');
    expect(describeGlyph({ kind: 'icon', name: 'leader' }).text).toBe('Leader or solo feature');
    expect(sourceIcon('⭐️')).toEqual({ kind: 'icon', name: 'trait' });
    for (const unknown of ['♪', 'constructor', 'toString', '__proto__'])
      expect(sourceIcon(unknown)).toBeUndefined();
  });
  it('recognizes exact printed tokens, preserving ordinary prose and unknown combinations', () => {
    expect(tokenizeGlyphText('A < 0; M < STRONG')).toEqual([
      { kind: 'potency', characteristic: 'A', threshold: 0 },
      '; ',
      { kind: 'potency', characteristic: 'M', threshold: 'STRONG' },
    ]);
    for (const text of [
      'I am here.',
      'MIGHT < STRONG',
      'A < -1',
      'A < 1.5',
      'A < 1e6',
      'A <= 2',
      'A<1',
      'R > 2',
      'A < 9007199254740993',
      'M < STRONGER',
    ])
      expect(tokenizeGlyphText(text)).toEqual([text]);
    expect(tokenizeGlyphText('A < 2. R < AVERAGE.')).toEqual([
      { kind: 'potency', characteristic: 'A', threshold: 2 },
      '. ',
      { kind: 'potency', characteristic: 'R', threshold: 'AVERAGE' },
      '.',
    ]);
    expect(tokenizeGlyphText('📏 Melee 1')).toEqual([
      { kind: 'icon', name: 'distance' },
      ' Melee 1',
    ]);
    expect(() => describeGlyph({ kind: 'potency', characteristic: 'A', threshold: -1 })).toThrow();
  });
});
