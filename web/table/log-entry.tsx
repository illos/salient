// SPDX-License-Identifier: GPL-3.0-only
/**
 * One game-log entry in the mockup feed presentation (session-free-play-director.png,
 * combat-table-*.png; docs/build/V21-desktop-layout-fidelity.md item 5): a small disc at the
 * left (ink for the viewer's own creature, red for a foe, grey otherwise), the actor's name in
 * bold with the time at the right, the recorded description in grey beneath, dice as chips with
 * the total filled and the tier in brick red, and the history affordance as a small ghost button:
 * Undo / Rewind on the entry the viewer's undo would act on, and Redo on the undone entry their
 * redo would restore (V29 item 1 gave Redo the same inline placement Undo already had, so a
 * player keeps both after the Director's toolbar moved into the settings pop-up). Session and
 * combat markers render as a centred pill. Presentation only: every number shown here is read
 * from the recorded event; nothing is computed.
 *
 * Owning specifications: docs/table-spec.md#game-log-and-chat-scope,
 * #confirmed-action-and-log-contract, #undo-permissions-and-proposed-campaign-control.
 */
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Chip, DiceChips, type DiceChip } from '../components/chip';
import { Disc, type DiscVariant } from '../components/disc';
import { Pill } from '../components/pill';
import { EventRuleLinks } from '../rules/event-links';
import { readableRuleText } from '../rules/reference';
import { CommandButton } from './setup-card';
import { redoCommand, undoCommand, undoLabel, type HistoryStatus } from './history-controls';
import { AbilityCard, manualClausesOf, type AbilityResult } from './targeting';

export type LogEvent = FunctionReturnType<typeof api.events.list>['events'][number];

type BoundActor =
  { kind?: 'character' | 'foe' | 'squad'; id?: string; name?: string } | null | undefined;

/** The creature the command was issued for, when the envelope bound one. */
export function boundActorOf(payload: unknown): BoundActor {
  return (payload as { envelope?: { boundActor?: BoundActor } })?.envelope?.boundActor ?? null;
}

const CHARACTERISTIC_NAMES: Record<string, string> = {
  M: 'Might',
  A: 'Agility',
  R: 'Reason',
  I: 'Intuition',
  P: 'Presence',
};

function signed(value: number): string {
  return value < 0 ? `−${Math.abs(value)}` : `+${value}`;
}

/** `2d10` for two ten-sided dice, `d6` for one, grouped by sides in first-seen order. */
function diceNotation(dice: { sides: number }[]): string[] {
  const counts = new Map<number, number>();
  for (const die of dice) counts.set(die.sides, (counts.get(die.sides) ?? 0) + 1);
  return [...counts.entries()].map(([sides, count]) => `${count > 1 ? count : ''}d${sides}`);
}

type TestRollData = {
  result?: {
    characteristic?: string;
    characteristicValue?: number;
    skillBonus?: number;
    edgeBane?: { modifier?: number };
    total?: number;
    tier?: number;
  };
};
type AbilityUseData = {
  result?: {
    kind?: string;
    characteristicValue?: number;
    selectedCharacteristic?: string;
    targets?: { targetId?: string; outcome?: { total?: number; tier?: number } }[];
  };
  targets?: { target?: { id?: string; name?: string } }[];
};

/**
 * Dice chips for an entry, read from the recorded event: the test roll's inputs, total and tier;
 * an ability's power roll with each target's total and tier; a public table roll's faces; and any
 * other event's dice by notation. Null when the event carries no dice.
 */
export function diceChipsOf(event: LogEvent): DiceChip[] | null {
  const dice = event.dice ?? [];
  const data = (event.payload as { data?: unknown } | undefined)?.data;
  if (event.kind === 'test.roll') {
    const result = (data as TestRollData | undefined)?.result;
    if (!result) return null;
    const chips: DiceChip[] = [];
    const name = CHARACTERISTIC_NAMES[result.characteristic ?? ''] ?? result.characteristic;
    chips.push({ label: name ? `Test · ${name}` : 'Test', kind: 'plain' });
    chips.push({ label: dice.length ? diceNotation(dice).join(' ') : '2d10', kind: 'plain' });
    if (typeof result.characteristicValue === 'number')
      chips.push({ label: signed(result.characteristicValue), kind: 'plain' });
    if (result.skillBonus)
      chips.push({ label: `${signed(result.skillBonus)} skill`, kind: 'plain' });
    const modifier = result.edgeBane?.modifier ?? 0;
    if (modifier)
      chips.push({ label: `${signed(modifier)} ${modifier > 0 ? 'edge' : 'bane'}`, kind: 'plain' });
    if (typeof result.total === 'number')
      chips.push({ label: String(result.total), kind: 'result' });
    if (typeof result.tier === 'number')
      chips.push({ label: `Tier ${result.tier}`, kind: 'accent' });
    return chips;
  }
  if (event.kind === 'ability.use') {
    const payload = data as AbilityUseData | undefined;
    const result = payload?.result;
    if (!result || result.kind !== 'resolved') return dice.length ? plainDice(dice) : null;
    const chips: DiceChip[] = [{ label: 'Power roll', kind: 'plain' }];
    chips.push({ label: dice.length ? diceNotation(dice).join(' ') : '2d10', kind: 'plain' });
    if (typeof result.characteristicValue === 'number') {
      const name = CHARACTERISTIC_NAMES[result.selectedCharacteristic ?? ''];
      chips.push({
        label: `${signed(result.characteristicValue)}${name ? ` ${name}` : ''}`,
        kind: 'plain',
      });
    }
    const targets = result.targets ?? [];
    const several = targets.length > 1;
    for (const target of targets) {
      if (several) {
        const named = payload?.targets?.find(t => t.target?.id === target.targetId)?.target?.name;
        if (named) chips.push({ label: named, kind: 'plain' });
      }
      if (typeof target.outcome?.total === 'number')
        chips.push({ label: String(target.outcome.total), kind: 'result' });
      if (typeof target.outcome?.tier === 'number')
        chips.push({ label: `Tier ${target.outcome.tier}`, kind: 'accent' });
    }
    return chips;
  }
  if (!dice.length) return null;
  if (event.kind === 'combat.initiative-roll')
    return [
      { label: 'Initiative', kind: 'plain' },
      ...diceNotation(dice).map(label => ({ label, kind: 'plain' as const })),
      ...dice.map(die => ({ label: String(die.value), kind: 'result' as const })),
    ];
  return plainDice(dice);
}

/** Notation plus each face: a public roll records faces and adds nothing. */
function plainDice(dice: { sides: number; value: number }[]): DiceChip[] {
  return [
    ...diceNotation(dice).map(label => ({ label, kind: 'plain' as const })),
    ...dice.map(die => ({ label: String(die.value), kind: 'result' as const })),
  ];
}

/** Whether the entry carries dice (the ROLLS tab filter). */
export function hasDice(event: LogEvent): boolean {
  return (event.dice?.length ?? 0) > 0 || diceChipsOf(event) !== null;
}

type Marker = { label: string };

/** Session and combat markers shown as a centred pill instead of an entry. */
export function markerOf(event: LogEvent): Marker | null {
  const time = new Date(event.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  switch (event.kind) {
    case 'session.started':
      return { label: `Session started · ${time}` };
    case 'combat.ended':
      return { label: `Combat ended · ${time}` };
    case 'combat.finished':
      return { label: `Encounter closed · ${time}` };
    case 'combat.voided':
      return { label: `Combat voided · ${time}` };
    case 'clock.boundary': {
      const boundary = (event.payload as { event?: { kind?: string; round?: number } } | undefined)
        ?.event;
      if (boundary?.kind === 'combat-start') return { label: `Combat started · ${time}` };
      if (boundary?.kind === 'round-start') return { label: `Round ${boundary.round}` };
      return null;
    }
    default:
      return null;
  }
}

function timeOf(createdAt: number): { short: string; full: string } {
  const date = new Date(createdAt);
  return {
    short: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleString(),
  };
}

/** Disc tone: ink for the viewer's own creature, red for a foe, grey for everything else. */
function discVariant(actor: BoundActor, ownActorIds: ReadonlySet<string>): DiscVariant {
  if (actor?.kind === 'foe') return 'red';
  if (actor?.kind === 'character' && actor.id && ownActorIds.has(actor.id)) return 'ink';
  return 'grey';
}

export function LogEntry({
  campaignId,
  event,
  history,
  undoTarget,
  redoTarget,
  result,
  director,
  running,
  ownActorIds,
}: {
  campaignId: Id<'campaigns'>;
  event: LogEvent;
  history: HistoryStatus | undefined;
  /** The event the viewer's Undo / Rewind would act on, from `history.status`. */
  undoTarget: string | undefined;
  /** The undone event the viewer's Redo would restore, from `history.status`. */
  redoTarget: string | undefined;
  result: AbilityResult | undefined;
  director: boolean;
  running: boolean;
  /** Ids of the heroes the viewer controls; their entries get the ink disc. */
  ownActorIds: ReadonlySet<string>;
}) {
  const undone = event.disposition === 'undone';
  const description = readableRuleText(event.description);
  const time = timeOf(event.createdAt);
  const marker = markerOf(event);
  const title = `#${event.sequence} · ${time.full}`;
  if (marker)
    return (
      <li
        className={undone ? 'opacity-60' : undefined}
        data-disposition={event.disposition}
        data-sequence={event.sequence}
        data-kind={event.kind}
        title={`${title} · ${description}`}
      >
        <Pill centered className="py-3">
          <span className={undone ? 'line-through' : undefined}>{marker.label}</span>
        </Pill>
      </li>
    );
  const actor = boundActorOf(event.payload);
  const user = event.actorName ?? (event.origin === 'clock' ? 'Game clock' : 'Engine');
  const name = actor?.name ?? user;
  const attribution = actor?.name ? `${user} as ${actor.name}` : user;
  const chips = diceChipsOf(event);
  return (
    <li
      className={`group/entry flex items-start gap-3 py-2.5 ${undone ? 'text-muted-foreground' : ''}`}
      data-disposition={event.disposition}
      data-sequence={event.sequence}
      data-kind={event.kind}
      data-dice={chips ? 'true' : undefined}
    >
      <Disc
        name={name}
        size="sm"
        variant={discVariant(actor, ownActorIds)}
        muted={undone}
        label={attribution}
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span
            className={`min-w-0 truncate text-sm font-bold ${undone ? 'line-through' : ''}`}
            title={attribution}
          >
            {name}
          </span>
          {event.disposition !== 'applied' && (
            <Chip caps kind="plain" className="h-5 text-muted-foreground">
              {event.disposition === 'undone'
                ? 'Undone'
                : event.disposition === 'redone'
                  ? 'Redone'
                  : event.disposition}
            </Chip>
          )}
          <EventRuleLinks payload={event.payload} />
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {history && event.id === undoTarget && (
              <span className="opacity-0 transition-opacity duration-(--motion-fast) group-focus-within/entry:opacity-100 group-hover/entry:opacity-100">
                <CommandButton
                  campaignId={campaignId}
                  text={undoCommand(history.role, event.id)}
                  label={undoLabel(history.role)}
                  variant="ghost"
                />
              </span>
            )}
            {history && event.id === redoTarget && (
              <span className="opacity-0 transition-opacity duration-(--motion-fast) group-focus-within/entry:opacity-100 group-hover/entry:opacity-100">
                <CommandButton
                  campaignId={campaignId}
                  text={redoCommand(event.id)}
                  label="Redo"
                  variant="ghost"
                />
              </span>
            )}
            <time
              className="text-xs text-muted-foreground tabular-nums"
              dateTime={new Date(event.createdAt).toISOString()}
              title={title}
            >
              {time.short}
            </time>
          </span>
        </div>
        {/* The recorded description stays in a <strong> for the audit locators; visually grey. */}
        <strong
          className={`text-sm leading-5 font-normal text-muted-foreground [overflow-wrap:anywhere] ${
            undone ? 'line-through' : ''
          }`}
        >
          {description}
        </strong>
        {chips && <DiceChips chips={chips} className="mt-0.5" />}
        {event.kind === 'ability.use' && (
          <AbilityCard
            campaignId={campaignId}
            eventId={event.id}
            result={result}
            director={director}
            running={running}
            manualClauses={manualClausesOf(event.payload)}
          />
        )}
      </div>
    </li>
  );
}
