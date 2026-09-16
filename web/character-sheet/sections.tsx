// SPDX-License-Identifier: GPL-3.0-only
/**
 * The sheet's secondary sections from character-sheet.png: a section heading over a hard rule,
 * the ruled Stats list, Skills and Languages as outline chips, the Kit boxes, the Features rows
 * with their category at the right, the Details rows and the Notes callout. Presentation only:
 * every value is the projection's, and a value the baseline has not derived yet reads "pending".
 */
import { cn } from 'cn';
import type { HeroSheet, SheetFeature } from '../../shared/contracts/characterSheet';
import type { KitContributions, PartialBaseline } from '../../shared/contracts/characterEvaluation';
import { Chip } from '../components/chip';
import { StatBox } from '../components/stat-box';
import { RuleLink } from '../rules/link';

/** A value the baseline has not derived yet is shown as pending, never as a zero. */
export function pending(value: number | string | undefined | null): string {
  return value === undefined || value === null ? 'pending' : String(value);
}

/** Section title over the mockup's hard rule with a caps aside (`10 entries`, `2 active`). */
export function SheetSection({
  title,
  aside,
  compact,
  children,
  className,
  id,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const Heading = compact ? 'h3' : 'h2';
  return (
    <section className={cn('flex flex-col', className)} aria-labelledby={id}>
      <div
        className={cn(
          'rule-strong flex items-end justify-between gap-x-4 pb-2',
          compact ? 'mb-2' : 'mb-3',
        )}
      >
        <Heading id={id} className={cn('m-0', compact ? 'text-lg' : 'text-2xl')}>
          {title}
        </Heading>
        {aside !== undefined && <span className="caps text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/** One ruled row: label at the left, value bold at the right (Stats, Features, Details). */
export function RuledRow({
  label,
  value,
  aside,
  compact,
  align = 'baseline',
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
  align?: 'baseline' | 'start';
}) {
  return (
    <li
      className={cn(
        'rule-soft flex justify-between gap-x-4 text-sm',
        compact ? 'py-1.5' : 'py-2',
        align === 'start' ? 'items-start' : 'items-baseline',
      )}
    >
      <span className="flex min-w-0 items-center gap-1 text-foreground">{label}</span>
      <span className="flex shrink-0 items-center gap-2 text-right font-bold tabular-nums">
        {value}
        {aside}
      </span>
    </li>
  );
}

export function StatsList({
  partial,
  xp,
  compact,
}: {
  partial: PartialBaseline | null;
  xp: number | null;
  compact?: boolean;
}) {
  const rows: [string, React.ReactNode][] = [
    ['Size', pending(partial?.size?.value)],
    ['Speed', pending(partial?.speed?.value)],
    ['Stability', pending(partial?.stability?.value)],
    ['Disengage', pending(partial?.disengage?.value)],
    [
      'Potency',
      partial?.potency
        ? `${partial.potency.weak.value} / ${partial.potency.average.value} / ${partial.potency.strong.value}`
        : 'pending',
    ],
    [
      'Saves on',
      partial?.savingThrowThreshold ? `${partial.savingThrowThreshold.value}+` : 'pending',
    ],
    ['Renown', pending(partial?.renown?.value)],
    ['Wealth', pending(partial?.wealth?.value)],
  ];
  if (xp !== null) rows.push(['XP', xp]);
  return (
    <ul className="m-0 list-none p-0" aria-label="Stats">
      {rows.map(([label, value]) => (
        <RuledRow key={label} label={label} value={value} compact={compact} />
      ))}
    </ul>
  );
}

export function ChipList({
  items,
  empty,
  label,
}: {
  items: { key: string; text: string; title?: string }[];
  empty: string;
  label: string;
}) {
  if (!items.length) return <p className="m-0 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={label}>
      {items.map(item => (
        <li key={item.key} className="contents">
          <Chip caps title={item.title}>
            {item.text}
          </Chip>
        </li>
      ))}
    </ul>
  );
}

export function SkillChips({ partial }: { partial: PartialBaseline | null }) {
  return (
    <ChipList
      label="Skills"
      empty="No skills granted yet."
      items={(partial?.skills ?? []).map(skill => ({
        key: skill.name,
        text: skill.name,
        title: `${skill.name} (${skill.group})`,
      }))}
    />
  );
}

export function LanguageChips({ partial }: { partial: PartialBaseline | null }) {
  return (
    <ChipList
      label="Languages"
      empty="No languages granted yet."
      items={(partial?.languages ?? []).map((language, index) => ({
        key: `${language.name}:${index}`,
        text: language.duplicateOf ? `${language.name} (duplicate)` : language.name,
      }))}
    />
  );
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

/** Kit boxes: the sourced bonuses the projection carries; a tuple shows all three tiers. */
export function KitBoxes({ kit, compact }: { kit: KitContributions; compact?: boolean }) {
  const boxes: { label: string; value: string }[] = [
    { label: 'Stamina', value: signed(kit.staminaBonusApplied.value) },
    { label: 'Speed', value: signed(kit.speedBonus.value) },
    { label: 'Melee dmg', value: kit.meleeDamageBonus.value.map(signed).join('/') },
  ];
  if (kit.rangedDamageBonus.value.some(Boolean))
    boxes.push({ label: 'Ranged dmg', value: kit.rangedDamageBonus.value.map(signed).join('/') });
  if (kit.stabilityBonus.value)
    boxes.push({ label: 'Stability', value: signed(kit.stabilityBonus.value) });
  if (kit.disengageBonus.value)
    boxes.push({ label: 'Disengage', value: signed(kit.disengageBonus.value) });
  if (kit.meleeDistanceBonus.value)
    boxes.push({ label: 'Melee dist', value: signed(kit.meleeDistanceBonus.value) });
  if (kit.rangedDistanceBonus.value)
    boxes.push({ label: 'Ranged dist', value: signed(kit.rangedDistanceBonus.value) });
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {boxes.map(box => (
          <StatBox
            key={box.label}
            label={box.label}
            value={<span className={compact ? 'text-base' : 'text-lg'}>{box.value}</span>}
            className={cn('min-w-0 px-2', compact ? 'h-14' : 'h-16')}
          />
        ))}
      </div>
      <p className="m-0 text-xs text-muted-foreground">
        {kit.equipmentText.value} Stamina bonus {signed(kit.staminaBonusPerEchelon.value)} per
        echelon (echelon {kit.echelon.value}).
      </p>
    </div>
  );
}

const FEATURE_CATEGORY: Record<SheetFeature['kind'], string> = {
  'ancestry-signature-trait': 'Ancestry',
  'ancestry-purchased-trait': 'Ancestry',
  'culture-benefit': 'Culture',
  'class-feature': 'Class',
  'aspect-feature': 'Subclass',
  perk: 'Perk',
};

export function featureCategory(feature: SheetFeature, level: number | undefined): string {
  const base = FEATURE_CATEGORY[feature.kind];
  // A source's grant level is independent of the hero's current level. Do not relabel
  // inherited features when advancing; omit a level when the source does not identify one.
  const sourceLevel = /(?:^|\/)level-(\d+)\//.exec(feature.sourcePath)?.[1];
  if (
    (feature.kind === 'class-feature' || feature.kind === 'aspect-feature') &&
    level !== undefined &&
    sourceLevel
  )
    return `${base} · L${sourceLevel}`;
  return base;
}

export function FeatureRows({
  features,
  level,
  compact,
}: {
  features: SheetFeature[];
  level: number | undefined;
  compact?: boolean;
}) {
  if (!features.length)
    return <p className="m-0 text-sm text-muted-foreground">No features granted yet.</p>;
  return (
    <ul className="m-0 list-none p-0" aria-label="Features">
      {features.map(feature => (
        <RuledRow
          key={`${feature.kind}:${feature.name}`}
          compact={compact}
          label={
            <>
              <span className="truncate font-bold">{feature.name}</span>
              <RuleLink
                id={feature.content?.id}
                sourcePath={feature.sourcePath}
                label={feature.name}
              />
            </>
          }
          value={
            <span className="caps font-semibold text-muted-foreground">
              {featureCategory(feature, level)}
              {feature.cost !== undefined
                ? ` · ${feature.cost} point${feature.cost === 1 ? '' : 's'}`
                : ''}
            </span>
          }
        />
      ))}
    </ul>
  );
}

/** Long authored text under a caps label; the mockup's Notes box uses the same shape. */
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="rule-soft flex flex-col gap-0.5 py-2 text-sm">
      <span className="caps text-muted-foreground">{label}</span>
      <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{value}</span>
    </li>
  );
}

export function DetailsRows({
  sheet,
  partial,
}: {
  sheet: HeroSheet;
  partial: PartialBaseline | null;
}) {
  const culture = [
    sheet.details.cultureLanguage,
    sheet.details.environment,
    sheet.details.organization,
    sheet.details.upbringing,
  ].filter(Boolean);
  return (
    <ul className="m-0 list-none p-0" aria-label="Details">
      <DetailRow
        label="Culture"
        value={
          sheet.details.cultureName
            ? `${sheet.details.cultureName}${culture.length ? ` (${culture.join(', ')})` : ''}`
            : '—'
        }
      />
      <DetailRow
        label="Career"
        value={
          partial?.career?.value
            ? `${partial.career.value}${sheet.details.incitingIncident ? ` · ${sheet.details.incitingIncident}` : ''}`
            : '—'
        }
      />
      {sheet.details.whatWasTaken && (
        <DetailRow label="What was taken" value={sheet.details.whatWasTaken} />
      )}
      {sheet.details.connections && (
        <DetailRow label="Connections" value={sheet.details.connections} />
      )}
      <DetailRow label="Appearance" value={sheet.authored.appearance || '—'} />
      <DetailRow label="Biography" value={sheet.authored.biography || '—'} />
    </ul>
  );
}

/** The owner-private Notes callout (read-only display; editing lives in the wizard). */
export function NotesBox({ notes, compact }: { notes: string | undefined; compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-md border border-rule-strong bg-background shadow-hard',
        compact ? 'p-3' : 'p-4',
      )}
      aria-label="Notes"
    >
      <span className="caps text-muted-foreground">Notes</span>
      <p className="m-0 text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
        {notes || <span className="text-muted-foreground">No notes yet.</span>}
      </p>
    </div>
  );
}
