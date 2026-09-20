// SPDX-License-Identifier: GPL-3.0-only
/** Modifiable starting cultures from the pinned Compendium Background chapter tables.
 * An ancestral culture never restricts the hero's ancestry. These presets grant no extra rules.
 */
import type { DecisionDefinitions } from '../evaluate/definitions.ts';

export const CULTURE_PRESET_SOURCE = 'en/unified/md/chapter/background.md';
export const BESPOKE_CULTURE = 'Bespoke';

export interface CulturePreset {
  id: string;
  name: string;
  category: 'ancestral' | 'professional';
  environment: 'Nomadic' | 'Rural' | 'Secluded' | 'Urban' | 'Wilderness';
  organization: 'Bureaucratic' | 'Communal';
  upbringing: 'Academic' | 'Creative' | 'Lawless' | 'Labor' | 'Martial' | 'Noble';
  language?: string;
  sourcePath: string;
  sourceHeading: string;
}

type PresetRow = Pick<
  CulturePreset,
  'name' | 'environment' | 'organization' | 'upbringing' | 'language'
>;
const ancestral: PresetRow[] = [
  {
    name: 'Devil',
    language: 'Anjali',
    environment: 'Urban',
    organization: 'Bureaucratic',
    upbringing: 'Academic',
  },
  {
    name: 'Dragon Knight',
    language: 'Vastariax',
    environment: 'Secluded',
    organization: 'Bureaucratic',
    upbringing: 'Martial',
  },
  {
    name: 'Dwarf',
    language: 'Zaliac',
    environment: 'Secluded',
    organization: 'Bureaucratic',
    upbringing: 'Creative',
  },
  {
    name: 'Wode Elf',
    language: 'Yllyric',
    environment: 'Wilderness',
    organization: 'Bureaucratic',
    upbringing: 'Martial',
  },
  {
    name: 'High Elf',
    language: 'Hyrallic',
    environment: 'Secluded',
    organization: 'Bureaucratic',
    upbringing: 'Martial',
  },
  {
    name: 'Hakaan',
    language: 'Vhoric',
    environment: 'Rural',
    organization: 'Communal',
    upbringing: 'Labor',
  },
  {
    name: 'Human',
    language: 'Vaslorian',
    environment: 'Urban',
    organization: 'Communal',
    upbringing: 'Labor',
  },
  {
    name: 'Memonek',
    language: 'Axiomatic',
    environment: 'Nomadic',
    organization: 'Communal',
    upbringing: 'Academic',
  },
  {
    name: 'Orc',
    language: 'Kalliak',
    environment: 'Wilderness',
    organization: 'Communal',
    upbringing: 'Creative',
  },
  {
    name: 'Polder',
    language: 'Khoursirian',
    environment: 'Urban',
    organization: 'Communal',
    upbringing: 'Creative',
  },
  {
    name: 'Time Raider',
    language: 'Voll',
    environment: 'Nomadic',
    organization: 'Communal',
    upbringing: 'Martial',
  },
];
const professional: PresetRow[] = [
  {
    name: 'Artisan Guild',
    environment: 'Urban',
    organization: 'Bureaucratic',
    upbringing: 'Creative',
  },
  {
    name: 'Borderland Homestead',
    environment: 'Wilderness',
    organization: 'Communal',
    upbringing: 'Labor',
  },
  {
    name: 'College Conclave',
    environment: 'Urban',
    organization: 'Bureaucratic',
    upbringing: 'Academic',
  },
  { name: 'Criminal Gang', environment: 'Urban', organization: 'Communal', upbringing: 'Lawless' },
  {
    name: 'Farming Village',
    environment: 'Rural',
    organization: 'Bureaucratic',
    upbringing: 'Labor',
  },
  {
    name: 'Herding Community',
    environment: 'Nomadic',
    organization: 'Communal',
    upbringing: 'Labor',
  },
  {
    name: 'Knightly Order',
    environment: 'Secluded',
    organization: 'Bureaucratic',
    upbringing: 'Martial',
  },
  {
    name: 'Laborer Neighborhood',
    environment: 'Urban',
    organization: 'Communal',
    upbringing: 'Labor',
  },
  {
    name: 'Mercenary Band',
    environment: 'Nomadic',
    organization: 'Bureaucratic',
    upbringing: 'Martial',
  },
  {
    name: 'Merchant Caravan',
    environment: 'Nomadic',
    organization: 'Bureaucratic',
    upbringing: 'Creative',
  },
  {
    name: 'Monastic Order',
    environment: 'Secluded',
    organization: 'Bureaucratic',
    upbringing: 'Academic',
  },
  { name: 'Noble House', environment: 'Urban', organization: 'Bureaucratic', upbringing: 'Noble' },
  {
    name: 'Outlaw Band',
    environment: 'Wilderness',
    organization: 'Communal',
    upbringing: 'Lawless',
  },
  { name: 'Pirate Crew', environment: 'Nomadic', organization: 'Communal', upbringing: 'Lawless' },
  {
    name: 'Telepathic Hive',
    environment: 'Secluded',
    organization: 'Communal',
    upbringing: 'Creative',
  },
  {
    name: 'Traveling Entertainers',
    environment: 'Nomadic',
    organization: 'Communal',
    upbringing: 'Creative',
  },
];

function rows(category: CulturePreset['category'], entries: PresetRow[]): CulturePreset[] {
  return entries.map(entry => ({
    ...entry,
    id: `${category}.${entry.name.toLowerCase().replaceAll(' ', '-')}`,
    category,
    sourcePath: CULTURE_PRESET_SOURCE,
    sourceHeading:
      category === 'ancestral' ? 'Typical Ancestry Cultures Table' : 'Archetypical Cultures Table',
  }));
}

export const CULTURE_PRESETS: CulturePreset[] = [
  ...rows('ancestral', ancestral),
  ...rows('professional', professional),
];

export function findCulturePreset(value: unknown): CulturePreset | undefined {
  return CULTURE_PRESETS.find(preset => preset.name === value);
}

/** Optional so existing saved cultures remain complete without a new selection. */
export function extendCultureDefinitions(definitions: DecisionDefinitions): void {
  const step = definitions.steps.find(candidate => candidate.id === 'step.culture');
  if (!step || step.decisions.some(decision => decision.id === 'culture.preset')) return;
  step.decisions.unshift({
    id: 'culture.preset',
    label: 'Starting culture',
    kind: 'choice',
    shape: { type: 'single', count: 1 },
    optional: true,
    source: CULTURE_PRESET_SOURCE,
    quote:
      'You can build your culture one aspect at a time, or you can use the following tables if you want to assess sample cultures or make your own culture quickly.',
    options: [
      {
        id: 'culture.bespoke',
        value: BESPOKE_CULTURE,
        source: CULTURE_PRESET_SOURCE,
        supportedInV001: true,
      },
      ...CULTURE_PRESETS.map(preset => ({
        id: `culture.${preset.id}`,
        value: preset.name,
        source: preset.sourcePath,
        supportedInV001: true,
      })),
    ],
    note: 'A starting culture fills the existing aspects and any printed language default. All choices remain editable; ancestry is independent.',
  });
}
