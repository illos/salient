import { Glyph } from '../components/glyph';
// SPDX-License-Identifier: GPL-3.0-only
/**
 * The sheet's header band (docs/design-mockups/quiet/README.md, identity header): disc with
 * initials, the name, one muted identity line (ancestry · class · subclass · level · kit ·
 * campaign), the build status badges and the five characteristic tiles at the right. Selecting a
 * characteristic tile opens the shared Roll test flow with that characteristic preselected;
 * nothing rolls until Roll (docs/character-sheet-spec.md#layout-and-content). The compact variant
 * is the same band in the heroes pane: a smaller disc and the tiles in one row as `sub` insets.
 */
import { cn } from 'cn';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import type { DerivedBaseline, PartialBaseline } from '../../shared/contracts/characterEvaluation';
import { Badge } from '../components/ui/badge';
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
  /** Rendered under the identity line (active condition badges in the compact header). */
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
        'flex flex-wrap items-start justify-between',
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
        <div className={cn('flex min-w-0 flex-col', compact ? 'gap-1.5' : 'gap-2')}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Name className={cn('m-0 truncate font-medium', compact ? 'text-lg' : 'text-3xl')}>
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
          {/* One muted line; a CSS middle dot separates the items so no text changes. */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground [&>*+*]:before:mr-2 [&>*+*]:before:content-['·']",
              compact ? 'text-sm' : 'text-base',
            )}
            aria-label="Identity"
          >
            {chips.map(chip => (
              <span key={chip.key} className={cn(chip.filled && 'text-foreground')}>
                {chip.text}
              </span>
            ))}
            {!compact && (
              <span>
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
              className="group/stat rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-pressed={open}
              aria-label={`${name} ${value}`}
              title={`Open the Roll test flow with ${name} selected`}
              onClick={() => onRollFor(open ? null : key)}
            >
              <StatBox
                value={value}
                label={
                  <Glyph
                    token={{
                      kind: compact ? 'characteristic' : 'characteristicName',
                      characteristic: key,
                    }}
                  />
                }
                compact={compact}
                emphasis={open}
                inset={compact}
                className={cn(
                  'transition-colors',
                  compact ? 'group-hover/stat:bg-accent' : 'group-hover/stat:bg-muted',
                )}
              />
            </button>
          );
        })}
      </div>
    </header>
  );
}
