// SPDX-License-Identifier: GPL-3.0-only
import {
  BEASTHEART_ACTIONS,
  beastheartActionText,
  beastheartSourceText,
} from '../content/classes/beastheart/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? BEASTHEART_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function beastheartAbilitySource(
  ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>,
) {
  const a = managed(ability);
  return a
    ? {
        ...a,
        text: beastheartActionText(a),
        ...(a.cost ? { cost: `${a.cost} Ferocity` } : { cost: undefined }),
      }
    : undefined;
}
export function beastheartAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const parents = [...features, ...existing];
  // Class grants become named manual records; a class perk's own ability (perkAbilities) stays.
  const result = existing.filter(
    a =>
      !a.provenance.decisionId.startsWith('class.beastheart.') ||
      a.provenance.decisionId.endsWith('.perk'),
  );
  for (const a of BEASTHEART_ACTIONS) {
    const parent = parents.find(
      p => p.name === a.parent && p.provenance.decisionId.startsWith('class.beastheart.'),
    );
    if (!parent) continue;
    result.push({
      name: a.name,
      kind: 'class',
      sourcePath: a.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: a.activationCondition,
      ...(a.cost ? { cost: { resource: 'ferocity', amount: a.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: { ...parent.provenance.source, path: a.sourcePath, quote: beastheartSourceText(a) },
      },
    });
  }
  return result;
}
