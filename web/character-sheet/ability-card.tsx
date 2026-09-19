// SPDX-License-Identifier: GPL-3.0-only
/** Core-style printed ability cards. Full source and glyphs are presentation only;
 * build damage modifiers remain separate and the rulebook control opens the complete reference. */
import { cn } from 'cn';
import type { SheetAbility } from '../../shared/contracts/characterSheet';
import type { ChipKind } from '../components/chip';
import { CoreSource } from '../components/core-content';
import { abilitySource } from '../../shared/presentation/ability';
import { RuleLink } from '../rules/link';
import { readableRuleText } from '../rules/reference';

export interface AbilityTag {
  text: string;
  kind: ChipKind;
}

/** Tags in the mockup's order: the printed cost chip leads for heroic abilities. */
export function abilityTags(ability: SheetAbility): AbilityTag[] {
  const tags: AbilityTag[] = [];
  const type = ability.metadata.actionType ? readableRuleText(ability.metadata.actionType) : '';
  if (ability.kind === 'signature' || ability.kind === 'kit-signature')
    tags.push({ text: 'Signature', kind: 'result' });
  const cost =
    ability.cost && ability.costAdjustments?.length
      ? `${ability.cost.amount} ${ability.cost.resource}`
      : ability.metadata.cost
        ? readableRuleText(ability.metadata.cost)
        : ability.cost
          ? `${ability.cost.amount} ${ability.cost.resource}`
          : null;
  if (cost) tags.push({ text: cost, kind: 'accent' });
  if (/triggered/i.test(type))
    tags.push({ text: /free/i.test(type) ? 'Free triggered' : 'Triggered', kind: 'plain' });
  else if (/maneuver/i.test(type)) tags.push({ text: 'Maneuver', kind: 'plain' });
  else if (/move action/i.test(type)) tags.push({ text: 'Move', kind: 'plain' });
  if (ability.kind === 'free-strike') tags.push({ text: 'Free strike', kind: 'plain' });
  return tags;
}

/** `Main action · Melee 1` from the printed action type and distance; absent parts are omitted. */
export function abilityPlacement(ability: SheetAbility): string {
  const m = ability.metadata;
  return [m.actionType, m.distance]
    .filter((part): part is string => !!part)
    .map(readableRuleText)
    .join(' · ');
}

/** The one-line grey summary when the source prints no power roll: trigger, effect or keywords. */
export function abilitySummary(ability: SheetAbility): string | null {
  const m = ability.metadata;
  if (m.trigger) return `Trigger: ${readableRuleText(m.trigger)}`;
  const effect = m.effects?.[0];
  if (effect) return readableRuleText(effect.text);
  if (m.keywords.length) return m.keywords.map(readableRuleText).join(', ');
  if (ability.kind === 'kit-signature') return 'Kit signature ability · kit bonuses included';
  return null;
}

const CARD = 'flex flex-col gap-2 rounded-md border';

export function AbilityCard({ ability, compact }: { ability: SheetAbility; compact?: boolean }) {
  const tags = abilityTags(ability).filter(tag => tag.kind === 'result' || tag.kind === 'accent');
  return (
    <li className={cn('ds-hero-ability', compact && 'text-sm')} data-ability-kind={ability.kind}>
      <header>
        <strong>{ability.name}</strong>
        <span className="flex items-center gap-2 text-sm">
          {tags.map(tag => (
            <span key={tag.text}>{tag.text}</span>
          ))}
          <RuleLink id={ability.content?.id} sourcePath={ability.sourcePath} label={ability.name} />
        </span>
      </header>
      {ability.activationCondition && (
        <p className="text-sm">Available when: {ability.activationCondition}</p>
      )}
      <CoreSource source={abilitySource(ability)} />
      {ability.costAdjustments?.map(adjustment => (
        <p key={adjustment.decisionId} className="text-xs">
          Cost adjustment: {adjustment.amount > 0 ? '+' : ''}
          {adjustment.amount} (minimum {adjustment.minimum}).{' '}
          <RuleLink sourcePath={adjustment.sourcePath} label="Cost adjustment" />
        </p>
      ))}
      {ability.kitBonusesIncluded && (
        <p className="text-xs text-muted-foreground">Kit bonuses included</p>
      )}
      {ability.grantedBy.note && (
        <p className="text-xs text-muted-foreground">{ability.grantedBy.note}</p>
      )}
      {ability.buildModifiers?.length ? (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>Printed tiers shown above. Rolled damage bonuses:</span>
          {ability.buildModifiers.map((modifier, index) => (
            <span key={index}>
              +{modifier.amount} from {modifier.label}
              {modifier.condition ? ` (${modifier.condition})` : ''}
              <RuleLink sourcePath={modifier.sourcePath} label={modifier.label} />
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}

/** A readable common action: a lighter card, no use control (its operation lives in the log). */
export function CommonActionCard({
  name,
  id,
  compact,
}: {
  name: string;
  id: string;
  compact?: boolean;
}) {
  return (
    <li
      className={cn(
        CARD,
        'flex-row items-center justify-between border-border bg-muted/60',
        compact ? 'px-3 py-2' : 'px-4 py-2.5',
      )}
    >
      <span className="text-sm">{name}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        Common action
        <RuleLink id={id} label={name} />
      </span>
    </li>
  );
}
