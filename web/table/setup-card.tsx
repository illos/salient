// SPDX-License-Identifier: GPL-3.0-only
/**
 * The staged combat setup card in the game log column: setup (Director draft of participants,
 * surprise and groups; others see the lists), the shared initiative roll, and the starting-side
 * choice. Every control submits a registered operation; OK answers the card's interaction so the
 * continuation (`combat.commit`) runs through the same runner as the CLI. Nothing here decides a
 * rule: who may edit, roll or choose comes from `encounters.current`.
 *
 * Owning specifications: docs/table-spec.md#confirmed-initiative-setup-and-shared-presentation,
 * docs/table-command-spec.md#starting-combat-through-an-action-card.
 */
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { FunctionReturnType } from 'convex/server';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { SectionHeading, useCommand } from '../ui';

export type Encounter = NonNullable<FunctionReturnType<typeof api.encounters.current>>;
type Participant = Encounter['participants'][number];

/** One slash command as a button. */
export function CommandButton({
  campaignId,
  text,
  label,
  disabled,
  variant = 'outline',
  icon,
  title,
  describedBy,
  onDone,
}: {
  campaignId: Id<'campaigns'>;
  text: string;
  /** Visible text, or — with `icon` — the accessible name of an icon-only control. */
  label: string;
  disabled?: boolean;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
  /** Render an icon-only button carrying `label` as its accessible name (V31 item 2). */
  icon?: React.ReactNode;
  /** Tooltip; defaults to the slash text the button submits. */
  title?: string;
  /** Id of an element describing the control, e.g. why it is unavailable (V31). */
  describedBy?: string;
  onDone?: () => void;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const tooltip = title ?? text;
  const inert = disabled || command.pending;
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        variant={variant}
        size={icon ? 'icon-sm' : 'sm'}
        aria-label={icon ? label : undefined}
        aria-describedby={describedBy}
        disabled={inert}
        // An icon-only control carries its whole explanation in the tooltip and the description,
        // and a natively disabled button reaches neither: it takes no pointer events, so the
        // tooltip never opens, and it leaves the tab order (V31 review, finding 1). Base UI's
        // `focusableWhenDisabled` emits `aria-disabled` instead, which stays inert but focusable
        // and hoverable. Buttons with a visible label keep the native behaviour.
        focusableWhenDisabled={icon ? true : undefined}
        // Pointer events stay on so the tooltip opens, so the hover background has to be turned
        // off explicitly or an inert control lights up as though it were live.
        className={
          icon ? 'aria-disabled:opacity-40 [&[aria-disabled=true]:hover]:bg-transparent' : undefined
        }
        title={tooltip}
        onClick={() => {
          if (inert) return;
          void command
            .run(
              commandId => submit({ campaignId, text, commandId }),
              JSON.stringify(['combat', campaignId, text]),
            )
            .then(ok => {
              if (ok) onDone?.();
            });
        }}
      >
        {icon ?? label}
      </Button>
    </span>
  );
}

function ref(actor: { kind: 'character' | 'foe' | 'squad'; id: string }) {
  return `@{${actor.kind}:${actor.id}}`;
}

function ParticipantRow({
  campaignId,
  participant,
  editable,
}: {
  campaignId: Id<'campaigns'>;
  participant: Participant;
  editable: boolean;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const change = (args: string) => {
    const text = `/combat setup creature=${ref(participant.actor)} ${args}`;
    void command.run(
      commandId => submit({ campaignId, text, commandId }),
      JSON.stringify(['combat.setup', campaignId, text]),
    );
  };
  const groupName = participant.groupKey.includes(':')
    ? participant.groupKey.split(':').slice(1).join(':')
    : participant.groupKey;
  const ownGroup = participant.groupKey === participant.key;
  return (
    <li
      className={`flex flex-col gap-1.5 py-2 text-base ${participant.included ? '' : 'opacity-40'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <strong className="font-medium">{participant.actor.name}</strong>
        {participant.surprised && <Badge variant="outline">Surprised</Badge>}
        {!participant.included && <Badge variant="outline">Not in this combat</Badge>}
        {!ownGroup && <Badge variant="outline">Group {groupName}</Badge>}
      </div>
      {editable && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className="size-[18px] accent-primary"
              checked={participant.included}
              disabled={command.pending}
              onChange={e => change(`included=${e.target.checked}`)}
            />
            Included
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className="size-[18px] accent-primary"
              checked={participant.surprised}
              disabled={command.pending || !participant.included}
              onChange={e => change(`surprised=${e.target.checked}`)}
            />
            Surprised
          </label>
          <label className="flex items-center gap-1.5">
            Group
            <input
              className="h-7 w-24 rounded-md border-0 bg-placeholder px-2 text-sm text-foreground caret-primary outline-none disabled:opacity-40"
              defaultValue={ownGroup ? '' : groupName}
              placeholder="own"
              disabled={command.pending || !participant.included}
              onBlur={e => {
                const name = e.target.value.trim();
                const current = ownGroup ? '' : groupName;
                if (name === current) return;
                change(`group=${JSON.stringify(name || 'own')}`);
              }}
            />
          </label>
        </div>
      )}
    </li>
  );
}

function SideList({
  title,
  campaignId,
  participants,
  editable,
}: {
  title: string;
  campaignId: Id<'campaigns'>;
  participants: Participant[];
  editable: boolean;
}) {
  return (
    <div>
      <SectionHeading as="h3" className="mb-1">
        {title}
      </SectionHeading>
      {participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody on this side.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {participants.map(p => (
            <ParticipantRow
              key={p.key}
              campaignId={campaignId}
              participant={p}
              editable={editable}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OkButton({
  campaignId,
  interactionId,
}: {
  campaignId: Id<'campaigns'>;
  interactionId: Id<'interactions'>;
}) {
  const respond = useMutation(api.interactions.respond);
  const command = useCommand();
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        size="sm"
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => respond({ interactionId, answer: {}, commandId }),
            JSON.stringify(['combat.ok', campaignId, interactionId]),
          )
        }
      >
        OK
      </Button>
    </span>
  );
}

function sideName(side: 'heroes' | 'director') {
  return side === 'heroes' ? 'Heroes' : 'Foes';
}

export function CombatSetupCard({
  campaignId,
  encounter,
}: {
  campaignId: Id<'campaigns'>;
  encounter: Encounter;
}) {
  const phase = encounter.phase;
  if (phase !== 'setup' && phase !== 'roll' && phase !== 'choice') return null;
  const heroes = encounter.participants.filter(p => p.side === 'heroes');
  const foes = encounter.participants.filter(p => p.side === 'director');
  return (
    <div className="inset-controls rounded-md bg-muted p-5">
      <div className="flex flex-col gap-4">
        <SectionHeading
          aside={
            phase === 'setup'
              ? 'Setup · draft'
              : phase === 'roll'
                ? 'Combat committed · roll initiative'
                : 'Combat committed · who goes first?'
          }
          className="mb-0"
        >
          Combat
        </SectionHeading>
        {phase === 'setup' && (
          <>
            <p className="text-sm text-muted-foreground">
              {encounter.mayEditSetup
                ? 'Choose who takes part, who is surprised and how initiative groups are formed. Nothing is committed until OK; Cancel discards these choices.'
                : 'The Director is preparing combat. Included creatures, surprise and groups are shown as they are chosen.'}
            </p>
            <div className="grid grid-cols-2 gap-6">
              <SideList
                title="Heroes"
                campaignId={campaignId}
                participants={heroes}
                editable={encounter.mayEditSetup}
              />
              <SideList
                title="Foes"
                campaignId={campaignId}
                participants={foes}
                editable={encounter.mayEditSetup}
              />
            </div>
            {encounter.mayEditSetup && (
              <div className="flex flex-wrap items-center gap-2">
                {encounter.setupInteractionId && (
                  <OkButton campaignId={campaignId} interactionId={encounter.setupInteractionId} />
                )}
                <CommandButton campaignId={campaignId} text="/combat cancel" label="Cancel" />
              </div>
            )}
          </>
        )}
        {phase === 'roll' && (
          <>
            <p className="text-base">
              Both sides have an unsurprised creature. Any active player or the Director rolls the
              shared d10: on 6 or higher the players choose who goes first; otherwise the Director
              decides.
            </p>
            {encounter.mayRoll ? (
              <CommandButton
                campaignId={campaignId}
                text="/combat roll"
                label="Roll initiative (d10)"
                variant="default"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Waiting for the roll.</p>
            )}
          </>
        )}
        {phase === 'choice' && (
          <>
            <p className="text-base">
              {encounter.opening?.roll
                ? `${encounter.opening.roll.rolledByName} rolled ${encounter.opening.roll.value}: ${
                    encounter.opening.roll.entitlement === 'players'
                      ? 'the players choose who goes first.'
                      : 'the Director decides who goes first.'
                  }`
                : encounter.opening?.path === 'adjudication'
                  ? 'The source gives no starting side here (both sides surprised, or a side has no participants): the Director chooses.'
                  : 'Choose the starting side.'}
              {encounter.opening?.surprisedSides.length
                ? ` Surprised side: ${encounter.opening.surprisedSides.map(sideName).join(', ')}.`
                : ''}
            </p>
            {encounter.mayChooseFirst ? (
              <div className="flex flex-wrap gap-2">
                <CommandButton
                  campaignId={campaignId}
                  text="/combat first side=heroes"
                  label="Heroes first"
                  variant="default"
                />
                <CommandButton
                  campaignId={campaignId}
                  text="/combat first side=foes"
                  label="Foes first"
                  variant="default"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Waiting for the choice.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
