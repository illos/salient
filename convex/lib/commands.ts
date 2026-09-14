import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

/** Stable internal identity: null is reserved for server-originated work, never a client issuer. */
export function commandKey(issuerId: Id<'users'> | null, commandId: string): string {
  return JSON.stringify([issuerId, commandId]);
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}
export async function command(
  ctx: MutationCtx,
  userId: Id<'users'>,
  commandId: string,
  kind: string,
  args: unknown,
) {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(commandId))
    throw new ConvexError(
      'Provide a valid command ID (8–128 letters, numbers, underscores or hyphens).',
    );
  const fingerprint = JSON.stringify([kind, canonical(args)]);
  const previous = await ctx.db
    .query('commands')
    .withIndex('by_user_command', q => q.eq('userId', userId).eq('commandId', commandId))
    .unique();
  if (previous && previous.fingerprint !== fingerprint)
    throw new ConvexError('This command ID was already used for a different request.');
  return {
    previous,
    save: (result: string | null) =>
      ctx.db.insert('commands', { userId, commandId, fingerprint, result }),
  };
}
