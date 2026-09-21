// SPDX-License-Identifier: GPL-3.0-only
/**
 * The starting-culture chooser (V96): one card per preset in a grid, grouped ancestral,
 * professional, then bespoke at the bottom, after the user's 2026-09-21 layout direction. Each
 * card names the culture and shows the choices it makes as chips, its three aspects plus its
 * language when the preset carries one, so the pick is made from the card rather than from a
 * collapsed list.
 *
 * Quiet (docs/design-mockups/quiet/README.md): cards are `sub` insets inside the step panel with
 * the selected card taking the inset accent ring, group labels are sentence case rather than
 * tracked uppercase, and no per-card category badge repeats its own group heading. The aspect
 * chips stay muted and take no accent: the ring already carries the selection, and the chips are
 * metadata. They are short pills at the 13px floor the theme sets, not smaller type.
 *
 * Presentation only: the cards are native radios in one group, and choosing one sends the same
 * value through the same shared choice transition the select sent before.
 */
import { cn } from 'cn';
import { Chip } from '../components/chip';
import {
  BESPOKE_CULTURE,
  CULTURE_PRESETS,
  findCulturePreset,
  type CulturePreset,
} from '../../shared/content/culture-presets';

/** The choices a preset makes, in the wizard's own aspect order. */
function aspects(preset: CulturePreset): string[] {
  const list = [preset.environment, preset.organization, preset.upbringing];
  return preset.language ? [...list, preset.language] : list;
}

function CultureCard({
  name,
  choices,
  note,
  checked,
  onChange,
}: {
  name: string;
  /** The preset's aspect values, shown as chips: the card reads back what picking it selects. */
  choices: string[];
  /** Used only where there is nothing to read back yet, as on the bespoke card. */
  note?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col gap-2.5 rounded-md bg-muted p-4 transition-colors duration-(--motion-fast)',
        checked ? 'ring-1 ring-primary ring-inset' : 'hover:bg-accent',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
      )}
    >
      <input
        type="radio"
        name="culture-preset"
        aria-label={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-base font-medium">{name}</span>
      {choices.length > 0 && (
        <span className="flex flex-wrap gap-1">
          {choices.map(choice => (
            <Chip key={choice} className="h-5 bg-placeholder px-2">
              {choice}
            </Chip>
          ))}
        </span>
      )}
      {note && <span className="text-sm text-muted-foreground">{note}</span>}
    </label>
  );
}

function CultureGroup({
  label,
  note,
  children,
}: {
  label: string;
  /** A clarification that belongs to this group rather than to the whole chooser. */
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="m-0 text-sm font-normal text-muted-foreground">
        {label}
        {note && <span className="ml-2 text-muted-foreground">{note}</span>}
      </h4>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-2">{children}</div>
    </section>
  );
}

/** Uses the ordinary shared choice transition; no culture-specific save or hidden UI state. */
export function CulturePresetSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const preset = findCulturePreset(value);
  const group = (category: CulturePreset['category']) =>
    CULTURE_PRESETS.filter(entry => entry.category === category).map(entry => (
      <CultureCard
        key={entry.id}
        name={entry.name}
        choices={aspects(entry)}
        checked={preset?.id === entry.id}
        onChange={() => onChange(entry.name)}
      />
    ));
  return (
    <div className="flex flex-col gap-5" role="radiogroup" aria-label="Starting culture">
      <CultureGroup label="Ancestral cultures" note="Available to heroes of any ancestry.">
        {group('ancestral')}
      </CultureGroup>
      <CultureGroup label="Professional cultures">{group('professional')}</CultureGroup>
      <CultureGroup label="Bespoke culture">
        <CultureCard
          name="Build your own"
          choices={[]}
          note="Choose any environment, organization and upbringing."
          checked={value === BESPOKE_CULTURE}
          onChange={() => onChange(BESPOKE_CULTURE)}
        />
      </CultureGroup>
    </div>
  );
}
