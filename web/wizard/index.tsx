import { CulturePresetSelect } from './culture-preset';
import { KitChoice } from './kit-choice';
// SPDX-License-Identifier: GPL-3.0-only
/**
 * The shared level-one wizard: a decision flow over the supported class definitions
 * (shared/content/level-one-decisions.ts). Every presented step appears in source order
 * with its decisions; the full option pool is visible with unsupported options labeled; each
 * option and decision links to the embedded rules with readable labels. The "hero so far" is the
 * shared `characters.evaluate` read over the current selections; nothing here derives a value.
 *
 * V21 (docs/build/V21-desktop-layout-fidelity.md item 10): the page is the mockup's full-viewport
 * frame (character-wizard-class.png) with its own header, the step rail, a scrolling centre
 * column with the pinned step navigation, and the hero-so-far column. Presentation only: every
 * decision writes through the same `characters.save` mutation with the same arguments as before.
 *
 * Owning specifications: docs/character-wizard-spec.md#v001-scope, #3-decision-system,
 * #main-creation-and-editing, #10-mobile-interaction-requirements (desktop first for v0.01);
 * docs/build/V37-supporting-character-choices.md (full supporting-choice text and conditional
 * controls). Availability, pools and permanent mechanics are owned by the shared evaluator.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useConvex, useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { definitions as levelOneDefinitions } from '../../shared/content/level-one-decisions';
import { getDefinitions } from '../../shared/content/character-decisions';
import { emptyAuthored, type CharacterAuthored } from '../../shared/characterDraft';
import { findCulturePreset } from '../../shared/content/culture-presets';
import { SUPPORTING_LANGUAGES } from '../../shared/content/supporting-languages';
import type {
  Diagnostic,
  EvaluationResult,
  PartialBaseline,
  SelectionValue,
} from '../../shared/contracts/characterEvaluation';
import type { Decision, DecisionDefinitions, Step } from '../../shared/evaluate/definitions';
import {
  assignCharacteristic,
  assignmentError,
  assignmentContext,
} from '../../shared/evaluate/assignment';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { changeChoice } from '../../shared/evaluate/choiceTransition';
import {
  indexDecisions,
  isAvailable,
  isSupported,
  poolOf,
  unavailableReason,
  type Selections,
} from '../../shared/evaluate/structure';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { StatBox } from '../components/stat-box';
import { ErrorNotice, Field, Loading, Notice, useCommand } from '../ui';
import { RuleLink, RuleReadMore } from '../rules/link';
import { readableRuleText, ruleExcerpt } from '../rules/reference';
import { Button } from '../components/ui/button';
import { useRulesCatalog } from '../rules/content';
import {
  decisionLabel,
  decisionReference,
  primaryDecisionId,
  readableGuidance,
  stepExcerpt,
  stepName,
  stepReference,
} from './presentation';
import { WizardHeader } from './header';
import { StepRail, type RailStep } from './rail';
import { ChoiceList, ChoiceRow, ChoiceSection, StepNav, StepTitle } from './choice-list';
import { cn } from 'cn';
import { HeroSoFar } from './hero-so-far';
import { PrimaryChoice } from './primary-choice';
import {
  CatalogSelect,
  IncidentText,
  SelectedLanguageSource,
  SelectedRuleSource,
  SelectedSkillSource,
} from './supporting-components';

/** Authored decisions that are the character's own fields rather than selections. */
const AUTHORED_FIELDS: Record<string, keyof CharacterAuthored> = {
  'details.name': 'name',
  'details.appearance': 'appearance',
  'details.backstory-and-personality': 'biography',
};

type LoadedCharacter = FunctionReturnType<typeof api.characters.get>;

/**
 * Source steps the wizard does not present (V96, docs/character-wizard-spec.md#main-creation-and-editing):
 * "1. Think" has nothing to record and its reference now sits on the rail heading; "7. Add Free
 * Strikes" grants the same two abilities to every hero and offers no choice, and they already read
 * on the hero column and the sheet; "10. Make Connections" is left to the table. Presentation
 * only: the evaluator still holds every step, `free-strikes.grant` still grants both abilities and
 * still anchors the base Disengage and saving-throw provenance, and the headless route still
 * records `connections.notes`.
 */
const HIDDEN_STEPS = new Set(['step.think', 'step.free-strikes', 'step.connections']);
/**
 * Culture aspects a preset fixes (V96). Choosing a premade culture takes its name and aspects as
 * a set; the three skills stay the player's choice, and Build your own still reaches every
 * combination, including naming the culture.
 */
const PRESET_FIXED_ASPECTS = new Set([
  'culture.name',
  'culture.environment',
  'culture.organization',
  'culture.upbringing',
]);
/**
 * The side panes stick to the viewport while the page itself scrolls (V96): the wizard is one
 * scrolling document rather than three independently scrolling columns, and the header scrolls
 * away with it. A pane taller than the viewport scrolls inside its own sticky box; one that fits
 * shows no scrollbar at all.
 */
const STICKY_PANE =
  'sticky top-(--page-gap) max-h-[calc(100dvh_-_var(--page-gap)_*_2)] overflow-y-auto';
/**
 * Steps the rail nests under the step they depend on (V96). A kit is granted by the class, and
 * which kits are offered follows from it, so it reads as part of the class rather than beside it.
 * The flow is unchanged: the kit is still its own step, in source order, with its own page.
 */
const NESTED_STEPS: Record<string, string> = { 'step.kit': 'step.class' };
/** Anchor for a decision, so the rail can jump to the choice it names (V96). */
const anchorId = (decisionId: string) => `choice-${decisionId.replace(/\./g, '-')}`;
/** The rail heading's reference: the whole Making a Hero chapter. */
const BUILDER_REFERENCE = { id: 'mcdm.heroes.v1/chapter/making-a-hero', label: 'Making a Hero' };

function Diagnostics({ list }: { list: Diagnostic[] | undefined }) {
  if (!list?.length) return null;
  return (
    <ul className="m-0 list-none p-0 text-sm">
      {list.map((d, i) => (
        <li
          key={i}
          className={d.severity === 'warning' ? 'text-muted-foreground' : 'text-destructive'}
        >
          {readableGuidance(d.message)}
        </li>
      ))}
    </ul>
  );
}

/** One selectable value from a pool, disabled and labeled when the v0.01 app does not offer it. */
function PoolSelect({
  decision,
  value,
  values,
  onChange,
  allowOpen,
  label,
}: {
  decision: Decision;
  value: string | null | undefined;
  values: string[];
  onChange: (value: string | null | undefined) => void;
  allowOpen?: boolean;
  label: string;
}) {
  const supported = values.filter(v => isSupported(decision, v));
  const unsupported = values.filter(v => !isSupported(decision, v));
  return (
    <select
      className="native-select max-w-sm"
      aria-label={label}
      value={value === null ? '__open__' : (value ?? '')}
      onChange={event => {
        const next = event.target.value;
        onChange(next === '' ? undefined : next === '__open__' ? null : next);
      }}
    >
      <option value="">
        {decision.optional || (decision.shape.type === 'single' && decision.shape.noneAllowed)
          ? 'None'
          : 'Choose…'}
      </option>
      {(decision.id === 'culture.language' || decision.id.endsWith('.languages')) && (
        <option value="Caelian" disabled>
          Caelian — automatically known common tongue
        </option>
      )}
      {allowOpen && <option value="__open__">Leave open (deferred)</option>}
      {supported.map(v => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
      {unsupported.map(v => (
        <option key={v} value={v} disabled>
          {v} — not offered yet
        </option>
      ))}
    </select>
  );
}

/** Follow structural parents so inactive class/ancestry branches disappear as a unit. */
function belongsToOtherBranch(
  decision: Decision,
  selections: Selections,
  decisions: Map<string, Decision>,
): boolean {
  const condition = decision.availableWhen;
  if (
    condition &&
    selections[condition.decision] !== undefined &&
    selections[condition.decision] !== condition.value
  )
    return true;
  const parentInOtherBranch = (parentId: string) => {
    const parent = decisions.get(parentId);
    return parent ? belongsToOtherBranch(parent, selections, decisions) : false;
  };
  if ((decision.dependsOn ?? []).some(parentInOtherBranch)) return true;
  // Alternative parents: hidden only when none of them can lead here (each is in another branch or
  // is chosen with a value that has no options entry, like a class without a kit).
  const alternatives = decision.dependsOnAny ?? [];
  return (
    alternatives.length > 0 &&
    alternatives.every(parentId => {
      if (parentInOtherBranch(parentId)) return true;
      const value = selections[parentId];
      return (
        decision.optionsByParent !== undefined &&
        typeof value === 'string' &&
        decision.optionsByParent[value] === undefined
      );
    })
  );
}

export function DecisionEditor({
  definitions = levelOneDefinitions,
  decision,
  step,
  selections,
  onSelect,
  authored,
  onAuthored,
  diagnostics,
  lockedBy,
  baseline,
  row,
}: {
  definitions?: DecisionDefinitions;
  decision: Decision;
  step: Step;
  selections: Selections;
  onSelect: (id: string, value: SelectionValue | undefined) => void;
  authored: CharacterAuthored;
  onAuthored: (value: CharacterAuthored) => void;
  diagnostics: Diagnostic[] | undefined;
  /** Name of the preset that fixed this value: show it read-only and say what to do instead. */
  lockedBy?: string;
  /** Evaluated values, for the automatic steps that read them back (base statistics). */
  baseline?: PartialBaseline;
  /**
   * Render as one row of a panel (V96 mockup): the label and this note on the left, the control
   * on the right, instead of the label-above-control section.
   */
  row?: string;
}) {
  const decisions = useMemo(() => indexDecisions(definitions), [definitions]);
  // Shared cached catalog: the reference links on these same rows already hold it.
  const { catalog } = useRulesCatalog();
  const available = isAvailable(decision, selections, decisions);
  const value = selections[decision.id];
  const shape = decision.shape;
  const label = decision.label ?? decisionLabel(decision.id);
  const reference = <RuleLink {...decisionReference(decision, step)} />;
  // Parent-specific branches disappear together; unmet dependencies in the active branch still
  // explain the next choice. This keeps a second class from doubling every wizard section.
  if (
    !available &&
    (decision.availableWhen ||
      decision.conditions?.length ||
      decision.duplicateFixedSkill ||
      belongsToOtherBranch(decision, selections, decisions))
  )
    return null;
  if (!available)
    return (
      <ChoiceSection label={label} reference={reference} muted>
        <p className="m-0 text-sm text-muted-foreground">
          {readableGuidance(
            unavailableReason(decision, decisions) ?? 'Complete the earlier choices first.',
          )}
        </p>
        <Diagnostics list={diagnostics} />
      </ChoiceSection>
    );
  // A chosen preset fixes the aspects it names. The source lets a player "use or modify" a table
  // culture (background.md, before the Typical Ancestry Cultures Table), and Build your own still
  // reaches every combination, so this restricts the path rather than the legal character.
  if (lockedBy)
    return (
      <ChoiceSection label={`${label} — set by the ${lockedBy} culture`} reference={reference}>
        <p className="m-0 rounded-md bg-muted px-4 py-3.5 text-lg font-medium">
          {typeof value === 'string' ? value : 'Pending'}
        </p>
        <Diagnostics list={diagnostics} />
      </ChoiceSection>
    );
  // A base-statistics step reads its values back as tiles, so its own `statistic` grant — the
  // same "size 1M, speed 5, stability 0" sentence — would print them a second time. Drop it and
  // let the source quote stand under the tiles, as it does for an ancestry that grants no text.
  const showsStatTiles =
    decision.kind === 'automatic' && decision.id.endsWith('.base-statistics') && !!baseline;
  const shownGrants = (decision.grants ?? []).filter(
    grant => !(showsStatTiles && grant.kind === 'statistic'),
  );
  if (decision.id === 'kit.choice') {
    const pool = poolOf(decision, selections, definitions);
    return (
      <ChoiceSection label={label} reference={reference}>
        <KitChoice
          decision={decision}
          value={typeof value === 'string' ? value : undefined}
          values={pool.values}
          onChange={next => onSelect(decision.id, next)}
        />
        <Diagnostics list={diagnostics} />
      </ChoiceSection>
    );
  }
  if (decision.id === 'culture.preset')
    return (
      <CulturePresetSelect
        value={typeof value === 'string' ? value : undefined}
        onChange={value => onSelect(decision.id, value)}
      />
    );
  let control: React.ReactNode = null;
  if (decision.kind === 'none') control = null;
  else if (decision.id === 'culture.preset')
    control = (
      <CulturePresetSelect
        value={typeof value === 'string' ? value : undefined}
        onChange={value => onSelect(decision.id, value)}
      />
    );
  else if (decision.kind === 'automatic')
    control = (
      <div className="flex flex-col gap-3">
        {/* The base-statistics step reads its three values back as tiles (V96 mockup). They come
            from the shared evaluation, exactly as the hero column's do; nothing is derived here. */}
        {showsStatTiles && baseline && (
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['Size', baseline.size],
                ['Speed', baseline.speed],
                ['Stability', baseline.stability],
              ] as const
            ).map(([label, entry]) => (
              <span key={label} className="flex flex-col gap-0.5 rounded-md bg-muted px-4 py-3">
                <span
                  className={cn(
                    'text-2xl font-medium tabular-nums',
                    entry === undefined && 'text-base font-normal text-muted-foreground',
                  )}
                >
                  {/* The hero column's word for a value the evaluator has not produced yet.
                      Stability waits for the kit, which can add to it; the source sentence under
                      these tiles still states the ancestry's own 0. */}
                  {entry === undefined ? 'Pending' : String(entry.value)}
                </span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </span>
            ))}
          </div>
        )}
        {shownGrants.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {shownGrants.map((grant, i) => {
              // A granted language names its kind and links its table row, so the card says
              // everything the separate language card below used to.
              const language =
                grant.kind === 'language' ? SUPPORTING_LANGUAGES[grant.value] : undefined;
              return (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-md bg-muted px-4 py-3.5 text-lg font-medium"
                >
                  {language
                    ? `${grant.value} · ${language.type} language`
                    : readableRuleText(grant.value)
                        .replace(/ \(derived in R02\)/g, '')
                        .replace(/manual in v0.01/g, 'resolved at the table')}
                  {language ? (
                    <RuleLink id={language.source.scc} label={`${grant.value} language`} />
                  ) : (
                    grant.source && <RuleLink sourcePath={grant.source} label={grant.value} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!shownGrants.length && decision.quote && (
          <p className="m-0 border-t border-border pt-3 text-sm text-muted-foreground">
            {readableRuleText(decision.quote)}
          </p>
        )}
      </div>
    );
  else if (decision.kind === 'authored') {
    const field = AUTHORED_FIELDS[decision.id];
    const text = field ? authored[field] : typeof value === 'string' ? value : '';
    control =
      field === 'name' ? (
        <Input
          aria-label={label}
          required
          maxLength={100}
          className="max-w-md"
          value={text}
          onChange={event => onAuthored({ ...authored, name: event.target.value })}
        />
      ) : (
        <Textarea
          aria-label={label}
          required={decision.requiredText}
          maxLength={10000}
          className="max-w-2xl"
          value={text}
          onChange={event =>
            field
              ? onAuthored({ ...authored, [field]: event.target.value })
              : onSelect(decision.id, event.target.value || undefined)
          }
        />
      );
  } else if (
    shape.type === 'single' &&
    decision.options &&
    !['skill', 'language', 'skill-target', 'language-removal'].includes(
      decision.selectionRole ?? '',
    )
  ) {
    const pool = poolOf(decision, selections, definitions);
    const options = decision.options.filter(
      option => pool.values.includes(option.value) || option.requiresFeature,
    );
    control = (
      <>
        {options.length > 30 ? (
          <CatalogSelect
            decision={decision}
            label={label}
            value={typeof value === 'string' ? value : undefined}
            values={pool.values}
            onChange={next => onSelect(decision.id, next)}
          />
        ) : (
          <ChoiceList>
            {(decision.optional || shape.noneAllowed) && (
              <ChoiceRow
                type="radio"
                group={decision.id}
                name={decision.id === 'complication.choice' ? 'No complication' : 'None'}
                checked={value === undefined}
                supported
                onChange={() => onSelect(decision.id, undefined)}
              />
            )}
            {options.map(option => (
              <ChoiceRow
                key={option.id}
                type="radio"
                group={decision.id}
                name={option.value}
                checked={value === option.value}
                supported={option.supportedInV001 && pool.values.includes(option.value)}
                unavailableReason={
                  !pool.values.includes(option.value) ? option.unavailableReason : undefined
                }
                onChange={() => onSelect(decision.id, option.value)}
                meta={option.cost !== undefined ? `${option.cost} pt` : undefined}
                reference={
                  option.source ? (
                    <RuleLink sourcePath={option.source} label={option.value} />
                  ) : null
                }
              />
            ))}
          </ChoiceList>
        )}
        {shape.customAllowed && (
          <details
            className="mt-3"
            open={typeof value === 'string' && !pool.values.includes(value) ? true : undefined}
          >
            <summary className="cursor-pointer text-sm">Or write your own incident</summary>
            <Textarea
              aria-label={`Custom ${label.toLowerCase()}`}
              className="mt-2 max-w-2xl"
              maxLength={10000}
              value={typeof value === 'string' && !pool.values.includes(value) ? value : ''}
              onChange={event => onSelect(decision.id, event.target.value || undefined)}
            />
          </details>
        )}
      </>
    );
  } else if (shape.type === 'single') {
    const pool = poolOf(decision, selections, definitions);
    control = (
      <div className="flex flex-col gap-1.5">
        {!row && pool.parent && (
          <span className="text-sm text-muted-foreground">
            {pool.parentValue}
            <RuleLink sourcePath={pool.parent.source} label={pool.parentValue ?? 'Culture skill'} />
          </span>
        )}
        <div className="flex items-center gap-2">
          <PoolSelect
            decision={decision}
            value={typeof value === 'string' ? value : undefined}
            values={pool.values}
            onChange={next => onSelect(decision.id, next ?? undefined)}
            label={label}
          />
          {typeof value === 'string' && decision.optionSources?.[value] && (
            <RuleLink sourcePath={decision.optionSources[value]} label={value} />
          )}
        </div>
        {!row && (
          <span className="text-sm text-muted-foreground">{pool.values.length} options</span>
        )}
      </div>
    );
  } else if (shape.type === 'multi') {
    const pool = poolOf(decision, selections, definitions);
    const slots: (string | null | undefined)[] = Array.from({ length: shape.count }, (_, index) =>
      Array.isArray(value) ? value[index] : undefined,
    );
    control = (
      <div className="flex flex-col gap-1.5">
        {slots.map((slot, index) => (
          <PoolSelect
            key={index}
            decision={decision}
            value={slot}
            values={pool.values.filter(
              option =>
                option === slot ||
                !slots.some((other, otherIndex) => otherIndex !== index && other === option),
            )}
            allowOpen={shape.deferrable}
            label={`${label} ${index + 1}`}
            onChange={next => {
              const nextSlots = [...slots];
              nextSlots[index] = next;
              onSelect(
                decision.id,
                nextSlots.every(s => s === undefined)
                  ? undefined
                  : (nextSlots.map(s => (s === undefined ? null : s)) as SelectionValue),
              );
            }}
          />
        ))}
        <span className="text-sm text-muted-foreground">
          {shape.count} slots{shape.deferrable ? '; a slot may stay open' : ''} ·{' '}
          {pool.values.length} options
        </span>
      </div>
    );
  } else if (shape.type === 'points') {
    const pool = poolOf(decision, selections, definitions);
    const chosen = Array.isArray(value) ? (value.filter(Boolean) as string[]) : [];
    const total = chosen.reduce(
      (sum, name) => sum + (decision.options?.find(o => o.value === name)?.cost ?? 0),
      0,
    );
    // The point-budget decision is its own panel (V96 mockup): a heading that counts the budget,
    // a dot per point, Clear, then the option cards two across.
    return (
      <section className="rounded-lg bg-card p-6" aria-label={label}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h3 className="m-0 flex items-center gap-2 text-xl font-medium">
              {label}
              {reference}
            </h3>
            <p className="mt-1 mb-0 text-sm text-muted-foreground">
              {total} of {shape.budget} points spent · {Math.max(0, shape.budget - total)} left
              {decision.exactBudget ? ' · spend exactly this budget' : ''}
              {decision.supportedSetInV001
                ? ` · offered set: ${decision.supportedSetInV001.join(' + ')}`
                : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" aria-hidden>
              {Array.from({ length: shape.budget }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    'size-2 rounded-full',
                    index < total ? 'bg-primary' : 'bg-placeholder',
                  )}
                />
              ))}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={chosen.length === 0}
              onClick={() => onSelect(decision.id, undefined)}
            >
              Clear
            </Button>
          </div>
        </div>
        <ChoiceList grid>
          {(decision.options ?? [])
            .filter(option => pool.values.includes(option.value) || option.requiresFeature)
            .map(option => (
              <ChoiceRow
                key={option.id}
                type="checkbox"
                indicator
                name={option.value}
                checked={chosen.includes(option.value)}
                supported={option.supportedInV001 && pool.values.includes(option.value)}
                unavailableReason={
                  !pool.values.includes(option.value) ? option.unavailableReason : undefined
                }
                onChange={() => {
                  const next = chosen.includes(option.value)
                    ? chosen.filter(name => name !== option.value)
                    : [...chosen, option.value];
                  onSelect(decision.id, next.length ? next : undefined);
                }}
                meta={`${option.cost} point${option.cost === 1 ? '' : 's'}`}
                body={
                  option.source
                    ? ruleExcerpt(catalog, { sourcePath: option.source, label: option.value })
                    : undefined
                }
                reference={
                  option.source ? (
                    <RuleLink sourcePath={option.source} label={option.value} />
                  ) : null
                }
              />
            ))}
        </ChoiceList>
        <Diagnostics list={diagnostics} />
      </section>
    );
  } else if (shape.type === 'assignment') {
    control = (
      <AssignmentEditor definitions={definitions} selections={selections} onSelect={onSelect} />
    );
  }
  const supporting =
    /^(culture|career|kit|complication)\./.test(decision.id) || /\.perk$/.test(decision.id);
  const selectedNames = (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === 'string',
  );
  const skillSelection =
    decision.selectionRole?.startsWith('skill') || /(?:^|[.-])skills?(?:[.-]|$)/.test(decision.id);
  const languageSelection =
    decision.selectionRole?.startsWith('language') ||
    /(?:^|[.-])languages?(?:[.-]|$)/.test(decision.id);
  const knowledgeGrants = [
    ...(decision.grants ?? []),
    ...selectedNames.flatMap(
      name => decision.options?.find(option => option.value === name)?.grants ?? [],
    ),
  ];
  const selectedSkills = [
    ...new Set([
      ...(skillSelection ? selectedNames : []),
      ...knowledgeGrants.filter(grant => grant.kind === 'skill').map(grant => grant.value),
    ]),
  ];
  const selectedLanguages = [
    ...new Set([
      ...(languageSelection ? selectedNames : []),
      ...knowledgeGrants.filter(grant => grant.kind === 'language').map(grant => grant.value),
    ]),
  ];
  const selectedSources =
    supporting &&
    !skillSelection &&
    !languageSelection &&
    !decision.id.endsWith('.inciting-incident')
      ? selectedNames.flatMap(name => {
          const sourcePath =
            decision.options?.find(option => option.value === name)?.source ??
            decision.optionSources?.[name];
          // Career skill options cite their parent career; its complete text is already shown once.
          const parentSource =
            sourcePath === decision.source &&
            !/^(career|kit|complication)\.choice$/.test(decision.id);
          return sourcePath && !parentSource ? [{ name, sourcePath }] : [];
        })
      : [];
  if (row)
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-muted px-4 py-3.5">
          <span className="min-w-0">
            <span className="block text-base font-medium">{label}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {row}
              {reference}
            </span>
          </span>
          {/* The control steps down to the panel's tone rather than up, so it reads as a well in
              the inset rather than another tile on it. */}
          <span className="shrink-0 [&_.native-select]:bg-card">{control}</span>
        </div>
        <Diagnostics list={diagnostics} />
        {selectedSkills.map(name => (
          <SelectedSkillSource key={name} name={name} />
        ))}
      </div>
    );
  return (
    <ChoiceSection
      label={decision.kind === 'automatic' && shownGrants.length ? `${label} — granted` : label}
      reference={reference}
    >
      {decision.decisionActor && decision.decisionActor !== 'owner' && (
        <p className="m-0 text-sm text-muted-foreground">
          {decision.id === 'complication.strange-inheritance.secretTrinket' ? (
            'The Director privately chooses your inherited trinket. Its identity and powers stay hidden until the source reveals them.'
          ) : (
            <>
              {decision.decisionActor === 'Director'
                ? 'The Director determines this choice.'
                : 'Make this choice together with your Director.'}{' '}
              Record the proposed choice here for campaign review.
            </>
          )}
        </p>
      )}
      {decision.label && decision.quote && decision.quote.length <= 400 && (
        <p className="m-0 text-sm text-muted-foreground">{readableRuleText(decision.quote)}</p>
      )}
      {control}
      {decision.selectionRole === 'skill-target' && (
        <p className="m-0 text-sm text-muted-foreground">
          {decision.ownedPool?.kind === 'skill' && !decision.ownedPool.exclude
            ? 'Choose a skill you already know. This choice modifies that skill; it does not grant another skill.'
            : 'This choice records a skill for this feature; it does not grant another skill.'}
        </p>
      )}
      {decision.deferralRule?.quote && (
        <p className="m-0 text-sm text-muted-foreground">
          {readableRuleText(decision.deferralRule.quote)}
        </p>
      )}
      <Diagnostics list={diagnostics} />
      {selectedSkills.map(name => (
        <SelectedSkillSource key={name} name={name} />
      ))}
      {decision.kind !== 'automatic' &&
        selectedLanguages.map(name => <SelectedLanguageSource key={name} name={name} />)}
      {selectedSources.map(source => (
        <SelectedRuleSource key={`${source.name}:${source.sourcePath}`} {...source} />
      ))}
      {decision.id.endsWith('.inciting-incident') && typeof value === 'string' && (
        <IncidentText
          career={
            typeof selections['career.choice'] === 'string'
              ? selections['career.choice']
              : undefined
          }
          name={value}
        />
      )}
    </ChoiceSection>
  );
}

/** Each repeated array value has its own draggable token; named selects use the same transition. */
function AssignmentEditor({
  definitions,
  selections,
  onSelect,
}: {
  definitions: DecisionDefinitions;
  selections: Selections;
  onSelect: (id: string, value: SelectionValue | undefined) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const context = assignmentContext(selections, definitions);
  if (!context) return null;
  const { array, targets, fixed, decisionId } = context;
  const value = selections[decisionId];
  const current = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const remaining = [...array];
  for (const amount of Object.values(current)) {
    const index = remaining.indexOf(amount);
    if (index >= 0) remaining.splice(index, 1);
  }
  function assign(target: string, amount: number | null, fromTarget?: string) {
    try {
      const next = assignCharacteristic(selections, target, amount, fromTarget, definitions);
      onSelect(decisionId, next[decisionId]);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid assignment.');
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-muted-foreground">
        {Object.keys(fixed).join(' and ')} {Object.keys(fixed).length === 1 ? 'is' : 'are'} fixed by{' '}
        {String(selections['class.choice'])}. Place each remaining value in a blank characteristic,
        or choose it by name.
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Remaining values</span>
        <div aria-label="Remaining characteristic values" className="flex gap-2">
          {remaining.map((amount, index) => (
            <span
              key={`${amount}:${index}`}
              draggable
              // Without a payload the drop target has nothing to read and the assignment is lost.
              onDragStart={event =>
                event.dataTransfer.setData('application/json', JSON.stringify({ value: amount }))
              }
              data-testid={`array-value-${index}`}
              className="inline-flex size-10 cursor-grab items-center justify-center rounded-md bg-muted text-base font-medium tabular-nums transition-colors duration-(--motion-fast) hover:bg-accent"
            >
              {amount}
            </span>
          ))}
          {remaining.length === 0 && (
            <span className="text-sm text-muted-foreground">All values placed</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {Object.entries(fixed).map(([target, score]) => (
          <span
            key={target}
            role="group"
            aria-label={`${target} (fixed)`}
            className="flex flex-col items-center gap-1"
          >
            <StatBox compact inset emphasis value={score} label={target.slice(0, 3)} />
            <span className="text-sm text-muted-foreground">Fixed</span>
          </span>
        ))}
        {targets.map(target => (
          <label
            key={target}
            data-testid={`assignment-${target}`}
            className="flex flex-col items-center gap-1 rounded-md bg-muted px-3 py-2 text-sm"
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
              event.preventDefault();
              try {
                const dropped = JSON.parse(event.dataTransfer.getData('application/json')) as {
                  value: number;
                  fromTarget?: string;
                };
                assign(target, dropped.value, dropped.fromTarget);
              } catch {
                setError('Drop a characteristic value from this array.');
              }
            }}
          >
            <span
              draggable={current[target] !== undefined}
              className={
                current[target] === undefined
                  ? 'text-sm text-muted-foreground'
                  : 'text-sm font-medium text-foreground'
              }
              onDragStart={event =>
                event.dataTransfer.setData(
                  'application/json',
                  JSON.stringify({ value: current[target], fromTarget: target }),
                )
              }
            >
              {target}
              {current[target] === undefined ? '' : `: ${current[target]}`}
            </span>
            <select
              className="native-select"
              aria-label={`Assign ${target}`}
              value={current[target] === undefined ? '' : String(current[target])}
              onChange={event =>
                assign(target, event.target.value === '' ? null : Number(event.target.value))
              }
            >
              <option value="">Choose…</option>
              {[...new Set(array)].map(amount => (
                <option
                  key={amount}
                  value={String(amount)}
                  disabled={
                    assignmentError({ ...current, [target]: amount }, array, targets) !== null
                  }
                >
                  {amount}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <ErrorNotice error={error} />
    </div>
  );
}

/** Whether the step has anything the user records (a choice or an authored text). */
function hasInteractiveDecision(step: Step): boolean {
  return step.decisions.some(d => d.kind === 'choice' || d.kind === 'authored');
}

type WizardCharacter = Omit<LoadedCharacter, 'id'> & { id: Id<'characters'> | null };
const unsavedCharacter: WizardCharacter = {
  id: null,
  wizardDraft: true,
  authored: emptyAuthored,
  revision: 0,
  selections: [],
  status: 'incomplete',
  evaluation: null,
  level: 1,
  choiceOrigins: {},
  fullEditIsStale: false,
  combatLocked: false,
  campaignId: null,
  campaignName: null,
  effectiveRevisionId: null,
  effectiveRevision: null,
  draftIsEffective: false,
  derivedBaseline: null,
  liveState: null,
  activationPreview: null,
  review: null,
};

function Wizard({ character }: { character: WizardCharacter }) {
  const definitions = useMemo(
    () => getDefinitions(character.level, character.choiceOrigins),
    [character.level, character.choiceOrigins],
  );
  const SHOWN = definitions.steps.filter(
    step => step.presentedInV001 && !HIDDEN_STEPS.has(step.id),
  );
  const PRESENTED = SHOWN.filter(step => !NESTED_STEPS[step.id]);
  /** The steps that read as sections of this one, in source order. */
  const nestedUnder = (parent: Step) => SHOWN.filter(step => NESTED_STEPS[step.id] === parent.id);
  const navigate = useNavigate();
  const client = useConvex();
  const save = useMutation(api.characters.save);
  const create = useMutation(api.characters.create);
  const command = useCommand();
  const [selections, setSelections] = useState<Selections>(() =>
    Object.fromEntries(character.selections.map(s => [s.decisionId, s.value as SelectionValue])),
  );
  const [authored, setAuthored] = useState<CharacterAuthored>(character.authored);
  const [expectedRevision, setExpectedRevision] = useState(character.revision);
  const [expectedEffectiveRevisionId, setExpectedEffectiveRevisionId] = useState(
    character.effectiveRevisionId,
  );
  const [reconciled, setReconciled] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [nameRequired, setNameRequired] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [cleared, setCleared] = useState<string[]>([]);
  const [confirmedEmptyChoices, setConfirmedEmptyChoices] = useState<Set<string>>(() => new Set());
  // The step whose main chooser is deliberately reopened, and where to put focus after the
  // header and the chooser swap places. Lifted out of PrimaryChoice with V96, because the
  // chosen option now lives in the step header that this component owns.
  const autosaving = useRef(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [focusAfterChange, setFocusAfterChange] = useState(false);
  const chooserRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const stale =
    character.revision !== expectedRevision ||
    character.effectiveRevisionId !== expectedEffectiveRevisionId;
  const draft = useMemo(
    () => draftSelectionsFrom(selections, definitions),
    [selections, definitions],
  );
  const evaluation = useQuery(api.characters.evaluate, {
    ...(character.id ? { characterId: character.id } : {}),
    selections: draft,
    targetLevel: character.level,
  }) as EvaluationResult | undefined;
  const step = PRESENTED[stepIndex]!;
  const { catalog } = useRulesCatalog();
  const canSave =
    !command.pending &&
    !stale &&
    !character.combatLocked &&
    (!character.fullEditIsStale || reconciled);
  function goTo(index: number) {
    setStepIndex(index);
    setReached(r => Math.max(r, index));
  }
  function select(id: string, value: SelectionValue | undefined) {
    if (command.pending) return;
    setSaved(false);
    setDirty(true);
    const pruned = changeChoice(selections, definitions, id, value);
    setSelections(pruned.selections);
    setCleared(pruned.removed.filter(removed => removed !== id));
  }
  function author(value: CharacterAuthored) {
    if (command.pending) return;
    setSaved(false);
    setDirty(true);
    setAuthored(value);
  }
  /**
   * Keep the working draft on the server (V96). Runs quietly after every change, creating the
   * character on the first one, and never lists it or demands a name. `characters.save` is the
   * same revision operation the explicit save uses.
   */
  async function autosave() {
    if (autosaving.current || command.pending || stale || character.combatLocked) return;
    autosaving.current = true;
    try {
      if (!character.id) {
        const id = await create({
          commandId: crypto.randomUUID(),
          authored,
          selections: draft,
          wizardDraft: true,
        });
        await navigate({
          to: '/characters/$characterId/wizard',
          params: { characterId: id },
          replace: true,
        });
        return;
      }
      const revision = await save({
        commandId: crypto.randomUUID(),
        characterId: character.id,
        expectedRevision,
        expectedEffectiveRevisionId,
        authored,
        selections: draft,
        targetLevel: character.level,
      });
      setExpectedRevision(revision);
      setDirty(false);
    } catch {
      // A failed autosave leaves the editor dirty; the explicit save reports the reason.
    } finally {
      autosaving.current = false;
    }
  }
  async function persist(close: boolean) {
    setSaved(false);
    if (!authored.name.trim()) {
      goTo(PRESENTED.findIndex(step => step.id === 'step.details'));
      setNameRequired(true);
      return;
    }
    setNameRequired(false);
    let createdId: Id<'characters'> | undefined;
    const ok = await command.run(
      async commandId => {
        if (!character.id) {
          createdId = await create({ commandId, authored, selections: draft });
          return;
        }
        const revision = await save({
          commandId,
          characterId: character.id,
          expectedRevision,
          expectedEffectiveRevisionId,
          authored,
          selections: draft,
          targetLevel: character.level,
          list: true,
        });
        setExpectedRevision(revision);
        // An already-effective standalone build follows its own complete saves. Accept only
        // this acknowledged revision; another tab's newer save must still make this editor stale.
        if (!character.campaignId && expectedEffectiveRevisionId) {
          const current = await client.query(api.characters.get, { characterId: character.id });
          if (current.revision === revision && !current.campaignId && current.draftIsEffective)
            setExpectedEffectiveRevisionId(current.effectiveRevisionId);
        }
      },
      JSON.stringify(['characters.save', character.id, expectedRevision, authored, draft]),
    );
    if (ok) {
      setSaved(true);
      setDirty(false);
      if (createdId) {
        await navigate({
          to: close ? '/characters/$characterId' : '/characters/$characterId/wizard',
          params: { characterId: createdId },
          replace: true,
        });
      } else if (close && character.id)
        await navigate({ to: '/characters/$characterId', params: { characterId: character.id } });
    }
  }
  /** EXIT: the working draft is already saved, so leaving keeps it; a listed hero opens its page. */
  async function exit() {
    if (dirty && !character.wizardDraft && character.id && canSave) return persist(true);
    if (!character.id || character.wizardDraft) {
      await navigate({ to: '/characters' });
      return;
    }
    await navigate({ to: '/characters/$characterId', params: { characterId: character.id } });
  }
  const problemsByStep = (s: Step) =>
    s.decisions.reduce(
      (n, d) =>
        n + (evaluation?.diagnostics[d.id]?.filter(x => x.severity !== 'warning').length ?? 0),
      0,
    );
  const recordedValue = (id: string | undefined): string | undefined => {
    if (!id) return undefined;
    const field = AUTHORED_FIELDS[id];
    if (field) return authored[field] || undefined;
    const value = selections[id];
    return typeof value === 'string' ? value : undefined;
  };
  // What a step asks of the hero right now: the choices it actually presents, and how many of
  // them are recorded. Only the active branch counts, since every ancestry's and class's
  // decisions live in their step, and a value a preset fixed is not a choice to make.
  const culturePreset = findCulturePreset(
    typeof selections['culture.preset'] === 'string'
      ? (selections['culture.preset'] as string)
      : undefined,
  );
  // Tiles, in reading order. The culture name is fixed too, but it is already the step's title,
  // so it gets no tile of its own.
  const lockedAspectOrder = ['culture.environment', 'culture.organization', 'culture.upbringing'];
  const lockedByPreset = (id: string): string | undefined => {
    if (!culturePreset) return undefined;
    if (id === 'culture.language') return culturePreset.language ? culturePreset.name : undefined;
    return PRESET_FIXED_ASPECTS.has(id) ? culturePreset.name : undefined;
  };
  const railIndex = indexDecisions(definitions);
  const stepChoices = (s: Step) =>
    s.decisions.filter(
      d =>
        (d.kind === 'choice' || d.kind === 'authored') &&
        !lockedByPreset(d.id) &&
        isAvailable(d, selections, railIndex) &&
        !belongsToOtherBranch(d, selections, railIndex),
    );
  /**
   * A nested step reads as a section of its parent's page, so its rail row opens the parent and
   * scrolls to the section. It has no number, no position of its own, and is not "passed".
   */
  const nestedRow = (child: Step, parent: RailStep): RailStep => {
    const choices = stepChoices(child);
    const decided = choices.filter(d =>
      AUTHORED_FIELDS[d.id] ? Boolean(authored[AUTHORED_FIELDS[d.id]!]) : d.id in selections,
    ).length;
    return {
      id: child.id,
      name: stepName(child),
      index: parent.index,
      anchor: primaryDecisionId(child) ?? choices[0]?.id,
      number: 0,
      children: [],
      chosen: recordedValue(primaryDecisionId(child)),
      problems: problemsByStep(child),
      decided,
      choices: choices.length,
      items: [],
      done: choices.length > 0 ? decided === choices.length : parent.done,
      passed: parent.passed,
    };
  };
  const flatSteps = PRESENTED.map((s, index) => {
    const problems = problemsByStep(s);
    const choices = stepChoices(s);
    const decided = choices.filter(d =>
      AUTHORED_FIELDS[d.id] ? Boolean(authored[AUTHORED_FIELDS[d.id]!]) : d.id in selections,
    ).length;
    const recorded = s.decisions.some(d =>
      AUTHORED_FIELDS[d.id] ? Boolean(authored[AUTHORED_FIELDS[d.id]!]) : d.id in selections,
    );
    // A step that asks nothing of this hero — a class that grants no kit, say — is done once
    // they have been past it, the same as a step with nothing to decide at all.
    const done =
      evaluation !== undefined &&
      problems === 0 &&
      (hasInteractiveDecision(s) && choices.length > 0 ? recorded : index < reached);
    return {
      id: s.id,
      name: stepName(s),
      index,
      children: [] as RailStep[],
      number: 0,
      chosen: recordedValue(primaryDecisionId(s)),
      problems,
      decided,
      choices: choices.length,
      items: choices.map(d => ({
        id: d.id,
        label: d.label ?? decisionLabel(d.id),
        done: AUTHORED_FIELDS[d.id]
          ? Boolean(authored[AUTHORED_FIELDS[d.id]!])
          : d.id in selections,
      })),
      done,
      passed: index < reached,
    };
  });
  // Nested steps hang off their parent and leave the top-level numbering to the rest.
  const railSteps: RailStep[] = [];
  let number = 0;
  for (const entry of flatSteps) {
    entry.number = ++number;
    railSteps.push(entry);
  }
  for (const parent of SHOWN) {
    const row = railSteps.find(entry => entry.id === parent.id);
    if (!row) continue;
    row.children = nestedUnder(parent).map(child => nestedRow(child, row));
  }
  const primary = step.decisions.find(
    decision =>
      decision.id === primaryDecisionId(step) &&
      decision.kind === 'choice' &&
      decision.shape.type === 'single' &&
      isAvailable(decision, selections, indexDecisions(definitions)),
  );
  const primaryValue = primary ? selections[primary.id] : undefined;
  const selectedName =
    primary &&
    typeof primaryValue === 'string' &&
    isSupported(primary, primaryValue) &&
    poolOf(primary, selections, definitions).values.includes(primaryValue)
      ? primaryValue
      : undefined;
  const selectedSource = selectedName
    ? (primary?.options?.find(option => option.value === selectedName)?.source ??
      primary?.optionSources?.[selectedName])
    : undefined;
  // Culture has no "none": Build your own is a card in the chooser's own bespoke group, so a
  // second confirm button above the list would offer the same thing twice.
  const primaryNoneLabel =
    !primary || primary.id === 'culture.preset'
      ? undefined
      : primary.optional || (primary.shape.type === 'single' && primary.shape.noneAllowed)
        ? `No ${stepName(step).toLowerCase()}`
        : undefined;
  // Aspects a chosen starting culture fixes: shown read-only until the hero goes bespoke. A
  // preset's language counts only when that preset actually names one, so a professional culture
  // still picks its own (background.md: "then add a language that fits the culture's concept").
  const primaryExpanded =
    primary !== undefined &&
    (editingStep === step.id ||
      (!selectedName &&
        !(
          primaryNoneLabel &&
          primaryValue === undefined &&
          (Boolean(character.id) || confirmedEmptyChoices.has(primary.id))
        )));
  // One quiet write a short while after the last change, not one per keystroke or click.
  const latestAutosave = useRef(autosave);
  useEffect(() => {
    latestAutosave.current = autosave;
  });
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => void latestAutosave.current(), 800);
    return () => clearTimeout(timer);
  }, [dirty, selections, authored]);
  useEffect(() => {
    if (!focusAfterChange) return;
    const target = primaryExpanded ? chooserRef.current : editRef.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest' });
  }, [primaryExpanded, focusAfterChange]);
  const renderDecision = (decision: Decision, onSelect = select, row?: string) => (
    <div key={decision.id} id={anchorId(decision.id)}>
      <DecisionEditor
        decision={decision}
        definitions={definitions}
        step={step}
        selections={selections}
        onSelect={onSelect}
        authored={authored}
        onAuthored={author}
        diagnostics={evaluation?.diagnostics[decision.id]}
        lockedBy={lockedByPreset(decision.id)}
        baseline={evaluation?.baseline ?? evaluation?.partial}
        row={row}
      />
    </div>
  );
  const previous = stepIndex > 0 ? PRESENTED[stepIndex - 1] : undefined;
  const next = stepIndex < PRESENTED.length - 1 ? PRESENTED[stepIndex + 1] : undefined;
  // A point-budget decision is its own panel beside the step card (V96 mockup); everything else
  // reads inside it. Both lists come from the same step in the same source order.
  const stepDecisionIndex = indexDecisions(definitions);
  // What the chosen culture fixed, read back together (V96 mockup) rather than as one read-only
  // section per decision each repeating the same explanation.
  const lockedAspects = culturePreset
    ? lockedAspectOrder.flatMap(id => {
        if (!lockedByPreset(id)) return [];
        const value = selections[id];
        if (typeof value !== 'string') return [];
        // A culture has no entry of its own: it is a row combining aspects. Each aspect does have
        // one, so the tile carries that aspect's text and opens it.
        const source = stepDecisionIndex
          .get(id)
          ?.options?.find(option => option.value === value)?.source;
        return [
          {
            id,
            label: decisionLabel(id),
            value,
            source,
            text: source ? ruleExcerpt(catalog, { sourcePath: source, label: value }) : undefined,
          },
        ];
      })
    : [];
  // Everything the preset fixed is taken out of the ordinary decision list, tile or not.
  // The preset's language is not a tile: it reads with the common language it joins, further
  // down the step, so the two languages the hero speaks sit together.
  const lockedIds = new Set([...PRESET_FIXED_ASPECTS].filter(id => lockedByPreset(id)));
  // The three culture skills are one decision to the player: one per aspect, chosen together.
  const isCultureSkill = (decision: Decision) =>
    /^culture\..+\.skill$/.test(decision.id) &&
    isAvailable(decision, selections, stepDecisionIndex);
  const isPanel = (decision: Decision) =>
    decision !== primary && decision.shape.type === 'points' && !lockedByPreset(decision.id);
  const dependent = primary
    ? step.decisions.filter(decision => decision !== primary)
    : step.decisions;
  const cultureSkills = dependent.filter(isCultureSkill);
  // The chosen option's own rules text, when the option has an entry of its own rather than
  // citing the decision's shared source.
  const chosenText =
    selectedSource && selectedSource !== primary?.source
      ? ruleExcerpt(catalog, { sourcePath: selectedSource, label: selectedName })
      : undefined;
  const lockedBlock = lockedAspects.length ? (
    <section
      className="flex flex-col gap-3 py-5"
      aria-label={`Set by the ${culturePreset!.name} culture`}
    >
      <p className="m-0 text-sm text-muted-foreground">Set by the {culturePreset!.name} culture</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-2">
        {lockedAspects.map(aspect => (
          <div key={aspect.id} className="flex flex-col gap-1 rounded-md bg-muted px-4 py-3">
            <span className="flex items-center gap-2">
              <span className="text-lg font-medium">{aspect.value}</span>
              {aspect.source && <RuleLink sourcePath={aspect.source} label={aspect.value} />}
            </span>
            <span className="text-sm text-muted-foreground">{aspect.label}</span>
            {aspect.text && (
              <span className="mt-1 text-sm text-balance text-muted-foreground">{aspect.text}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  ) : null;
  const inlineDecisions = dependent.filter(
    decision => !isPanel(decision) && !lockedIds.has(decision.id) && !isCultureSkill(decision),
  );
  const panelDecisions = primaryExpanded ? [] : dependent.filter(isPanel);
  // What this step still owes, for the rail hint and the step footer. The budget and the costs
  // are content; this only counts what is already recorded, as the panel heading does.
  const stepProblems = step.decisions.reduce(
    (n, d) =>
      n + (evaluation?.diagnostics[d.id]?.filter(x => x.severity !== 'warning').length ?? 0),
    0,
  );
  const stepFooterNote =
    stepProblems > 0
      ? `${stepProblems} choice${stepProblems === 1 ? '' : 's'} still to make.`
      : next
        ? 'This step is complete.'
        : 'Name your hero in this step, then save.';
  // Only the branch the hero is actually on: every ancestry's trait budget lives in this step,
  // and the unreachable ones are neither rendered nor owed.
  const pointsOwed = dependent.flatMap(decision => {
    if (decision.shape.type !== 'points') return [];
    if (!isAvailable(decision, selections, stepDecisionIndex)) return [];
    const chosen = selections[decision.id];
    const spent = (Array.isArray(chosen) ? chosen : [])
      .filter((name): name is string => typeof name === 'string')
      .reduce((sum, name) => sum + (decision.options?.find(o => o.value === name)?.cost ?? 0), 0);
    const left = decision.shape.budget - spent;
    return left > 0 ? [`${left} point${left === 1 ? '' : 's'} still unspent`] : [];
  });
  return (
    <div className="min-h-dvh bg-background" data-wizard-shell>
      <WizardHeader
        heroName={authored.name}
        editing={Boolean(character.effectiveRevisionId)}
        saving={command.pending}
        canSave={canSave}
        draft={character.wizardDraft || !character.id}
        savingDraft={dirty}
        onSaveDraft={() => void persist(false)}
        onExit={() => void exit()}
      />
      <div className="grid grid-cols-[224px_minmax(0,1fr)_330px] items-start gap-(--page-gap) px-(--page-gap) pb-(--page-gap)">
        <div className={STICKY_PANE}>
          <StepRail
            title="Character Builder"
            reference={BUILDER_REFERENCE}
            steps={railSteps}
            currentIndex={stepIndex}
            onSelect={goTo}
            onSelectItem={id =>
              // A nested row opens its parent first, so wait for that page before scrolling.
              requestAnimationFrame(() =>
                document
                  .getElementById(anchorId(id))
                  ?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
              )
            }
            hint={
              pointsOwed.length
                ? `${pointsOwed.join(' · ')}. ${next ? `${stepName(next)} comes next.` : ''}`
                : next
                  ? `${stepName(next)} comes next.`
                  : undefined
            }
            footer={
              <StepNav
                previous={previous ? stepName(previous) : undefined}
                next={next ? stepName(next) : undefined}
                onPrevious={() => goTo(stepIndex - 1)}
                onNext={() => goTo(stepIndex + 1)}
                finishLabel={
                  command.pending
                    ? 'Saving…'
                    : character.wizardDraft || !character.id
                      ? 'Save hero'
                      : 'Save and close'
                }
                finishDisabled={!canSave}
                onFinish={() => void persist(true)}
              />
            }
          />
        </div>
        <div className="flex min-w-0 flex-col gap-(--page-gap)">
          <section className="rounded-lg bg-card" aria-label="Current step">
            <div className="p-6" data-wizard-pane="centre">
              {nameRequired && (
                <p role="alert" className="mb-4 text-base text-destructive">
                  Enter a name in Details before saving your character.
                </p>
              )}
              {character.fullEditIsStale && (
                <Notice className="mb-4">
                  Your effective build advanced after this draft was saved. Review its earlier
                  choices and level before saving a reconciled full edit. Saving does not activate
                  it.
                  <label className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={reconciled}
                      onChange={event => setReconciled(event.target.checked)}
                      className="size-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] bg-placeholder transition-colors duration-(--motion-fast) outline-none checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    />
                    I reviewed this draft against the current effective build.
                  </label>
                </Notice>
              )}
              {stale && (
                <Notice className="mb-4">
                  A newer saved version exists. Reload the page before saving.
                </Notice>
              )}
              {character.combatLocked && (
                <Notice className="mb-4">Character editing is locked during combat.</Notice>
              )}
              {saved && (
                <p role="status" className="mb-4 text-base text-success">
                  Draft saved (revision {expectedRevision}).
                </p>
              )}
              {cleared.length > 0 && (
                <Notice className="mb-4" role="status">
                  Cleared because a parent choice changed: {cleared.map(decisionLabel).join(', ')}.
                </Notice>
              )}
              {/* A settled main choice speaks for its step: the option's name, its own rules text
                and its reference stand in for the step's, with Change to reopen the chooser. So
                while it is collapsed the header is where that choice lives, and it answers to the
                rail's jump for it. */}
              <div id={primary && !primaryExpanded ? anchorId(primary.id) : undefined}>
                {primary && !primaryExpanded ? (
                  <StepTitle
                    title={selectedName ?? primaryNoneLabel ?? stepName(step)}
                    eyebrow={stepName(step)}
                    // Only the chosen option's own text. A culture is a table row combining aspects
                    // and has no entry, so its header carries no paragraph; the aspect tiles below
                    // hold the descriptions. Repeating the step's "choose a culture" line under the
                    // culture you already chose says nothing.
                    description={chosenText}
                    reference={
                      selectedSource && selectedSource !== primary.source ? (
                        <RuleLink sourcePath={selectedSource} label={selectedName} />
                      ) : (
                        <RuleLink {...stepReference(step)} />
                      )
                    }
                    more={
                      chosenText && selectedSource ? (
                        <RuleReadMore sourcePath={selectedSource} label={selectedName} />
                      ) : undefined
                    }
                    optional={step.optional}
                    action={
                      <Button
                        ref={editRef}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={command.pending}
                        aria-label={`Change ${stepName(step).toLowerCase()}`}
                        onClick={() => {
                          setFocusAfterChange(true);
                          setEditingStep(step.id);
                        }}
                      >
                        Change
                      </Button>
                    }
                  />
                ) : (
                  <StepTitle
                    title={stepName(step)}
                    // The culture chooser opens with its own sentence, so the step's would be a
                    // second instruction above the same cards. Its source text stays on the hero
                    // column's Source inset.
                    description={primary?.id === 'culture.preset' ? undefined : stepExcerpt(step)}
                    reference={
                      // Culture cites the Background chapter, which is the reference that matters
                      // here; the Making a Hero step reference is already on the rail's heading.
                      primary?.id === 'culture.preset' ? (
                        <RuleLink {...decisionReference(primary, step)} />
                      ) : (
                        <RuleLink {...stepReference(step)} />
                      )
                    }
                    optional={step.optional}
                  />
                )}
                {primary && !primaryExpanded && (
                  <Diagnostics list={evaluation?.diagnostics[primary.id]} />
                )}
              </div>

              <fieldset disabled={command.pending} className="contents">
                {primary ? (
                  <PrimaryChoice
                    key={step.id}
                    label={stepName(step)}
                    expanded={primaryExpanded}
                    chooserRef={chooserRef}
                    onKeep={value => {
                      if (command.pending) return;
                      if (value !== selections[primary.id]) select(primary.id, value);
                      setConfirmedEmptyChoices(previous => {
                        const next = new Set(previous);
                        if (value === undefined) next.add(primary.id);
                        else next.delete(primary.id);
                        return next;
                      });
                      setFocusAfterChange(true);
                      setEditingStep(null);
                    }}
                    renderChooser={choose => renderDecision(primary, (_id, value) => choose(value))}
                  >
                    {lockedBlock}
                    {inlineDecisions.map(decision => renderDecision(decision))}
                  </PrimaryChoice>
                ) : (
                  <>
                    {lockedBlock}
                    {inlineDecisions.map(decision => renderDecision(decision))}
                  </>
                )}
                {nestedUnder(step).map(child => (
                  <section
                    key={child.id}
                    className="mt-2 flex flex-col gap-3 border-t border-border pt-6"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="m-0 text-xl font-medium">{stepName(child)}</h3>
                      <RuleLink {...stepReference(child)} />
                    </div>
                    {child.id === 'step.kit' && evaluation?.partial?.kit === null && (
                      <p className="m-0 text-base text-muted-foreground">
                        This build has no kit. Its class features supply its starting statistics and
                        abilities.
                      </p>
                    )}
                    {child.decisions.map(decision => renderDecision(decision))}
                  </section>
                ))}
                {step.id === 'step.details' && (
                  <Field
                    label="Private notes"
                    hint="Only you can read these notes."
                    className="py-5"
                  >
                    <Textarea
                      maxLength={10000}
                      className="max-w-2xl"
                      value={authored.notes}
                      onChange={event => author({ ...authored, notes: event.target.value })}
                    />
                  </Field>
                )}
              </fieldset>
            </div>
          </section>
          <fieldset disabled={command.pending} className="contents">
            {cultureSkills.length > 0 && (
              <section className="rounded-lg bg-card p-6" aria-label="Culture skills">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <h3 className="m-0 text-xl font-medium">Culture skills</h3>
                    <p className="mt-1 mb-0 text-sm text-muted-foreground">
                      One skill from each aspect’s list of options.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" aria-hidden>
                      {cultureSkills.map(decision => (
                        <span
                          key={decision.id}
                          className={cn(
                            'size-2 rounded-full',
                            typeof selections[decision.id] === 'string'
                              ? 'bg-primary'
                              : 'bg-placeholder',
                          )}
                        />
                      ))}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={cultureSkills.every(d => selections[d.id] === undefined)}
                      onClick={() => {
                        for (const decision of cultureSkills) select(decision.id, undefined);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {cultureSkills.map(decision => {
                    const parent = selections[decision.id.replace(/\.skill$/, '')];
                    const count = poolOf(decision, selections, definitions).values.length;
                    return renderDecision(
                      decision,
                      select,
                      [typeof parent === 'string' ? parent : null, `${count} options`]
                        .filter(Boolean)
                        .join(' · '),
                    );
                  })}
                </div>
              </section>
            )}
            {panelDecisions.map(decision => renderDecision(decision))}
          </fieldset>
          {/* The step's own footer: what it still owes, and the same move the rail offers. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card px-6 py-4">
            <p className="m-0 text-sm text-muted-foreground">
              {pointsOwed.length ? `${pointsOwed.join(' · ')}.` : stepFooterNote}
            </p>
            {next ? (
              <Button type="button" className="rounded-full" onClick={() => goTo(stepIndex + 1)}>
                Continue to {stepName(next)} <span aria-hidden>→</span>
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-full"
                disabled={!canSave}
                onClick={() => void persist(true)}
              >
                {command.pending
                  ? 'Saving…'
                  : character.wizardDraft || !character.id
                    ? 'Save hero'
                    : 'Save and close'}
              </Button>
            )}
          </div>
        </div>
        <div className={STICKY_PANE}>
          <HeroSoFar
            evaluation={evaluation}
            heroName={authored.name}
            sourceReference={stepReference(step)}
            sourceExcerpt={stepExcerpt(step)}
          />
        </div>
      </div>
    </div>
  );
}

export function WizardPage({ characterId }: { characterId?: Id<'characters'> }) {
  // A new hero resumes this owner's working draft when they have one, so leaving and returning
  // continues the same build instead of starting another unlisted row (V96).
  const existingDraft = useQuery(api.characters.wizardDraft, characterId ? 'skip' : {});
  const resolved = characterId ?? existingDraft ?? undefined;
  const character = useQuery(api.characters.get, resolved ? { characterId: resolved } : 'skip');
  if (!characterId && existingDraft === undefined)
    return (
      <div className="p-10">
        <Loading>Opening the character builder…</Loading>
      </div>
    );
  if (!resolved) return <Wizard key="new" character={unsavedCharacter} />;
  if (character === undefined)
    return (
      <div className="p-10">
        <Loading>Loading character…</Loading>
      </div>
    );
  return <Wizard key={character.id} character={character} />;
}
