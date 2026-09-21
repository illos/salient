// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Your hero so far" column (V21 item 10; Quiet, docs/design-mockups/quiet/README.md; V96
 * grouping): a `card` panel with the disc and identity line, five compact characteristic tiles,
 * then the derived values in named groups — Vitals, Movement and defense, Standing — each a `sub`
 * inset of hairline-split rows. What the build grants follows in its own insets, counted; then the
 * skills, then what the hero still owes, then the Source text inset for the current step.
 *
 * The status reads as a dot and a word rather than a pill, so the accent marks completeness
 * rather than decorating a label. Every value is read from the shared `characters.evaluate`
 * result; nothing here derives one. A value the evaluator has not produced yet reads "Pending"
 * (the model does not say which later step supplies it).
 */
import { cn } from 'cn';
import { Chip } from '../components/chip';
import { Disc } from '../components/disc';
import { StatBox } from '../components/stat-box';
import { Loading } from '../ui';
import { RuleLink } from '../rules/link';
import type { RuleReference } from '../rules/reference';
import type { EvaluationResult, PartialBaseline } from '../../shared/contracts/characterEvaluation';
import { decisionLabel, readableGuidance } from './presentation';
import { SupportingBuildFacts } from './supporting-components';

const CHARACTERISTICS = [
  ['M', 'Mgt'],
  ['A', 'Agl'],
  ['R', 'Rsn'],
  ['I', 'Int'],
  ['P', 'Prs'],
] as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const pending = value === undefined || value === null || value === '';
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-base">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={pending ? 'text-sm text-muted-foreground' : 'text-right font-medium'}>
        {pending ? 'Pending' : value}
      </span>
    </div>
  );
}

/** A named group of rows: the label outside, the rows in a `sub` inset. */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5" aria-label={label}>
      <h3 className="m-0 text-sm font-normal text-muted-foreground">{label}</h3>
      <div className="divide-y divide-border rounded-md bg-muted px-4 py-1">{children}</div>
    </section>
  );
}

/** One kind of thing the build grants: what it is, how many, and their names. */
function Granted({ label, list }: { label: string; list: { name: string }[] | undefined }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted px-4 py-3">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        {list?.length ? (
          <span className="text-sm tabular-nums text-muted-foreground">{list.length}</span>
        ) : null}
      </span>
      <span className={cn('text-base', !list?.length && 'text-sm text-muted-foreground')}>
        {list?.length ? list.map(item => item.name).join(', ') : 'Pending'}
      </span>
    </div>
  );
}

function names(list: { name: string }[] | undefined): string | undefined {
  return list?.length ? list.map(item => item.name).join(', ') : undefined;
}

export function HeroSoFar({
  evaluation,
  heroName,
  sourceReference,
  sourceExcerpt,
}: {
  evaluation: EvaluationResult | undefined;
  heroName: string;
  sourceReference: RuleReference;
  sourceExcerpt?: string;
}) {
  const b: PartialBaseline = evaluation?.baseline ?? evaluation?.partial ?? {};
  const show = (v: { value: number | string } | undefined) =>
    v === undefined ? undefined : String(v.value);
  const problems = evaluation
    ? Object.values(evaluation.diagnostics)
        .flat()
        .filter(d => d.severity !== 'warning')
    : [];
  const identity = [
    b.ancestry?.value,
    b.class ? `${b.class.value}${b.subclass ? ` (${b.subclass.value})` : ''}` : undefined,
    b.level ? `Level ${b.level.value}` : undefined,
  ].filter(Boolean);
  return (
    <aside
      aria-label="Hero so far"
      data-wizard-pane="summary"
      className="flex flex-col gap-5 rounded-lg bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-lg font-medium">Your hero so far</p>
        {evaluation ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              aria-hidden
              className={cn(
                'size-2 rounded-full',
                evaluation.status === 'complete' ? 'bg-primary' : 'bg-placeholder',
              )}
            />
            {evaluation.status}
          </span>
        ) : (
          <Loading>Evaluating…</Loading>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Disc name={heroName || 'Unnamed hero'} variant="grey" size="md" />
        <div className="min-w-0">
          <p className="m-0 truncate text-base font-medium">{heroName || 'Unnamed hero'}</p>
          <p className="m-0 truncate text-sm text-muted-foreground">
            {identity.length ? identity.join(' · ') : 'Ancestry and class to come'}
          </p>
        </div>
      </div>
      <div className="flex justify-between gap-2" aria-label="Characteristics">
        {CHARACTERISTICS.map(([key, label]) => (
          <StatBox
            key={key}
            compact
            inset
            // An assigned characteristic steps up a tone rather than taking the accent: every
            // tile is assigned once the class step is done, so a ring here would spend the
            // accent on decoration (docs/design-mockups/quiet/README.md, accent budget).
            className={b.characteristics?.[key] !== undefined ? 'bg-placeholder' : undefined}
            value={b.characteristics ? b.characteristics[key].value : '–'}
            label={label}
          />
        ))}
      </div>
      <Group label="Vitals">
        <Row label="Stamina" value={show(b.staminaMaximum)} />
        <Row
          label="Recoveries"
          value={
            b.recoveriesMaximum
              ? `${b.recoveriesMaximum.value}${b.recoveryValue ? ` · value ${b.recoveryValue.value}` : ''}`
              : undefined
          }
        />
        <Row label="Winded" value={show(b.windedValue)} />
        <Row
          label="Heroic resource"
          value={
            b.heroicResource
              ? `${b.heroicResource.name.value.replace(/^./, c => c.toUpperCase())} ${b.heroicResource.startingValue.value}`
              : undefined
          }
        />
        <Row label="Kit" value={b.kit === null ? 'None' : b.kit?.name.value} />
      </Group>
      <Group label="Movement and defense">
        <Row label="Speed" value={show(b.speed)} />
        <Row label="Stability" value={show(b.stability)} />
        <Row label="Size" value={show(b.size)} />
        <Row label="Disengage" value={show(b.disengage)} />
        <Row
          label="Potency"
          value={
            b.potency
              ? `${b.potency.weak.value} / ${b.potency.average.value} / ${b.potency.strong.value}`
              : undefined
          }
        />
        <Row
          label="Saves on"
          value={b.savingThrowThreshold ? `${b.savingThrowThreshold.value}+` : undefined}
        />
      </Group>
      <Group label="Standing">
        <Row label="Renown" value={show(b.renown)} />
        <Row label="Wealth" value={show(b.wealth)} />
        <Row label="Languages" value={names(b.languages)} />
      </Group>
      <section className="flex flex-col gap-1.5" aria-label="Granted by your build">
        <h3 className="m-0 text-sm font-normal text-muted-foreground">Granted by your build</h3>
        <Granted label="Traits" list={b.traits} />
        <Granted label="Features" list={b.features} />
        <Granted label="Perks" list={b.perks} />
        <Granted label="Abilities" list={b.abilities} />
      </section>
      <SupportingBuildFacts baseline={b} />
      <section className="flex flex-col gap-1.5" aria-label="Skills">
        <h3 className="m-0 text-sm font-normal text-muted-foreground">Skills</h3>
        {b.skills?.length ? (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {b.skills.map(skill => (
              <li key={skill.name}>
                <Chip>{skill.name}</Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">None yet</p>
        )}
      </section>
      {problems.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-label="Outstanding">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="m-0 text-sm font-normal text-muted-foreground">Outstanding</h3>
            <span className="text-sm text-primary tabular-nums">
              {problems.length} of {problems.length} left
            </span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {problems.map((d, i) => (
              <li key={i} className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 flex-1 font-medium">{decisionLabel(d.decisionId)}</span>
                <span className="shrink-0 text-muted-foreground">
                  {readableGuidance(d.message)}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm text-muted-foreground">
            Each needs a selection before the hero can be finished.
          </p>
        </section>
      )}
      {b.uncertainties?.length ? (
        <p className="m-0 text-sm text-muted-foreground">
          Some character details still need a rules decision. Review them with your Director.
        </p>
      ) : null}
      <div className="mt-auto flex flex-col gap-2 rounded-md bg-muted p-4" aria-label="Source text">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Source text</span>
          <RuleLink {...sourceReference} />
        </div>
        {sourceExcerpt && (
          <p className="m-0 text-base text-muted-foreground">
            {sourceExcerpt} <span className="text-sm">— {sourceReference.label}</span>
          </p>
        )}
      </div>
    </aside>
  );
}
