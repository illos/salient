// SPDX-License-Identifier: GPL-3.0-only
/**
 * The kit chooser (V96): one card per kit rather than a dropdown, after the user's 2026-09-21
 * direction and the Forge Steel kit sheet they referenced. Each card carries what that reference
 * splits across its Overview and Stats tabs — the kit's own description, what it equips you with,
 * and every bonus it grants — plus a pill naming its signature ability, which opens the kit's full
 * entry in the reader.
 *
 * Quiet (docs/design-mockups/quiet/README.md): cards are `sub` insets, the selected one takes the
 * inset accent ring, and the bonus values step up to `ph` rather than taking the accent, which is
 * spent on the selection itself.
 *
 * Presentation only: the cards are native radios in one group, and choosing one sends the same
 * value through the same shared choice transition the select sent before. Every number shown is
 * read from the kit's recorded source row; nothing here derives a value.
 */
import { cn } from 'cn';
import { SUPPORTING_KITS } from '../../shared/content/supporting-kits';
import type { KitSentences } from '../../shared/evaluate/sources';
import { isSupported } from '../../shared/evaluate/structure';
import type { Decision } from '../../shared/evaluate/definitions';
import { useRulesCatalog } from '../rules/content';
import { RuleLink } from '../rules/link';
import { ruleExcerpt } from '../rules/reference';

/** The bonuses a kit grants, in the Kits table's own order, omitting the ones it does not. */
function bonuses(kit: KitSentences): { label: string; value: string }[] {
  const triple = (value: [number, number, number]) => `+${value[0]} / +${value[1]} / +${value[2]}`;
  return [
    ...(kit.staminaBonusPerEchelon.amount
      ? [{ label: 'Stamina per echelon', value: `+${kit.staminaBonusPerEchelon.amount}` }]
      : []),
    ...(kit.speedBonus ? [{ label: 'Speed', value: `+${kit.speedBonus}` }] : []),
    ...(kit.stabilityBonus?.amount
      ? [{ label: 'Stability', value: `+${kit.stabilityBonus.amount}` }]
      : []),
    ...(kit.meleeDamageBonus
      ? [{ label: 'Melee damage', value: triple(kit.meleeDamageBonus.value) }]
      : []),
    ...(kit.rangedDamageBonus.some(Boolean)
      ? [{ label: 'Ranged damage', value: triple(kit.rangedDamageBonus) }]
      : []),
    ...(kit.meleeDistanceBonus
      ? [{ label: 'Melee distance', value: `+${kit.meleeDistanceBonus}` }]
      : []),
    ...(kit.rangedDistanceBonus
      ? [{ label: 'Ranged distance', value: `+${kit.rangedDistanceBonus}` }]
      : []),
    ...(kit.disengageBonus ? [{ label: 'Disengage', value: `+${kit.disengageBonus}` }] : []),
  ];
}

function KitCard({
  name,
  kit,
  description,
  checked,
  supported,
  onChange,
}: {
  name: string;
  kit?: KitSentences;
  description?: string;
  checked: boolean;
  supported: boolean;
  onChange: () => void;
}) {
  const rows = kit ? bonuses(kit) : [];
  return (
    <label
      className={cn(
        'flex h-full flex-col gap-2.5 rounded-md bg-muted p-4 transition-colors duration-(--motion-fast)',
        checked ? 'ring-1 ring-primary ring-inset' : supported && 'hover:bg-accent',
        supported ? 'cursor-pointer' : 'cursor-default text-muted-foreground',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
      )}
    >
      <input
        type="radio"
        name="kit-choice"
        aria-label={name}
        checked={checked}
        disabled={!supported}
        onChange={onChange}
        className="sr-only"
      />
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-medium">{name}</span>
        {!supported && <span className="text-sm text-muted-foreground">Not offered yet</span>}
      </span>
      {description && (
        <span className="text-sm text-balance text-muted-foreground">{description}</span>
      )}
      {kit && <span className="text-sm text-muted-foreground">{kit.equipmentText}</span>}
      {rows.length > 0 && (
        <span className="mt-auto flex flex-col divide-y divide-border">
          {rows.map(row => (
            <span
              key={row.label}
              className="flex items-baseline justify-between gap-3 py-1 text-sm"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular-nums">{row.value}</span>
            </span>
          ))}
        </span>
      )}
      {kit && (
        <span className="flex items-center gap-2 pt-1">
          <span className="inline-flex h-6 items-center rounded-full bg-placeholder px-2.5 text-sm">
            {kit.signatureAbility}
          </span>
          <RuleLink sourcePath={kit.entryPath} label={`${name} kit`} />
        </span>
      )}
    </label>
  );
}

export function KitChoice({
  decision,
  value,
  values,
  onChange,
}: {
  decision: Decision;
  value?: string;
  values: string[];
  onChange: (value: string | undefined) => void;
}) {
  const { catalog } = useRulesCatalog();
  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-2"
      role="radiogroup"
      aria-label="Kit"
    >
      {values.map(name => {
        const kit = SUPPORTING_KITS[name];
        return (
          <KitCard
            key={name}
            name={name}
            kit={kit}
            description={
              kit ? ruleExcerpt(catalog, { sourcePath: kit.entryPath, label: name }) : undefined
            }
            checked={value === name}
            supported={isSupported(decision, name)}
            onChange={() => onChange(name)}
          />
        );
      })}
    </div>
  );
}
