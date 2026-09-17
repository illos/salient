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
  group?: { id: string; name: string };
  sourcebook?: 'Monsters' | 'Heroes';
  parentId?: string;
  order?: number;
  featureIds: string[];
  supportingIds: string[];
  relatedRules?: { id: string; path: string; name: string; relationship: string }[];
  fields: Fields;
  keywords: string[];
  usage: string | null;
  activation?: { signature: boolean; villainAction: number | null; costText: string | null };
  ev?: { printed: string; amount: number | null; quantity: number | null };
  sections: FoeSection[];
  markdown: string;
  html: string;
  source: { revision: string; path: string; scc: string; start: number; end: number };
  original: {
    records?: Fields[];
    record: Fields;
    markdown: string;
    json?: string;
    linkedMarkdown?: string;
  };
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
  group?: { id: string; name: string };
  sourcebook?: 'Monsters' | 'Heroes';
  level?: number;
  organization?: string;
  role?: string;
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

/** Browser projection: source evidence stays in the archival package, never in the JS bundle. */
export type FoeDisplayObject = Omit<FoeObject, 'original' | 'sections' | 'markdown'>;
export interface FoeDisplayPackage extends Omit<FoePackage, 'objects' | 'corrections'> {
  objects: FoeDisplayObject[];
}
