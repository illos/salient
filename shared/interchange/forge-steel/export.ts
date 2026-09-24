// SPDX-License-Identifier: GPL-3.0-only
/**
 * Forge Steel export is NOT implemented (docs/character-wizard-spec.md#desired-export; V09 keeps
 * only the adapter boundary). No code path may claim export support. When it is built, an imported
 * character patches the translated fields into its preserved `characterImports.payload`, and a
 * character created here builds a complete pinned-shape `Hero` graph
 * (docs/forge-steel-interchange.md#proposed-adapter-boundary). The intended signature:
 *
 *   exportForgeHero(revision, preservedPayload?: string): { payload: string; diagnostics }
 */
export type ForgeExportNotImplemented = never;
