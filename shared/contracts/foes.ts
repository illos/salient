// SPDX-License-Identifier: GPL-3.0-only
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type Fields = { [key: string]: Json };
export type FoeKind = 'statblock' | 'malice' | 'ability' | 'trait';
/** Public definitions only. Edition is required: no silent substitution by the latest package. */
export interface FoeReference {
  kind: FoeKind;
  id: string;
  edition: string;
}
export interface FoeSection {
  type: string;
  markdown: string;
}
export interface FoeObject {
  id: string;
  kind: FoeKind;
  name: string;
  parentId?: string;
  order?: number;
  featureIds: string[];
  supportingIds: string[];
  fields: Fields;
  keywords: string[];
  usage: string | null;
  activation?: { signature: boolean; villainAction: number | null; costText: string | null };
  ev?: { printed: string; amount: number | null; quantity: number | null };
  sections: FoeSection[];
  markdown: string;
  html: string;
  source: { revision: string; path: string; scc: string; start: number; end: number };
  original: { record: Fields; markdown: string; json?: string; linkedMarkdown?: string };
  diagnostics: string[];
}
export interface FoeSearchEntry {
  id: string;
  kind: FoeKind;
  name: string;
  parentName: string;
  text: string;
  keywords: string[];
  usage: string | null;
}
export interface FoePackage {
  schema: 'foes.1';
  generator: string;
  edition: string;
  sourceRevision: string;
  objects: FoeObject[];
  search: FoeSearchEntry[];
  corrections: Fields[];
}
