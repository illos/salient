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
  return result.map(a => {
    const condition = a.provenance.decisionId.startsWith('class.fury.')
      ? FURY_ACTIVATION[a.name]
      : undefined;
    return condition ? { ...a, activationCondition: condition } : a;
  });
}

/** Printed clauses the resolver does not model; each is resolved manually at the table. */
const FURY_ACTIVATION: Record<string, string> = {
  'Tide of Death':
    'The Self header describes your movement. Its power roll damages traversed enemies, never yourself. Movement, enemy selection, the roll, kit bonuses and last-target extra damage are resolved manually.',
  'Aspect of the Wild':
    'Transform only into forms granted by your Stormwight kit or back to your true form. Track form, size, movement, negotiation and equipment manually. Crow and rat animal forms cannot use abilities except Aspect of the Wild.',
  'Wrecking Ball':
    'Move up to your speed in a straight line through mundane structures, leaving difficult terrain. One power roll targets each enemy you move adjacent to, never yourself. Movement, structure destruction, target selection, the power roll and pushes are resolved manually.',
  'Phalanx-Breaker':
    'Shift up to your speed; one power roll targets up to three enemies you move adjacent to during the shift, never yourself. Movement, target selection, the power roll, damage, kit bonuses and dazed are resolved manually.',
  'Apex Predator':
    'The target cannot be hidden from you for 24 hours. Until the end of the encounter, use Apex Predator: Pursue when it willingly moves. Hidden-state tracking is manual.',
  'Visceral Roar':
    'Deals your primordial damage type from your Stormwight kit, which the generic roll cannot carry. The power roll, typed damage, pushes and dazed are resolved manually.',
  'Demon Unleashed':
    'Until the end of the encounter or until you are dying, each enemy who starts its turn adjacent to you with Presence below your strong potency is frightened until the end of its turn. Adjacency, duration and the condition are manual.',
  'Face the Storm!':
    'Until the end of the encounter or until you are dying, each creature you make a melee strike against with Presence below your average potency is taunted until the end of its next turn. Rolled damage against an enemy you taunted gains twice your Might and +1 potency. Resolve manually.',
  Steelbreaker: 'Gain 20 temporary Stamina. Apply the temporary Stamina manually.',
  'You Are Already Dead':
    'A target that is not a leader or solo creature is reduced to 0 Stamina at the end of its next turn; resolve that manually. Against a leader or solo creature you gain 3 surges (adjust manually) and can also use You Are Already Dead: Free Strike.',
};
