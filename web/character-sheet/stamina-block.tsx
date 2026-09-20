// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Stamina panel (docs/design-mockups/quiet/README.md, stamina card): the label, the hero
 * number over the maximum, the 6px bar, `Winded at n` (accent once winded) and `Recovery n`, then
 * the Recoveries pips, the Heroic Resource (an accent dot before its label) and the Surges,
 * Victories and turn-state rows below hairlines. The spec-required rows the mockup lacks
 * (temporary Stamina, Surges, Victories, turn state) keep the same style. Every number is the
 * projection's; every control submits its existing registered operation (Catch Breath,
 * `/hero recover`, `/adjust`).
 */
import { cn } from 'cn';
import type { Id } from '../../convex/_generated/dataModel';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import { HealthBar } from '../components/health-bar';
import { PipRow } from '../components/pip-row';
import { AdjustControl, CatchBreathButton, SlashButton, actorRef } from './controls';
import { pending } from './sections';

function Row({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-2 text-base', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 font-medium tabular-nums">{children}</span>
    </div>
  );
}

export function StaminaBlock({
  sheet,
  compact,
  campaignId,
  canAct,
  canEdit,
  turnState,
  extraControls,
}: {
  sheet: HeroSheet;
  compact?: boolean;
  campaignId: Id<'campaigns'> | null;
  canAct: boolean;
  canEdit: boolean;
  /** The shared turn-state line (index.tsx); rendered as the last row. */
  turnState?: React.ReactNode;
  /** Controls placed after Catch Breath and Spend a Recovery (the labeled Roll test entry). */
  extraControls?: React.ReactNode;
}) {
  const live = sheet.live;
  const baseline = sheet.build?.baseline ?? null;
  const actor = actorRef(sheet.id);
  const edit = (field: string, label: string, current: number) =>
    canEdit && campaignId ? (
      <AdjustControl
        campaignId={campaignId}
        characterId={sheet.id}
        field={field}
        label={label}
        current={current}
        inset={compact}
      />
    ) : null;
  // Inside the heroes pane (itself a `card` panel) the block is a `sub` inset, so its tonal
  // controls step up to `ph`.
  const control = compact ? 'bg-placeholder' : undefined;
  return (
    <div
      className={cn(
        'flex flex-col',
        compact ? 'gap-3 rounded-md bg-muted p-4' : 'gap-4 rounded-lg bg-card p-6',
      )}
      aria-label="Stamina"
      data-sheet-stamina
    >
      {live ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <span className="text-sm text-muted-foreground">Stamina</span>
            <span className="flex items-baseline gap-1.5">
              <span className="flex items-baseline gap-1 tabular-nums" data-sheet-stamina-value>
                <strong className={cn('font-medium', compact ? 'text-2xl' : 'text-4xl')}>
                  {live.stamina}
                </strong>{' '}
                <span className="text-sm text-muted-foreground">
                  / {pending(baseline?.staminaMaximum.value)}
                </span>
              </span>
              {edit('stamina', 'Stamina', live.stamina)}
            </span>
          </div>
          <HealthBar
            value={live.stamina}
            max={baseline?.staminaMaximum.value ?? 0}
            tone="hero"
            low={live.labels.windedValue}
            label={`${sheet.name} Stamina`}
          />
          <div className="flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
            <span className={cn(live.labels.winded && 'text-primary')}>
              Winded at {live.labels.windedValue}
              {live.labels.winded && (
                <strong className="ml-1 font-medium text-primary">Winded</strong>
              )}
            </span>
            <span>Recovery {pending(baseline?.recoveryValue.value)}</span>
          </div>
          {(live.temporaryStamina > 0 || canEdit) && (
            <Row label="Temporary" className="min-h-11">
              <span
                className={live.temporaryStamina > 0 ? 'text-foreground' : 'text-muted-foreground'}
              >
                +{live.temporaryStamina} temporary
              </span>
              {edit('temporary-stamina', 'Temporary Stamina', live.temporaryStamina)}
            </Row>
          )}
          <div
            className={cn('flex flex-col gap-2 border-t border-border', compact ? 'pt-3' : 'pt-4')}
          >
            <span className="flex items-baseline justify-between gap-2 text-base">
              <span className="text-muted-foreground">Recoveries</span>
              <span className="flex items-center gap-1">
                <span className="font-medium tabular-nums">
                  {live.recoveries} / {pending(baseline?.recoveriesMaximum.value)}
                </span>
                {edit('recoveries', 'Recoveries', live.recoveries)}
              </span>
            </span>
            <PipRow
              filled={live.recoveries}
              total={baseline?.recoveriesMaximum.value ?? 0}
              label={`Recoveries ${live.recoveries} of ${pending(baseline?.recoveriesMaximum.value)}`}
            />
          </div>
          <div
            className={cn(
              'flex min-h-11 items-center justify-between gap-2 border-t border-border text-base',
              compact ? 'pt-3' : 'pt-4',
            )}
          >
            <span className="flex items-center gap-2 text-foreground">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
              {live.heroicResource.name}
            </span>
            <span className="flex items-center gap-1">
              <strong
                className={cn(
                  'font-medium text-foreground tabular-nums',
                  compact ? 'text-xl' : 'text-2xl',
                )}
                data-sheet-heroic-resource
              >
                {live.heroicResource.current}
              </strong>
              {edit('heroic-resource', 'Heroic Resource', live.heroicResource.current)}
            </span>
          </div>
          <div
            className={cn('flex flex-col gap-2 border-t border-border', compact ? 'pt-3' : 'pt-4')}
          >
            <Row label="Surges">
              {live.surges}
              {edit('surges', 'Surges', live.surges)}
            </Row>
            <Row label="Victories">
              {live.victories}
              {edit('victories', 'Victories', live.victories)}
            </Row>
            {turnState}
          </div>
          {campaignId && (!compact || sheet.viewer.controls) && (
            <div
              className={cn(
                'flex flex-col gap-2 border-t border-border',
                compact ? 'pt-3' : 'pt-4',
              )}
            >
              <CatchBreathButton
                campaignId={campaignId}
                characterId={sheet.id}
                disabled={!canAct}
                className={cn('h-11 w-full', control)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <SlashButton
                  campaignId={campaignId}
                  text={`${actor} /hero recover`}
                  label="Spend a Recovery"
                  disabled={!canAct}
                  title={
                    canAct
                      ? `${actor} /hero recover`
                      : 'Needs a running session and control of this hero'
                  }
                  className={control}
                />
                {extraControls}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <span className="text-sm text-muted-foreground">Stamina</span>
          <p className="m-0 text-base text-muted-foreground">
            No live values: they are initialized when the build is admitted to a campaign.
          </p>
          {baseline && (
            <div className="flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
              <span>Maximum {baseline.staminaMaximum.value}</span>
              <span>Recovery {baseline.recoveryValue.value}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
