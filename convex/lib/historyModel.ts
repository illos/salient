// SPDX-License-Identifier: GPL-3.0-only
/** Shared classification for the authoritative walker and its derived read index. */
export const NON_GAMEPLAY_KINDS = new Set([
  'campaign.created',
  'campaign.setting',
  'session.note',
  'session.started',
  'session.paused',
  'session.running',
  'session.closed',
  'session.players',
  'membership.approved',
  'interaction.opened',
  'interaction.closed',
  'target.draft',
  'ability.blocked',
]);

/**
 * Encounter lifecycle kinds that history does not undo: the setup draft precedes the encounter
 * (its card is not journaled) and OK is the encounter start, the boundary Director rewind does not
 * cross ("a rewind attempt past the encounter start is rejected"). A07 adds its closeout/void
 * kinds here; those archive the encounter and are boundaries in the same sense.
 */
export const ENCOUNTER_LIFECYCLE_KINDS = new Set([
  'combat.setup-opened',
  'combat.setup',
  'combat.setup-canceled',
  'combat.committed',
]);

export const isHistoryKind = (kind: string) => kind.startsWith('history.');

export function isGameplayHead(event: { origin: string; kind: string }): boolean {
  return (
    event.origin === 'user' &&
    !NON_GAMEPLAY_KINDS.has(event.kind) &&
    !ENCOUNTER_LIFECYCLE_KINDS.has(event.kind) &&
    !event.kind.startsWith('character.') &&
    !isHistoryKind(event.kind)
  );
}

export function historyTarget(payload: unknown): string | null {
  const data = (payload as { data?: { target?: { eventId?: string } } } | undefined)?.data;
  return data?.target?.eventId ?? null;
}
