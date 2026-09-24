// SPDX-License-Identifier: GPL-3.0-only
/**
 * A05 table controls: the target reticle and per-target edge/bane inputs on every roster row, the
 * ability list of a controlled creature (select for use versus expand to read the verbatim text,
 * with the advisory allowance and the pending draft), and the ability cards in the game log
 * (dice, per-target tier and damage, unresolved clauses with Resolved at table, post-roll Add
 * edge / Add bane / remove). Every control submits a registered operation as slash text; nothing
 * here resolves a rule, and what a viewer may see or do comes from the server queries.
 *
 * Owning specifications: docs/table-spec.md#roster-targeting-controls, #v001-edge-and-bane-inputs,
 * #v001-roll-characteristic-default, #player-sheet-actions-and-explicit-end-turn,
 * #v001-critical-hits-and-additional-main-actions, #inline-interaction-cards-in-the-game-log,
 * #director-edits-to-inline-results, docs/table-command-spec.md#results-and-pending-interactions.
 */
import { RuleLink } from '../rules/link';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import type { CompileDiagnostic } from '../../shared/resolve/compileAbility';
import { readableRuleText } from '../rules/reference';
import { GlyphText } from '../components/core-content';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { FunctionReturnType } from 'convex/server';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useCommand } from '../ui';
import { describeContribution, describeModifier } from '../../shared/resolve/modifiers';
import { describeWatcher } from '../../shared/resolve/watchers';
import { describeDuration } from '../../shared/resolve/lastingEffects';

type Actor = { kind: 'character' | 'foe' | 'squad'; id: string; name: string };
type Sheet = FunctionReturnType<typeof api.abilities.sheet>;
type AbilityView = Sheet['abilities'][number];
type Results = FunctionReturnType<typeof api.abilities.results>;
export type AbilityResult = Results[number];

const ref = (actor: { kind: string; id: string }) => `@{${actor.kind}:${actor.id}}`;
const key = (actor: { kind: string; id: string }) => `${actor.kind}:${actor.id}`;

// Operational clauses stay readable; complete references open in the rule card.
const summaryText = readableRuleText;

/** The small edge / bane count field: a 999px `sub` inset with the accent caret (Quiet). */
const MODIFIER_FIELD =
  'h-7 w-12 rounded-full border-0 bg-muted px-2 text-sm text-foreground caret-primary tabular-nums outline-none transition-colors duration-(--motion-fast) focus-visible:bg-accent';

/** A button that submits one slash command through the shared path. */
function Command({
  campaignId,
  text,
  label,
  disabled,
  variant = 'outline',
  title,
}: {
  campaignId: Id<'campaigns'>;
  text: string;
  label: string;
  disabled?: boolean;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
  title?: string;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={disabled || command.pending}
        title={title ?? text}
        onClick={() =>
          void command.run(
            commandId => submit({ campaignId, text, commandId }),
            JSON.stringify(['a05', campaignId, text]),
          )
        }
      >
        {label}
      </Button>
    </span>
  );
}

/**
 * The reticle for one roster row plus that target's next-attack edge and bane counts. The draft
 * belongs to the viewer; other users' selections show as separate indicators.
 */
export function TargetControls({
  campaignId,
  target,
  running,
  mayTarget,
}: {
  campaignId: Id<'campaigns'>;
  target: Actor;
  running: boolean;
  mayTarget: boolean;
}) {
  const drafts = useQuery(api.targets.drafts, { campaignId });
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const mine = drafts?.mine ?? null;
  const selected = mine?.targets.some(t => key(t) === key(target)) ?? false;
  const counts = mine?.modifiers[key(target)] ?? { edges: 0, banes: 0 };
  const [edges, setEdges] = useState<string | null>(null);
  const [banes, setBanes] = useState<string | null>(null);
  const others = (drafts?.others ?? []).filter(o => o.targets.some(t => key(t) === key(target)));
  if (!running) return null;
  const setCounts = () => {
    const e = edges ?? String(counts.edges);
    const b = banes ?? String(counts.banes);
    const text = `/target modifier target=${ref(target)} edges=${Number(e) || 0} banes=${Number(b) || 0}`;
    void command
      .run(
        commandId => submit({ campaignId, text, commandId }),
        JSON.stringify(['mod', campaignId, text]),
      )
      .then(ok => {
        if (ok) {
          setEdges(null);
          setBanes(null);
        }
      });
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {mayTarget && (
        <Command
          campaignId={campaignId}
          text={`/target toggle target=${ref(target)}`}
          label={selected ? 'Targeted' : 'Target'}
          variant={selected ? 'default' : 'outline'}
          title={`Target ${target.name} (selecting a target for a pending ability fires it)`}
        />
      )}
      {mayTarget && (
        <label className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Edges</span>
          <input
            className={MODIFIER_FIELD}
            type="number"
            min={0}
            value={edges ?? String(counts.edges)}
            onChange={e => setEdges(e.target.value)}
            onBlur={() => edges !== null && setCounts()}
            aria-label={`Edges against ${target.name}`}
          />
          <span className="text-sm text-muted-foreground">Banes</span>
          <input
            className={MODIFIER_FIELD}
            type="number"
            min={0}
            value={banes ?? String(counts.banes)}
            onChange={e => setBanes(e.target.value)}
            onBlur={() => banes !== null && setCounts()}
            aria-label={`Banes against ${target.name}`}
          />
        </label>
      )}
      {others.map(o => (
        <Badge key={o.userName} variant="outline">
          Targeted by {o.userName}
          {o.actor ? ` (${o.actor.name})` : ''}
        </Badge>
      ))}
    </div>
  );
}

function AbilityRow({
  campaignId,
  actor,
  ability,
  pending,
}: {
  campaignId: Id<'campaigns'>;
  actor: Actor;
  ability: AbilityView;
  pending: boolean;
}) {
  return (
    <li className="rule-soft flex flex-col gap-1 py-2.5 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="font-medium">{ability.name}</strong>
          {ability.fixedCost && (
            <Badge variant="outline" className="ml-2">
              {ability.fixedCost.amount} {ability.fixedCost.resource}
            </Badge>
          )}
          {ability.unknownCost && (
            <Badge variant="outline" className="ml-2">
              cost not read: manual
            </Badge>
          )}
        </span>
        <span className="flex gap-1">
          <Command
            campaignId={campaignId}
            text={`${ref(actor)} /ability select ability="${ability.id}"`}
            label={pending ? 'Cancel' : 'Use'}
            variant={pending ? 'default' : 'outline'}
          />
          <RuleLink id={ability.id} sourcePath={ability.sourcePath} label={ability.name} />
        </span>
      </div>
    </li>
  );
}

/** The ability list and the pending draft for one controlled creature. */
export function AbilityPanel({
  campaignId,
  actor,
  running,
}: {
  campaignId: Id<'campaigns'>;
  actor: Actor;
  running: boolean;
}) {
  const sheet = useQuery(api.abilities.sheet, { campaignId, actor });
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  if (!sheet || !sheet.controlled || !running) return null;
  const draft = sheet.draft;
  const pending = draft?.abilityId ? sheet.abilities.find(a => a.id === draft.abilityId) : null;
  const allowance = sheet.allowance;
  return (
    <div className="flex flex-col gap-2 text-base">
      {allowance.inCombat && (
        <p className="text-sm text-muted-foreground">
          {allowance.onTurn ? 'Taking their turn' : 'Not their turn'} · main action{' '}
          {allowance.mainUsed >= 1 ? 'spent' : 'available'} · maneuver{' '}
          {allowance.maneuverUsed >= 1 ? 'spent' : 'available'}
          {allowance.extraMainOffered > 0 && (
            <Badge className="ml-2">Extra main action available (critical hit)</Badge>
          )}{' '}
          <span>(advisory: grayed actions still execute with a warning)</span>
        </p>
      )}
      {sheet.missingFacts && <p className="text-sm text-destructive">{sheet.missingFacts}</p>}
      {pending && (
        <div className="inset-controls flex flex-wrap items-center gap-2 rounded-md bg-muted p-3 text-sm">
          <span>
            Pending: <strong className="font-medium">{pending.name}</strong> ·{' '}
            {draft!.targets.length} target
            {draft!.targets.length === 1 ? '' : 's'}
            {draft!.targets.length ? `: ${draft!.targets.map(t => t.name).join(', ')}` : ''}
            {pending.targetShape.kind === 'multi' ? ` (up to ${pending.targetShape.max})` : ''}
            {pending.targetShape.kind === 'area' ? ' (area: select the affected creatures)' : ''}
          </span>
          {pending.permittedCharacteristics.length > 1 && (
            <label className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Roll with</span>
              <select
                className="native-select"
                value={draft!.characteristic ?? ''}
                disabled={command.pending}
                onChange={e => {
                  const text = `${ref(actor)} /ability select ability="${pending.id}" characteristic=${e.target.value || 'default'}`;
                  void command.run(
                    commandId => submit({ campaignId, text, commandId }),
                    JSON.stringify(['char', campaignId, text]),
                  );
                }}
              >
                <option value="">highest (default)</option>
                {pending.permittedCharacteristics.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          {pending.permittedDamageCharacteristics.length > 1 && (
            <label className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Damage with</span>
              <select
                className="native-select"
                aria-label="Damage characteristic"
                value={draft!.damageCharacteristic ?? ''}
                disabled={command.pending}
                onChange={e => {
                  const text = `${ref(actor)} /ability select ability="${pending.id}" damage-characteristic=${e.target.value || 'default'}`;
                  void command.run(
                    commandId => submit({ campaignId, text, commandId }),
                    JSON.stringify(['damage-char', campaignId, text]),
                  );
                }}
              >
                <option value="">highest (default)</option>
                {pending.permittedDamageCharacteristics.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          {['melee', 'ranged'].every(mode =>
            pending.keywords.some(
              keyword => readableRuleText(keyword).trim().toLowerCase() === mode,
            ),
          ) && (
            <label className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Use as</span>
              <select
                className="native-select"
                aria-label="Melee or ranged"
                value={draft!.mode ?? ''}
                disabled={command.pending}
                onChange={e => {
                  const text = `${ref(actor)} /ability select ability="${pending.id}" mode=${e.target.value || 'default'}`;
                  void command.run(
                    commandId => submit({ campaignId, text, commandId }),
                    JSON.stringify(['mode', campaignId, text]),
                  );
                }}
              >
                <option value="">choose</option>
                <option value="melee">melee</option>
                <option value="ranged">ranged</option>
              </select>
            </label>
          )}
          {pending.targetShape.kind !== 'single' && pending.targetShape.kind !== 'self' && (
            <Command
              campaignId={campaignId}
              text={`${ref(actor)} /ability fire`}
              label="Fire"
              variant="default"
              disabled={!draft!.targets.length}
            />
          )}
          <Command
            campaignId={campaignId}
            text="/selection cancel"
            label="Cancel"
            variant="ghost"
          />
        </div>
      )}
      {sheet.resourceForgo && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            {sheet.resourceForgo.forgoing
              ? 'Forgoing Heroic Resource until the start of the next turn (Self-Taught).'
              : sheet.resourceForgo.forgoNext
                ? 'Will forgo Heroic Resource at the next turn start (Self-Taught).'
                : 'Self-Taught: can forgo Heroic Resource at the next turn start.'}
          </span>
          <Command
            campaignId={campaignId}
            text={`${ref(actor)} /resource forgo value=${sheet.resourceForgo.forgoNext ? 'off' : 'on'}`}
            label={sheet.resourceForgo.forgoNext ? 'Keep gaining' : 'Forgo next'}
            title={sheet.resourceForgo.quote}
          />
          {!sheet.resourceForgo.forgoing && (
            <Command
              campaignId={campaignId}
              text={`${ref(actor)} /resource forgo value=now`}
              label="Forgo this turn"
              title="At the start of your turn: remove this turn's gain and forgo until your next turn."
            />
          )}
          <RuleLink sourcePath={sheet.resourceForgo.sourcePath} label="Self-Taught" />
        </p>
      )}
      {sheet.resourcePrayer && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            {sheet.resourcePrayer.prayNext
              ? `${sheet.resourcePrayer.label} before the next turn-start roll.`
              : `${sheet.resourcePrayer.label}: not declared for the next turn start.`}
          </span>
          <Command
            campaignId={campaignId}
            text={`${ref(actor)} /resource pray value=${sheet.resourcePrayer.prayNext ? 'off' : 'on'}`}
            label={
              sheet.resourcePrayer.prayNext
                ? `Cancel: ${sheet.resourcePrayer.label}`
                : sheet.resourcePrayer.label
            }
            title={sheet.resourcePrayer.quote}
          />
          <RuleLink
            sourcePath={sheet.resourcePrayer.sourcePath}
            label={sheet.resourcePrayer.label}
          />
        </p>
      )}
      {sheet.resourceMaintenance && sheet.resourceMaintenance.inCombat && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0" aria-label="Persistent abilities">
          {sheet.resourceMaintenance.abilities.map(ability => (
            <li key={ability.name} className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                {ability.name}: persistent {ability.value}
                {ability.maintained ? ` (maintained × ${ability.maintained})` : ''}
              </span>
              <Command
                campaignId={campaignId}
                text={`${ref(actor)} /resource maintain ability="${ability.name}" value=on`}
                label="Maintain"
                title={sheet.resourceMaintenance!.quote}
              />
              {ability.maintained > 0 && (
                <Command
                  campaignId={campaignId}
                  text={`${ref(actor)} /resource maintain ability="${ability.name}" value=off`}
                  label="Stop one"
                />
              )}
              <RuleLink sourcePath={ability.sourcePath} label={ability.name} />
            </li>
          ))}
        </ul>
      )}
      {sheet.resourceTriggers.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0" aria-label="Resource triggers">
          {sheet.resourceTriggers.map(trigger => (
            <li key={trigger.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                {trigger.label}: {trigger.dice ? `+1d${trigger.dice}` : `+${trigger.amount}`}{' '}
                {trigger.resource}
                {trigger.limit === 'each' ? ' ' : ', once '}
                {trigger.limit === 'each'
                  ? 'each time'
                  : trigger.limit === 'encounter'
                    ? 'per encounter'
                    : `per ${trigger.limit}`}
                {trigger.observed ? ' (automatic when recorded)' : ''}
              </span>
              <span className="text-muted-foreground">
                {trigger.unavailable ?? trigger.confirmation}
              </span>
              <Command
                campaignId={campaignId}
                text={`${ref(actor)} /resource claim trigger=${trigger.id}`}
                label="Claim"
                disabled={trigger.unavailable !== null}
                title={trigger.quote}
              />
              <RuleLink sourcePath={trigger.sourcePath} label={trigger.label} />
            </li>
          ))}
        </ul>
      )}
      <ul className="m-0 list-none p-0">
        {sheet.abilities.map(ability => (
          <AbilityRow
            key={ability.id}
            campaignId={campaignId}
            actor={actor}
            ability={ability}
            pending={pending?.id === ability.id}
          />
        ))}
      </ul>
    </div>
  );
}

type Outcome = {
  total: number;
  tier: number;
  uncertainty?: string;
  edgeBane: { edges: number; banes: number; modifier: number; tierShift: number };
  damage?: {
    rolledDamage: number;
    kitBonus: number;
    damageCharacteristicValue: number;
    tierConstant: number;
  };
  unresolvedClauses: string[];
};
type Applied = {
  afterImmunity: number;
  absorbedByTemporaryStamina: number;
  staminaBefore?: number;
  staminaAfter?: number;
  windedAfter: boolean;
  slain?: boolean;
  dying?: boolean;
} | null;

/** Displays saved calculations only; manual disposition never claims movement execution. */
export function CompiledEffects({
  campaignId,
  eventId,
  compiled,
  targets,
  mayResolve,
}: {
  campaignId: Id<'campaigns'>;
  eventId: Id<'events'>;
  compiled: PublicCompiledResult;
  targets: { target: Actor; originalTargetId?: string }[];
  mayResolve: boolean;
}) {
  return (
    <ol className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Recorded ability effects">
      {compiled.effects.map(occurrence => {
        const effect = occurrence.effect;
        const target = targets.find(t => t.originalTargetId === effect.targetId)?.target;
        return (
          <li
            key={occurrence.id}
            className="flex flex-col gap-1 border-t border-border pt-2 first:border-t-0 first:pt-0"
          >
            <span className="flex flex-wrap items-center gap-2">
              <strong>
                {effect.kind === 'rider' && !effect.tier
                  ? 'Ability effect'
                  : (target?.name ?? 'Original target')}{' '}
                ·{' '}
                {effect.kind === 'unsupported' || effect.kind === 'rider'
                  ? 'Manual effect'
                  : effect.kind === 'strained'
                    ? 'Strained effect'
                    : effect.kind === 'watcher'
                      ? 'Watcher'
                      : effect.kind === 'modifier'
                        ? 'Modifier'
                        : effect.kind === 'gain'
                          ? 'Gain'
                          : effect.kind === 'push'
                            ? `${effect.vertical ? 'Vertical ' : ''}${effect.movement === 'pull' ? 'pull' : effect.movement === 'slide' ? 'slide' : 'push'}`.replace(
                                /^./,
                                letter => letter.toUpperCase(),
                              )
                            : effect.kind === 'condition'
                              ? 'Condition'
                              : 'Damage'}
              </strong>
              <Badge variant="outline">
                {effect.kind === 'damage'
                  ? effect.application
                    ? 'Applied damage'
                    : 'Damage not applied'
                  : occurrence.disposition
                    ? 'Resolved at table'
                    : effect.kind === 'strained'
                      ? effect.status === 'applied'
                        ? 'Applied'
                        : effect.status === 'not-strained'
                          ? 'Not strained'
                          : 'Manual'
                      : effect.kind === 'watcher'
                        ? effect.status === 'applied'
                          ? 'Tracked effect'
                          : 'Manual watcher'
                        : effect.kind === 'modifier'
                          ? effect.status === 'applied'
                            ? 'Tracked effect'
                            : 'Manual modifier'
                          : effect.kind === 'gain'
                            ? effect.status === 'applied'
                              ? 'Applied gain'
                              : 'Manual gain'
                            : effect.kind === 'condition'
                              ? effect.status === 'applied'
                                ? 'Applied condition'
                                : effect.status === 'resisted'
                                  ? 'Resisted'
                                  : effect.status === 'immune'
                                    ? 'Immune'
                                    : effect.status === 'ineligible'
                                      ? 'Too large to grab'
                                      : effect.status === 'fact-needed'
                                        ? 'Facts needed'
                                        : 'Manual condition'
                              : effect.kind === 'push'
                                ? 'Outstanding instruction'
                                : 'Unresolved'}
              </Badge>
            </span>
            <span className="[overflow-wrap:anywhere]">
              <GlyphText text={summaryText(effect.clause)} />
            </span>
            <span className="text-muted-foreground [overflow-wrap:anywhere]">
              Source: {compiled.definition.source.path} · {effect.locator}
            </span>
            {effect.kind === 'damage' && (
              <>
                {effect.breakdown && (
                  <span>
                    Calculated damage {effect.breakdown.rolledDamage}
                    {effect.breakdown.damageType ? ` (${effect.breakdown.damageType})` : ''}.
                  </span>
                )}
                {effect.application && (
                  <span>
                    {effect.application.afterImmunity} damage applied;{' '}
                    {effect.application.absorbedByTemporaryStamina} absorbed by temporary Stamina.
                  </span>
                )}
                {!!effect.requirements.length && (
                  <span>Needed: {effect.requirements.join('; ')}.</span>
                )}
              </>
            )}
            {effect.kind === 'condition' && (
              <>
                <span>
                  {effect.restriction ? "can't stand" : effect.condition} (
                  {effect.duration === 'eot'
                    ? 'EoT'
                    : effect.duration === 'none'
                      ? 'no printed duration'
                      : 'save ends'}
                  ) ·{' '}
                  {effect.thresholdSource.kind === 'always'
                    ? 'no potency'
                    : `${effect.characteristic} < ${
                        effect.thresholdSource.kind === 'printed'
                          ? effect.thresholdSource.value
                          : effect.thresholdSource.tier
                      }${
                        effect.thresholdSource.kind === 'potency' && effect.threshold !== undefined
                          ? ` (potency ${effect.threshold})`
                          : ''
                      }`}
                  .
                </span>
                {effect.targetScore !== undefined && (
                  <span>
                    Target {effect.characteristic}: {effect.targetScore}.
                  </span>
                )}
                {!!effect.requirements.length && (
                  <span>Needed: {effect.requirements.join('; ')}.</span>
                )}
                <span className="text-muted-foreground">
                  Condition consequences and potency adjustments remain manual.
                </span>
              </>
            )}
            {effect.kind === 'push' && (
              <>
                <span>
                  Printed {effect.vertical ? 'vertical ' : ''}
                  {effect.movement ?? 'push'} {effect.printed} + size bonus{' '}
                  {effect.sizeBonus ?? 'unknown'}
                  {effect.allowance !== undefined
                    ? ` · Allowance ${effect.allowance} before optional stability reduction.`
                    : effect.subtotal !== undefined
                      ? ` · Subtotal ${effect.subtotal}; final allowance not established.`
                      : ' · Final allowance not established.'}
                </span>
                <span>
                  Optional stability reduction: {effect.stability ?? 'unknown'}
                  {effect.stabilityEffects?.length
                    ? ` (includes ${effect.stabilityEffects
                        .map(
                          e =>
                            `${e.amount >= 0 ? '+' : '−'}${Math.abs(e.amount)} from ${e.actorLabel}'s ${e.abilityName}`,
                        )
                        .join(', ')})`
                    : ''}
                  . Physical movement remains manual.
                </span>
                {!!effect.requirements.length && (
                  <span>Needed: {effect.requirements.join('; ')}.</span>
                )}
                {!!effect.manualReasons.length && (
                  <span>Manual coverage: {effect.manualReasons.join('; ')}.</span>
                )}
                <span>{effect.instruction}</span>
                <span className="text-muted-foreground">
                  Manual scope: {effect.manualScope.join('; ')}.
                </span>
                <span className="text-muted-foreground [overflow-wrap:anywhere]">
                  Rules: {effect.rulePaths.join('; ')}.
                </span>
              </>
            )}
            {effect.kind === 'gain' && (
              <>
                <span>
                  {[
                    effect.temporaryStamina !== undefined
                      ? `${effect.temporaryStamina} temporary Stamina${
                          effect.application?.temporaryStaminaAfter !== undefined
                            ? ` (${effect.application.temporaryStaminaBefore} → ${effect.application.temporaryStaminaAfter}; the greater amount is kept)`
                            : ''
                        }`
                      : '',
                    effect.surges !== undefined
                      ? `${effect.surges} surge${effect.surges === 1 ? '' : 's'}${
                          effect.application?.surgesAfter !== undefined
                            ? ` (${effect.application.surgesBefore} → ${effect.application.surgesAfter})`
                            : ''
                        }`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  .
                </span>
                {effect.status === 'manual' && (
                  <span>Apply this gain at the table; no live state was changed.</span>
                )}
              </>
            )}
            {effect.kind === 'modifier' && (
              <span>
                {effect.payload ? describeModifier(effect.payload) : 'Amount unknown'} ·{' '}
                {describeDuration(effect.spec.duration, effect.spec.endsWhen)}
                {effect.spec.consumeOn ? ' · used up by their next roll' : ''}.{' '}
                {effect.status === 'applied'
                  ? 'Applied automatically to later rolls and derived values; exclude it on a roll it doesn’t fit.'
                  : `Apply it at the table: ${effect.requirements.join('; ')}.`}
              </span>
            )}
            {effect.kind === 'watcher' && (
              <span>
                {effect.payload ? describeWatcher(effect.payload) : 'Amount unknown'} ·{' '}
                {describeDuration(effect.spec.duration, effect.spec.endsWhen)}.{' '}
                {effect.status === 'applied'
                  ? 'The engine fires it when that happens; end it with /effect end.'
                  : `Resolve it at the table: ${effect.requirements.join('; ')}.`}
              </span>
            )}
            {effect.kind === 'strained' && (
              <span>
                {effect.status === 'not-strained'
                  ? 'The user was not strained for this use, so this does not apply.'
                  : effect.status === 'applied'
                    ? `Applied${effect.spec.targetExtraDamage ? `: the target's damage includes the extra ${effect.spec.targetExtraDamage.amount}` : ''}${effect.selfApplication ? `; the user took ${effect.selfApplication.afterImmunity} damage that can't be reduced` : ''}.`
                    : `Resolve at the table: ${effect.requirements.join('; ')}.`}
              </span>
            )}
            {effect.kind === 'rider' && (
              <span>
                Resolve the printed effect at the table; this entry applies no additional state
                changes.
                {effect.requirements.length > 0 && ` Needed: ${effect.requirements.join('; ')}.`}
              </span>
            )}
            {effect.kind === 'unsupported' && (
              <span>
                Manual: {effect.reason} ·{' '}
                {effect.dependency === 'after-damage' ? 'After damage' : 'Dependency unknown'}.
              </span>
            )}
            {occurrence.disposition?.note && (
              <span className="text-muted-foreground">{occurrence.disposition.note}</span>
            )}
            {effect.kind !== 'damage' &&
              (effect.kind !== 'gain' || effect.status === 'manual') &&
              (effect.kind !== 'modifier' || effect.status === 'manual') &&
              (effect.kind !== 'watcher' || effect.status === 'manual') &&
              (effect.kind !== 'strained' || effect.status === 'manual') &&
              (effect.kind !== 'condition' ||
                effect.status === 'fact-needed' ||
                effect.status === 'manual') &&
              !occurrence.disposition &&
              target &&
              mayResolve && (
                <Command
                  campaignId={campaignId}
                  text={`/ability resolved event="${eventId}" occurrence=${JSON.stringify(occurrence.id)} target=${ref(target)}`}
                  label="Resolved at table"
                  variant="ghost"
                />
              )}
          </li>
        );
      })}
    </ol>
  );
}

/** The interactive card for one resolved ability use, rendered under its log entry. */
export function AbilityCard({
  campaignId,
  eventId,
  result,
  director,
  running,
  manualClauses,
}: {
  campaignId: Id<'campaigns'>;
  eventId: Id<'events'>;
  result: AbilityResult | undefined;
  director: boolean;
  running: boolean;
  /** Ability-level Effect clauses from the event payload (manualResolutions.sourceClause). */
  manualClauses: string[];
}) {
  if (!result) return null;
  const mayCorrect = result.mayCorrect && running;
  const execution = result.execution as
    | { mode: 'compiled' | 'legacy-compatibility' | 'manual'; diagnostics: CompileDiagnostic[] }
    | undefined;
  return (
    <div className="inset-controls mt-2 flex flex-col gap-2 rounded-md bg-muted p-4 text-sm">
      <span className="text-muted-foreground">
        {/* V157: an ability without a power roll has no dice line. */}
        {result.dice
          ? `Dice ${result.dice.d10a} + ${result.dice.d10b}${
              result.selectedCharacteristic
                ? ` + ${result.characteristicValue} (${result.selectedCharacteristic})`
                : ` + ${result.characteristicValue}`
            }`
          : 'No power roll'}
        {result.correctionEventIds.length
          ? ` · ${result.correctionEventIds.length} correction${result.correctionEventIds.length === 1 ? '' : 's'} applied`
          : ''}
      </span>
      {execution && (
        <div className="flex flex-col gap-1 text-muted-foreground">
          <span>
            {execution.mode === 'legacy-compatibility'
              ? 'Legacy compatibility: unchanged sourced ability; manual effects retain existing controls.'
              : execution.mode === 'manual'
                ? 'Manual ability: source is outside supported execution.'
                : 'Recorded compiled effects'}
          </span>
          {execution.diagnostics.map((diagnostic, index) => (
            <span key={`${diagnostic.code}:${diagnostic.locator}:${index}`}>
              {diagnostic.message} · {diagnostic.locator}
            </span>
          ))}
        </div>
      )}
      {result.targets.map(t => {
        // V157: an effect-only use has no per-target roll; its effects are listed below.
        if (result.effectOnly) return null;
        const outcome = t.outcome as Outcome;
        const applied = t.applied as Applied;
        const target = t.target;
        return (
          <div key={key(target)} className="flex flex-col gap-1">
            <span>
              <strong className="font-medium">{target.name}</strong>: {t.edges} edge, {t.banes} bane
              {t.contributions?.some(c => !c.excluded)
                ? ` (${outcome.edgeBane.edges} edge, ${outcome.edgeBane.banes} bane with effects)`
                : ''}{' '}
              → total {outcome.total}, tier {outcome.tier}
              {outcome.uncertainty ? ` (${outcome.uncertainty})` : ''}
              {outcome.damage
                ? applied
                  ? ` · ${applied.afterImmunity} damage applied${applied.absorbedByTemporaryStamina ? ` (${applied.absorbedByTemporaryStamina} to temporary Stamina)` : ''}${applied.slain ? ' · Slain' : applied.windedAfter ? ' · winded' : ''}`
                  : ` · ${outcome.damage.rolledDamage} damage not applied`
                : ' · no supported damage'}
            </span>
            {/* V159: automatic contributions of active effects, with the exclude command. */}
            {(t.contributions ?? []).map(contribution => {
              const excluded = (t.contributions ?? [])
                .filter(c => c.excluded)
                .map(c => c.instanceId);
              const next = contribution.excluded
                ? excluded.filter(id => id !== contribution.instanceId)
                : [...excluded, contribution.instanceId];
              return (
                <span
                  key={contribution.instanceId}
                  className="flex flex-wrap items-center gap-2 text-muted-foreground"
                  data-roll-contribution
                >
                  <Badge variant="outline">
                    {contribution.excluded ? 'Excluded' : 'Automatic'}
                  </Badge>
                  <span className="[overflow-wrap:anywhere]" title={contribution.sourcePath}>
                    {describeContribution(contribution)}
                  </span>
                  {mayCorrect &&
                    (!contribution.excluded ||
                      !contribution.consumes.length ||
                      contribution.usedUp) && (
                      <Command
                        campaignId={campaignId}
                        text={`/ability correct event="${eventId}" target=${ref(target)} exclude=${JSON.stringify(next)}`}
                        label={contribution.excluded ? 'Include' : 'Exclude'}
                        variant="ghost"
                      />
                    )}
                </span>
              );
            })}
            {mayCorrect && (
              <span className="flex flex-wrap gap-1">
                <Command
                  campaignId={campaignId}
                  text={`/ability correct event="${eventId}" target=${ref(target)} edges=${t.edges + 1} banes=${t.banes}`}
                  label="Add edge"
                  variant="ghost"
                />
                <Command
                  campaignId={campaignId}
                  text={`/ability correct event="${eventId}" target=${ref(target)} edges=${t.edges} banes=${t.banes + 1}`}
                  label="Add bane"
                  variant="ghost"
                />
                {t.edges > 0 && (
                  <Command
                    campaignId={campaignId}
                    text={`/ability correct event="${eventId}" target=${ref(target)} edges=${t.edges - 1} banes=${t.banes}`}
                    label="Remove edge"
                    variant="ghost"
                  />
                )}
                {t.banes > 0 && (
                  <Command
                    campaignId={campaignId}
                    text={`/ability correct event="${eventId}" target=${ref(target)} edges=${t.edges} banes=${t.banes - 1}`}
                    label="Remove bane"
                    variant="ghost"
                  />
                )}
              </span>
            )}
            {!result.compiled &&
              outcome.unresolvedClauses.map(clause => {
                const disposition = t.dispositions.find(d => d.clause === clause);
                return (
                  <span key={clause} className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {disposition ? 'Resolved at table' : 'Unresolved'}
                    </Badge>
                    <span className="[overflow-wrap:anywhere]">
                      <GlyphText text={summaryText(clause)} />
                    </span>
                    {disposition?.note && (
                      <span className="text-muted-foreground">{disposition.note}</span>
                    )}
                    {director && running && result.mayResolve && !disposition && (
                      <Command
                        campaignId={campaignId}
                        text={`/ability resolved event="${eventId}" target=${ref(target)} clause=${JSON.stringify(clause)}`}
                        label="Resolved at table"
                        variant="ghost"
                      />
                    )}
                  </span>
                );
              })}
          </div>
        );
      })}
      {result.compiled && (
        <CompiledEffects
          campaignId={campaignId}
          eventId={eventId}
          compiled={result.compiled}
          targets={result.targets}
          mayResolve={director && running && result.mayResolve}
        />
      )}
      {!result.compiled &&
        manualClauses.map(clause => {
          const disposition = result.manualDispositions.find(d => d.clause === clause);
          return (
            <span key={clause} className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{disposition ? 'Resolved at table' : 'Unresolved'}</Badge>
              <span className="[overflow-wrap:anywhere]">
                <GlyphText text={summaryText(clause)} />
              </span>
              {director && running && result.mayResolve && !disposition && (
                <Command
                  campaignId={campaignId}
                  text={`/ability resolved event="${eventId}" clause=${JSON.stringify(clause)}`}
                  label="Resolved at table"
                  variant="ghost"
                />
              )}
            </span>
          );
        })}
    </div>
  );
}

/** Ability-level manual clauses carried by an ability.use event payload. */
export function manualClausesOf(payload: unknown): string[] {
  const result = (
    payload as { data?: { result?: { manualResolutions?: { sourceClause: string }[] } } }
  )?.data?.result;
  return (result?.manualResolutions ?? []).map(m => m.sourceClause);
}
