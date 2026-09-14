// SPDX-License-Identifier: GPL-3.0-only
/**
 * The minimal level-one devil Fury wizard: a real decision flow over the R01 table
 * (shared/content/fury-level-one-decisions.json). Every presented step appears in source order
 * with its decisions; the full option pool is visible with unsupported options labeled; each
 * option and decision exposes its source sentence and, where the content snapshot carries the
 * entry, the verbatim text. The "hero so far" is the shared `characters.evaluate` read over the
 * current selections; nothing here derives a value.
 *
 * Owning specifications: docs/character-wizard-spec.md#v001-scope, #3-decision-system,
 * #main-creation-and-editing, #10-mobile-interaction-requirements (desktop first for v0.01);
 * docs/fury-level-one-decisions.md (steps, decisions, pools, supported marking; the complication
 * step is not presented, Q-CHAR-1).
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import definitionsJson from '../../shared/content/fury-level-one-decisions.json';
import manifest from '../../shared/content/compendium/manifest.json';
import type { CharacterAuthored } from '../../shared/characterDraft';
import type {
  Diagnostic,
  EvaluationResult,
  PartialBaseline,
  SelectionValue,
} from '../../shared/contracts/characterEvaluation';
import type { Decision, DecisionDefinitions, Step } from '../../shared/evaluate/definitions';
import { parseArray } from '../../shared/evaluate/character';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import {
  indexDecisions,
  isAvailable,
  isSupported,
  poolOf,
  pruneUnavailable,
  singleValue,
  unavailableReason,
  type Selections,
} from '../../shared/evaluate/structure';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ErrorNotice, Eyebrow, Field, Loading, Notice, useCommand } from '../ui';
import { SourceText } from '../character-sheet/controls';

const definitions = definitionsJson as unknown as DecisionDefinitions;
const decisions = indexDecisions(definitions);
const PRESENTED: Step[] = definitions.steps.filter(step => step.presentedInV001);
/** Source path (relative to the Compendium) to content id, for the "Read entry" control. */
const CONTENT_ID_BY_PATH = new Map(
  (manifest as { entries: { id: string; sourcePath: string }[] }).entries.map(entry => [
    entry.sourcePath.replace(/^vendor\/steel-compendium\//, ''),
    entry.id,
  ]),
);
/** Authored decisions that are the character's own fields rather than selections. */
const AUTHORED_FIELDS: Record<string, keyof CharacterAuthored> = {
  'details.name': 'name',
  'details.appearance': 'appearance',
  'details.backstory-and-personality': 'biography',
};

type LoadedCharacter = FunctionReturnType<typeof api.characters.get>;

/** The decision's own source sentence plus, when the snapshot has the entry, its verbatim text. */
function SourcePanel({ path, quote, label }: { path: string; quote?: string; label: string }) {
  const [open, setOpen] = useState(false);
  const contentId = CONTENT_ID_BY_PATH.get(path);
  const entry = useQuery(api.content.get, open && contentId ? { id: contentId } : 'skip');
  return (
    <div className="text-xs text-muted-foreground">
      {quote && <p className="m-0">“{quote}”</p>}
      <p className="m-0 flex flex-wrap items-center gap-2">
        <span>{path}</span>
        {contentId ? (
          <Button type="button" variant="ghost" size="xs" onClick={() => setOpen(!open)}>
            {open ? 'Close entry' : 'Read entry'}
          </Button>
        ) : (
          <span>(no snapshot entry: the sentence is quoted from the pinned file)</span>
        )}
      </p>
      {open && contentId && (entry ? <SourceText text={entry.text} label={label} /> : <Loading />)}
      {open && contentId && entry === null && (
        <p className="m-0">Content entry {contentId} is not loaded; run pnpm content:seed.</p>
      )}
    </div>
  );
}

function Diagnostics({ list }: { list: Diagnostic[] | undefined }) {
  if (!list?.length) return null;
  return (
    <ul className="m-0 list-none p-0 text-xs">
      {list.map((d, i) => (
        <li
          key={i}
          className={d.severity === 'warning' ? 'text-muted-foreground' : 'text-destructive'}
        >
          <strong>{d.severity}</strong> ({d.code}): {d.message}
          {d.uncertainty ? ` [${d.uncertainty}]` : ''}
        </li>
      ))}
    </ul>
  );
}

function UnsupportedLabel() {
  return <span className="caps text-muted-foreground">not offered in v0.01</span>;
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
      className="native-select"
      aria-label={label}
      value={value === null ? '__open__' : (value ?? '')}
      onChange={event => {
        const next = event.target.value;
        onChange(next === '' ? undefined : next === '__open__' ? null : next);
      }}
    >
      <option value="">Choose…</option>
      {allowOpen && <option value="__open__">Leave open (deferred)</option>}
      {supported.map(v => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
      {unsupported.map(v => (
        <option key={v} value={v} disabled>
          {v} — not offered in v0.01
        </option>
      ))}
    </select>
  );
}

function DecisionEditor({
  decision,
  selections,
  onSelect,
  authored,
  onAuthored,
  diagnostics,
}: {
  decision: Decision;
  selections: Selections;
  onSelect: (id: string, value: SelectionValue | undefined) => void;
  authored: CharacterAuthored;
  onAuthored: (value: CharacterAuthored) => void;
  diagnostics: Diagnostic[] | undefined;
}) {
  const available = isAvailable(decision, selections, decisions);
  const value = selections[decision.id];
  const shape = decision.shape;
  const heading = (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h4 className="m-0">
        {decision.id}
        <span className="ml-2 caps text-muted-foreground">{decision.kind}</span>
      </h4>
      {decision.questions?.length ? (
        <span className="caps text-muted-foreground">open: {decision.questions.join(', ')}</span>
      ) : null}
    </div>
  );
  if (!available)
    return (
      <div className="rule-soft flex flex-col gap-1 py-3 opacity-60">
        {heading}
        <p className="m-0 text-xs text-muted-foreground">
          {unavailableReason(decision, decisions)}
        </p>
        <Diagnostics list={diagnostics} />
      </div>
    );
  let control: React.ReactNode = null;
  if (decision.kind === 'none') control = null;
  else if (decision.kind === 'automatic')
    control = (
      <ul className="m-0 list-none p-0 text-sm">
        {(decision.grants ?? []).map((grant, i) => (
          <li key={i}>
            <Badge variant="outline">{grant.kind}</Badge> {grant.value}
            {grant.quote ? <span className="text-muted-foreground"> — “{grant.quote}”</span> : null}
            {grant.note ? <span className="text-muted-foreground"> ({grant.note})</span> : null}
          </li>
        ))}
      </ul>
    );
  else if (decision.kind === 'authored') {
    const field = AUTHORED_FIELDS[decision.id];
    const text = field ? authored[field] : typeof value === 'string' ? value : '';
    control =
      field === 'name' ? (
        <Input
          aria-label={decision.id}
          required
          maxLength={100}
          value={text}
          onChange={event => onAuthored({ ...authored, name: event.target.value })}
        />
      ) : (
        <Textarea
          aria-label={decision.id}
          maxLength={10000}
          value={text}
          onChange={event =>
            field
              ? onAuthored({ ...authored, [field]: event.target.value })
              : onSelect(decision.id, event.target.value || undefined)
          }
        />
      );
  } else if (shape.type === 'single' && decision.options) {
    control = (
      <ul className="m-0 list-none p-0">
        {decision.options.map(option => (
          <li key={option.id} className="flex flex-wrap items-center gap-2 py-0.5 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={decision.id}
                value={option.value}
                checked={value === option.value}
                disabled={!option.supportedInV001}
                onChange={() => onSelect(decision.id, option.value)}
              />
              <span>{option.value}</span>
            </label>
            {option.cost !== undefined && (
              <span className="text-muted-foreground">{option.cost} pt</span>
            )}
            {!option.supportedInV001 && <UnsupportedLabel />}
            {option.source && <OptionSource path={option.source} label={option.value} />}
          </li>
        ))}
      </ul>
    );
  } else if (shape.type === 'single') {
    const pool = poolOf(decision, selections, definitions);
    control = (
      <div className="flex flex-col gap-1">
        {pool.parent?.quote && (
          <p className="m-0 text-xs text-muted-foreground">
            {pool.parentValue}: “{pool.parent.quote}” ({pool.parent.source})
          </p>
        )}
        <PoolSelect
          decision={decision}
          value={typeof value === 'string' ? value : undefined}
          values={pool.values}
          onChange={next => onSelect(decision.id, next ?? undefined)}
          label={decision.id}
        />
        {typeof value === 'string' && decision.optionSources?.[value] && (
          <OptionSource path={decision.optionSources[value]} label={value} />
        )}
        <span className="text-xs text-muted-foreground">
          {pool.values.length} options in the source pool
        </span>
      </div>
    );
  } else if (shape.type === 'multi') {
    const pool = poolOf(decision, selections, definitions);
    const slots: (string | null | undefined)[] = Array.isArray(value)
      ? value
      : Array.from({ length: shape.count }, () => undefined);
    control = (
      <div className="flex flex-col gap-1">
        {slots.map((slot, index) => (
          <PoolSelect
            key={index}
            decision={decision}
            value={slot}
            values={pool.values}
            allowOpen={shape.deferrable}
            label={`${decision.id} slot ${index + 1}`}
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
        <span className="text-xs text-muted-foreground">
          {shape.count} slots{shape.deferrable ? '; a slot may stay open' : ''} ·{' '}
          {pool.values.length} options
        </span>
      </div>
    );
  } else if (shape.type === 'points') {
    const chosen = Array.isArray(value) ? (value.filter(Boolean) as string[]) : [];
    const total = chosen.reduce(
      (sum, name) => sum + (decision.options?.find(o => o.value === name)?.cost ?? 0),
      0,
    );
    control = (
      <div className="flex flex-col gap-1">
        <ul className="m-0 list-none p-0">
          {(decision.options ?? []).map(option => (
            <li key={option.id} className="flex flex-wrap items-center gap-2 py-0.5 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={chosen.includes(option.value)}
                  disabled={!option.supportedInV001}
                  onChange={event => {
                    const next = event.target.checked
                      ? [...chosen, option.value]
                      : chosen.filter(name => name !== option.value);
                    onSelect(decision.id, next.length ? next : undefined);
                  }}
                />
                <span>{option.value}</span>
              </label>
              <span className="text-muted-foreground">
                {option.cost} point{option.cost === 1 ? '' : 's'}
              </span>
              {!option.supportedInV001 && <UnsupportedLabel />}
              {option.source && <OptionSource path={option.source} label={option.value} />}
            </li>
          ))}
        </ul>
        <span className="text-xs text-muted-foreground">
          {total} of {shape.budget} points spent
          {decision.supportedSetInV001
            ? ` · offered set: ${decision.supportedSetInV001.join(' + ')}`
            : ''}
        </span>
      </div>
    );
  } else if (shape.type === 'assignment') {
    const array = singleValue(selections, decision.dependsOn?.[0] ?? '');
    const values = array ? parseArray(array) : [];
    const current =
      value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : ({} as Record<string, number>);
    control = (
      <div className="flex flex-wrap items-end gap-3">
        {shape.targets.map(target => (
          <label key={target} className="flex flex-col gap-1 text-sm">
            <span className="caps text-muted-foreground">{target}</span>
            <select
              className="native-select"
              aria-label={`${decision.id} ${target}`}
              value={current[target] === undefined ? '' : String(current[target])}
              onChange={event => {
                const next = { ...current };
                if (event.target.value === '') delete next[target];
                else next[target] = Number(event.target.value);
                onSelect(decision.id, Object.keys(next).length ? next : undefined);
              }}
            >
              <option value="">Choose…</option>
              {[...new Set(values)].map(v => (
                <option key={v} value={String(v)}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
        <span className="text-xs text-muted-foreground">
          Array {array ?? '—'}; offered assignment: {decision.supportedInV001?.join('; ') ?? '—'}
        </span>
      </div>
    );
  }
  return (
    <div className="rule-soft flex flex-col gap-2 py-3">
      {heading}
      {control}
      <SourcePanel path={decision.source} quote={decision.quote} label={decision.id} />
      {decision.note && <p className="m-0 text-xs text-muted-foreground">{decision.note}</p>}
      <Diagnostics list={diagnostics} />
    </div>
  );
}

function OptionSource({ path, label }: { path: string; label: string }) {
  const [open, setOpen] = useState(false);
  const contentId = CONTENT_ID_BY_PATH.get(path);
  const entry = useQuery(api.content.get, open && contentId ? { id: contentId } : 'skip');
  if (!contentId) return <span className="text-xs text-muted-foreground">{path}</span>;
  return (
    <span className="flex flex-col">
      <Button type="button" variant="ghost" size="xs" onClick={() => setOpen(!open)}>
        {open ? 'Close text' : 'Source text'}
      </Button>
      {open && (entry ? <SourceText text={entry.text} label={label} /> : <Loading />)}
    </span>
  );
}

function HeroSoFar({ evaluation }: { evaluation: EvaluationResult | undefined }) {
  if (!evaluation) return <Loading>Evaluating…</Loading>;
  const b: PartialBaseline = evaluation.baseline ?? evaluation.partial ?? {};
  const show = (v: { value: number | string } | undefined) => (v ? String(v.value) : 'pending');
  const chars = b.characteristics;
  const problems = Object.values(evaluation.diagnostics)
    .flat()
    .filter(d => d.severity !== 'warning');
  return (
    <div className="flex flex-col gap-2 text-sm" aria-label="Hero so far">
      <div className="flex items-center justify-between">
        <h3 className="m-0">Hero so far</h3>
        <Badge variant={evaluation.status === 'complete' ? 'default' : 'outline'}>
          {evaluation.status}
        </Badge>
      </div>
      <p className="m-0 text-muted-foreground">
        Level {show(b.level)} {b.ancestry?.value ?? '…'} {b.class?.value ?? '…'}
        {b.subclass ? ` (${b.subclass.value})` : ''} · {b.career?.value ?? '…'}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <dt className="text-muted-foreground">M / A / R / I / P</dt>
        <dd className="m-0">
          {chars
            ? [chars.M, chars.A, chars.R, chars.I, chars.P].map(c => c.value).join(' / ')
            : 'pending'}
        </dd>
        <dt className="text-muted-foreground">Stamina max</dt>
        <dd className="m-0">{show(b.staminaMaximum)}</dd>
        <dt className="text-muted-foreground">Recoveries</dt>
        <dd className="m-0">
          {show(b.recoveriesMaximum)} (value {show(b.recoveryValue)})
        </dd>
        <dt className="text-muted-foreground">Winded</dt>
        <dd className="m-0">{show(b.windedValue)}</dd>
        <dt className="text-muted-foreground">Speed / stability / size</dt>
        <dd className="m-0">
          {show(b.speed)} / {show(b.stability)} / {show(b.size)}
        </dd>
        <dt className="text-muted-foreground">Disengage</dt>
        <dd className="m-0">{show(b.disengage)}</dd>
        <dt className="text-muted-foreground">Potency</dt>
        <dd className="m-0">
          {b.potency
            ? `${b.potency.weak.value} / ${b.potency.average.value} / ${b.potency.strong.value}`
            : 'pending'}
        </dd>
        <dt className="text-muted-foreground">Saves on</dt>
        <dd className="m-0">
          {b.savingThrowThreshold ? `${b.savingThrowThreshold.value}+` : 'pending'}
        </dd>
        <dt className="text-muted-foreground">Heroic resource</dt>
        <dd className="m-0">
          {b.heroicResource
            ? `${b.heroicResource.name.value} ${b.heroicResource.startingValue.value}`
            : 'pending'}
        </dd>
        <dt className="text-muted-foreground">Renown / Wealth</dt>
        <dd className="m-0">
          {show(b.renown)} / {show(b.wealth)}
        </dd>
        <dt className="text-muted-foreground">Kit</dt>
        <dd className="m-0">{b.kit ? b.kit.name.value : 'pending'}</dd>
        <dt className="text-muted-foreground">Skills</dt>
        <dd className="m-0">{b.skills?.map(s => s.name).join(', ') || '—'}</dd>
        <dt className="text-muted-foreground">Languages</dt>
        <dd className="m-0">{b.languages?.map(l => l.name).join(', ') || '—'}</dd>
        <dt className="text-muted-foreground">Traits</dt>
        <dd className="m-0">{b.traits?.map(t => t.name).join(', ') || '—'}</dd>
        <dt className="text-muted-foreground">Features</dt>
        <dd className="m-0">{b.features?.map(f => f.name).join(', ') || '—'}</dd>
        <dt className="text-muted-foreground">Perks</dt>
        <dd className="m-0">{b.perks?.map(p => p.name).join(', ') || '—'}</dd>
        <dt className="text-muted-foreground">Abilities</dt>
        <dd className="m-0">{b.abilities?.map(a => a.name).join(', ') || '—'}</dd>
      </dl>
      {problems.length > 0 && (
        <div>
          <h4 className="m-0 caps text-muted-foreground">Outstanding</h4>
          <ul className="m-0 list-none p-0 text-xs">
            {problems.map((d, i) => (
              <li key={i}>
                {d.decisionId}: {d.code}
              </li>
            ))}
          </ul>
        </div>
      )}
      {b.uncertainties?.length ? (
        <p className="m-0 text-xs text-muted-foreground">
          Provisional: {b.uncertainties.join(', ')}
        </p>
      ) : null}
    </div>
  );
}

function Wizard({ character }: { character: LoadedCharacter }) {
  const navigate = useNavigate();
  const save = useMutation(api.characters.save);
  const command = useCommand();
  const [selections, setSelections] = useState<Selections>(() =>
    Object.fromEntries(character.selections.map(s => [s.decisionId, s.value as SelectionValue])),
  );
  const [authored, setAuthored] = useState<CharacterAuthored>(character.authored);
  const [expectedRevision, setExpectedRevision] = useState(character.revision);
  const [stepIndex, setStepIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState<string[]>([]);
  const stale = character.revision !== expectedRevision;
  const draft = useMemo(() => draftSelectionsFrom(selections, definitions), [selections]);
  const evaluation = useQuery(api.characters.evaluate, { selections: draft }) as
    EvaluationResult | undefined;
  const step = PRESENTED[stepIndex]!;
  function select(id: string, value: SelectionValue | undefined) {
    setSaved(false);
    const next = { ...selections };
    if (value === undefined) delete next[id];
    else next[id] = value;
    const pruned = pruneUnavailable(next, definitions);
    setSelections(pruned.selections);
    setCleared(pruned.removed.filter(removed => removed !== id));
  }
  async function persist(close: boolean) {
    setSaved(false);
    const ok = await command.run(
      async commandId => {
        const revision = await save({
          commandId,
          characterId: character.id,
          expectedRevision,
          authored,
          selections: draft,
        });
        setExpectedRevision(revision);
      },
      JSON.stringify(['characters.save', character.id, expectedRevision, authored, draft]),
    );
    if (ok) {
      setSaved(true);
      if (close)
        await navigate({ to: '/characters/$characterId', params: { characterId: character.id } });
    }
  }
  const problemsByStep = (s: Step) =>
    s.decisions.reduce(
      (n, d) =>
        n + (evaluation?.diagnostics[d.id]?.filter(x => x.severity !== 'warning').length ?? 0),
      0,
    );
  return (
    <>
      <Link
        to="/characters/$characterId"
        params={{ characterId: character.id }}
        className="mb-4 inline-block text-sm text-muted-foreground"
      >
        ← {character.authored.name}
      </Link>
      <div className="rule-strong mb-6 flex flex-wrap items-end justify-between gap-4 pb-4">
        <div>
          <Eyebrow>Character wizard · level-one devil Fury</Eyebrow>
          <h1>{authored.name || 'Unnamed hero'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Steps follow Making a Hero in source order; the complication step is not presented
            (Q-CHAR-1). Draft revision {expectedRevision}
            {character.effectiveRevisionId ? ' · edits await review before they take effect' : ''}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {evaluation && (
            <Badge variant={evaluation.status === 'complete' ? 'default' : 'outline'}>
              {evaluation.status}
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={command.pending || stale || character.combatLocked}
            onClick={() => void persist(false)}
          >
            {command.pending ? 'Saving…' : 'Save draft'}
          </Button>
          <Button
            type="button"
            disabled={command.pending || stale || character.combatLocked}
            onClick={() => void persist(true)}
          >
            Save and close
          </Button>
        </div>
      </div>
      {stale && (
        <Notice className="mb-4">
          A newer saved version exists. Reload the page before saving.
        </Notice>
      )}
      {character.combatLocked && (
        <Notice className="mb-4">Character editing is locked during combat.</Notice>
      )}
      <ErrorNotice error={command.error} />
      {saved && (
        <p role="status" className="mb-4 text-sm text-success">
          Draft saved (revision {expectedRevision}).
        </p>
      )}
      {cleared.length > 0 && (
        <Notice className="mb-4" role="status">
          Cleared because a parent choice changed: {cleared.join(', ')}.
        </Notice>
      )}
      <div className="grid grid-cols-[220px_minmax(0,1fr)_320px] items-start gap-6">
        <nav aria-label="Steps">
          <ol className="m-0 list-none p-0">
            {PRESENTED.map((s, index) => {
              const problems = problemsByStep(s);
              return (
                <li key={s.id} className="rule-soft">
                  <button
                    type="button"
                    aria-current={index === stepIndex ? 'step' : undefined}
                    className={`flex w-full items-center justify-between gap-2 py-2 text-left text-sm ${index === stepIndex ? 'font-bold' : ''}`}
                    onClick={() => setStepIndex(index)}
                  >
                    <span>{s.sourceStep}</span>
                    {problems > 0 && <Badge variant="outline">{problems}</Badge>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div>
              <h2 className="m-0">{step.sourceStep}</h2>
              <p className="m-0 text-xs text-muted-foreground">
                {step.source}
                {step.optional ? ` · optional in the source: “${step.optionalQuote}”` : ''}
                {step.note ? ` · ${step.note}` : ''}
              </p>
            </div>
            {step.decisions.map(decision => (
              <DecisionEditor
                key={decision.id}
                decision={decision}
                selections={selections}
                onSelect={select}
                authored={authored}
                onAuthored={value => {
                  setSaved(false);
                  setAuthored(value);
                }}
                diagnostics={evaluation?.diagnostics[decision.id]}
              />
            ))}
            {step.id === 'step.details' && (
              <Field label="Private notes" hint="Only you can read these notes.">
                <Textarea
                  maxLength={10000}
                  value={authored.notes}
                  onChange={event => {
                    setSaved(false);
                    setAuthored({ ...authored, notes: event.target.value });
                  }}
                />
              </Field>
            )}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex(stepIndex - 1)}
              >
                ← Previous step
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={stepIndex === PRESENTED.length - 1}
                onClick={() => setStepIndex(stepIndex + 1)}
              >
                Next step →
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <HeroSoFar evaluation={evaluation} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function WizardPage({ characterId }: { characterId: Id<'characters'> }) {
  const character = useQuery(api.characters.get, { characterId });
  if (character === undefined) return <Loading>Loading character…</Loading>;
  return <Wizard key={character.id} character={character} />;
}
