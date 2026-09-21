// SPDX-License-Identifier: GPL-3.0-only
import {
  SUMMONER_ACTIONS,
  summonerActionText,
  summonerSourceText,
} from '../content/classes/summoner/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? SUMMONER_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function summonerAbilitySource(
  ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>,
) {
  const a = managed(ability);
  return a
    ? {
        ...a,
        text: summonerActionText(a),
        ...(a.cost ? { cost: `${a.cost} Essence` } : { cost: undefined }),
      }
    : undefined;
}
export function summonerAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const parents = [...features, ...existing];
  const isSummoner = features.some(f => f.provenance.decisionId.startsWith('class.summoner.'));
  const result = existing.filter(
    a =>
      !a.provenance.decisionId.startsWith('class.summoner.') &&
      !(isSummoner && a.kind === 'free-strike'),
  );
  for (const a of SUMMONER_ACTIONS) {
    const parent = parents.find(
      p => p.name === a.parent && p.provenance.decisionId.startsWith('class.summoner.'),
    );
    if (!parent) continue;
    result.push({
      name: a.name,
      kind: 'class',
      sourcePath: a.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: a.activationCondition,
      ...(a.cost ? { cost: { resource: 'essence', amount: a.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: { ...parent.provenance.source, path: a.sourcePath, quote: summonerSourceText(a) },
      },
    });
  }
  return result;
}
