// SPDX-License-Identifier: GPL-3.0-only
/** Shared constructors for sourced decision content. */
import type { Decision, DecisionOption, OptionGrant } from '../evaluate/definitions.ts';

export const path = (relative: string) => `en/unified/md/${relative}.md`;
export const option = (
  value: string,
  source: string,
  extra: Partial<DecisionOption> = {},
): DecisionOption => ({
  id: value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  value,
  source,
  supportedInV001: true,
  ...extra,
});
export const auto = (
  id: string,
  parent: string,
  value: string,
  source: string,
  quote: string,
  grants: OptionGrant[] = [],
): Decision => ({
  id,
  kind: 'automatic',
  shape: { type: 'none' },
  availableWhen: { decision: parent, value },
  source,
  quote,
  grants,
});
export const choice = (
  id: string,
  parent: string,
  value: string,
  source: string,
  quote: string,
  options: DecisionOption[],
  extra: Partial<Decision> = {},
): Decision => ({
  id,
  kind: 'choice',
  shape: { type: 'single', count: 1 },
  availableWhen: { decision: parent, value },
  source,
  quote,
  options,
  ...extra,
});
export const grant = (
  kind: string,
  value: string,
  source: string,
  quote?: string,
): OptionGrant => ({
  kind,
  value,
  source,
  ...(quote ? { quote } : {}),
});
