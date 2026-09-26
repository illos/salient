// SPDX-License-Identifier: GPL-3.0-only
/** Source discovery only. These descriptors never execute a trait or infer its timing. */
import { plain } from './abilityGrammar.ts';

export const featureSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A single printed blockquote, excluding following prose and sibling/private features. */
export function foeFeatureText(text: string, name: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex(line => {
    if (!/^>\s+(?:[^*]+\s+)?\*\*[^*]+\*\*\s*$/.test(line)) return false;
    const title = plain(line)
      .replace(/^>\s*/, '')
      .replace(/^[^\p{L}\p{N}]+/u, '');
    return title === name || (title.startsWith(name) && /^\s+\(/.test(title.slice(name.length)));
  });
  if (start < 0) return '';
  const iconHeader = /^>\s+[^\s*|>\p{L}\p{N}]+\s+\*\*[^*]+\*\*\s*$/u;
  const hasIcon = iconHeader.test(lines[start]!);
  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end]!;
    if (iconHeader.test(line) || (!hasIcon && /^>\s+\*\*[^*]+\*\*\s*$/.test(line))) break;
    if (line.trim() && !line.startsWith('>')) break;
    end++;
  }
  return lines.slice(start, end).join('\n').trim();
}

export interface FoeFeatureSource {
  contentId: string;
  sourcePath: string;
  revision: string;
  text: string;
  structured: Record<string, unknown>;
  features?: unknown[];
}
export interface ManualFoeFeature {
  id: string;
  name: string;
  category: 'trait' | 'malice' | 'group';
  /** Printed parent timing context; never sibling feature text. */
  context?: string;
  text: string;
  source: { id: string; path: string; revision: string };
  clauses: { name: string; text: string }[];
}

export function manualFoeFeatures(entry: FoeFeatureSource): ManualFoeFeature[] {
  const malice = entry.structured.kind === 'malice';
  const raw =
    entry.features ??
    (malice && Array.isArray(entry.structured.features) ? entry.structured.features : []);
  const out: ManualFoeFeature[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const feature = item as Record<string, unknown>;
    if ((!malice && feature.feature_type !== 'trait') || typeof feature.name !== 'string') continue;
    const text = foeFeatureText(entry.text, feature.name);
    if (!text) continue; // Never expose a whole parent when a section cannot be isolated.
    const effects = Array.isArray(feature.effects) ? feature.effects : [];
    const clauses = effects.flatMap((item: unknown) => {
      if (!item || typeof item !== 'object') return [];
      const effect = item as Record<string, unknown>;
      const parts = [effect.effect, effect.tier1, effect.tier2, effect.tier3].filter(
        (x): x is string => typeof x === 'string',
      );
      return parts.length
        ? [
            {
              name: typeof effect.name === 'string' ? effect.name : (feature.name as string),
              text: parts.join('\n'),
            },
          ]
        : [];
    });
    out.push({
      id: `${entry.contentId}/${featureSlug(feature.name)}`,
      name: feature.name,
      category: malice ? 'malice' : 'trait',
      ...(malice && typeof entry.structured.flavor === 'string'
        ? { context: entry.structured.flavor }
        : {}),
      text,
      source: { id: entry.contentId, path: entry.sourcePath, revision: entry.revision },
      clauses: clauses.length ? clauses : [{ name: feature.name, text }],
    });
    // Named choices inside a trait need independent reachability without fabricated action costs.
    for (const clause of clauses.filter(c => c.name === 'End Effect' && c.name !== feature.name))
      out.push({
        id: `${entry.contentId}/${featureSlug(feature.name)}/${featureSlug(clause.name)}`,
        name: clause.name,
        category: 'trait',
        text: clause.text,
        source: { id: entry.contentId, path: entry.sourcePath, revision: entry.revision },
        clauses: [clause],
      });
  }
  return out;
}

/** Named out-of-stat-block features, tied to their exact source rather than loose name matches. */
export const externalFoeFeatures = [
  {
    parent: 'mcdm.monsters.v1/rule.monster/malice',
    names: ['Brutal Effectiveness', 'Malicious Strike'],
  },
  { parent: 'mcdm.monsters.v1/monster.group/werewolf', names: ['Shared Ferocity'] },
  { parent: 'mcdm.monsters.v1/monster.group/dragon', names: ["Thorn Dragon's Domain"] },
] as const;

export function namedFoeFeatures(entry: FoeFeatureSource): ManualFoeFeature[] {
  const selection = externalFoeFeatures.find(x => x.parent === entry.contentId);
  return (selection?.names ?? []).flatMap(name => {
    const text = foeFeatureText(entry.text, name);
    return text
      ? [
          {
            id: `${entry.contentId}/${featureSlug(name)}`,
            name,
            category: entry.contentId.includes('/rule.') ? ('malice' as const) : ('group' as const),
            text,
            source: { id: entry.contentId, path: entry.sourcePath, revision: entry.revision },
            clauses: [{ name, text }],
          },
        ]
      : [];
  });
}

/** Printed band access. Bugbears explicitly also use Goblin Malice Features. */
export function foeSupportingIds(id: string): string[] {
  const base = 'mcdm.monsters.v1/';
  const bands = [
    ['monster.goblin.statblock/', ['monster.goblin/goblin-malice']],
    [
      'monster.bugbear.statblock/',
      ['monster.bugbear/bugbear-malice', 'monster.goblin/goblin-malice'],
    ],
    ['monster.human.statblock/', ['monster.human/human-malice']],
    [
      'monster.undead.1st-echelon.statblock/',
      ['monster.undead.1st-echelon/undead-malice-level-1-malice-features'],
    ],
    ['monster.arixx.statblock/', ['monster.arixx/arixx-malice']],
    ['monster.werewolf.statblock/', ['monster.werewolf/werewolf-malice', 'monster.group/werewolf']],
    [
      'monster.dragon.statblock/thorn-dragon',
      ['monster.dragon/thorn-dragon-malice', 'monster.group/dragon'],
    ],
  ] as const;
  const match = bands.find(([prefix]) => id.startsWith(base + prefix));
  return match ? [...match[1].map(x => base + x), base + 'rule.monster/malice'] : [];
}
