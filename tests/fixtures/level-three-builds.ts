// SPDX-License-Identifier: GPL-3.0-only
/**
 * One complete level-three build per class, assembled from each class's independent source ledger
 * exactly as its level-three test does (V98, V114, V116, V117, V132–V138). V163 splits each into its
 * level-one foundation and the level-two and level-three decisions a level-up adds.
 */
import shadow from './v98-shadow-three-expected.json' with { type: 'json' };
import furyOne from './v101-fury-expected.json' with { type: 'json' };
import fury from './v114-fury-three-expected.json' with { type: 'json' };
import tacticianOne from './v94-tactician-expected.json' with { type: 'json' };
import tactician from './v116-tactician-three-expected.json' with { type: 'json' };
import censorOne from './v99-censor-expected.json' with { type: 'json' };
import censor from './v117-censor-three-expected.json' with { type: 'json' };
import troubadourOne from './v102-troubadour-expected.json' with { type: 'json' };
import troubadour from './v132-troubadour-three-expected.json' with { type: 'json' };
import nullOne from './v103-null-expected.json' with { type: 'json' };
import nullThree from './v133-null-three-expected.json' with { type: 'json' };
import conduitOne from './v100-conduit-expected.json' with { type: 'json' };
import conduit from './v134-conduit-three-expected.json' with { type: 'json' };
import elementalistOne from './v104-elementalist-expected.json' with { type: 'json' };
import elementalist from './v135-elementalist-three-expected.json' with { type: 'json' };
import talentOne from './v105-talent-expected.json' with { type: 'json' };
import talent from './v136-talent-three-expected.json' with { type: 'json' };
import beastheartOne from './v106-beastheart-expected.json' with { type: 'json' };
import beastheart from './v137-beastheart-three-expected.json' with { type: 'json' };
import summoner from './v138-summoner-three-expected.json' with { type: 'json' };
import type { SelectionValue } from '../../shared/contracts/characterEvaluation.ts';

type Selections = Record<string, SelectionValue>;
export interface LevelThreeBuild {
  className: string;
  witness: string;
  selections: Selections;
  /** Ledger values at level three, for readback. */
  staminaMaximum: number;
}
const base = (one: { witnesses: { id: string; selections: unknown }[] }, id: string) =>
  one.witnesses.find(b => b.id === id)!.selections as Selections;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const furyAbility: Record<string, string> = {
  Berserker: 'class.fury.level-2.aspect-ability',
  Reaver: 'class.fury.level-2.reaver-ability',
  Stormwight: 'class.fury.level-2.stormwight-ability',
};

export function levelThreeBuilds(): LevelThreeBuild[] {
  const s = shadow.witnesses[0]!;
  const f = fury.witnesses[0]!;
  const fTwo = f.levelTwo.addedSelections as Record<string, string>;
  const fThree = f.levelThree.addedSelections as Record<string, string>;
  const [tId, t] = Object.entries(tactician.witnesses)[0]!;
  const [cId, c] = Object.entries(censor.witnesses)[0]!;
  const [trId, tr] = Object.entries(troubadour.witnesses)[0]!;
  const [nId, n] = Object.entries(nullThree.witnesses)[0]!;
  const [coId, co] = Object.entries(conduit.witnesses)[0]!;
  const coTwo = co.levelTwo as {
    secondDomain: string;
    addedSelections: Record<string, string>;
  };
  const [eId, e] = Object.entries(elementalist.witnesses)[0]!;
  const [taId, ta] = Object.entries(talent.witnesses)[0]!;
  const [bId, b] = Object.entries(beastheart.witnesses)[0]!;
  const su = summoner.witnesses[0]!;
  return [
    {
      className: 'Shadow',
      witness: s.id,
      selections: s.selections as unknown as Selections,
      staminaMaximum: s.expected.staminaMaximum,
    },
    {
      className: 'Fury',
      witness: f.id,
      selections: {
        ...base(furyOne, f.id),
        'class.fury.level-2.perk': fTwo['class.fury.level-2.perk']!,
        [furyAbility[f.subclass]!]: fTwo['class.fury.level-2.aspect-ability']!,
        'class.fury.level-3.ability-7': fThree['class.fury.level-3.7-ferocity-ability']!,
      },
      staminaMaximum: f.levelThree.staminaMaximum,
    },
    {
      className: 'Tactician',
      witness: tId,
      selections: {
        ...base(tacticianOne, t.base),
        'class.tactician.level-2.perk': t.levelTwo.addedSelections.perk,
        [`class.tactician.level-2.${t.doctrine.toLowerCase()}-ability`]:
          t.levelTwo.addedSelections.doctrineAbility,
        'class.tactician.level-3.ability-7': t.levelThree.addedSelections.ability7,
      },
      staminaMaximum: t.levelThree.staminaMaximum,
    },
    {
      className: 'Censor',
      witness: cId,
      selections: {
        ...base(censorOne, c.base),
        'class.censor.level-2.perk': c.levelTwo.addedSelections.perk,
        [`class.censor.level-2.${c.order.toLowerCase()}-ability`]:
          c.levelTwo.addedSelections.orderAbility,
        'class.censor.level-3.ability-7': c.levelThree.addedSelections.ability7,
      },
      staminaMaximum: c.levelThree.staminaMaximum,
    },
    {
      className: 'Troubadour',
      witness: trId,
      selections: {
        ...base(troubadourOne, tr.base),
        'class.troubadour.level-2.perk': tr.levelTwo.addedSelections.perk,
        'class.troubadour.level-2.invocation': tr.levelTwo.addedSelections.invocation,
        [`class.troubadour.level-2.${tr.classAct.toLowerCase()}-ability`]:
          tr.levelTwo.addedSelections.classActAbility,
        'class.troubadour.level-3.ability-7': tr.levelThree.addedSelections.ability7,
      },
      staminaMaximum: tr.levelThree.staminaMaximum,
    },
    {
      className: 'Null',
      witness: nId,
      selections: {
        ...base(nullOne, n.base),
        'class.null.level-2.perk': n.levelTwo.addedSelections.perk,
        [`class.null.level-2.${n.tradition.toLowerCase()}-ability`]:
          n.levelTwo.addedSelections.traditionAbility,
        'class.null.level-3.ability-7': n.levelThree.addedSelections.ability7,
      },
      staminaMaximum: n.levelThree.staminaMaximum,
    },
    {
      className: 'Conduit',
      witness: coId,
      selections: {
        ...base(conduitOne, co.base),
        'class.conduit.level-2.perk': coTwo.addedSelections.perk!,
        'class.conduit.level-2.domain-ability': coTwo.addedSelections.domainAbilityDomain!,
        [`class.conduit.level-2.domain-skill.${slug(coTwo.secondDomain)}`]:
          coTwo.addedSelections.secondDomainSkill!,
        'class.conduit.level-3.ability-7': co.levelThree.addedSelections.ability7,
      },
      staminaMaximum: co.levelThree.staminaMaximum,
    },
    {
      className: 'Elementalist',
      witness: eId,
      selections: {
        ...base(elementalistOne, e.base),
        'class.elementalist.level-2.perk': e.levelTwo.addedSelections.perk,
        'class.elementalist.level-2.ability-5': e.levelTwo.addedSelections.ability5,
        'class.elementalist.level-3.ability-7': e.levelThree.addedSelections.ability7,
      },
      staminaMaximum: e.levelThree.staminaMaximum,
    },
    {
      className: 'Talent',
      witness: taId,
      selections: {
        ...base(talentOne, ta.base),
        'class.talent.level-2.perk': ta.levelTwo.addedSelections.perk,
        [`class.talent.level-2.${ta.tradition.toLowerCase()}-ability`]:
          ta.levelTwo.addedSelections.traditionAbility,
        'class.talent.level-3.ability-7': ta.levelThree.addedSelections.ability7,
      },
      staminaMaximum: ta.levelThree.staminaMaximum,
    },
    {
      className: 'Beastheart',
      witness: bId,
      selections: {
        ...base(beastheartOne, b.base),
        'class.beastheart.level-2.perk': b.levelTwo.addedSelections.perk,
        [`class.beastheart.level-2.${b.wildNature.toLowerCase()}-ability`]:
          b.levelTwo.addedSelections.natureAbility,
        'class.beastheart.level-3.ability-7': b.levelThree.addedSelections.ability7,
      },
      staminaMaximum: b.levelThree.staminaMaximum,
    },
    {
      className: 'Summoner',
      witness: su.id,
      selections: {
        ...(su.level1Selections as unknown as Selections),
        'class.summoner.level-2.perk': su.level2Selections['class.summoner.level-2.perk'],
        [`class.summoner.portfolio.${su.circle.toLowerCase()}.5`]: su.newPortfolioMinion.name,
        'class.summoner.level-3.ward': su.level3Selections['class.summoner.level-3.ward'],
        'class.summoner.level-3.ability-7': su.level3Selections['class.summoner.level-3.ability-7'],
      },
      staminaMaximum: su.level3.staminaMaximum,
    },
  ];
}
