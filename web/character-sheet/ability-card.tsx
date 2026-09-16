// SPDX-License-Identifier: GPL-3.0-only
/**
 * Ability cards from character-sheet.png: name, a tag chip (SIGNATURE ink-filled, a resource cost
 * in brick red, TRIGGERED / MANEUVER / FREE STRIKE outlined), the action type and distance in grey
 * at the right, then the roll and tier chips when the source prints them. Everything shown is the
 * projection's printed metadata (docs/character-sheet-spec.md#actions-tests-and-readable-rules);
 * the card computes nothing, and the rulebook icon opens the complete source text.
 */
import { cn } from 'cn';
import type { SheetAbility } from '../../shared/contracts/characterSheet';
import { Chip, type ChipKind } from '../components/chip';
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
  const cost = ability.metadata.cost
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
  const m = ability.metadata;
  const tags = abilityTags(ability);
  const placement = abilityPlacement(ability);
  const summary = abilitySummary(ability);
  const signature = ability.kind === 'signature' || ability.kind === 'kit-signature';
  return (
    <li
      className={cn(
        CARD,
        compact ? 'p-3' : 'p-4',
        signature ? 'border-rule-strong bg-card shadow-hard' : 'border-border bg-background',
      )}
      data-ability-kind={ability.kind}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <strong className="text-base">{ability.name}</strong>
        {tags.map(tag => (
          <Chip key={tag.text} kind={tag.kind} caps>
            {tag.text}
          </Chip>
        ))}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          {placement}
          <RuleLink id={ability.content?.id} sourcePath={ability.sourcePath} label={ability.name} />
        </span>
      </div>
      {m.roll || m.tiers ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {m.roll && <Chip>{readableRuleText(m.roll)}</Chip>}
          {m.tiers?.map((tier, index) => (
            <Chip key={index} className="h-auto min-h-6 py-0.5 whitespace-normal">
              <span className="mr-1 text-muted-foreground">Tier {index + 1} ·</span>
              {readableRuleText(tier)}
            </Chip>
          ))}
          {ability.kitBonusesIncluded && (
            <span className="text-xs text-muted-foreground">Kit bonuses included</span>
          )}
        </div>
      ) : summary ? (
        <p className="m-0 truncate text-sm text-muted-foreground" title={summary}>
          {summary}
        </p>
      ) : null}
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
