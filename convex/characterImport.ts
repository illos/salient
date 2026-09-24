// SPDX-License-Identifier: GPL-3.0-only
/**
 * Forge Steel hero import (V09 part a, V182 part b; docs/character-wizard-spec.md#required-import).
 * The caller becomes the owner of a new unattached draft built from the translated selections
 * through the same validation and evaluation path as `characters.create`. The verbatim file, its
 * SHA-256, the Forge pin, the adapter's diagnostics and the reconciled play state (stored, not
 * applied; Q-V-3) are kept in `characterImports`, outside rules evaluation. Nothing in the file
 * (hero id, folder, campaign, approvals, play state) grants authority or activates a build: the
 * draft has no campaign, no effective revision and no review.
 *
 * `previewForge` runs the same adapter and level check without writing, so the UI and the CLI
 * (`pnpm character:import --dry-run`) can show what an import would do first. `importDiagnostics`
 * returns an import record's diagnostics to the character's owner only.
 */
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser } from './lib/access';
import { command } from './lib/commands';
import { sha256, toHex } from './lib/sha256';
import { authored, insertCharacterDraft } from './lib/characterDrafts';
import { forgeImportDiagnosticValidator, forgeLiveSeedValidator } from './characterTables';
import { getDefinitions } from '../shared/content/character-decisions';
import { draftSelectionsFrom } from '../shared/evaluate/draft';
import {
  FORGE_STEEL_REVISION,
  ForgeShapeError,
  MAX_FORGE_PAYLOAD_BYTES,
  forgeImportRefusal,
  importForgeText,
  type ForgeImportResult,
} from '../shared/interchange/forge-steel/import';
import { forgeLiveSeed } from '../shared/interchange/forge-steel/state';

const result = v.object({
  characterId: v.id('characters'),
  diagnostics: v.array(forgeImportDiagnosticValidator),
});

const TOO_LARGE = 'Forge Steel hero files up to 512 KB are supported.';

/** Parses and translates a file; a malformed file is a `ConvexError` with the shape message. */
function translate(payload: string): ForgeImportResult {
  try {
    return importForgeText(payload);
  } catch (error) {
    if (error instanceof ForgeShapeError) throw new ConvexError(error.message);
    throw error;
  }
}

export const previewForge = query({
  args: { payload: v.string() },
  returns: v.object({
    /** Why the file would not import (malformed, too large, above the level ceiling), or null. */
    error: v.union(v.null(), v.string()),
    name: v.union(v.null(), v.string()),
    level: v.union(v.null(), v.number()),
    className: v.union(v.null(), v.string()),
    diagnostics: v.array(forgeImportDiagnosticValidator),
  }),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const empty = { name: null, level: null, className: null, diagnostics: [] };
    if (new TextEncoder().encode(args.payload).length > MAX_FORGE_PAYLOAD_BYTES)
      return { ...empty, error: TOO_LARGE };
    let imported: ForgeImportResult;
    try {
      imported = translate(args.payload);
    } catch (error) {
      if (error instanceof ConvexError) return { ...empty, error: String(error.data) };
      throw error;
    }
    const className = imported.selections['class.choice'];
    return {
      error: forgeImportRefusal(imported),
      name: imported.authored.name,
      level: imported.level,
      className: typeof className === 'string' ? className : null,
      diagnostics: imported.diagnostics,
    };
  },
});

export const importForge = mutation({
  args: { commandId: v.string(), payload: v.string() },
  returns: result,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const bytes = new TextEncoder().encode(args.payload);
    if (bytes.length > MAX_FORGE_PAYLOAD_BYTES) throw new ConvexError(TOO_LARGE);
    const payloadSha256 = toHex(sha256(bytes));
    // The receipt fingerprints the file's digest, not the file, so a retry stays small.
    const receipt = await command(ctx, user._id, args.commandId, 'characters.importForge', {
      payloadSha256,
    });
    if (receipt.previous) {
      const characterId = receipt.previous.result as Id<'characters'>;
      const record = await ctx.db
        .query('characterImports')
        .withIndex('by_character', q => q.eq('characterId', characterId))
        .unique();
      if (!record || record.ownerId !== user._id) throw new ConvexError('Import unavailable.');
      return { characterId, diagnostics: record.diagnostics };
    }
    const imported = translate(args.payload);
    // Q-V-6 interim default: refuse above the class's supported level; nothing is written.
    const refusal = forgeImportRefusal(imported);
    if (refusal) throw new ConvexError(refusal);
    // The adapter bounds the diagnostics (count, string length, total size) and the authored fields.
    const { diagnostics, unmapped } = imported;
    const existing = await ctx.db
      .query('characters')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .take(100);
    if (existing.length >= 100) throw new ConvexError('Prototype limit of 100 characters reached.');
    const fields = authored({
      name: imported.authored.name,
      appearance: '',
      biography: '',
      notes: imported.authored.notes,
    });
    const characterId = await insertCharacterDraft(ctx, {
      ownerId: user._id,
      authored: fields,
      selections: draftSelectionsFrom(imported.selections, getDefinitions(imported.level)),
      level: imported.level,
    });
    // Reconcile against Salient's own maxima from the evaluated revision 1 (state.ts).
    const character = await ctx.db.get(characterId);
    const revision = character?.draftRevisionId
      ? await ctx.db.get(character.draftRevisionId)
      : null;
    const baseline = revision?.derivedBaseline as
      | { staminaMaximum?: { value?: unknown }; recoveriesMaximum?: { value?: unknown } }
      | null
      | undefined;
    const maximum = (value: unknown) => (typeof value === 'number' ? value : null);
    const liveSeed = forgeLiveSeed(imported.playState, {
      staminaMaximum: maximum(baseline?.staminaMaximum?.value),
      recoveriesMaximum: maximum(baseline?.recoveriesMaximum?.value),
    });
    await ctx.db.insert('characterImports', {
      characterId,
      ownerId: user._id,
      format: 'forge-steel-hero',
      payload: args.payload,
      payloadBytes: bytes.length,
      payloadSha256,
      forgeVendorRevision: FORGE_STEEL_REVISION,
      level: imported.level,
      diagnostics,
      unmapped,
      liveSeed,
      importedAt: Date.now(),
    });
    await receipt.save(characterId);
    return { characterId, diagnostics };
  },
});

export const importDiagnostics = query({
  args: { characterId: v.id('characters') },
  returns: v.union(
    v.null(),
    v.object({
      importedAt: v.number(),
      level: v.number(),
      forgeVendorRevision: v.string(),
      diagnostics: v.array(forgeImportDiagnosticValidator),
      liveSeed: v.union(v.null(), forgeLiveSeedValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await ctx.db.get(args.characterId);
    // Owner only (Q-V-5 default): anyone else, including a Director, sees no import record.
    if (!character || character.ownerId !== user._id) return null;
    const record = await ctx.db
      .query('characterImports')
      .withIndex('by_character', q => q.eq('characterId', args.characterId))
      .unique();
    if (!record || record.ownerId !== user._id) return null;
    return {
      importedAt: record.importedAt,
      level: record.level,
      forgeVendorRevision: record.forgeVendorRevision,
      diagnostics: record.diagnostics,
      liveSeed: record.liveSeed ?? null,
    };
  },
});
