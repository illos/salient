// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SUMMONER_MINIONS } from '../../content/classes/summoner/minions.ts';
export function applySummonerModifiers(ctx: DerivationContext, out: PartialBaseline) {
  if (
    ctx.single('class.choice') !== 'Summoner' ||
    ctx.single('class.summoner.circle') !== 'Spring' ||
    !out.recoveriesMaximum
  )
    return;
  out.recoveriesMaximum = {
    value: out.recoveriesMaximum.value + 2,
    provenance: [
      ...out.recoveriesMaximum.provenance,
      {
        decisionId: 'class.summoner.circle',
        selection: 'Spring',
        source: ctx.sentence({
          path: 'en/unified/md/feature/summoner/level-1/pixie-dust.md',
          quote: 'Increase your number of Recoveries by 2.',
        }),
        operation: 'add',
        amount: 2,
      },
    ],
  };
}
export function deriveSummonerPortfolio(ctx: DerivationContext, out: PartialBaseline) {
  if (ctx.single('class.choice') !== 'Summoner' || !out.characteristics?.R) return;
  const circle = ctx.single('class.summoner.circle'),
    formation = ctx.single('class.summoner.formation'),
    r = out.characteristics.R.value;
  if (!circle || !formation) return;
  const chosen = [
    ...(ctx.list(`class.summoner.portfolio.${circle.toLowerCase()}.1`) ?? []),
    ...(ctx.list(`class.summoner.portfolio.${circle.toLowerCase()}.3`) ?? []),
  ];
  const provenance: Provenance = {
    decisionId: 'class.summoner.formation',
    selection: formation,
    source: ctx.sentence({
      path: `en/unified/md/feature/summoner/level-1/${formation.toLowerCase()}-formation.md`,
      quote:
        formation === 'Elite'
          ? 'Each of your minions have their Stamina increased by 3 and their stability increased by 1.'
          : formation === 'Horde'
            ? 'Your maximum number of minions increases by 4'
            : 'Formation',
    }),
  };
  out.summoner = {
    circle,
    formation,
    range: 5 + r,
    minionMaximum: formation === 'Horde' ? 12 : 8,
    squadMaximum: 2,
    squadSizeMaximum: 8,
    startOfCombatMinions: 2,
    startOfTurnMinions: formation === 'Horde' ? 4 : 3,
    outsideCombatMaximum: 4,
    portfolio: SUMMONER_MINIONS.filter(m => chosen.includes(m.name)).map(m => ({
      name: m.name,
      sourcePath: m.sourcePath,
      cost: m.cost,
      summonCount: m.count,
      stamina: m.stamina + (formation === 'Elite' ? 3 : 0),
      stability: (m.stability === 'R' ? r : Number(m.stability)) + (formation === 'Elite' ? 1 : 0),
      size: m.size,
      speed: m.speed,
      movement: m.movement,
      freeStrike: m.freeStrike,
      characteristics: { ...m.characteristics },
      immunities: m.immunities.map(i => i.replace(/\bR\b/g, String(r))),
      weaknesses: m.weaknesses,
      traits: [...m.traits],
      text: m.text,
      provenance: [
        {
          decisionId: `class.summoner.portfolio.${circle.toLowerCase()}.${m.cost}`,
          selection: m.name,
          source: ctx.sentence({
            path: m.sourcePath,
            quote: m.cost === 1 ? '1 essence per minion summoned' : '3 essence for two minions',
          }),
        },
        ...(formation === 'Elite' ? [provenance] : []),
      ],
    })),
    provenance: [
      {
        decisionId: 'class.summoner.features',
        source: ctx.sentence({
          path: 'en/unified/md/feature/summoner/level-1/minions.md',
          quote: "Your Summoner's Range is equal to 5 + your Reason score.",
        }),
      },
    ],
  };
}
