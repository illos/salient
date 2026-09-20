// SPDX-License-Identifier: GPL-3.0-only
/** Builds legal Shadow counterparts from pinned Forge definitions and input selections only. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { human } from '@/data/ancestries/human';
import { shadow } from '@/data/classes/shadow/shadow';
import { core } from '@/data/sourcebooks/official/core';
import { orden } from '@/data/sourcebooks/official/orden';
import { Characteristic } from '@/enums/characteristic';
import { FeatureType } from '@/enums/feature-type';
import { SourcebookLogic } from '@/logic/sourcebook-logic';
import type { Hero } from '@/models/hero';
import type { ForgeWitness } from './ancestry-witnesses';

type Input = { id: string; selections: Record<string, unknown> };
const normalize = (name: string) => name.replaceAll('’', "'");

export function createShadowWitnesses(fixtureRoot = 'tests/fixtures'): ForgeWitness[] {
  const template = JSON.parse(
    readFileSync(join(fixtureRoot, 'v45-reference/Grug-level-1.ds-hero'), 'utf8'),
  ) as Hero;
  // Expected values are deliberately never read by the builder.
  const ledger = JSON.parse(
    readFileSync(join(fixtureRoot, 'v92-shadow-expected.json'), 'utf8'),
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
    hero.class = structuredClone(shadow);
    hero.class.primaryCharacteristics = [Characteristic.Agility];
    const assignment = selections['class.shadow.array-assignment'] as Record<string, number>;
    hero.class.characteristics = Object.values(Characteristic).map(characteristic => ({
      characteristic,
      value: characteristic === Characteristic.Agility ? 2 : assignment[characteristic]!,
    }));
    const college = String(selections['class.shadow.college']);
    const collegeName =
      college === 'Harlequin Mask' ? 'College of the Harlequin Mask' : `College of ${college}`;
    for (const subclass of hero.class.subclasses) subclass.selected = subclass.name === collegeName;
    const features = hero.class.featuresByLevel.find(level => level.level === 1)!.features;
    const skills = features.find(f => f.id === 'shadow-1-3');
    if (!skills || skills.type !== FeatureType.SkillChoice)
      throw new Error('Shadow skills missing');
    skills.data.selected = [...(selections['class.shadow.skills'] as string[])];
    const kitChoice = features.find(f => f.type === FeatureType.Kit);
    const kit = SourcebookLogic.getKits([core, orden]).find(
      k => k.name === selections['kit.choice'],
    );
    if (!kitChoice || kitChoice.type !== FeatureType.Kit || !kit)
      throw new Error('Shadow kit missing');
    kitChoice.data.selected = [structuredClone(kit)];
    for (const [cost, decision] of [
      ['signature', 'class.shadow.signature-ability'],
      [3, 'class.shadow.ability-3'],
      [5, 'class.shadow.ability-5'],
    ] as const) {
      const choice = features.find(
        f => f.type === FeatureType.ClassAbility && f.data.cost === cost,
      );
      const ability = hero.class.abilities.find(
        a => normalize(a.name) === normalize(String(selections[decision])) && a.cost === cost,
      );
      if (!choice || choice.type !== FeatureType.ClassAbility || !ability)
        throw new Error(`Shadow ability missing: ${selections[decision]}`);
      choice.data.selectedIDs = [ability.id];
    }
    return {
      id,
      hero,
      selections: structuredClone(selections),
      ancestry: 'Human',
      purchasedTraits,
      calibration: [
        'Reused approved Grug culture and Soldier career inputs; replaced ancestry/class with pinned Human/Shadow definitions and filled both Soldier languages. No rule payload edited.',
        'Forge College of prefix maps to Compendium college names. Curly apostrophes normalize to straight apostrophes for display comparison.',
      ],
    };
  });
}
