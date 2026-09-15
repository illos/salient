// SPDX-License-Identifier: GPL-3.0-only
/**
 * The v0.01 character sheet (docs/character-sheet-spec.md): compact header (identity, Stamina,
 * Recoveries, heroic resource, surges, Victories, turn state placeholder), then Actions and
 * abilities, Conditions, Features and modifiers, Character details. The same component renders
 * on the standalone character page and in the table's heroes pane; every value comes from the
 * audience-projected `characters.sheet` read, and every control submits a registered operation.
 * Nothing here computes a game value.
 */
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type {
  CharacterSheet as SheetPayload,
  HeroSheet,
  PeerSheet,
  SheetAbility,
  SheetFeature,
} from '../../shared/contracts/characterSheet';
import type { DerivedBaseline, PartialBaseline } from '../../shared/contracts/characterEvaluation';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ErrorNotice, Loading, Notice, useCommand } from '../ui';
import {
  ActiveConditionBadges,
  CatchBreathButton,
  AdjustControl,
  ConditionToggles,
  SlashButton,
  SourceText,
  actorRef,
} from './controls';

const CHARACTERISTICS: [keyof DerivedBaseline['characteristics'], string][] = [
  ['M', 'Might'],
  ['A', 'Agility'],
  ['R', 'Reason'],
  ['I', 'Intuition'],
  ['P', 'Presence'],
];
const GROUPS: [SheetAbility['group'], string][] = [
  ['main', 'Main actions'],
  ['maneuver', 'Maneuvers'],
  ['move', 'Move actions'],
  ['triggered', 'Triggered actions'],
  ['other', 'Other (no structured action type in the source entry)'],
];

/** A value the baseline has not derived yet is shown as pending, never as a zero. */
function pending(value: number | string | undefined | null): string {
  return value === undefined || value === null ? 'pending' : String(value);
}

/** The shared encounter read supplies turn status; no separate sheet clock. */
function TurnState({
  campaignId,
  characterId,
}: {
  campaignId: Id<'campaigns'> | null;
  characterId: string;
}) {
  const encounter = useQuery(api.encounters.current, campaignId ? { campaignId } : 'skip');
  let label = 'Free play';
  if (campaignId && encounter === undefined) label = 'Loading…';
  else if (encounter?.status === 'committed') {
    if (encounter.phase !== 'turns')
      label = encounter.phase === 'closeout' ? 'Closing combat' : 'Opening combat';
    else {
      const entries = encounter.groups
        .flatMap(group => group.entries)
        .filter(entry => entry.actor.kind === 'character' && entry.actor.id === characterId);
      label = entries.some(entry => entry.active)
        ? 'Active turn'
        : entries.length && entries.every(entry => entry.spent)
          ? 'Acted this round'
          : entries.length
            ? 'Awaiting turn'
            : 'Not in combat';
    }
  }
  return <Stat label="Turn state" value={label} />;
}

function PeerCard({ sheet }: { sheet: PeerSheet }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <strong>{sheet.name}</strong>
        <span className="caps text-muted-foreground">{sheet.ownerName}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
        <dt className="text-muted-foreground">Stamina</dt>
        <dd className="m-0">
          {sheet.live ? `${sheet.live.stamina} / ${pending(sheet.maxima?.staminaMaximum)}` : '—'}
        </dd>
        <dt className="text-muted-foreground">Recoveries</dt>
        <dd className="m-0">
          {sheet.live
            ? `${sheet.live.recoveries} / ${pending(sheet.maxima?.recoveriesMaximum)}`
            : '—'}
        </dd>
      </dl>
    </div>
  );
}

/** The shared Roll test entry: characteristic shortcuts prefill it; nothing rolls until Roll. */
function RollTest({
  campaignId,
  characterId,
  characteristic,
  skills,
  enabled,
}: {
  campaignId: Id<'campaigns'>;
  characterId: string;
  characteristic: string;
  skills: string[];
  enabled: boolean;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const [skill, setSkill] = useState('');
  const [edges, setEdges] = useState('0');
  const [banes, setBanes] = useState('0');
  const [difficulty, setDifficulty] = useState('');
  const parts = [
    `${actorRef(characterId)} /test roll characteristic=${characteristic}`,
    skill ? `skill="${skill.replace(/"/g, '')}"` : '',
    edges !== '0' ? `edges=${edges}` : '',
    banes !== '0' ? `banes=${banes}` : '',
    difficulty ? `difficulty=${difficulty}` : '',
  ].filter(Boolean);
  const text = parts.join(' ');
  return (
    <form
      className="flex flex-wrap items-end gap-2 text-xs"
      onSubmit={event => {
        event.preventDefault();
        void command.run(
          commandId => submit({ campaignId, text, commandId }),
          JSON.stringify(['test', campaignId, text]),
        );
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="caps text-muted-foreground">Skill</span>
        <select className="native-select" value={skill} onChange={e => setSkill(e.target.value)}>
          <option value="">None</option>
          {skills.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="caps text-muted-foreground">Edges</span>
        <Input
          className="h-7 w-14"
          inputMode="numeric"
          value={edges}
          onChange={e => setEdges(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="caps text-muted-foreground">Banes</span>
        <Input
          className="h-7 w-14"
          inputMode="numeric"
          value={banes}
          onChange={e => setBanes(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="caps text-muted-foreground">Difficulty</span>
        <select
          className="native-select"
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
        >
          <option value="">Director interprets</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
      </label>
      <Button type="submit" size="sm" disabled={!enabled || command.pending} title={text}>
        Roll test ({characteristic})
      </Button>
      <ErrorNotice error={command.error} />
    </form>
  );
}

function AbilityEntry({ ability }: { ability: SheetAbility }) {
  const [open, setOpen] = useState(false);
  const m = ability.metadata;
  return (
    <li className="rule-soft py-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <strong>{ability.name}</strong>
        <span className="caps text-muted-foreground">
          {m.actionType ?? 'action type in text'}
          {m.cost
            ? ` · ${m.cost}`
            : ability.cost
              ? ` · ${ability.cost.amount} ${ability.cost.resource}`
              : ''}
          {ability.kitBonusesIncluded ? ' · kit bonuses included' : ''}
        </span>
        <Button type="button" variant="ghost" size="xs" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Read'}
        </Button>
      </div>
      {open && (
        <div className="mt-1 flex flex-col gap-1 text-xs">
          <p className="text-muted-foreground">
            Granted by {ability.grantedBy.decisionId}
            {ability.grantedBy.selection ? ` (${ability.grantedBy.selection})` : ''}: “
            {ability.grantedBy.quote}” — {ability.grantedBy.path}
          </p>
          {m.keywords.length > 0 && <p>Keywords: {m.keywords.join(', ')}</p>}
          {m.distance && <p>Distance: {m.distance}</p>}
          {m.target && <p>Target: {m.target}</p>}
          {m.roll && <p>{m.roll}</p>}
          {m.tiers && (
            <ol className="m-0 list-none p-0">
              <li>≤11: {m.tiers[0]}</li>
              <li>12–16: {m.tiers[1]}</li>
              <li>17+: {m.tiers[2]}</li>
            </ol>
          )}
          {m.trigger && <p>Trigger: {m.trigger}</p>}
          {m.effects?.map((effect, index) => (
            <p key={index}>
              <strong>{effect.label}:</strong> {effect.text}
            </p>
          ))}
          <p className="text-muted-foreground">
            Effects are resolved at the table from the source text below; nothing is applied
            automatically in v0.01.
          </p>
          {ability.content ? (
            <SourceText text={ability.content.text} label={ability.name} />
          ) : (
            <p className="text-muted-foreground">
              The content snapshot has no entry for {ability.sourcePath}; run pnpm content:seed.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function FeatureEntry({ feature }: { feature: SheetFeature }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rule-soft py-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <strong>{feature.name}</strong>
        <span className="caps text-muted-foreground">
          {feature.kind.replace(/-/g, ' ')}
          {feature.cost !== undefined
            ? ` · ${feature.cost} point${feature.cost === 1 ? '' : 's'}`
            : ''}
          {feature.affects?.length ? ` · affects ${feature.affects.join(', ')}` : ''}
        </span>
        <Button type="button" variant="ghost" size="xs" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Read'}
        </Button>
      </div>
      {open && (
        <div className="mt-1 text-xs">
          <p className="text-muted-foreground">
            Granted by {feature.grantedBy.decisionId}
            {feature.grantedBy.selection ? ` (${feature.grantedBy.selection})` : ''}: “
            {feature.grantedBy.quote}” — {feature.grantedBy.path}
          </p>
          {feature.content ? (
            <SourceText text={feature.content.text} label={feature.name} />
          ) : (
            <p className="mt-1">
              {feature.grantedBy.quote}{' '}
              <span className="text-muted-foreground">({feature.sourcePath})</span>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function Section({
  title,
  aside,
  defaultOpen,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="rule-soft py-2">
      <summary className="flex cursor-pointer items-baseline justify-between gap-3">
        <h3 className="m-0">{title}</h3>
        {aside && <span className="caps text-muted-foreground">{aside}</span>}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

function Stat({
  label,
  value,
  aside,
}: {
  label: string;
  value: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="caps text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
      {aside}
    </div>
  );
}

export function HeroSheetView({ sheet, compact }: { sheet: HeroSheet; compact?: boolean }) {
  const [rollFor, setRollFor] = useState<string | null>(null);
  const baseline = sheet.build?.baseline ?? null;
  const partial: PartialBaseline | null = baseline ?? sheet.build?.partial ?? null;
  const campaignId = sheet.campaign ? (sheet.campaign.id as Id<'campaigns'>) : null;
  const live = sheet.live;
  const director = sheet.viewer.role === 'director';
  const running = sheet.viewer.sessionRunning;
  const canAct = !!campaignId && sheet.viewer.controls && running;
  const canEdit = !!campaignId && director && running;
  const actor = actorRef(sheet.id);
  const skills = partial?.skills?.map(s => s.name) ?? [];
  const groups = GROUPS.map(([group, title]) => ({
    group,
    title,
    abilities: sheet.abilities.filter(a => a.group === group),
    common: sheet.commonActions.filter(a => a.group === group),
  })).filter(g => g.abilities.length || g.common.length);
  const buildLabel =
    sheet.build?.label === 'effective'
      ? 'Effective build'
      : sheet.build?.label === 'proposed'
        ? 'Proposed build (awaiting review)'
        : sheet.build?.label === 'draft'
          ? 'Draft preview (not in play)'
          : 'No build yet';
  return (
    <article
      className={compact ? 'flex flex-col gap-3' : 'flex flex-col gap-6'}
      aria-label={`${sheet.name} character sheet`}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="m-0">{sheet.name}</h2>
          <span className="flex flex-wrap items-center gap-1">
            <Badge variant={sheet.build?.label === 'effective' ? 'default' : 'outline'}>
              {buildLabel}
            </Badge>
            {sheet.build && sheet.build.status !== 'complete' && (
              <Badge variant="outline">{sheet.build.status}</Badge>
            )}
            {sheet.review?.status === 'pending' && <Badge variant="outline">Review pending</Badge>}
            {sheet.combatLocked && <Badge variant="outline">Combat lock</Badge>}
          </span>
        </div>
        <p className="m-0 text-sm text-muted-foreground">
          Level {pending(partial?.level?.value)} {partial?.ancestry?.value ?? 'ancestry pending'}{' '}
          {partial?.class?.value ?? 'class pending'}
          {partial?.subclass ? ` (${partial.subclass.value})` : ''} ·{' '}
          {partial?.career?.value ?? 'career pending'}
          {' · '}
          {sheet.campaign ? sheet.campaign.name : 'not attached to a campaign'} · owned by{' '}
          {sheet.ownerName}
        </p>
        {sheet.activationPreview &&
          (sheet.activationPreview.changes.length > 0 ||
            sheet.activationPreview.incompatibleResource) && (
            <Notice role="status">
              On activation:{' '}
              {sheet.activationPreview.changes
                .map(
                  change =>
                    `${change.field} ${change.currentBefore}/${change.maximumBefore ?? '—'} → ${change.currentAfter}/${change.maximumAfter}`,
                )
                .join('; ')}
              {sheet.activationPreview.incompatibleResource &&
                ` Activation blocked: changing ${sheet.activationPreview.incompatibleResource.before} to ${sheet.activationPreview.incompatibleResource.after} requires explicit resource reconciliation.`}
            </Notice>
          )}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {CHARACTERISTICS.map(([key, name]) => (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto flex-col items-start gap-0 px-1"
              title={`Open the Roll test flow with ${name} selected`}
              onClick={() => setRollFor(rollFor === key ? null : key)}
            >
              <span className="caps text-muted-foreground">{name}</span>
              <span className="text-lg">{pending(partial?.characteristics?.[key]?.value)}</span>
            </Button>
          ))}
          <Stat label="Size" value={pending(partial?.size?.value)} />
          <Stat label="Speed" value={pending(partial?.speed?.value)} />
          <Stat label="Stability" value={pending(partial?.stability?.value)} />
          <Stat label="Disengage" value={pending(partial?.disengage?.value)} />
          <Stat
            label="Potency"
            value={
              partial?.potency
                ? `${partial.potency.weak.value} / ${partial.potency.average.value} / ${partial.potency.strong.value}`
                : 'pending'
            }
          />
          <Stat
            label="Saves on"
            value={
              partial?.savingThrowThreshold ? `${partial.savingThrowThreshold.value}+` : 'pending'
            }
          />
        </div>
        {rollFor && campaignId && (
          <RollTest
            campaignId={campaignId}
            characterId={sheet.id}
            characteristic={rollFor}
            skills={skills}
            enabled={canAct}
          />
        )}
        {rollFor && !campaignId && (
          <p className="text-xs text-muted-foreground">
            Tests are rolled at the table of an attached campaign.
          </p>
        )}
        {live ? (
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Stat
              label="Stamina"
              value={`${live.stamina} / ${pending(baseline?.staminaMaximum.value)}`}
              aside={
                <>
                  {live.temporaryStamina > 0 && (
                    <span className="text-sm text-muted-foreground">
                      +{live.temporaryStamina} temporary
                    </span>
                  )}
                  {live.labels.winded && (
                    <Badge variant="outline">Winded (≤ {live.labels.windedValue})</Badge>
                  )}
                  {canEdit && campaignId && (
                    <>
                      <AdjustControl
                        campaignId={campaignId}
                        characterId={sheet.id}
                        field="stamina"
                        label="Stamina"
                        current={live.stamina}
                      />
                      <AdjustControl
                        campaignId={campaignId}
                        characterId={sheet.id}
                        field="temporary-stamina"
                        label="Temporary Stamina"
                        current={live.temporaryStamina}
                      />
                    </>
                  )}
                </>
              }
            />
            <Stat
              label="Recoveries"
              value={`${live.recoveries} / ${pending(baseline?.recoveriesMaximum.value)}`}
              aside={
                <>
                  <span className="text-sm text-muted-foreground">
                    recovery value {pending(baseline?.recoveryValue.value)} Stamina restored
                  </span>
                  {canEdit && campaignId && (
                    <AdjustControl
                      campaignId={campaignId}
                      characterId={sheet.id}
                      field="recoveries"
                      label="Recoveries"
                      current={live.recoveries}
                    />
                  )}
                </>
              }
            />
            <Stat
              label={live.heroicResource.name}
              value={live.heroicResource.current}
              aside={
                canEdit && campaignId ? (
                  <AdjustControl
                    campaignId={campaignId}
                    characterId={sheet.id}
                    field="heroic-resource"
                    label="Heroic Resource"
                    current={live.heroicResource.current}
                  />
                ) : undefined
              }
            />
            <Stat
              label="Surges"
              value={live.surges}
              aside={
                canEdit && campaignId ? (
                  <AdjustControl
                    campaignId={campaignId}
                    characterId={sheet.id}
                    field="surges"
                    label="Surges"
                    current={live.surges}
                  />
                ) : undefined
              }
            />
            <Stat
              label="Victories"
              value={live.victories}
              aside={
                canEdit && campaignId ? (
                  <AdjustControl
                    campaignId={campaignId}
                    characterId={sheet.id}
                    field="victories"
                    label="Victories"
                    current={live.victories}
                  />
                ) : undefined
              }
            />
            <Stat label="XP" value={live.xp} />
            <TurnState campaignId={campaignId} characterId={sheet.id} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No live values: they are initialized when the build is admitted to a campaign.
          </p>
        )}
        {live && <ActiveConditionBadges conditions={live.conditions} />}
        {live && campaignId && (!compact || sheet.viewer.controls) && (
          <div className="flex flex-wrap items-center gap-2">
            <CatchBreathButton campaignId={campaignId} characterId={sheet.id} disabled={!canAct} />
            <SlashButton
              campaignId={campaignId}
              text={`${actor} /hero recover`}
              label="Spend a Recovery"
              disabled={!canAct}
              title={
                canAct
                  ? `${actor} /hero recover`
                  : 'Needs a running session and control of this hero'
              }
            />
          </div>
        )}
      </header>
      <div className={compact ? 'max-h-[60vh] overflow-y-auto' : ''}>
        <Section
          title="Actions and abilities"
          aside={`${sheet.abilities.length} granted`}
          defaultOpen
        >
          {sheet.build?.status === 'incomplete' && (
            <p className="text-xs text-muted-foreground">
              The build is incomplete; abilities its missing choices would grant are absent.
            </p>
          )}
          {groups.map(group => (
            <div key={group.group} className="mt-2">
              <h4 className="m-0 caps text-muted-foreground">{group.title}</h4>
              <ul className="m-0 list-none p-0">
                {group.abilities.map(ability => (
                  <AbilityEntry key={`${ability.kind}:${ability.name}`} ability={ability} />
                ))}
                {group.common.map(action => (
                  <CommonActionEntry
                    key={action.id}
                    name={action.name}
                    text={action.content.text}
                  />
                ))}
              </ul>
            </div>
          ))}
        </Section>
        <Section
          title="Conditions"
          aside={
            live
              ? `${Object.values(live.conditions).filter(Boolean).length} active`
              : 'no live record'
          }
        >
          {live ? (
            <ConditionToggles
              campaignId={campaignId}
              characterId={sheet.id}
              conditions={live.conditions}
              canToggle={canAct}
              reason={
                !campaignId
                  ? 'Conditions are toggled at the table.'
                  : !running
                    ? 'Toggles need a running session.'
                    : !sheet.viewer.controls
                      ? 'Only the hero’s controller or the Director toggles conditions.'
                      : null
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">No live record yet.</p>
          )}
        </Section>
        <Section title="Features and modifiers" aside={`${sheet.features.length} entries`}>
          {partial?.kit && (
            <div className="rule-soft py-2 text-sm">
              <strong>Kit: {partial.kit.name.value}</strong>{' '}
              <span className="text-muted-foreground">{partial.kit.equipmentText.value}</span>
              <p className="m-0 text-xs text-muted-foreground">
                Stamina +{partial.kit.staminaBonusApplied.value} (echelon{' '}
                {partial.kit.echelon.value}) · speed +{partial.kit.speedBonus.value} · stability +
                {partial.kit.stabilityBonus.value} · melee damage +
                {partial.kit.meleeDamageBonus.value.join('/+')} · ranged damage +
                {partial.kit.rangedDamageBonus.value.join('/+')} · melee distance +
                {partial.kit.meleeDistanceBonus.value} · ranged distance +
                {partial.kit.rangedDistanceBonus.value} · disengage +
                {partial.kit.disengageBonus.value}
              </p>
            </div>
          )}
          <ul className="m-0 list-none p-0">
            {sheet.features.map(feature => (
              <FeatureEntry key={`${feature.kind}:${feature.name}`} feature={feature} />
            ))}
          </ul>
        </Section>
        <Section title="Character details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Culture</dt>
            <dd className="m-0">
              {sheet.details.cultureName ?? '—'}
              {sheet.details.cultureLanguage || sheet.details.environment
                ? ` (${[sheet.details.cultureLanguage, sheet.details.environment, sheet.details.organization, sheet.details.upbringing].filter(Boolean).join(', ')})`
                : ''}
            </dd>
            <dt className="text-muted-foreground">Career</dt>
            <dd className="m-0">
              {partial?.career?.value ?? '—'}
              {sheet.details.incitingIncident ? ` · ${sheet.details.incitingIncident}` : ''}
            </dd>
            <dt className="text-muted-foreground">Skills</dt>
            <dd className="m-0">{skills.length ? skills.join(', ') : '—'}</dd>
            <dt className="text-muted-foreground">Languages</dt>
            <dd className="m-0">
              {partial?.languages?.length
                ? partial.languages
                    .map(l => `${l.name}${l.duplicateOf ? ' (duplicate, Q-R-100)' : ''}`)
                    .join(', ')
                : '—'}
            </dd>
            <dt className="text-muted-foreground">Renown / Wealth</dt>
            <dd className="m-0">
              {pending(partial?.renown?.value)} / {pending(partial?.wealth?.value)}
            </dd>
            {sheet.details.whatWasTaken && (
              <>
                <dt className="text-muted-foreground">What was taken</dt>
                <dd className="m-0 whitespace-pre-wrap">{sheet.details.whatWasTaken}</dd>
              </>
            )}
            {sheet.details.connections && (
              <>
                <dt className="text-muted-foreground">Connections</dt>
                <dd className="m-0 whitespace-pre-wrap">{sheet.details.connections}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Appearance</dt>
            <dd className="m-0 whitespace-pre-wrap">{sheet.authored.appearance || '—'}</dd>
            <dt className="text-muted-foreground">Biography</dt>
            <dd className="m-0 whitespace-pre-wrap">{sheet.authored.biography || '—'}</dd>
            {sheet.audience === 'owner' && (
              <>
                <dt className="text-muted-foreground">Private notes</dt>
                <dd className="m-0 whitespace-pre-wrap">{sheet.authored.notes || '—'}</dd>
              </>
            )}
          </dl>
          {partial?.uncertainties?.length ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Provisional defaults in this build: {partial.uncertainties.join(', ')}{' '}
              (docs/rules-questions-for-user.md).
            </p>
          ) : null}
        </Section>
      </div>
    </article>
  );
}

function CommonActionEntry({ name, text }: { name: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rule-soft py-2">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span>{name}</span>
        <span className="caps text-muted-foreground">common action · readable</span>
        <Button type="button" variant="ghost" size="xs" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Read'}
        </Button>
      </div>
      {open && <SourceText text={text} label={name} />}
    </li>
  );
}

/** Loads and renders one hero's sheet for the viewer's audience. */
export function CharacterSheet({
  characterId,
  view,
  compact,
}: {
  characterId: Id<'characters'>;
  view?: 'effective' | 'draft' | 'proposed';
  compact?: boolean;
}) {
  const sheet = useQuery(api.characters.sheet, { characterId, ...(view ? { view } : {}) }) as
    SheetPayload | undefined;
  if (!sheet) return <Loading>Loading the sheet…</Loading>;
  if (sheet.audience === 'peer') return <PeerCard sheet={sheet} />;
  return <HeroSheetView sheet={sheet} compact={compact} />;
}
