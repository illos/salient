// SPDX-License-Identifier: GPL-3.0-only
import { FURY_ACTIONS, furyActionText } from '../content/classes/fury/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? FURY_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function furyAbilitySource(ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) {
  const action = managed(ability);
  return action
    ? {
        ...action,
        text: furyActionText(action),
        ...(action.cost ? { cost: `${action.cost} Ferocity` } : { cost: undefined }),
      }
    : undefined;
}
export function furyAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(a => !managed(a));
  for (const action of FURY_ACTIONS) {
    const parent = [...features, ...result].find(
      p =>
        p.name === action.parent &&
        (p.provenance.decisionId.startsWith('class.fury.') ||
          p.provenance.decisionId === 'kit.corven.contributions' ||
          p.provenance.decisionId === 'kit.raden.contributions'),
    );
    if (!parent) continue;
    result.push({
      name: action.name,
      kind: 'class',
      sourcePath: action.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: action.activationCondition,
      ...(action.cost ? { cost: { resource: 'ferocity', amount: action.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: {
          ...parent.provenance.source,
          path: action.sourcePath,
          quote: furyActionText(action),
        },
      },
    });
  }
  return result.map(a =>
    a.name === 'Tide of Death' && a.provenance.decisionId.startsWith('class.fury.')
      ? {
          ...a,
          activationCondition:
            'The Self header describes your movement. Its power roll damages traversed enemies, never yourself. Movement, enemy selection, the roll, kit bonuses and last-target extra damage are resolved manually.',
        }
      : a.name === 'Aspect of the Wild' && a.provenance.decisionId.startsWith('class.fury.')
        ? {
            ...a,
            activationCondition:
              'Transform only into forms granted by your Stormwight kit or back to your true form. Track form, size, movement, negotiation and equipment manually. Crow and rat animal forms cannot use abilities except Aspect of the Wild.',
          }
        : a,
  );
}
