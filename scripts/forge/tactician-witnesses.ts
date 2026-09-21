// SPDX-License-Identifier: GPL-3.0-only
/** Builds legal Tactician counterparts from pinned Forge definitions and input selections only. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { human } from '@/data/ancestries/human';
import { tactician } from '@/data/classes/tactician/tactician';
import { core } from '@/data/sourcebooks/official/core';
import { orden } from '@/data/sourcebooks/official/orden';
import { Characteristic } from '@/enums/characteristic';
import { FeatureType } from '@/enums/feature-type';
import { SourcebookLogic } from '@/logic/sourcebook-logic';
import type { Hero } from '@/models/hero';
import type { ForgeWitness } from './ancestry-witnesses';

type Input = { id: string; selections: Record<string, unknown> };
const normalize = (name: string) =>
  name
    .replaceAll('’', "'")
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function createTacticianWitnesses(fixtureRoot = 'tests/fixtures'): ForgeWitness[] {
  const template = JSON.parse(
    readFileSync(join(fixtureRoot, 'v45-reference/Grug-level-1.ds-hero'), 'utf8'),
  ) as Hero;
  // Expected values are deliberately never read by the builder.
  const ledger = JSON.parse(
    readFileSync(join(fixtureRoot, 'v94-tactician-expected.json'), 'utf8'),
  ) as { witnesses: Input[] };
  return ledger.witnesses.map(({ id, selections }) => {
    const hero = structuredClone(template);
    hero.name = String(selections['details.name']);
    hero.ancestry = structuredClone(human);
    const purchase = hero.ancestry.features.find(
      f => f.type === FeatureType.Choice && f.data.count === 'ancestry',
    );
    if (!purchase || purchase.type !== FeatureType.Choice)
      throw new Error('Human purchase missing');
    const purchasedTraits = selections['ancestry.human.purchased-traits'] as string[];
    purchase.data.selected = purchasedTraits.map(name => {
      const option = purchase.data.options.find(o => normalize(o.feature.name) === normalize(name));
      if (!option) throw new Error(`Missing pinned Human trait: ${name}`);
      return structuredClone(option.feature);
    });
    const language = hero.career?.features.find(f => f.id === 'career-soldier-feature-3');
    if (!language || language.type !== FeatureType.LanguageChoice)
      throw new Error('Soldier languages missing');
    language.data.selected = [...(selections['career.soldier.languages'] as string[])];
    hero.class = structuredClone(tactician);
    hero.class.primaryCharacteristics = [Characteristic.Might, Characteristic.Reason];
    const assignment = selections['class.tactician.array-assignment'] as Record<string, number>;
    hero.class.characteristics = Object.values(Characteristic).map(characteristic => ({
      characteristic,
      value: [Characteristic.Might, Characteristic.Reason].includes(characteristic)
        ? 2
        : assignment[characteristic]!,
    }));
    const doctrine = String(selections['class.tactician.doctrine']);
    const selectedDoctrine = hero.class.subclasses.find(subclass => subclass.name === doctrine);
    if (!selectedDoctrine) throw new Error(`Tactician doctrine missing: ${doctrine}`);
    for (const subclass of hero.class.subclasses) subclass.selected = subclass === selectedDoctrine;
    const doctrineSkill = selectedDoctrine.featuresByLevel
      .find(level => level.level === 1)!
      .features.find(f => f.type === FeatureType.SkillChoice);
    if (!doctrineSkill || doctrineSkill.type !== FeatureType.SkillChoice)
      throw new Error('Tactician doctrine skill missing');
    doctrineSkill.data.selected = [String(selections['class.tactician.doctrine-skill'])];
    const features = hero.class.featuresByLevel.find(level => level.level === 1)!.features;
    const skills = features.find(f => f.id === 'tactician-1-2');
    if (!skills || skills.type !== FeatureType.SkillChoice)
      throw new Error('Tactician skills missing');
    skills.data.selected = [...(selections['class.tactician.skills'] as string[])];
    const kitChoice = features.find(f => f.type === FeatureType.Kit);
    if (!kitChoice || kitChoice.type !== FeatureType.Kit)
      throw new Error('Tactician Field Arsenal missing');
    kitChoice.data.selected = ['kit.choice', 'class.tactician.second-kit'].map(decision => {
      const kit = SourcebookLogic.getKits([core, orden]).find(k => k.name === selections[decision]);
      if (!kit) throw new Error(`Tactician kit missing: ${selections[decision]}`);
      return structuredClone(kit);
    });
    for (const [cost, decision] of [
      [3, 'class.tactician.ability-3'],
      [5, 'class.tactician.ability-5'],
    ] as const) {
      const choice = features.find(
        f => f.type === FeatureType.ClassAbility && f.data.cost === cost,
      );
      const ability = hero.class.abilities.find(
        a => normalize(a.name) === normalize(String(selections[decision])) && a.cost === cost,
      );
      if (!choice || choice.type !== FeatureType.ClassAbility || !ability)
        throw new Error(`Tactician ability missing: ${selections[decision]}`);
      choice.data.selectedIDs = [ability.id];
    }
    return {
      id,
      hero,
      selections: structuredClone(selections),
      ancestry: 'Human',
      purchasedTraits,
      calibration: [
        'Reused approved Grug culture and Soldier career inputs; replaced ancestry/class with pinned Human/Tactician definitions and filled both Soldier languages. No rule payload edited.',
        'Both pinned kits are retained unchanged. Forge has no per-benefit choice input and always selects the maximum scalar kit bonus; the runner records exact expected discrepancies against the Compendium ledger.',
      ],
    };
  });
}
