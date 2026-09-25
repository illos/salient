// SPDX-License-Identifier: GPL-3.0-only
/**
 * SettingsPopup: the Director's table settings in the app-wide card (OverlayCard), opened from
 * the gear in the Foes heading. Rows in the account-mockup style (label, one-line description,
 * control at the right): the presentation settings — Monster health display (Bar / Numerical /
 * Winded), Show Malice, Show test difficulty — the Enable user undo campaign setting and V190's
 * XP per level (a slider snapping to Double 8, Standard 16 and Half 32, plus a whole-number input
 * for a custom pace from 1 to 200; docs/table-spec.md#respite-mode). Each
 * control submits the same registered operation it did before it moved here, and every value is
 * read from `table.roster.settings`, which the server returns to the Director only.
 *
 * Rewind and Redo are not here. V29 moved them in with the toggle; the user corrected that in V31
 * (docs/build/V31-history-control-placement.md) — they are actions taken during play and live in
 * the log pane's tab row as a discreet icon pair, while only the campaign setting belongs here.
 *
 * Owning specifications: docs/table-spec.md#confirmed-combat-layout (settings pop-up decision, and
 * the corrected 2026-09-16 history placement),
 * #monster-visibility-and-health-display, #malice-visibility (test difficulty visibility: the same campaign settings section),
 * #undo-permissions-and-proposed-campaign-control.
 */
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { OverlayCard } from '../components/overlay-card';
import { useCommand } from '../ui';
import { Input } from '../components/ui/input';
import {
  XP_PER_LEVEL_MAX,
  XP_PER_LEVEL_MIN,
  XP_PER_LEVEL_PRESETS,
} from '../../shared/evaluate/xpAdvancement';
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
        <span className="text-base font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </li>
  );
}

/** Three-tab segmented control on a `sub` track; the current mode is the `ph` pill in ink and not resubmittable. */
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
        className="inline-flex h-9 items-center rounded-full bg-muted p-1"
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
                'h-7 cursor-pointer rounded-full border-0 bg-transparent px-3 text-sm font-medium text-muted-foreground transition-colors duration-(--motion-fast) hover:text-foreground disabled:cursor-default disabled:opacity-40',
                active && 'bg-accent text-foreground disabled:opacity-100',
              )}
            >
              {label}
            </button>
          );
        })}
      </span>
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
  setting: 'malice-visible' | 'test-difficulty-visible' | 'user-undo';
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
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-0 p-0 transition-colors duration-(--motion-fast) disabled:opacity-40',
          checked ? 'bg-primary' : 'bg-placeholder',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 size-5 rounded-full transition-[left] duration-(--motion-fast)',
            checked ? 'left-[22px] bg-primary-foreground' : 'left-0.5 bg-foreground',
          )}
        />
      </button>
    </span>
  );
}

/** The slider covers 1–48 and snaps to a preset within 2; the number input takes any 1–200. */
const SLIDER_MAX = 48;
const snap = (value: number) =>
  XP_PER_LEVEL_PRESETS.find(p => Math.abs(p.value - value) <= 2)?.value ?? value;

/** XP per level: submits `/campaign xp-per-level value=<n>` when the slider is released (pointer up, or blur/Enter from the keyboard), a preset is chosen, or the input is committed. */
function XpPerLevelControl({
  campaignId,
  current,
}: {
  campaignId: Id<'campaigns'>;
  current: number;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const [draft, setDraft] = useState(String(current));
  // A new server value replaces the draft (React's "adjusting state when a prop changes").
  const [shown, setShown] = useState(current);
  if (shown !== current) {
    setShown(current);
    setDraft(String(current));
  }
  const commit = (raw: string) => {
    const value = Number(raw);
    // Never submit an empty or non-numeric value; the server refuses out-of-range numbers.
    if (!raw.trim() || !Number.isFinite(value) || value === current)
      return setDraft(String(current));
    const text = `/campaign xp-per-level value=${value}`;
    void command
      .run(
        commandId => submit({ campaignId, text, commandId }),
        JSON.stringify(['quick', campaignId, text]),
      )
      .then(ok => {
        if (!ok) setDraft(String(current));
      });
  };
  const numeric = Number(draft);
  const invalid =
    !Number.isInteger(numeric) || numeric < XP_PER_LEVEL_MIN || numeric > XP_PER_LEVEL_MAX;
  return (
    <span className="flex flex-col gap-2">
      <span className="flex items-center gap-4">
        <input
          type="range"
          aria-label="XP per level slider"
          min={XP_PER_LEVEL_MIN}
          max={SLIDER_MAX}
          step={1}
          list="xp-per-level-presets"
          value={Math.min(SLIDER_MAX, invalid ? current : numeric)}
          disabled={command.pending}
          onChange={e => setDraft(String(snap(Number(e.target.value))))}
          onPointerUp={() => commit(draft)}
          onBlur={() => commit(draft)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit(draft);
          }}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-primary disabled:opacity-40"
        />
        <datalist id="xp-per-level-presets">
          {XP_PER_LEVEL_PRESETS.map(p => (
            <option key={p.value} value={p.value} label={p.label} />
          ))}
        </datalist>
        <Input
          type="number"
          inputMode="numeric"
          aria-label="XP per level"
          min={XP_PER_LEVEL_MIN}
          max={XP_PER_LEVEL_MAX}
          step={1}
          value={draft}
          aria-invalid={invalid || undefined}
          disabled={command.pending}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit(draft);
          }}
          className="w-20 shrink-0 text-right tabular-nums"
        />
      </span>
      <span
        role="group"
        aria-label="XP per level presets"
        className="inline-flex h-9 w-fit items-center rounded-full bg-muted p-1"
      >
        {XP_PER_LEVEL_PRESETS.map(p => (
          <button
            key={p.value}
            type="button"
            aria-pressed={current === p.value}
            title={`/campaign xp-per-level value=${p.value}`}
            disabled={current === p.value || command.pending}
            onClick={() => commit(String(p.value))}
            className={cn(
              'h-7 cursor-pointer rounded-full border-0 bg-transparent px-3 text-sm font-medium text-muted-foreground transition-colors duration-(--motion-fast) hover:text-foreground disabled:cursor-default disabled:opacity-40',
              current === p.value && 'bg-accent text-foreground disabled:opacity-100',
            )}
          >
            {p.label} {p.value}
          </button>
        ))}
      </span>
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
      eyebrow="Campaign settings"
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
        <SettingRow
          label="Enable user undo"
          description="Players may undo and redo their own recent actions."
        >
          <SettingSwitch
            campaignId={campaignId}
            label="Enable user undo"
            setting="user-undo"
            checked={settings.enableUserUndo}
          />
        </SettingRow>
        <li className="rule-soft flex flex-col gap-3 py-4 last:border-b-0">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-base font-medium">XP per level</span>
            <span className="text-sm text-muted-foreground">
              XP each level needs, from {XP_PER_LEVEL_MIN} to {XP_PER_LEVEL_MAX}. Applies from the
              next completed respite.
            </span>
          </span>
          <XpPerLevelControl campaignId={campaignId} current={settings.xpPerLevel} />
        </li>
      </ul>
    </OverlayCard>
  );
}
