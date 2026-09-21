// SPDX-License-Identifier: GPL-3.0-only
/**
 * The sheet's secondary sections (docs/design-mockups/quiet/README.md, character sheet): each a
 * borderless `card` panel with a 20px title, the plain two-column Stats list, Skills as `sub`
 * pills, Languages as one comma-joined line, the Kit tiles as `sub` insets, the Features rows
 * with their category at the right, the Details rows and the Notes panel. Presentation only:
 * every value is the projection's, and a value the baseline has not derived yet reads "pending".
 */
import { cn } from 'cn';
import { Fragment } from 'react';
import type { HeroSheet, SheetFeature } from '../../shared/contracts/characterSheet';
import type { KitContributions, PartialBaseline } from '../../shared/contracts/characterEvaluation';
import { Chip } from '../components/chip';
import { StatBox } from '../components/stat-box';
import { RuleLink } from '../rules/link';
import { CoreSource } from '../components/core-content';
import { SupportingBuildFacts } from '../wizard/supporting-components';
import { SecretInheritance } from './secret-inheritance';
import type { Id } from '../../convex/_generated/dataModel';

/** A value the baseline has not derived yet is shown as pending, never as a zero. */
export function pending(value: number | string | undefined | null): string {
  return value === undefined || value === null ? 'pending' : String(value);
}

/**
 * Section title with a muted aside (`10 entries`, `2 active`). On the standalone page the section
 * is a `card` panel; in the heroes pane (already a panel) and for `bare` sections whose children
 * are panels themselves, it is only the heading and its content.
 */
export function SheetSection({
  title,
  aside,
  compact,
  bare,
  children,
  className,
  id,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
  /** No panel surface of its own (the children are the panels). */
  bare?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const Heading = compact ? 'h3' : 'h2';
  return (
    <section
      className={cn('flex flex-col', !compact && !bare && 'rounded-lg bg-card p-6', className)}
      aria-labelledby={id}
    >
      <div
        className={cn(
          'flex items-end justify-between gap-x-4',
          compact ? 'mb-3' : bare ? 'mb-5' : 'mb-4',
        )}
      >
        <Heading id={id} className={cn('m-0 font-medium', compact ? 'text-lg' : 'text-xl')}>
          {title}
        </Heading>
        {aside !== undefined && <span className="text-sm text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/** One row: label at the left, value at the right (Stats, Features). No rule beneath. */
export function RuledRow({
  label,
  value,
  aside,
  compact,
  align = 'baseline',
  muted,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
  align?: 'baseline' | 'start';
  /** Stats: the label is the muted side and the value carries the weight. */
  muted?: boolean;
}) {
  return (
    <li
      className={cn(
        'flex justify-between gap-x-4 text-base',
        compact ? 'py-1' : muted ? 'py-0' : 'py-2',
        align === 'start' ? 'items-start' : 'items-baseline',
      )}
    >
      <span
        className={cn(
          'flex min-w-0 items-center gap-1',
          muted ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {label}
      </span>
      <span className="flex shrink-0 items-center gap-2 text-right font-medium tabular-nums">
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
    <ul
      className={cn(
        'm-0 grid grid-cols-2 list-none p-0',
        compact ? 'gap-x-4 gap-y-1' : 'gap-x-6 gap-y-3',
      )}
      aria-label="Stats"
    >
      {rows.map(([label, value]) => (
        <RuledRow key={label} label={label} value={value} compact={compact} muted />
      ))}
    </ul>
  );
}

export function ChipList({
  items,
  empty,
  label,
  inline,
}: {
  items: { key: string; text: string; title?: string }[];
  empty: string;
  label: string;
  /** One comma-joined line instead of pills (Languages). */
  inline?: boolean;
}) {
  if (!items.length) return <p className="m-0 text-base text-muted-foreground">{empty}</p>;
  if (inline)
    return (
      <ul
        className="m-0 list-none p-0 text-base [&>li]:inline [&>li+li]:before:content-[',_']"
        aria-label={label}
      >
        {items.map(item => (
          <li key={item.key} title={item.title}>
            {item.text}
          </li>
        ))}
      </ul>
    );
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={label}>
      {items.map(item => (
        <li key={item.key} className="contents">
          <Chip caps title={item.title} className="h-8 px-3 text-foreground">
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
      inline
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

/** Kit tiles: the sourced bonuses the projection carries; a tuple shows all three tiers. */
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
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {boxes.map(box => (
          <StatBox
            key={box.label}
            label={box.label}
            value={<span className={compact ? 'text-lg' : 'text-xl'}>{box.value}</span>}
            inset
            className={cn('min-w-0 px-3', compact ? 'h-14' : 'h-16')}
          />
        ))}
      </div>
      <p className="m-0 text-sm text-muted-foreground">
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
  'career-benefit': 'Career',
  complication: 'Complication',
  'supporting-feature': 'Supporting feature',
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
    return <p className="m-0 text-base text-muted-foreground">No features granted yet.</p>;
  return (
    <ul className="m-0 list-none p-0" aria-label="Features">
      {features.map(feature => (
        <Fragment key={`${feature.kind}:${feature.name}`}>
          <RuledRow
            compact={compact}
            label={
              <>
                <span className="truncate font-medium">{feature.name}</span>
                <RuleLink
                  id={feature.content?.id}
                  sourcePath={feature.sourcePath}
                  label={feature.name}
                />
              </>
            }
            value={
              <span className="text-sm font-normal text-muted-foreground">
                {featureCategory(feature, level)}
                {feature.cost !== undefined
                  ? ` · ${feature.cost} point${feature.cost === 1 ? '' : 's'}`
                  : ''}
              </span>
            }
          />
          {feature.content && feature.sourcePath.includes('/complication/') && (
            <li className="py-3" aria-label={`${feature.name} full text`}>
              <CoreSource source={feature.content.text} />
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  );
}

/** Long authored text under a muted 13px label (Details). */
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-0.5 py-3 text-base">
      <span className="text-sm text-muted-foreground">{label}</span>
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
    <ul className="m-0 list-none divide-y divide-border p-0" aria-label="Details">
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
      <li className="py-3">
        <SupportingBuildFacts baseline={partial} />
      </li>
      {(sheet.audience === 'director' || sheet.viewer.role === 'director') &&
        sheet.build &&
        sheet.build.label !== 'draft' &&
        partial?.features?.some(
          feature => feature.kind === 'complication' && feature.name === 'Strange Inheritance',
        ) && (
          <li>
            <SecretInheritance
              characterId={sheet.id as Id<'characters'>}
              view={sheet.build.label}
              displayedRevision={sheet.build.revision}
            />
          </li>
        )}
      {partial?.companion && (
        <li className="space-y-2 py-3" aria-label="Beastheart companion">
          <h3 className="text-lg font-medium">Companion · {partial.companion.name}</h3>
          <p>
            Size {partial.companion.size} · Speed {partial.companion.speed} · Stability{' '}
            {partial.companion.stability} · Disengage {partial.companion.disengage}
          </p>
          <p>
            {Object.entries(partial.companion.characteristics)
              .map(([key, value]) => `${key} ${value}`)
              .join(' · ')}
          </p>
          <p>
            Stamina maximum {partial.companion.staminaMaximum} · Winded{' '}
            {partial.companion.windedValue} · Recovery value {partial.companion.recoveryValue}. Uses
            the hero’s Recoveries.
          </p>
          <p>
            Movement: {partial.companion.movement} · Immunity: {partial.companion.immunity}
          </p>
          <p>
            Melee damage bonus: {partial.companion.meleeDamageBonus.join(' / ')} · Printed free
            strike: {partial.companion.freeStrike}. No ranged free strike.
          </p>
          <p>
            Ranged damage bonus: {partial.companion.rangedDamageBonus.join(' / ')} · Distance
            bonuses: melee {partial.companion.meleeDistanceBonus}, ranged{' '}
            {partial.companion.rangedDistanceBonus} · Potency: {partial.companion.potency.weak} /{' '}
            {partial.companion.potency.average} / {partial.companion.potency.strong}
          </p>
          <p>Shared skills: {partial.companion.skills.join(', ')}</p>
          <p>Species features: {partial.companion.features.join(', ')}</p>
          <p>Species actions: {partial.companion.abilities.join(', ')}</p>
          <p className="text-sm text-muted-foreground">
            Track the companion’s current Stamina, conditions and Rampage separately. Companion
            actions are manual records in the action list; shared turns and companion targeting are
            not yet automated. Kit signature abilities belong to the Beastheart only.
          </p>
        </li>
      )}
      <DetailRow label="Appearance" value={sheet.authored.appearance || '—'} />
      <DetailRow label="Biography" value={sheet.authored.biography || '—'} />
    </ul>
  );
}

/**
 * The owner-private Notes (read-only display; editing lives in the wizard): a `card` panel on the
 * standalone page, a `sub` inset inside the heroes pane.
 */
export function NotesBox({ notes, compact }: { notes: string | undefined; compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col',
        compact ? 'gap-1 rounded-md bg-muted p-4' : 'gap-3 rounded-lg bg-card p-6',
      )}
      aria-label="Notes"
    >
      <span className={compact ? 'text-sm text-muted-foreground' : 'text-xl font-medium'}>
        Notes
      </span>
      <p className="m-0 text-base whitespace-pre-wrap [overflow-wrap:anywhere]">
        {notes || <span className="text-muted-foreground">No notes yet.</span>}
      </p>
    </div>
  );
}
