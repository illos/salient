// SPDX-License-Identifier: GPL-3.0-only
/**
 * The registry of shared table operations and the one runner every surface uses: UI buttons, the
 * palette, slash text, action-card responses and headless callers all end in `invoke`.
 *
 * Owning specifications: docs/table-command-spec.md#registry-definition (fields of a registered
 * operation), #structured-invocation-envelope (what a call carries), #identity-actor-and-targets
 * (issuer versus acting character; Director may act for any character),
 * #recording-ordering-and-recovery (retry returns the accepted outcome; a reused id with different
 * input is an error), docs/table-spec.md#confirmed-action-and-log-contract (ordered attributed entries)
 * and docs/accounts-and-access-spec.md#director-table-capability-doctrine.
 *
 * No operation here has game meaning. `session.note` records Director text, `table.roll` records a
 * public roll of plain dice, `card.respond` answers a pending interaction. Later slices add entries;
 * they do not add surfaces.
 */
import { ConvexError, v, type PropertyValidators, type Validator } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type {
  BoundActor,
  CommandEnvelope,
  ParsedValue,
  RecordedEnvelope,
  Reference,
} from '../../shared/commands/envelope';
import type { DieResult, DieSpec } from '../../shared/contracts/history';
import { requireMember, type ReadCtx } from './access';
import { command } from './commands';
import { rollDice } from './dice';
import { appendEvent } from './events';
import type { JournalScope } from './journal';
import { tableOperations } from './tableOperations';
import { foeOperations } from './foeOperations';
import { combatOperations } from './combatOperations';
import { historyOperations } from './history';
import { currentEncounter } from './encounters';
import { closeInteraction, respondToInteraction } from './interactions';

export type Role = 'director' | 'player' | 'observer';
export type SessionRequirement = 'none' | 'active' | 'running' | 'unpaused';
export type ActorUsage = 'none' | 'optional' | 'required';

/** Who is calling, at which table, in which session, as whom. Evaluated again on every execution. */
export interface TableContext {
  user: Doc<'users'>;
  campaign: Doc<'campaigns'>;
  /** The campaign's active session (running or paused), or null between sessions. */
  session: Doc<'sessions'> | null;
  role: Role;
}

export interface RespondsTo {
  interactionId: Id<'interactions'>;
  openedEventId: Id<'events'>;
  answer: unknown;
}

export interface Invocation<Args> {
  context: TableContext;
  envelope: RecordedEnvelope;
  actor: BoundActor | null;
  args: Args;
  /** Present when this execution answers a pending interaction. */
  respondsTo: RespondsTo | null;
}

export interface RequiredInput {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

/** What an operation asks the runner to record; the runner writes the event and any interaction row. */
export type Outcome =
  | {
      kind: string;
      description: string;
      causeEventId?: Id<'events'>;
      dice?: DieResult[];
      data?: unknown;
      /** Journaled state writes for this event, run after the event row exists (A03). */
      commit?: (ctx: MutationCtx, scope: JournalScope) => Promise<void>;
      /** Open a pending interaction bound to the labeled actor; the continuation resumes this operation. */
      interaction?: {
        /** Card kind; `guided-input` (A01) unless the operation opens a staged card (A04 `combat-setup`). */
        kind?: string;
        requiredInputs: RequiredInput[];
        continuation: Omit<CommandEnvelope, 'commandId'>;
      };
    }
  | { delegated: OperationResult };

export interface OperationResult {
  eventId: Id<'events'>;
  sequence: number;
  description: string;
  interactionId: Id<'interactions'> | null;
}

export interface OperationDefinition<Fields extends PropertyValidators = PropertyValidators> {
  /** Stable id, independent of display labels: `family.verb`. */
  id: string;
  family: string;
  verb: string;
  title: string;
  description: string;
  /** Argument schema as Convex validators; `v.optional` marks fields that may be omitted. */
  args: Fields;
  argDescriptions: { [K in keyof Fields]: string };
  roles: Role[];
  session: SessionRequirement;
  actor: ActorUsage;
  execute: (ctx: MutationCtx, invocation: Invocation<Record<string, unknown>>) => Promise<Outcome>;
}

// ---------------------------------------------------------------------------------------------
// Runtime argument validation against the declared Convex validators.

type AnyValidator = Validator<unknown, 'required' | 'optional', string> & {
  fields?: PropertyValidators;
  element?: AnyValidator;
  members?: AnyValidator[];
  value?: unknown;
};

/** Human name of a validator kind for diagnostics and the palette. */
export function typeName(validator: AnyValidator): string {
  switch (validator.kind) {
    case 'float64':
      return 'number';
    case 'union':
      return (validator.members ?? []).map(typeName).join(' | ');
    case 'literal':
      return JSON.stringify(validator.value);
    case 'array':
      return `${validator.element ? typeName(validator.element) : 'any'}[]`;
    default:
      return validator.kind;
  }
}

function conforms(validator: AnyValidator, value: unknown): boolean {
  switch (validator.kind) {
    case 'any':
      return true;
    case 'string':
      return typeof value === 'string';
    case 'float64':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    case 'literal':
      return value === validator.value;
    case 'union':
      return (validator.members ?? []).some(member => conforms(member, value));
    case 'array':
      return Array.isArray(value) && value.every(item => conforms(validator.element!, item));
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
      const record = value as Record<string, unknown>;
      const fields = validator.fields ?? {};
      for (const key of Object.keys(record)) if (!Object.hasOwn(fields, key)) return false;
      for (const [key, field] of Object.entries(fields)) {
        const f = field as AnyValidator;
        if (!Object.hasOwn(record, key)) {
          if (f.isOptional !== 'optional') return false;
          continue;
        }
        if (!conforms(f, record[key])) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

/** Structural validity of the arguments; unknown names are errors, not ignored (grammar report). */
export function checkArguments(
  operation: OperationDefinition,
  values: Record<string, unknown>,
): string[] {
  const problems: string[] = [];
  for (const name of Object.keys(values))
    if (!Object.hasOwn(operation.args, name))
      problems.push(`Unknown argument "${name}" for /${operation.family} ${operation.verb}.`);
  for (const [name, field] of Object.entries(operation.args)) {
    const validator = field as AnyValidator;
    if (!Object.hasOwn(values, name)) {
      if (validator.isOptional !== 'optional') problems.push(`Missing argument "${name}".`);
      continue;
    }
    if (!conforms(validator, values[name]))
      problems.push(`Argument "${name}" must be ${typeName(validator)}.`);
  }
  return problems;
}

/** Lowers a parsed value into plain JSON: records unwrap, enum words become strings, references stay. */
export function plain(value: ParsedValue): unknown {
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    if ('record' in value)
      return Object.fromEntries(
        Object.entries(value.record).map(([key, item]) => [key, plain(item)]),
      );
    if ('symbol' in value) return value.symbol;
  }
  return value;
}

// ---------------------------------------------------------------------------------------------
// Context, roles and actor binding.

export async function tableContext(
  ctx: ReadCtx,
  user: Doc<'users'>,
  campaignId: Id<'campaigns'>,
): Promise<TableContext> {
  const campaign = await requireMember(ctx, campaignId, user._id);
  const session = campaign.activeSessionId ? await ctx.db.get(campaign.activeSessionId) : null;
  const role: Role =
    campaign.ownerId === user._id
      ? 'director'
      : session?.selectedPlayerIds.includes(user._id)
        ? 'player'
        : 'observer';
  return { user, campaign, session, role };
}

const roleLabel: Record<Role, string> = {
  director: 'the Director',
  player: 'a player',
  observer: 'an observer',
};

/** Why the caller cannot use an operation right now, or null when they can. Actor binding is separate. */
export function unavailableReason(
  operation: OperationDefinition,
  context: TableContext,
): string | null {
  const spelling = `/${operation.family} ${operation.verb}`;
  if (!operation.roles.includes(context.role))
    return `${spelling} is for ${operation.roles.map(role => roleLabel[role]).join(' or ')}; you are ${roleLabel[context.role]} here.`;
  if ((operation.session === 'active' || operation.session === 'running') && !context.session)
    return `${spelling} needs an active session; the Director starts one first.`;
  if (
    (operation.session === 'running' || operation.session === 'unpaused') &&
    context.session?.status === 'paused'
  )
    return `The session is paused; ${spelling} waits until the Director resumes it.`;
  return null;
}

/**
 * Resolves `@Character` to one live actor the caller may act for: the Director may act for any
 * character or foe at the table; a player only for characters they own. Names bind exactly and must
 * be unique; ambiguity is returned as an error naming the stable form, never resolved by first match.
 */
export async function bindActor(
  ctx: ReadCtx,
  context: TableContext,
  reference: Reference,
): Promise<BoundActor> {
  if ('selector' in reference)
    throw new ConvexError('@self cannot be the actor: self resolves to the acting character.');
  const candidates: { actor: BoundActor; ownerId: Id<'users'> | null }[] = [];
  if ('refKind' in reference) {
    if (reference.refKind === 'character') {
      const id = ctx.db.normalizeId('characters', reference.id);
      const character = id ? await ctx.db.get(id) : null;
      if (character && character.campaignId === context.campaign._id)
        candidates.push({
          actor: { kind: 'character', id: character._id, name: character.authored.name },
          ownerId: character.ownerId,
        });
    } else if (reference.refKind === 'foe') {
      const id = ctx.db.normalizeId('foes', reference.id);
      const foe = id ? await ctx.db.get(id) : null;
      if (foe && foe.campaignId === context.campaign._id)
        candidates.push({ actor: { kind: 'foe', id: foe._id, name: foe.name }, ownerId: null });
    } else
      throw new ConvexError(
        `Unknown actor reference kind "${reference.refKind}"; use @{character:id} or @{foe:id}.`,
      );
    if (!candidates.length) throw new ConvexError('That actor is not at this table.');
  } else {
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
      .take(200);
    for (const character of characters)
      if (character.authored.name === reference.name)
        candidates.push({
          actor: { kind: 'character', id: character._id, name: character.authored.name },
          ownerId: character.ownerId,
        });
    const foes = await ctx.db
      .query('foes')
      .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
      .take(200);
    for (const foe of foes)
      if (foe.name === reference.name)
        candidates.push({ actor: { kind: 'foe', id: foe._id, name: foe.name }, ownerId: null });
    if (!candidates.length)
      throw new ConvexError(`No character or foe named "${reference.name}" is at this table.`);
    if (candidates.length > 1)
      throw new ConvexError(
        `Several actors are named "${reference.name}"; choose one with @{character:id} or @{foe:id}.`,
      );
  }
  const [candidate] = candidates;
  if (context.role !== 'director' && candidate!.ownerId !== context.user._id)
    throw new ConvexError(`You do not control ${candidate!.actor.name}.`);
  return candidate!.actor;
}

// ---------------------------------------------------------------------------------------------
// Operations.

const DICE_EXPRESSION = /^(\d{0,3})d(\d{1,4})$/;

/** `NdS` into die specs. Bounds come from the shared dice operation, not from here. */
export function diceFrom(expression: string): DieSpec[] {
  const match = DICE_EXPRESSION.exec(expression.trim());
  if (!match) throw new ConvexError('Write dice as "NdS", for example "2d10" or "d6".');
  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  return Array.from({ length: count }, (_, i) => ({ id: `die-${i + 1}`, sides }));
}

const sessionNote: OperationDefinition = {
  id: 'session.note',
  family: 'session',
  verb: 'note',
  title: 'Session note',
  description: 'Record a Director note in the game log. Free text; no effect on play.',
  args: { text: v.string() },
  argDescriptions: { text: 'The note, up to 2000 characters.' },
  roles: ['director'],
  session: 'active',
  actor: 'none',
  execute: async (_ctx, { args }) => {
    const text = String(args.text).trim();
    if (!text || text.length > 2000)
      throw new ConvexError('A session note needs 1–2000 characters of text.');
    return { kind: 'session.note', description: text, data: { text } };
  },
};

const tableRoll: OperationDefinition = {
  id: 'table.roll',
  family: 'table',
  verb: 'roll',
  title: 'Table roll',
  description:
    'Roll plain dice in public and record the faces. No game meaning: nothing is added, compared or applied.',
  args: { dice: v.optional(v.string()) },
  argDescriptions: { dice: 'Dice as NdS, for example "2d10" or "d6". Omit it to be asked.' },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'optional',
  execute: async (ctx, { context, envelope, actor, args }) => {
    if (args.dice === undefined) {
      // Guided entry: the short command opens a card that collects the missing input.
      return {
        kind: 'interaction.opened',
        description: `${actor?.name ?? context.user.displayName} — awaiting input: which dice to roll.`,
        interaction: {
          requiredInputs: [
            {
              name: 'dice',
              type: 'string',
              required: true,
              description: tableRoll.argDescriptions.dice!,
            },
          ],
          continuation: {
            schemaVersion: 1,
            campaignId: envelope.campaignId,
            operation: tableRoll.id,
            actor: actor ? { refKind: actor.kind, id: actor.id } : null,
            arguments: envelope.arguments,
          },
        },
      };
    }
    const expression = String(args.dice).trim();
    const accepted = await rollDice(
      ctx,
      context.campaign._id,
      envelope.commandId,
      diceFrom(expression),
      context.user._id,
    );
    const faces = accepted.dice.map(die => die.value).join(', ');
    return {
      kind: 'table.roll',
      description: `${actor ? `${actor.name} ` : ''}rolled ${expression}: ${faces}.`,
      dice: accepted.dice,
      data: { dice: expression, rollId: accepted.rollId },
    };
  },
};

const cardRespond: OperationDefinition = {
  id: 'card.respond',
  family: 'card',
  verb: 'respond',
  title: 'Respond to a card',
  description:
    'Answer a pending interaction by id. The answer fields are the card’s required inputs.',
  args: {
    card: v.object({ refKind: v.literal('interaction'), id: v.string() }),
    answer: v.object({ record: v.any() }),
    revision: v.optional(v.number()),
  },
  argDescriptions: {
    card: 'The interaction, as @{interaction:id}.',
    answer: 'A record of the card’s inputs, for example {"dice":"2d10"}.',
    revision: 'Expected card revision, when supplied.',
  },
  roles: ['director', 'player', 'observer'],
  session: 'none',
  actor: 'optional',
  execute: async (ctx, invocation) => {
    const card = invocation.args.card as { id: string };
    const interactionId = ctx.db.normalizeId('interactions', card.id);
    if (!interactionId) throw new ConvexError('That interaction id is not valid.');
    const result = await respondToInteraction(ctx, {
      context: invocation.context,
      interactionId,
      answer: plain(invocation.args.answer as ParsedValue),
      commandId: invocation.envelope.commandId,
      actor: invocation.actor,
      expectedRevision: invocation.args.revision as number | undefined,
      run,
    });
    return { delegated: result };
  },
};

const cardClose: OperationDefinition = {
  id: 'card.close',
  family: 'card',
  verb: 'close',
  title: 'Close a card',
  description: 'Close a pending interaction without answering it; records who closed it.',
  args: {
    card: v.object({ refKind: v.literal('interaction'), id: v.string() }),
    revision: v.optional(v.number()),
  },
  argDescriptions: {
    card: 'The interaction, as @{interaction:id}.',
    revision: 'Expected card revision, when supplied.',
  },
  roles: ['director', 'player', 'observer'],
  session: 'none',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const card = args.card as { id: string };
    const id = ctx.db.normalizeId('interactions', card.id);
    if (!id) throw new ConvexError('That interaction id is not valid.');
    return closeInteraction(ctx, context, id, args.revision as number | undefined);
  },
};

export const operations: OperationDefinition[] = [
  sessionNote,
  tableRoll,
  cardRespond,
  cardClose,
  ...tableOperations,
  ...foeOperations,
  ...combatOperations,
  ...historyOperations,
];

export function findOperation(id: string): OperationDefinition | undefined {
  return operations.find(operation => operation.id === id);
}

// ---------------------------------------------------------------------------------------------
// The runner.

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Authorizes, validates and executes one envelope, then records the accepted outcome as an ordered
 * event attributed to the invoking user with the acting character in the payload. Not idempotent by
 * itself: `invoke` adds the once-only commitment. Exposed so a card response can resume its
 * continuation under the responder's command id.
 */
export async function run(
  ctx: MutationCtx,
  context: TableContext,
  envelope: CommandEnvelope,
  respondsTo: RespondsTo | null = null,
): Promise<OperationResult> {
  const operation = findOperation(envelope.operation);
  if (!operation)
    throw new ConvexError(
      `Unknown command "/${envelope.operation.replace('.', ' ')}". The palette lists what is registered.`,
    );
  if (!isPlainRecord(envelope.arguments))
    throw new ConvexError('Arguments must be an object of named values.');
  const reason = unavailableReason(operation, context);
  if (reason) throw new ConvexError(reason);
  if (
    envelope.expectedRevision !== undefined &&
    context.session?.revision !== envelope.expectedRevision
  )
    throw new ConvexError('Session changed. Refresh and try again.');
  // Bare words (`difficulty=medium`) arrive as symbols from the parser; operations see plain strings.
  // The recorded envelope keeps the arguments exactly as submitted.
  const args = Object.fromEntries(
    Object.entries(envelope.arguments).map(([key, value]) => [
      key,
      value && typeof value === 'object' && 'symbol' in value ? value.symbol : value,
    ]),
  );
  const problems = checkArguments(operation, args);
  if (problems.length) throw new ConvexError(problems.join(' '));
  let actor: BoundActor | null = null;
  if (envelope.actor) {
    if (operation.actor === 'none')
      throw new ConvexError(`/${operation.family} ${operation.verb} does not take an @actor.`);
    actor = await bindActor(ctx, context, envelope.actor);
  } else if (operation.actor === 'required')
    throw new ConvexError(`/${operation.family} ${operation.verb} needs an @actor.`);
  const recorded: RecordedEnvelope = { ...envelope, issuerId: context.user._id, boundActor: actor };
  const outcome = await operation.execute(ctx, {
    context,
    envelope: recorded,
    actor,
    args,
    respondsTo,
  });
  if ('delegated' in outcome) return outcome.delegated;
  // A06: user events carry the session's current (unarchived) encounter so history can place them.
  const encounter = context.session ? await currentEncounter(ctx, context.session) : null;
  const eventId = await appendEvent(ctx, {
    campaignId: context.campaign._id,
    sessionId: context.session?._id ?? null,
    encounterId: encounter?._id ?? null,
    origin: 'user',
    actor: context.user,
    commandId: envelope.commandId,
    causeEventId: respondsTo?.openedEventId ?? outcome.causeEventId ?? null,
    kind: outcome.kind,
    description: outcome.description,
    ...(outcome.dice ? { dice: outcome.dice } : {}),
    payload: {
      envelope: recorded,
      ...(outcome.data === undefined ? {} : { data: outcome.data }),
      ...(respondsTo
        ? { respondsTo: { interactionId: respondsTo.interactionId, answer: respondsTo.answer } }
        : {}),
    },
  });
  if (outcome.commit) await outcome.commit(ctx, { campaignId: context.campaign._id, eventId });
  let interactionId: Id<'interactions'> | null = null;
  if (outcome.interaction) {
    interactionId = await ctx.db.insert('interactions', {
      campaignId: context.campaign._id,
      sessionId: context.session?._id ?? null,
      status: 'awaiting-input',
      kind: outcome.interaction.kind ?? 'guided-input',
      operation: operation.id,
      actorLabel: actor?.name ?? null,
      boundActor: actor,
      requesterId: context.user._id,
      requiredInputs: outcome.interaction.requiredInputs,
      continuation: outcome.interaction.continuation,
      revision: 0,
      openedEventId: eventId,
      resolvedEventId: null,
      answer: null,
      createdAt: Date.now(),
      resolvedAt: null,
    });
  }
  const event = (await ctx.db.get(eventId))!;
  return { eventId, sequence: event.sequence, description: outcome.description, interactionId };
}

/**
 * The public entry: once-only commitment keyed by issuer and command id (a retry with the same
 * envelope returns the accepted result; the same id with different content is an error), then `run`.
 */
export async function invoke(
  ctx: MutationCtx,
  user: Doc<'users'>,
  envelope: CommandEnvelope,
): Promise<OperationResult> {
  const campaignId = ctx.db.normalizeId('campaigns', envelope.campaignId);
  if (!campaignId) throw new ConvexError('Campaign unavailable.');
  const context = await tableContext(ctx, user, campaignId);
  const { commandId, ...content } = envelope;
  const receipt = await command(ctx, user._id, commandId, envelope.operation, content);
  if (receipt.previous) return JSON.parse(receipt.previous.result!) as OperationResult;
  const result = await run(ctx, context, envelope);
  await receipt.save(JSON.stringify(result));
  return result;
}
