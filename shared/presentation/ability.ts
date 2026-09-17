// SPDX-License-Identifier: GPL-3.0-only
import type { SheetAbility } from '../contracts/characterSheet.ts';
import { embeddedAbility } from './content.ts';

/** Full printed source, including embedded kit abilities; computed bonuses stay separate. */
export function abilitySource(ability: SheetAbility): string {
  if (ability.content) {
    if (ability.content.name === ability.name) return ability.content.text;
    const embedded = embeddedAbility(ability.content.text, ability.name);
    if (embedded) return embedded;
  }
  const m = ability.metadata;
  return [
    m.keywords.join(', '),
    m.actionType,
    m.distance && `📏 ${m.distance}`,
    m.target && `🎯 ${m.target}`,
    m.trigger && `**Trigger:** ${m.trigger}`,
    m.roll && `**${m.roll}:**`,
    m.tiers?.map((tier, i) => `- **${['≤11', '12-16', '17+'][i]}:** ${tier}`).join('\n'),
    ...(m.effects?.map(effect => `**${effect.label || 'Effect'}:** ${effect.text}`) ?? []),
  ]
    .filter(Boolean)
    .join('\n\n');
}
