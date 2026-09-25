import { StartingRewardsPanel } from './starting-rewards';
// SPDX-License-Identifier: GPL-3.0-only
/**
 * The character sheet (docs/character-sheet-spec.md) in the Quiet layout
 * (docs/design-mockups/quiet/README.md, character sheet): the header band (disc, name, identity
 * line, characteristic tiles), then three columns of `card` panels on the standalone page —
 * Stamina, Stats, Skills and Conditions at the left; Abilities in the centre; Kit, Features,
 * Languages, Details and Notes at the right — or one column in the table's heroes pane with the
 * header and Stamina block sticky above the scrolling body. Every value comes from the
 * audience-projected `characters.sheet` read, and every control submits a registered operation.
 * Nothing here computes a game value.
 */
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type {
  CharacterSheet as SheetPayload,
  HeroSheet,
  PeerSheet,
  SheetAbility,
} from '../../shared/contracts/characterSheet';
import type { PartialBaseline } from '../../shared/contracts/characterEvaluation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Disc } from '../components/disc';
import { HealthBar } from '../components/health-bar';
import { Loading, Notice, useCommand } from '../ui';
import { AbilityCard, CommonActionCard } from './ability-card';
import { ActiveConditionBadges, ConditionToggles, actorRef } from './controls';
import { ActiveEffects } from '../effect-instances';
import { CHARACTERISTICS, SheetHeader, type CharacteristicKey } from './header';
import {
  DetailsRows,
  FeatureRows,
  KitBoxes,
  LanguageChips,
  NotesBox,
  SheetSection,
  SkillChips,
  StatsList,
  pending,
} from './sections';
import { RunicCarving } from './runic-carving';
import { StaminaBlock } from './stamina-block';

const GROUPS: [SheetAbility['group'], string][] = [
  ['main', 'Main actions'],
  ['maneuver', 'Maneuvers'],
  ['move', 'Move actions'],
  ['triggered', 'Triggered actions'],
  ['other', 'Other abilities'],
];

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
  return (
    <div className="flex items-center justify-between gap-2 text-base">
      <span className="text-muted-foreground">Turn state</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

/** Peers see Stamina and Recoveries only; no Heroic Resource reaches this payload. */
function PeerCard({ sheet, compact }: { sheet: PeerSheet; compact?: boolean }) {
  const max = sheet.maxima?.staminaMaximum;
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        compact ? 'rounded-md bg-muted p-4' : 'rounded-lg bg-card p-6',
      )}
      data-sheet-peer
    >
      <div className="flex items-center gap-3">
        <Disc name={sheet.name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-base font-medium">{sheet.name}</strong>
          <span className="text-sm text-muted-foreground">{sheet.ownerName}</span>
        </div>
      </div>
      {sheet.live && max !== undefined && (
        <HealthBar
          value={sheet.live.stamina}
          max={max}
          tone="hero"
          label={`${sheet.name} Stamina`}
        />
      )}
      <dl className="m-0 grid grid-cols-2 gap-x-3 text-base">
        <div className="flex flex-col">
          <dt className="text-sm text-muted-foreground">Stamina</dt>
          <dd className="m-0 font-medium tabular-nums">
            {sheet.live ? `${sheet.live.stamina} / ${pending(max)}` : '—'}
          </dd>
        </div>
        <div className="flex flex-col items-end text-right">
          <dt className="text-sm text-muted-foreground">Recoveries</dt>
          <dd className="m-0 font-medium tabular-nums">
            {sheet.live
              ? `${sheet.live.recoveries} / ${pending(sheet.maxima?.recoveriesMaximum)}`
              : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** The shared Roll test entry: characteristic shortcuts prefill it; nothing rolls until Roll. */
function RollTest({
  campaignId,
  characterId,
  characteristic,
  onCharacteristic,
  skills,
  enabled,
  onClose,
}: {
  campaignId: Id<'campaigns'>;
  characterId: string;
  characteristic: CharacteristicKey;
  onCharacteristic: (key: CharacteristicKey) => void;
  skills: string[];
  enabled: boolean;
  onClose: () => void;
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
  const name = CHARACTERISTICS.find(([key]) => key === characteristic)?.[1] ?? characteristic;
  // The form is a `sub` inset, so its controls step up to `ph`.
  const select = 'native-select h-8 bg-placeholder';
  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-md bg-muted p-4 text-sm"
      aria-label="Roll test"
      onSubmit={event => {
        event.preventDefault();
        void command.run(
          commandId => submit({ campaignId, text, commandId }),
          JSON.stringify(['test', campaignId, text]),
        );
      }}
    >
      <span className="mr-1 self-center text-base font-medium text-foreground">Roll test</span>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Characteristic</span>
        <select
          className={select}
          aria-label="Test characteristic"
          value={characteristic}
          onChange={e => onCharacteristic(e.target.value as CharacteristicKey)}
        >
          {CHARACTERISTICS.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Skill</span>
        <select className={select} value={skill} onChange={e => setSkill(e.target.value)}>
          <option value="">None</option>
          {skills.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Edges</span>
        <Input
          className="h-8 w-14 bg-placeholder"
          inputMode="numeric"
          value={edges}
          onChange={e => setEdges(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Banes</span>
        <Input
          className="h-8 w-14 bg-placeholder"
          inputMode="numeric"
          value={banes}
          onChange={e => setBanes(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Difficulty</span>
        <select className={select} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="">Director interprets</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
      </label>
      <Button type="submit" size="sm" disabled={!enabled || command.pending} title={text}>
        Roll test ({name})
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClose}>
        Close
      </Button>
    </form>
  );
}

function Abilities({ sheet, compact }: { sheet: HeroSheet; compact?: boolean }) {
  const groups = GROUPS.map(([group, title]) => ({
    group,
    title,
    abilities: sheet.abilities.filter(a => a.group === group),
    common: sheet.commonActions.filter(a => a.group === group),
  })).filter(g => g.abilities.length || g.common.length);
  return (
    <SheetSection
      title="Abilities"
      aside={`${sheet.abilities.length} granted`}
      compact={compact}
      bare
      id="sheet-abilities"
    >
      {sheet.features.some(feature => feature.name === 'Runic Carving') &&
        (sheet.build?.label === 'effective' ||
          (sheet.audience === 'owner' && !sheet.campaign && sheet.build?.label !== 'history')) && (
          <RunicCarving characterId={sheet.id as Id<'characters'>} />
        )}
      {sheet.build?.status === 'incomplete' && (
        <p className="m-0 mb-3 text-sm text-muted-foreground">
          The build is incomplete; abilities its missing choices would grant are absent.
        </p>
      )}
      {/* On the standalone page each group is a `card` panel around its printed Core cards; in
          the heroes pane (already a panel) the groups sit on the pane surface. */}
      <div className={cn('flex flex-col', compact ? 'gap-5' : 'gap-4')}>
        {groups.map(group => (
          <div
            key={group.group}
            className={cn('flex flex-col gap-3', !compact && 'rounded-lg bg-card p-6')}
          >
            <h4 className="m-0 text-sm font-normal text-muted-foreground">{group.title}</h4>
            <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label={group.title}>
              {group.abilities.map(ability => (
                <AbilityCard
                  key={`${ability.kind}:${ability.name}`}
                  ability={ability}
                  compact={compact}
                />
              ))}
              {group.common.map(action => (
                <CommonActionCard
                  key={action.id}
                  name={action.name}
                  id={action.content.id}
                  compact={compact}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SheetSection>
  );
}

function Conditions({
  sheet,
  campaignId,
  canAct,
  compact,
}: {
  sheet: HeroSheet;
  campaignId: Id<'campaigns'> | null;
  canAct: boolean;
  compact?: boolean;
}) {
  const live = sheet.live;
  const running = sheet.viewer.sessionRunning;
  return (
    <SheetSection
      title="Conditions"
      compact={compact}
      id="sheet-conditions"
      aside={
        live ? `${Object.values(live.conditions).filter(Boolean).length} active` : 'no live record'
      }
    >
      {live ? (
        <div className="flex flex-col gap-4">
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
          <ActiveEffects
            campaignId={campaignId}
            canEnd={canAct}
            effects={(live.effectInstances ?? [])
              .filter(instance => instance.status === 'active')
              .map(instance => ({
                id: instance.id,
                abilityName: instance.abilityName,
                actorLabel: instance.actorLabel,
                sourcePath: instance.sourcePath,
                text: instance.payload.text,
                subject: instance.subject.name,
                printedDuration: instance.printedDuration,
                endsWhen: instance.endsWhen,
                scheduled: instance.registrationIds.length > 0,
                ...(instance.manualStacking ? { manualStacking: true } : {}),
              }))}
          />
        </div>
      ) : (
        <p className="m-0 text-base text-muted-foreground">No live record yet.</p>
      )}
    </SheetSection>
  );
}

export function HeroSheetView({ sheet, compact }: { sheet: HeroSheet; compact?: boolean }) {
  const [rollFor, setRollFor] = useState<CharacteristicKey | null>(null);
  const baseline = sheet.build?.baseline ?? null;
  const partial: PartialBaseline | null = baseline ?? sheet.build?.partial ?? null;
  // A recorded build (V185 History) is read-only: no table controls, rolls or inventory actions.
  const readOnly = sheet.build?.label === 'history';
  const campaignId = sheet.campaign && !readOnly ? (sheet.campaign.id as Id<'campaigns'>) : null;
  const live = sheet.live;
  const director = sheet.viewer.role === 'director';
  const running = sheet.viewer.sessionRunning;
  const canAct = !!campaignId && sheet.viewer.controls && running;
  const canEdit = !!campaignId && director && running;
  const skills = partial?.skills?.map(s => s.name) ?? [];
  const level = partial?.level?.value;
  const activation =
    sheet.activationPreview &&
    (sheet.activationPreview.changes.length > 0 || sheet.activationPreview.incompatibleResource) ? (
      <Notice role="status">
        {readOnly ? 'If restored and activated:' : 'On activation:'}{' '}
        {sheet.activationPreview.changes
          .map(
            change =>
              `${change.field} ${change.currentBefore}/${change.maximumBefore ?? '—'} → ${change.currentAfter}/${change.maximumAfter}`,
          )
          .join('; ')}
        {sheet.activationPreview.incompatibleResource &&
          ` Activation blocked: changing ${sheet.activationPreview.incompatibleResource.before} to ${sheet.activationPreview.incompatibleResource.after} requires explicit resource reconciliation.`}
      </Notice>
    ) : null;
  const rollTest =
    rollFor &&
    !readOnly &&
    (campaignId ? (
      <RollTest
        campaignId={campaignId}
        characterId={sheet.id}
        characteristic={rollFor}
        onCharacteristic={setRollFor}
        skills={skills}
        enabled={canAct}
        onClose={() => setRollFor(null)}
      />
    ) : (
      <p className="m-0 text-sm text-muted-foreground" role="status">
        Tests are rolled at the table of an attached campaign.
      </p>
    ));
  const rollEntry = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={compact ? 'bg-placeholder' : undefined}
      aria-expanded={rollFor !== null}
      onClick={() => setRollFor(rollFor ? null : 'M')}
    >
      Roll test
    </Button>
  );
  const stamina = (
    <StaminaBlock
      sheet={sheet}
      compact={compact}
      campaignId={campaignId}
      canAct={canAct}
      canEdit={canEdit}
      turnState={
        readOnly ? undefined : <TurnState campaignId={campaignId} characterId={sheet.id} />
      }
      extraControls={readOnly ? undefined : rollEntry}
    />
  );
  if (compact) {
    return (
      <article className="flex flex-col gap-3" aria-label={`${sheet.name} character sheet`}>
        {/* The pinned identity takes the pane's own surface so a card passing underneath is
            hidden rather than read as clipped. */}
        <div
          className="sticky top-0 z-10 -mx-1 flex flex-col gap-3 bg-card px-1 pb-3"
          data-sheet-sticky
        >
          <SheetHeader
            sheet={sheet}
            partial={partial}
            compact
            rollFor={rollFor}
            onRollFor={setRollFor}
          >
            {live && (
              <ActiveConditionBadges
                conditions={live.conditions}
                instances={live.conditionInstances}
              />
            )}
          </SheetHeader>
          {activation}
          {stamina}
          {rollTest}
        </div>
        <div className="flex flex-col gap-6" data-sheet-body>
          <Abilities sheet={sheet} compact />
          <Conditions sheet={sheet} campaignId={campaignId} canAct={canAct} compact />
          <SheetSection
            title={partial?.kit ? `Features · Kit · ${partial.kit.name.value}` : 'Features'}
            aside={`${sheet.features.length} entries`}
            compact
            id="sheet-features"
          >
            <div className="flex flex-col gap-3">
              {partial?.kit && <KitBoxes kit={partial.kit} compact />}
              <FeatureRows features={sheet.features} level={level} compact />
            </div>
          </SheetSection>
          <SheetSection title="Stats" compact id="sheet-stats">
            <StatsList partial={partial} xp={live?.xp ?? null} compact />
          </SheetSection>
          <SheetSection title="Details" compact id="sheet-details">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Skills</span>
                <SkillChips partial={partial} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Languages</span>
                <LanguageChips partial={partial} />
              </div>
              <DetailsRows sheet={sheet} partial={partial} />
              {!readOnly && (sheet.audience === 'owner' || sheet.campaign) && (
                <StartingRewardsPanel
                  characterId={sheet.id}
                  combatLocked={sheet.combatLocked}
                  compact
                />
              )}
              {sheet.audience === 'owner' && <NotesBox notes={sheet.authored.notes} compact />}
            </div>
          </SheetSection>
        </div>
      </article>
    );
  }
  return (
    <article className="flex flex-col gap-6" aria-label={`${sheet.name} character sheet`}>
      <div className="flex flex-col gap-4">
        <SheetHeader sheet={sheet} partial={partial} rollFor={rollFor} onRollFor={setRollFor}>
          {live && (
            <ActiveConditionBadges
              conditions={live.conditions}
              instances={live.conditionInstances}
            />
          )}
        </SheetHeader>
        {activation}
        {rollTest}
      </div>
      <div
        className="grid grid-cols-[340px_minmax(0,1fr)_360px] items-start gap-4"
        data-sheet-columns
      >
        <div className="flex flex-col gap-4">
          {stamina}
          <SheetSection title="Stats" id="sheet-stats">
            <StatsList partial={partial} xp={live?.xp ?? null} />
          </SheetSection>
          <SheetSection title="Skills" aside={`${skills.length}`} id="sheet-skills">
            <SkillChips partial={partial} />
          </SheetSection>
          <Conditions sheet={sheet} campaignId={campaignId} canAct={canAct} />
        </div>
        <Abilities sheet={sheet} />
        <div className="flex flex-col gap-4">
          {partial?.kit && (
            <SheetSection title={`Kit · ${partial.kit.name.value}`} id="sheet-kit">
              <KitBoxes kit={partial.kit} />
            </SheetSection>
          )}
          <SheetSection
            title="Features"
            aside={`${sheet.features.length} entries`}
            id="sheet-features"
          >
            <FeatureRows features={sheet.features} level={level} />
          </SheetSection>
          <SheetSection title="Languages" id="sheet-languages">
            <LanguageChips partial={partial} />
          </SheetSection>
          {!readOnly && (sheet.audience === 'owner' || sheet.campaign) && (
            <StartingRewardsPanel characterId={sheet.id} combatLocked={sheet.combatLocked} />
          )}
          <SheetSection title="Details" id="sheet-details">
            <DetailsRows sheet={sheet} partial={partial} />
            {partial?.uncertainties?.length ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Some character details still need a rules decision. Review this build with your
                Director.
              </p>
            ) : null}
          </SheetSection>
          {sheet.audience === 'owner' && <NotesBox notes={sheet.authored.notes} />}
        </div>
      </div>
    </article>
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
  /** Heroes-pane variant: one column, sticky header, no card wrapper and no own scroll. */
  compact?: boolean;
}) {
  const sheet = useQuery(api.characters.sheet, { characterId, ...(view ? { view } : {}) }) as
    SheetPayload | undefined;
  if (!sheet) return <Loading>Loading the sheet…</Loading>;
  if (sheet.audience === 'peer') return <PeerCard sheet={sheet} compact={compact} />;
  return <HeroSheetView sheet={sheet} compact={compact} />;
}
