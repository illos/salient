// SPDX-License-Identifier: GPL-3.0-only
import type { DerivedBaseline, GrantedFeature } from '../contracts/characterEvaluation.ts';
type InitialItem = NonNullable<DerivedBaseline['initialItems']>[number];
/** Source possessions outside treasure catalogs remain named, sourced possessions. */
const NARRATIVE_ITEMS = [
  { complication: 'Crash Landed', name: 'Power pack', slug: 'crash-landed' },
  { complication: 'War Dog Collar', name: 'Modified loyalty collar', slug: 'war-dog-collar' },
  { complication: 'Advanced Studies', name: 'Cryptic notebook', slug: 'advanced-studies' },
  { complication: "Sibling's Shield", name: 'Sibling’s shield', slug: 'siblings-shield' },
  {
    complication: 'Famous Relative',
    name: 'Magic jewelry from your famous relative',
    slug: 'famous-relative',
  },
  { complication: 'Pirate', name: 'Piece of a pirate map', slug: 'pirate' },
  { complication: 'Greening', name: 'Golden sapling', slug: 'greening' },
];
export function startingRewardItems(
  features: GrantedFeature[],
  items: InitialItem[] = [],
): InitialItem[] {
  const result = items.map(item =>
    item.state === 'broken' && item.decisionId.startsWith('complication.shattered-legacy.')
      ? {
          ...item,
          projectSource: item.sourcePath,
          condition: item.condition?.includes('Repair project source possessed;')
            ? item.condition
            : `${item.condition ?? ''} Repair project source possessed; half normal project goal; item prerequisite still required.`.trim(),
        }
      : { ...item },
  );
  for (const item of NARRATIVE_ITEMS) {
    const sourcePath = `en/unified/md/complication/${item.slug}.md`;
    if (
      !features.some(
        f =>
          f.kind === 'complication' && f.name === item.complication && f.sourcePath === sourcePath,
      )
    )
      continue;
    const decisionId = `complication.${item.slug}.possession`;
    if (!result.some(existing => existing.decisionId === decisionId))
      result.push({ decisionId, name: item.name, sourcePath, state: 'possessed' });
  }
  return result;
}
