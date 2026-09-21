// SPDX-License-Identifier: GPL-3.0-only
/** Target-level editing, shared by the full wizard and its authenticated API. */
import type { DecisionDefinitions } from './definitions.ts';
import { indexDecisions, pruneUnavailable, type Selections } from './structure.ts';

export function changeLevel(
  selections: Selections,
  from: DecisionDefinitions,
  to: DecisionDefinitions,
) {
  const previous = indexDecisions(from);
  const next = indexDecisions(to);
  const removed = Object.keys(selections).filter(id => previous.has(id) && !next.has(id));
  const retained = Object.fromEntries(
    Object.entries(selections).filter(([id]) => !removed.includes(id)),
  );
  const result = pruneUnavailable(retained, to);
  return { selections: result.selections, removed: [...removed, ...result.removed] };
}
