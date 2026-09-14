// SPDX-License-Identifier: GPL-3.0-only
/**
 * Public command surface: discovery (`list`), structured invocation (`invoke`) and slash text
 * (`submit`). The web console and the CLI both call `submit`; programmatic callers use `invoke`.
 * Both end in the same runner (convex/lib/registry.ts). Owning specification:
 * docs/table-command-spec.md#recommended-execution-model and #structured-invocation-envelope.
 */
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './lib/access';
import {
  invoke as invokeEnvelope,
  operations,
  tableContext,
  typeName,
  unavailableReason,
  type OperationDefinition,
} from './lib/registry';
import { BindingError, ParseError, parseCommand, toEnvelope } from '../shared/commands/parse';

const reference = v.union(
  v.object({ name: v.string() }),
  v.object({ refKind: v.string(), id: v.string() }),
  v.object({ selector: v.literal('self') }),
);
const result = v.object({
  eventId: v.id('events'),
  sequence: v.number(),
  description: v.string(),
  interactionId: v.union(v.id('interactions'), v.null()),
});

function syntax(operation: OperationDefinition): string {
  const args = Object.entries(operation.args).map(([name, field]) => {
    const optional = (field as { isOptional: string }).isOptional === 'optional';
    return optional ? `[${name}=…]` : `${name}=…`;
  });
  return [
    operation.actor === 'none' ? null : operation.actor === 'required' ? '@Actor' : '[@Actor]',
    `/${operation.family} ${operation.verb}`,
    ...args,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Every registered operation with its argument schema and whether the caller can use it now. */
export const list = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.array(
    v.object({
      id: v.string(),
      family: v.string(),
      verb: v.string(),
      title: v.string(),
      description: v.string(),
      syntax: v.string(),
      arguments: v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          required: v.boolean(),
          description: v.string(),
        }),
      ),
      roles: v.array(v.union(v.literal('director'), v.literal('player'), v.literal('observer'))),
      session: v.union(
        v.literal('none'),
        v.literal('active'),
        v.literal('running'),
        v.literal('unpaused'),
      ),
      actor: v.union(v.literal('none'), v.literal('optional'), v.literal('required')),
      available: v.boolean(),
      unavailableReason: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    return operations.map(operation => {
      const reason = unavailableReason(operation, context);
      return {
        id: operation.id,
        family: operation.family,
        verb: operation.verb,
        title: operation.title,
        description: operation.description,
        syntax: syntax(operation),
        arguments: Object.entries(operation.args).map(([name, field]) => ({
          name,
          type: typeName(field as Parameters<typeof typeName>[0]),
          required: (field as { isOptional: string }).isOptional !== 'optional',
          description: operation.argDescriptions[name] ?? '',
        })),
        roles: operation.roles,
        session: operation.session,
        actor: operation.actor,
        available: reason === null,
        unavailableReason: reason,
      };
    });
  },
});

/** Structured invocation for programmatic callers. The issuer comes from authentication. */
export const invoke = mutation({
  args: {
    commandId: v.string(),
    campaignId: v.id('campaigns'),
    operation: v.string(),
    actor: v.optional(v.union(reference, v.null())),
    arguments: v.any(),
    expectedRevision: v.optional(v.number()),
  },
  returns: result,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return invokeEnvelope(ctx, user, {
      schemaVersion: 1,
      commandId: args.commandId,
      campaignId: args.campaignId,
      operation: args.operation,
      actor: args.actor ?? null,
      arguments: args.arguments ?? {},
      ...(args.expectedRevision === undefined ? {} : { expectedRevision: args.expectedRevision }),
    });
  },
});

/** Slash text from the web console or the CLI: parsed here with the shared parser, then invoked. */
export const submit = mutation({
  args: {
    commandId: v.string(),
    campaignId: v.id('campaigns'),
    text: v.string(),
    expectedRevision: v.optional(v.number()),
  },
  returns: result,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.text.length > 4000) throw new ConvexError('Commands are limited to 4000 characters.');
    try {
      const tree = parseCommand(args.text);
      const envelope = toEnvelope(tree, {
        commandId: args.commandId,
        campaignId: args.campaignId,
        ...(args.expectedRevision === undefined ? {} : { expectedRevision: args.expectedRevision }),
      });
      return await invokeEnvelope(ctx, user, envelope);
    } catch (error) {
      if (error instanceof ParseError)
        throw new ConvexError(`Could not read that command: ${error.message}`);
      if (error instanceof BindingError) throw new ConvexError(error.message);
      throw error;
    }
  },
});
