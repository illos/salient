// SPDX-License-Identifier: GPL-3.0-only
/** Shared Core presentation vocabulary. Presentation only; never interprets or resolves game effects. */
const icons = {
  distance: ['o', 'Distance'],
  target: ['x', 'Target'],
  trait: ['*', 'Trait'],
  melee: ['t', 'Melee'],
  ranged: ['g', 'Ranged'],
  meleeOrRanged: ['l', 'Melee or ranged'],
  self: ['f', 'Self'],
  area: ['e', 'Area'],
  auraOrBurst: ['b', 'Aura or burst'],
  special: ['c', 'Special'],
  triggered: [')', 'Triggered action'],
  leader: ['d', 'Leader or solo feature'],
  activation: ['(', 'Activation'],
} as const;
const characteristics = {
  M: 'Might',
  A: 'Agility',
  R: 'Reason',
  I: 'Intuition',
  P: 'Presence',
} as const;
const tiers = {
  1: ['!', 'Tier 1, 11 or lower'],
  2: ['@', 'Tier 2, 12 to 16'],
  3: ['#', 'Tier 3, 17 or higher'],
} as const;
const banners = { WEAK: 'w', AVERAGE: 'v', STRONG: 's' } as const;
const ornaments = { divider: '¡¡¡¢¡¡¡', diamond: '¥', hero: '£' } as const;
export type IconName = keyof typeof icons;
export type Characteristic = keyof typeof characteristics;
export type Glyph =
  | { kind: 'icon'; name: IconName }
  | { kind: 'tier'; tier: 1 | 2 | 3 }
  | { kind: 'characteristic'; characteristic: Characteristic }
  | { kind: 'characteristicName'; characteristic: Characteristic }
  | { kind: 'potency'; characteristic: Characteristic; threshold: number | keyof typeof banners }
  | { kind: 'ornament'; name: keyof typeof ornaments };

export type GlyphPresentation = {
  characters: string;
  suffix: string;
  text: string;
  /** Entire composition gets one role/name, never a role on each font character. */
  accessibility: { role: 'img'; 'aria-label': string } | { 'aria-hidden': true };
};

/** No caller-supplied labels or roles: the finite semantic vocabulary owns both. */
export function describeGlyph(glyph: Glyph): GlyphPresentation {
  let characters: string;
  let text: string;
  let suffix = '';
  switch (glyph.kind) {
    case 'icon':
      [characters, text] = icons[glyph.name];
      break;
    case 'tier':
      [characters, text] = tiers[glyph.tier];
      break;
    case 'characteristic':
    case 'characteristicName':
      characters = glyph.characteristic;
      text = characteristics[glyph.characteristic];
      if (glyph.kind === 'characteristicName') suffix = text.slice(1);
      break;
    case 'potency': {
      const threshold = glyph.threshold;
      if (typeof threshold === 'number' && (!Number.isSafeInteger(threshold) || threshold < 0))
        throw new Error('A printed potency threshold must be a nonnegative safe integer');
      characters = `${glyph.characteristic.toLowerCase()}<${typeof threshold === 'number' ? threshold : banners[threshold]}`;
      text = `${characteristics[glyph.characteristic]} less than ${String(threshold).toLowerCase()}`;
      break;
    }
    case 'ornament':
      return {
        characters: ornaments[glyph.name],
        suffix: '',
        text: '',
        accessibility: { 'aria-hidden': true },
      };
  }
  return { characters, suffix, text, accessibility: { role: 'img', 'aria-label': text } };
}

const markers: Record<string, IconName> = {
  '📏': 'distance',
  '🎯': 'target',
  '⭐': 'trait',
  '★': 'trait',
  '🗡': 'melee',
  '🏹': 'ranged',
  '⚔': 'meleeOrRanged',
  '👤': 'self',
  '🔳': 'area',
  '❇': 'auraOrBurst',
  '🌀': 'special',
  '❗': 'triggered',
  '☠': 'leader',
  '❕': 'activation',
};
export function sourceIcon(marker: string): Glyph | undefined {
  const normalized = marker.replace(/[\uFE0E\uFE0F]/gu, '');
  const name = Object.hasOwn(markers, normalized) ? markers[normalized] : undefined;
  return name ? { kind: 'icon', name } : undefined;
}

export type GlyphRun = string | Glyph;
/** Called on Markdown text nodes, never on raw HTML, URLs, code or arbitrary letters. Heading IDs must be assigned before presentation.
 * Standalone M/A/R/I/P require a structured damage-expression adapter; the English pronoun I is text.
 */
export function tokenizeGlyphText(text: string): GlyphRun[] {
  const runs: GlyphRun[] = [];
  const pattern =
    /(?<![\p{L}\p{N}_])([MAIRP]) < (\d+|WEAK|AVERAGE|STRONG)(?![\p{L}\p{N}_]|\.\d)|[📏🎯⭐★🗡🏹⚔👤🔳❇🌀❗☠❕][\uFE0E\uFE0F]?/gu;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) runs.push(text.slice(cursor, match.index));
    if (match[1]) {
      const threshold = /^\d+$/.test(match[2])
        ? Number(match[2])
        : (match[2] as keyof typeof banners);
      if (typeof threshold === 'number' && !Number.isSafeInteger(threshold)) runs.push(match[0]);
      else runs.push({ kind: 'potency', characteristic: match[1] as Characteristic, threshold });
    } else runs.push(sourceIcon(match[0])!);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) runs.push(text.slice(cursor));
  return runs;
}

function escape(text: string): string {
  return text.replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
/** Trusted HTML renderer used by the design study; production HAST and React use the same descriptor.
 * Font codes exist only in data attributes/CSS content. DOM text remains meaningful even on copy.
 */
export function glyphHtml(glyph: Glyph): string {
  const p = describeGlyph(glyph);
  const attrs =
    'role' in p.accessibility ? `role="img" aria-label="${escape(p.text)}"` : 'aria-hidden="true"';
  return `<span class="ds-symbol" ${attrs}><span class="ds-symbol-visual" aria-hidden="true"><span class="ds-glyph" data-glyph="${escape(p.characters)}"></span>${escape(p.suffix)}</span><span class="ds-symbol-text" aria-hidden="true">${escape(p.text)}</span></span>`;
}

/** Exhaustive families; the corpus currently uses all 50 potency combinations below. */
export function knownGlyphExamples(): Glyph[] {
  return [
    ...(Object.keys(icons) as IconName[]).map(name => ({ kind: 'icon' as const, name })),
    ...([1, 2, 3] as const).map(tier => ({ kind: 'tier' as const, tier })),
    ...(Object.keys(characteristics) as Characteristic[]).flatMap(characteristic => [
      { kind: 'characteristic' as const, characteristic },
      { kind: 'characteristicName' as const, characteristic },
      ...([0, 1, 2, 3, 4, 5, 6, 'WEAK', 'AVERAGE', 'STRONG'] as const).map(threshold => ({
        kind: 'potency' as const,
        characteristic,
        threshold,
      })),
    ]),
    ...(Object.keys(ornaments) as (keyof typeof ornaments)[]).map(name => ({
      kind: 'ornament' as const,
      name,
    })),
  ];
}
