// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Stamina callout from character-sheet.png: caps STAMINA, the large current value over the
 * maximum, the bar with its Winded tick, `Winded at n` and `Recovery n`, the Recoveries pips and
 * the Heroic Resource in brick red. The spec-required rows the mockup lacks (temporary Stamina,
 * Surges, Victories, turn state) keep the same style. Every number is the projection's; every
 * control submits its existing registered operation (Catch Breath, `/hero recover`, `/adjust`).
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
    <div className={cn('flex items-center justify-between gap-2 text-sm', className)}>
      <span className="caps text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 font-bold tabular-nums">{children}</span>
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
      />
    ) : null;
  return (
    <div
      className={cn(
        'flex flex-col rounded-md border border-rule-strong bg-card shadow-hard',
        compact ? 'gap-2 p-3' : 'gap-3 p-4',
      )}
      aria-label="Stamina"
      data-sheet-stamina
    >
      {live ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <span className="caps text-muted-foreground">Stamina</span>
            <span className="flex items-baseline gap-1.5">
              <span className="flex items-baseline gap-1 tabular-nums" data-sheet-stamina-value>
                <strong className={compact ? 'text-xl' : 'text-2xl'}>{live.stamina}</strong>{' '}
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
            windedAt={live.labels.windedValue}
            label={`${sheet.name} Stamina`}
          />
          <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Winded at {live.labels.windedValue}
              {live.labels.winded && <strong className="ml-1 text-primary">Winded</strong>}
            </span>
            <span>Recovery {pending(baseline?.recoveryValue.value)}</span>
          </div>
          {(live.temporaryStamina > 0 || canEdit) && (
            <Row label="Temporary">
              <span
                className={live.temporaryStamina > 0 ? 'text-foreground' : 'text-muted-foreground'}
              >
                +{live.temporaryStamina} temporary
              </span>
              {edit('temporary-stamina', 'Temporary Stamina', live.temporaryStamina)}
            </Row>
          )}
          <div
            className={cn('grid gap-3', compact ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_auto]')}
          >
            <div className="flex flex-col gap-1">
              <span className="flex items-baseline gap-2">
                <span className="caps text-muted-foreground">Recoveries</span>
                <span className="text-xs font-bold tabular-nums">
                  {live.recoveries} / {pending(baseline?.recoveriesMaximum.value)}
                </span>
                {edit('recoveries', 'Recoveries', live.recoveries)}
              </span>
              <PipRow
                filled={live.recoveries}
                total={baseline?.recoveriesMaximum.value ?? 0}
                label={`Recoveries ${live.recoveries} of ${pending(baseline?.recoveriesMaximum.value)}`}
              />
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="caps text-muted-foreground">{live.heroicResource.name}</span>
              <span className="flex items-center gap-1">
                <strong
                  className={cn('tabular-nums text-primary', compact ? 'text-lg' : 'text-xl')}
                  data-sheet-heroic-resource
                >
                  {live.heroicResource.current}
                </strong>
                {edit('heroic-resource', 'Heroic Resource', live.heroicResource.current)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Row label="Surges">
              {live.surges}
              {edit('surges', 'Surges', live.surges)}
            </Row>
            <Row label="Victories">
              {live.victories}
              {edit('victories', 'Victories', live.victories)}
            </Row>
          </div>
          {turnState}
          {campaignId && (!compact || sheet.viewer.controls) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
              <CatchBreathButton
                campaignId={campaignId}
                characterId={sheet.id}
                disabled={!canAct}
              />
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
              />
              {extraControls}
            </div>
          )}
        </>
      ) : (
        <>
          <span className="caps text-muted-foreground">Stamina</span>
          <p className="m-0 text-sm text-muted-foreground">
            No live values: they are initialized when the build is admitted to a campaign.
          </p>
          {baseline && (
            <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
              <span>Maximum {baseline.staminaMaximum.value}</span>
              <span>Recovery {baseline.recoveryValue.value}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
