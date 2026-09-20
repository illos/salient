// SPDX-License-Identifier: GPL-3.0-only
import {
  BESPOKE_CULTURE,
  CULTURE_PRESETS,
  findCulturePreset,
} from '../../shared/content/culture-presets';

/** Uses the ordinary shared choice transition; no culture-specific save or hidden UI state. */
export function CulturePresetSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const preset = findCulturePreset(value);
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-sm text-muted-foreground">
        Choose a starting culture or build your own. Every choice below can be adjusted. Ancestral
        cultures are available to heroes of any ancestry.
      </p>
      <select
        className="native-select max-w-sm"
        aria-label="Starting culture"
        value={value ?? ''}
        onChange={event => onChange(event.target.value || undefined)}
      >
        <option value="">Choose…</option>
        <optgroup label="Ancestral cultures">
          {CULTURE_PRESETS.filter(entry => entry.category === 'ancestral').map(entry => (
            <option key={entry.id} value={entry.name}>
              {entry.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Professional cultures">
          {CULTURE_PRESETS.filter(entry => entry.category === 'professional').map(entry => (
            <option key={entry.id} value={entry.name}>
              {entry.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Bespoke culture">
          <option value={BESPOKE_CULTURE}>Build your own</option>
        </optgroup>
      </select>
      {preset && (
        <p className="m-0 text-base">
          {preset.environment} · {preset.organization} · {preset.upbringing}
          {preset.language ? ` · ${preset.language}` : ' · Choose a language below'}
        </p>
      )}
      <p className="m-0 text-sm text-muted-foreground">
        Choose one skill for each aspect below. Changing an aspect keeps skills that still fit.
      </p>
    </div>
  );
}
