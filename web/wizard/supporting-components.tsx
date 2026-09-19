// SPDX-License-Identifier: GPL-3.0-only
/** Supporting choices reuse the public, complete Compendium reader without leaving the draft. */
import { lazy, Suspense, useState } from 'react';
import type { Decision } from '../../shared/evaluate/definitions';
import type { PartialBaseline } from '../../shared/contracts/characterEvaluation';
import type { RuleSummary } from '../../shared/contracts/rules';
import { CAREER_INCIDENTS } from '../../shared/content/supporting-backgrounds';
import { SUPPORTING_LANGUAGES } from '../../shared/content/supporting-languages';
import compendiumManifest from '../../shared/content/compendium/manifest.json';
import { CoreSource } from '../components/core-content';
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { RuleArticleView } from '../rules/article';
import { useRulesCatalog } from '../rules/content';
import { RuleLink } from '../rules/link';
import { resolveRule } from '../rules/reference';
import { isSupported } from '../../shared/evaluate/structure';

const RulePreview = lazy(() => import('../rules/preview'));
const skillSources = new Map(
  compendiumManifest.entries
    .filter(entry => entry.kind === 'skill')
    .map(entry => [entry.name, entry.sourcePath]),
);
const readableLabel = (label: string) =>
  label
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, letter => letter.toUpperCase());

/** Large catalogs show names and one selected source, rather than a page of expanded cards. */
export function CatalogSelect({
  decision,
  label,
  value,
  values,
  onChange,
}: {
  decision: Decision;
  label: string;
  value?: string;
  values: string[];
  onChange: (value: string | undefined) => void;
}) {
  const [search, setSearch] = useState('');
  const matches = values.filter(name =>
    name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const visible =
    value && values.includes(value) && !matches.includes(value) ? [value, ...matches] : matches;
  const allowNone =
    decision.optional || (decision.shape.type === 'single' && decision.shape.noneAllowed);
  return (
    <div className="flex flex-col gap-2">
      <Input
        aria-label={`Search ${label.toLowerCase()} options`}
        placeholder="Filter options by name…"
        className="max-w-md"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <select
        aria-label={label}
        className="native-select max-w-md"
        value={value ?? ''}
        onChange={event => onChange(event.target.value || undefined)}
      >
        <option value="">{allowNone ? 'None' : 'Choose…'}</option>
        {visible.map(name => (
          <option key={name} value={name} disabled={!isSupported(decision, name)}>
            {name}
            {isSupported(decision, name) ? '' : ' — not offered yet'}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">
        {matches.length} of {values.length} options match
      </span>
    </div>
  );
}

export function SelectedRuleSource({ sourcePath, name }: { sourcePath: string; name: string }) {
  const { catalog, error } = useRulesCatalog();
  const target = catalog ? resolveRule(catalog, { sourcePath }) : undefined;
  const [followed, setFollowed] = useState<{ entry: RuleSummary; section?: string }>();
  return (
    <section className="mt-3 min-w-0 rounded-md border p-4" aria-label={`${name} full text`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="m-0 text-base font-semibold">{name}</h4>
        <RuleLink sourcePath={sourcePath} label={name} />
      </div>
      {!catalog ? (
        <p className="text-sm" role={error ? 'alert' : 'status'}>
          {error ?? 'Loading source text…'}
        </p>
      ) : !target ? (
        <p className="text-sm" role="status">
          Full source text is unavailable in this content release.
        </p>
      ) : (
        <RuleArticleView
          catalog={catalog}
          entry={target.entry}
          onFollow={(path, section) => {
            const entry = catalog.entries.find(item => item.path === path);
            if (entry) setFollowed({ entry, section });
          }}
        />
      )}
      <Dialog
        open={!!followed}
        onOpenChange={open => {
          if (!open) setFollowed(undefined);
        }}
      >
        {followed && catalog && (
          <Suspense fallback={null}>
            <RulePreview catalog={catalog} initial={followed} />
          </Suspense>
        )}
      </Dialog>
    </section>
  );
}

/** Selected knowledge stays compact; opening a skill loads its complete individual article. */
export function SelectedSkillSource({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const sourcePath = skillSources.get(name);
  if (!sourcePath) return null;
  return (
    <details
      className="rounded-md border p-3 text-sm"
      onToggle={event => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-semibold">{name} · skill description</summary>
      {open && <SelectedRuleSource name={name} sourcePath={sourcePath} />}
    </details>
  );
}

/** Preserve every source table field and the language's complete individual usage text. */
export function SelectedLanguageSource({ name }: { name: string }) {
  const language = SUPPORTING_LANGUAGES[name];
  if (!language) return null;
  return (
    <section className="space-y-2 rounded-md border p-3 text-sm" aria-label={`${name} language`}>
      <div className="flex items-center gap-2">
        <h4 className="m-0 text-sm font-semibold">
          {name} · {language.type} language
        </h4>
        <RuleLink id={language.source.scc} label={`${name} language`} />
      </div>
      {language.tableRows.map((row, index) => (
        <dl key={index} className="m-0 space-y-1">
          {Object.entries(row)
            .filter(([field, value]) => field !== 'language' && value)
            .map(([field, value]) => (
              <div key={field}>
                <dt className="inline font-semibold">{readableLabel(field)}: </dt>
                <dd className="m-0 inline">{value}</dd>
              </div>
            ))}
        </dl>
      ))}
      {language.usageText && <CoreSource source={language.usageText} />}
    </section>
  );
}

/** Incident narrative is reproduced from the source row, including Sailor's repaired extraction. */
export function IncidentText({ career, name }: { career?: string; name: string }) {
  const incident = career ? CAREER_INCIDENTS[career]?.find(item => item.name === name) : undefined;
  if (!incident) return null;
  return (
    <section className="mt-3 rounded-md border p-4" aria-label={`${name} full text`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="m-0 text-base font-semibold">{incident.name}</h4>
        <RuleLink sourcePath={incident.source} label={incident.name} />
      </div>
      <CoreSource source={incident.text} />
    </section>
  );
}

/**
 * V46: movement modes and conditional amounts. These are deliberately not folded into the
 * unconditional immunity/weakness rows above: every entry states the source condition, and
 * nothing here is applied automatically at the table.
 */
export function ConditionalBuildFacts({ baseline }: { baseline: PartialBaseline | null }) {
  const modes = baseline?.movementModes ?? [];
  const effects = baseline?.conditionalEffects ?? [];
  if (!modes.length && !effects.length) return null;
  const label = (effect: NonNullable<PartialBaseline['conditionalEffects']>[number]) =>
    ({
      'rounds-aloft': `${effect.feature}: maximum rounds aloft`,
      'damage-weakness': `${effect.feature}: damage weakness${
        effect.damageType && effect.damageType !== 'all-damage' ? ` (${effect.damageType})` : ''
      }`,
      'extra-strike-damage': `${effect.feature}: extra strike damage`,
    })[effect.effect];
  return (
    <section className="space-y-3 text-sm" aria-label="Conditional grants">
      <h4 className="caps m-0 text-muted-foreground">Movement and conditional effects</h4>
      <p className="m-0 text-muted-foreground">
        These apply only in the situation the source describes, and are resolved at the table.
      </p>
      <dl className="m-0 space-y-3">
        {modes.map(mode => (
          <div key={`mode:${mode.mode}:${mode.sourcePath}`}>
            <dt className="flex items-center gap-1 font-semibold">
              {mode.mode}
              <RuleLink sourcePath={mode.sourcePath} label={mode.mode} />
            </dt>
            <dd className="m-0">
              <span className="inline-flex items-center gap-1">
                Movement mode
                {mode.ruleSourcePath && (
                  <RuleLink sourcePath={mode.ruleSourcePath} label={`${mode.mode} movement rule`} />
                )}
              </span>
              {mode.condition && (
                <p className="mt-1 mb-0 text-muted-foreground">{mode.condition}</p>
              )}
            </dd>
          </div>
        ))}
        {effects.map(effect => (
          <div key={`effect:${effect.feature}:${effect.effect}`}>
            <dt className="flex items-center gap-1 font-semibold">
              {label(effect)}
              <RuleLink sourcePath={effect.sourcePath} label={effect.feature} />
            </dt>
            <dd className="m-0">
              {effect.amount.value}
              <p className="mt-1 mb-0 text-muted-foreground">{effect.condition}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Shared evaluation supplies these facts; this view never recalculates or spends a grant. */
export function SupportingBuildFacts({ baseline }: { baseline: PartialBaseline | null }) {
  if (!baseline) return null;
  const choices = baseline.supportingChoices ?? [];
  const items = baseline.initialItems ?? [];
  const rows = [
    ...(baseline.projectPoints
      ? [{ label: 'Starting project points', value: String(baseline.projectPoints.value) }]
      : []),
    ...(baseline.renownMaximum
      ? [{ label: 'Maximum Renown', value: String(baseline.renownMaximum.value) }]
      : []),
    ...(baseline.skills ?? []).flatMap(skill =>
      skill.bonus
        ? [
            {
              label: `${skill.name} skill bonus`,
              value: `${skill.bonus.value >= 0 ? '+' : ''}${skill.bonus.value}`,
            },
          ]
        : [],
    ),
    ...(baseline.damageImmunities ?? []).map(entry => ({
      label: `${entry.damageType} immunity`,
      value: String(entry.value.value),
    })),
    ...(baseline.damageWeaknesses ?? []).map(entry => ({
      label: `${entry.damageType} weakness`,
      value: String(entry.value.value),
    })),
    ...(baseline.conditionImmunities ?? []).map(entry => ({
      label: 'Condition immunity',
      value: entry.condition,
    })),
  ];
  if (!choices.length && !items.length && !rows.length) return null;
  return (
    <section className="space-y-3 text-sm" aria-label="Supporting build choices">
      <h4 className="caps m-0 text-muted-foreground">Supporting choices and grants</h4>
      <dl className="m-0 space-y-3">
        {rows.map(row => (
          <div key={`${row.label}:${row.value}`}>
            <dt className="font-semibold">{readableLabel(row.label)}</dt>
            <dd className="m-0">{row.value}</dd>
          </div>
        ))}
        {choices.map(choice => (
          <div key={`${choice.decisionId}:${choice.label}`}>
            <dt className="flex items-center gap-1 font-semibold">
              {readableLabel(choice.label)}
              <RuleLink sourcePath={choice.sourcePath} label={readableLabel(choice.label)} />
            </dt>
            <dd className="m-0 whitespace-pre-wrap break-words">
              {choice.sourcePath.endsWith('/strange-inheritance.md') && choice.actor === 'Director'
                ? 'The Director records this choice privately.'
                : choice.values.join(', ')}
              {choice.condition && (
                <p className="mt-1 mb-0 text-muted-foreground">{choice.condition}</p>
              )}
            </dd>
          </div>
        ))}
        {items.map(item => (
          <div key={`${item.decisionId}:${item.name}`}>
            <dt className="flex items-center gap-1 font-semibold">
              {item.state === 'pending-Director' ? 'Director-selected starting item' : item.name}
              <RuleLink sourcePath={item.sourcePath} label="Starting item grant" />
            </dt>
            <dd className="m-0">
              {
                {
                  possessed: 'Starting possession',
                  broken: 'Broken; repair required',
                  absent: 'Not currently possessed',
                  'pending-Director': 'The Director records this item privately.',
                }[item.state]
              }
              {item.condition && (
                <p className="mt-1 mb-0 text-muted-foreground">{item.condition}</p>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
