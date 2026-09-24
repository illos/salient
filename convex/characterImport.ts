// SPDX-License-Identifier: GPL-3.0-only
/**
 * Forge Steel hero import (V09 part a; docs/character-wizard-spec.md#required-import). The caller
 * becomes the owner of a new unattached draft built from the translated selections through the same
 * validation and evaluation path as `characters.create`. The verbatim file, its SHA-256, the Forge
 * pin and the adapter's diagnostics are kept in `characterImports`, outside rules evaluation.
 * Nothing in the file (hero id, folder, campaign, approvals, play state) grants authority or
 * activates a build: the draft has no campaign, no effective revision and no review.
 */
import { ConvexError, v } from 'convex/values';
import { mutation } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser } from './lib/access';
import { command } from './lib/commands';
import { sha256, toHex } from './lib/sha256';
import { authored, insertCharacterDraft } from './lib/characterDrafts';
import { forgeImportDiagnosticValidator } from './characterTables';
import { isSupportedDefinitionLevel } from '../shared/content/character-support';
import { getDefinitions } from '../shared/content/character-decisions';
import { draftSelectionsFrom } from '../shared/evaluate/draft';
import {
  FORGE_STEEL_REVISION,
  ForgeShapeError,
  MAX_FORGE_PAYLOAD_BYTES,
  importForgeText,
  type ForgeImportResult,
} from '../shared/interchange/forge-steel/import';

/** Stored diagnostics stay well inside Convex's array and document limits for a hostile file. */
const MAX_STORED_DIAGNOSTICS = 500;

const result = v.object({
  characterId: v.id('characters'),
  diagnostics: v.array(forgeImportDiagnosticValidator),
});

export const importForge = mutation({
  args: { commandId: v.string(), payload: v.string() },
  returns: result,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const bytes = new TextEncoder().encode(args.payload);
    if (bytes.length > MAX_FORGE_PAYLOAD_BYTES)
      throw new ConvexError('Forge Steel hero files up to 512 KB are supported.');
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
    let imported: ForgeImportResult;
    try {
      imported = importForgeText(args.payload);
    } catch (error) {
      if (error instanceof ForgeShapeError) throw new ConvexError(error.message);
      throw error;
    }
    if (!isSupportedDefinitionLevel(imported.level))
      throw new ConvexError(
        `This hero is level ${imported.level}; Salient cannot yet import heroes at that level.`,
      );
    const diagnostics =
      imported.diagnostics.length > MAX_STORED_DIAGNOSTICS
        ? [
            ...imported.diagnostics.slice(0, MAX_STORED_DIAGNOSTICS - 1),
            {
              path: 'hero',
              reason: `${imported.diagnostics.length - MAX_STORED_DIAGNOSTICS + 1} further diagnostics omitted.`,
            },
          ]
        : imported.diagnostics;
    const unmapped = imported.unmapped.slice(0, MAX_STORED_DIAGNOSTICS);
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
    await ctx.db.insert('characterImports', {
      characterId,
      ownerId: user._id,
      format: 'forge-steel-hero',
      payload: args.payload,
      payloadSha256,
      forgeVendorRevision: FORGE_STEEL_REVISION,
      level: imported.level,
      diagnostics,
      unmapped,
      importedAt: Date.now(),
    });
    await receipt.save(characterId);
    return { characterId, diagnostics };
  },
});
