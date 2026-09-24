// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ANCESTRY_ABILITIES } from '../../shared/content/ancestry-abilities.ts';
import { vendorPath } from '../../scripts/lib/vendor.ts';

const source = (path: string) =>
  readFileSync(vendorPath(`vendor/steel-compendium/${path}`), 'utf8');
const ability = (name: string) => {
  const found = ANCESTRY_ABILITIES.find(entry => entry.name === name);
  if (!found) throw new Error(`Missing trait-granted action: ${name}`);
  return found;
};

describe('ancestry ability source fidelity', () => {
  // Failure caught: an extracted action silently rewrites or loses its upstream provenance.
  // Adds independent validation against the pinned source, beyond grant-selection tests.
  it('retains verbatim source paragraphs for every extracted action', () => {
    for (const entry of ANCESTRY_ABILITIES) {
      const text = source(entry.sourcePath);
      for (const paragraph of entry.quote.split('\n\n')) {
        expect(text, entry.name).toContain(paragraph);
      }
      expect(text, entry.name).toContain('type: trait');
    }
  });

  // Failure caught: charging a triggered action for a free triggered action, or inventing
  // an action cost for a conditional free strike. Adds source-to-timing validation.
  it('preserves the distinction between free reactions and unspecified action cost', () => {
    const tumble = ability('Reactive Tumble');
    expect(source(tumble.sourcePath)).toContain('you can use a free [triggered action]');
    expect(tumble.actionType).toBe('Free triggered action');
    const relentless = ability('Relentless');
    const text = source(relentless.sourcePath);
    expect(text).toContain('you can make a [free strike]');
    expect(text).not.toContain('triggered action');
    expect(relentless.actionType).toBe('Not specified by source');
    expect(relentless.group).toBe('other');
    expect(relentless.quote).toContain('you can spend a [Recovery]');
  });

  // Failure caught: replacing downtime durations with maneuvers or making Doomsight
  // unconditional. Adds the timing/authorization limits the five Forge deltas omit.
  it('preserves noncombat durations and the Doomsight activation conditions', () => {
    const stone = ability('Stone Singer');
    expect(source(stone.sourcePath)).toContain('1 uninterrupted hour singing');
    expect(stone.actionType).toBe('1 uninterrupted hour');
    const carving = ability('Runic Carving: Carve, Change, or Remove Rune');
    expect(source(carving.sourcePath)).toContain(
      'change or remove a rune with 10 uninterrupted minutes',
    );
    expect(carving.actionType).toBe('10 uninterrupted minutes');
    const doom = ability('Doomsight');
    expect(source(doom.sourcePath)).toContain("with the Director's approval (no action required)");
    expect(doom.actionType).toBe('No action required');
    expect(doom.activationCondition).toContain('While dying');
    expect(doom.activationCondition).toContain('not predetermined');
    expect(doom.activationCondition).toContain("Director's approval");
  });

  // Failure caught: losing the Voice range/language/known-name limits when reducing the
  // trait to an action, or allowing a target change without changing the rune.
  it('keeps Voice restrictions and the one-rune limit in the extracted maneuver', () => {
    const voice = ability('Runic Carving: Voice');
    expect(voice.quote).toContain('within 1 mile');
    expect(voice.quote).toContain("must know the creature's name");
    expect(voice.quote).toContain('speak and understand a language you know');
    expect(voice.quote).toContain('different creature by changing the rune');
    expect(voice.quote).toContain('one rune active at a time');
  });
});
