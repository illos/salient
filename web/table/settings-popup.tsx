// SPDX-License-Identifier: GPL-3.0-only
/**
 * SettingsPopup: the Director's table settings in the app-wide card (OverlayCard), opened from
 * the gear in the Foes heading. Three rows in the account-mockup style (label, one-line
 * description, control at the right): Monster health display (Bar / Numerical / Winded),
 * Show Malice, Show test difficulty. Each control submits the same registered operation the
 * pane-body buttons did before V21; the current value is read from `table.roster.settings`,
 * which the server returns to the Director only.
 *
 * Owning specifications: docs/table-spec.md#confirmed-combat-layout (settings pop-up decision),
 * #monster-visibility-and-health-display, #malice-visibility (test difficulty visibility: the same campaign settings section).
 */
import { useMutation } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { OverlayCard } from '../components/overlay-card';
import { ErrorNotice, useCommand } from '../ui';
import type { Roster } from './foe-sheet';

type Settings = NonNullable<Roster['settings']>;
type HealthMode = Settings['healthDisplay'];

const MODES: { mode: HealthMode; label: string }[] = [
  { mode: 'bar', label: 'Bar' },
  { mode: 'numerical', label: 'Numerical' },
  { mode: 'winded', label: 'Winded' },
];

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rule-soft flex items-center justify-between gap-6 py-4 last:border-b-0">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-bold">{label}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </li>
  );
}

/** Three-chip segmented control; the current mode is filled ink and not resubmittable. */
function HealthDisplayControl({
  campaignId,
  current,
}: {
  campaignId: Id<'campaigns'>;
  current: HealthMode;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span
        role="group"
        aria-label="Monster health display"
        className="inline-flex overflow-hidden rounded-md border border-rule-strong"
      >
        {MODES.map(({ mode, label }) => {
          const text = `/campaign health-display mode=${mode}`;
          const active = current === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={active}
              title={text}
              disabled={active || command.pending}
              onClick={() =>
                void command.run(
                  commandId => submit({ campaignId, text, commandId }),
                  JSON.stringify(['quick', campaignId, text]),
                )
              }
              className={cn(
                'caps h-8 cursor-pointer border-0 border-l border-rule-strong bg-background px-3 text-foreground transition-colors duration-(--motion-fast) first:border-l-0 hover:bg-muted disabled:cursor-default',
                active && 'bg-foreground text-background hover:bg-foreground disabled:opacity-100',
              )}
            >
              {label}
            </button>
          );
        })}
      </span>
      <ErrorNotice error={command.error} />
    </span>
  );
}

/** An on/off switch that submits `/campaign <setting> state=on|off`. */
function SettingSwitch({
  campaignId,
  label,
  setting,
  checked,
}: {
  campaignId: Id<'campaigns'>;
  label: string;
  setting: 'malice-visible' | 'test-difficulty-visible';
  checked: boolean;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const text = `/campaign ${setting} state=${checked ? 'off' : 'on'}`;
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        title={text}
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => submit({ campaignId, text, commandId }),
            JSON.stringify(['quick', campaignId, text]),
          )
        }
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-0 p-0 transition-colors duration-(--motion-fast) disabled:opacity-50',
          checked ? 'bg-foreground' : 'bg-input',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-background transition-[left] duration-(--motion-fast)',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>
      <ErrorNotice error={command.error} />
    </span>
  );
}

export function SettingsPopup({
  campaignId,
  settings,
  open,
  onOpenChange,
}: {
  campaignId: Id<'campaigns'>;
  settings: Settings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <OverlayCard
      open={open}
      onOpenChange={onOpenChange}
      title="Table settings"
      eyebrow="Campaign presentation"
      closeLabel="Close settings"
      className="w-[min(560px,calc(100vw-2rem))]"
    >
      <ul className="m-0 list-none p-0">
        <SettingRow
          label="Monster health display"
          description="How players and observers see each foe's Stamina."
        >
          <HealthDisplayControl campaignId={campaignId} current={settings.healthDisplay} />
        </SettingRow>
        <SettingRow
          label="Show Malice"
          description="Players and observers see the shared Malice pool."
        >
          <SettingSwitch
            campaignId={campaignId}
            label="Show Malice"
            setting="malice-visible"
            checked={settings.showMalice}
          />
        </SettingRow>
        <SettingRow
          label="Show test difficulty"
          description="Players and observers see the difficulty of rolled tests."
        >
          <SettingSwitch
            campaignId={campaignId}
            label="Show test difficulty"
            setting="test-difficulty-visible"
            checked={settings.showTestDifficulty}
          />
        </SettingRow>
      </ul>
    </OverlayCard>
  );
}
