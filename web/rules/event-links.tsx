// SPDX-License-Identifier: GPL-3.0-only
import { RuleLink } from './link';

/** Historical evidence stays in the event; the reader resolves its public reference. */
type EventSourceRecord = { id?: string; sourcePath?: string; supporting?: EventSourceRecord[] };
export function EventRuleLinks({ payload }: { payload: unknown }) {
  const data = (
    payload as { data?: { source?: EventSourceRecord; ability?: { id?: string; name?: string } } }
  )?.data;
  if (!data?.source) return null;
  const references = [data.source, ...(data.source.supporting ?? [])];
  return (
    <span className="inline-flex items-center gap-1">
      {references.map((entry, index) => (
        <RuleLink
          key={`${entry.id}:${index}`}
          id={index === 0 ? (data.ability?.id ?? entry.id) : entry.id}
          sourcePath={entry.sourcePath}
          label={index === 0 ? data.ability?.name : undefined}
        />
      ))}
    </span>
  );
}
