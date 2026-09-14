// SPDX-License-Identifier: GPL-3.0-only
/** Saved choices are independent of wizard screens and never imply rules validation. */
export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export interface ContentReference {
  id: string;
  path: string;
  revision: string;
}
export interface DraftSelection {
  decisionId: string;
  ownerBranchId: string;
  sources: ContentReference[];
  value: JsonValue;
}
export interface CharacterAuthored {
  name: string;
  appearance: string;
  biography: string;
  notes: string;
}
export const emptyAuthored: CharacterAuthored = {
  name: '',
  appearance: '',
  biography: '',
  notes: '',
};

export function isJsonValue(value: unknown, depth = 0): value is JsonValue {
  if (depth > 16) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(item => isJsonValue(item, depth + 1));
  return (
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.values(value).every(item => isJsonValue(item, depth + 1))
  );
}
