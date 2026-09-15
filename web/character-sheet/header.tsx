// SPDX-License-Identifier: GPL-3.0-only
/**
 * The sheet's header band from character-sheet.png: disc with initials, the name, a row of caps
 * chips (ancestry, class · subclass, level, kit, campaign), the build status badge and the five
 * characteristic boxes at the right over a hard rule. Selecting a characteristic box opens the
 * shared Roll test flow with that characteristic preselected; nothing rolls until Roll
 * (docs/character-sheet-spec.md#layout-and-content). The compact variant is the same band in the
 * heroes pane: a smaller disc and the boxes in one row.
 */
import { cn } from 'cn';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import type { DerivedBaseline, PartialBaseline } from '../../shared/contracts/characterEvaluation';
import { Badge } from '../components/ui/badge';
import { Chip } from '../components/chip';
import { Disc } from '../components/disc';
import { StatBox } from '../components/stat-box';
import { pending } from './sections';

export type CharacteristicKey = keyof DerivedBaseline['characteristics'];
export const CHARACTERISTICS: [CharacteristicKey, string][] = [
  ['M', 'Might'],
  ['A', 'Agility'],
  ['R', 'Reason'],
  ['I', 'Intuition'],
  ['P', 'Presence'],
];

export function buildLabel(sheet: HeroSheet): string {
  return sheet.build?.label === 'effective'
    ? 'Effective build'
    : sheet.build?.label === 'proposed'
      ? 'Proposed build (awaiting review)'
      : sheet.build?.label === 'draft'
        ? 'Draft preview (not in play)'
        : 'No build yet';
}

export function SheetHeader({
  sheet,
  partial,
  compact,
  rollFor,
  onRollFor,
  children,
}: {
  sheet: HeroSheet;
  partial: PartialBaseline | null;
  compact?: boolean;
  /** The characteristic whose Roll test entry is open, if any. */
  rollFor: CharacteristicKey | null;
  onRollFor: (key: CharacteristicKey | null) => void;
  /** Rendered under the chips (active condition badges in the compact header). */
  children?: React.ReactNode;
}) {
  const Name = compact ? 'h3' : 'h1';
  const chips: { key: string; text: string; filled?: boolean }[] = [
    { key: 'ancestry', text: partial?.ancestry?.value ?? 'Ancestry pending' },
    {
      key: 'class',
      text: partial?.class
        ? `${partial.class.value}${partial.subclass ? ` · ${partial.subclass.value}` : ''}`
        : 'Class pending',
    },
    { key: 'level', text: `Level ${pending(partial?.level?.value)}` },
  ];
  if (partial?.kit) chips.push({ key: 'kit', text: `Kit · ${partial.kit.name.value}` });
  if (sheet.campaign)
    chips.push({ key: 'campaign', text: `Campaign · ${sheet.campaign.name}`, filled: true });
  return (
    <header
      className={cn(
        'rule-strong flex flex-wrap items-start justify-between',
        compact ? 'gap-x-4 gap-y-3 pb-3' : 'gap-x-8 gap-y-4 pb-6',
      )}
    >
      {/* The identity block keeps a floor width so the characteristics wrap to their own line
          in a narrow pane instead of squeezing the hero's name to nothing. */}
      <div
        className={cn(
          'flex flex-1 items-start',
          compact ? 'min-w-[13rem] basis-[13rem] gap-3' : 'min-w-[20rem] gap-6',
        )}
      >
        <Disc
          name={sheet.name}
          size={compact ? 'md' : 'lg'}
          variant={sheet.audience === 'owner' ? 'ink' : 'grey'}
          label={`${sheet.name} portrait`}
        />
        <div className={cn('flex min-w-0 flex-col', compact ? 'gap-1.5' : 'gap-3')}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Name className={cn('m-0 truncate', compact ? 'text-lg' : 'text-3xl')}>
              {sheet.name}
            </Name>
            <span className="flex flex-wrap items-center gap-1">
              <Badge variant={sheet.build?.label === 'effective' ? 'default' : 'outline'}>
                {buildLabel(sheet)}
              </Badge>
              {sheet.build && sheet.build.status !== 'complete' && (
                <Badge variant="outline">{sheet.build.status}</Badge>
              )}
              {sheet.review?.status === 'pending' && (
                <Badge variant="outline">Review pending</Badge>
              )}
              {sheet.combatLocked && <Badge variant="outline">Combat lock</Badge>}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Identity">
            {chips.map(chip => (
              <Chip key={chip.key} caps kind={chip.filled ? 'result' : 'plain'}>
                {chip.text}
              </Chip>
            ))}
            {!compact && (
              <span className="ml-1 text-xs text-muted-foreground">
                {partial?.career?.value ?? 'Career pending'} · owned by {sheet.ownerName}
              </span>
            )}
          </div>
          {children}
        </div>
      </div>
      <div
        className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')}
        role="group"
        aria-label="Characteristics"
      >
        {CHARACTERISTICS.map(([key, name]) => {
          const value = pending(partial?.characteristics?.[key]?.value);
          const open = rollFor === key;
          return (
            <button
              key={key}
              type="button"
              className="group/stat rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-pressed={open}
              aria-label={`${name} ${value}`}
              title={`Open the Roll test flow with ${name} selected`}
              onClick={() => onRollFor(open ? null : key)}
            >
              <StatBox
                value={value}
                label={compact ? key : name}
                compact={compact}
                emphasis={open}
                className={cn(
                  'transition-colors group-hover/stat:bg-muted',
                  !compact && 'h-20 min-w-[84px]',
                )}
              />
            </button>
          );
        })}
      </div>
    </header>
  );
}
