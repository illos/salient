// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Your hero so far" column (character-wizard-class.png; V21 item 10): disc and identity
 * line, five compact characteristic boxes, ruled rows of derived values, skill chips, the
 * outstanding list and the SOURCE TEXT callout for the current step. Every value is read from
 * the shared `characters.evaluate` result; nothing here derives one. A value the evaluator has
 * not produced yet reads "Pending" (the model does not say which later step supplies it).
 */
import { Chip } from '../components/chip';
import { Disc } from '../components/disc';
import { Pill } from '../components/pill';
import { StatBox } from '../components/stat-box';
import { Loading } from '../ui';
import { RuleLink } from '../rules/link';
import type { RuleReference } from '../rules/reference';
import type { EvaluationResult, PartialBaseline } from '../../shared/contracts/characterEvaluation';
import { decisionLabel, readableGuidance } from './presentation';

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
    <div className="rule-soft flex items-baseline justify-between gap-4 py-2 text-sm">
      <span>{label}</span>
      <span className={pending ? 'text-muted-foreground' : 'text-right font-semibold tabular-nums'}>
        {pending ? 'Pending' : value}
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
      className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-(--pane-padding-x) py-(--pane-padding-y)"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow mb-0">Your hero so far</p>
        {evaluation ? (
          <Pill filled={evaluation.status === 'complete'}>{evaluation.status}</Pill>
        ) : (
          <Loading>Evaluating…</Loading>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Disc name={heroName || 'Unnamed hero'} variant="grey" size="md" />
        <div className="min-w-0">
          <p className="m-0 truncate font-semibold">{heroName || 'Unnamed hero'}</p>
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
            emphasis={b.characteristics?.[key] !== undefined}
            value={b.characteristics ? b.characteristics[key].value : '–'}
            label={label}
          />
        ))}
      </div>
      <div>
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
        <Row label="Renown" value={show(b.renown)} />
        <Row label="Wealth" value={show(b.wealth)} />
        <Row label="Languages" value={names(b.languages)} />
        <Row label="Traits" value={names(b.traits)} />
        <Row label="Features" value={names(b.features)} />
        <Row label="Perks" value={names(b.perks)} />
        <Row label="Abilities" value={names(b.abilities)} />
      </div>
      <div>
        <p className="caps mb-2 text-muted-foreground">Skills</p>
        {b.skills?.length ? (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Skills">
            {b.skills.map(skill => (
              <li key={skill.name}>
                <Chip>{skill.name}</Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">None yet</p>
        )}
      </div>
      {problems.length > 0 && (
        <div>
          <p className="caps mb-1 text-muted-foreground">Outstanding</p>
          <ul className="m-0 list-none p-0 text-xs">
            {problems.map((d, i) => (
              <li key={i} className="py-0.5">
                <span className="font-semibold">{decisionLabel(d.decisionId)}</span>:{' '}
                {readableGuidance(d.message)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {b.uncertainties?.length ? (
        <p className="m-0 text-xs text-muted-foreground">
          Some character details still need a rules decision. Review them with your Director.
        </p>
      ) : null}
      <div
        className="mt-auto flex flex-col gap-2 rounded-md border border-primary p-4"
        aria-label="Source text"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="caps text-primary">Source text</span>
          <RuleLink {...sourceReference} />
        </div>
        {sourceExcerpt && (
          <p className="m-0 text-sm text-muted-foreground">
            {sourceExcerpt} <span className="text-xs">— {sourceReference.label}</span>
          </p>
        )}
      </div>
    </aside>
  );
}
