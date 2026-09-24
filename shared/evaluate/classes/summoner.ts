// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SUMMONER_MINIONS } from '../../content/classes/summoner/minions.ts';
import { SUMMONER_FIXTURES } from '../../content/classes/summoner/level-two-three.ts';
import { SENTENCES } from '../sources.ts';
export function applySummonerModifiers(ctx: DerivationContext, out: PartialBaseline) {
  if (ctx.single('class.choice') !== 'Summoner') return;
  applyConjuredWard(ctx, out);
  if (ctx.single('class.summoner.circle') !== 'Spring' || !out.recoveriesMaximum) return;
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
// feature/summoner/level-3/conjured-ward.md: +3 Stamina, +3 more at 4th, 7th and 10th levels.
function applyConjuredWard(ctx: DerivationContext, out: PartialBaseline) {
  if (ctx.single('class.summoner.level-3.ward') !== 'Conjured Ward' || !out.staminaMaximum) return;
  const amount = 3 * (1 + [4, 7, 10].filter(level => ctx.level >= level).length);
  const stamina = out.staminaMaximum.value + amount;
  out.staminaMaximum = {
    value: stamina,
    provenance: [
      ...out.staminaMaximum.provenance,
      {
        decisionId: 'class.summoner.level-3.ward',
        selection: 'Conjured Ward',
        source: ctx.sentence({
          path: 'en/unified/md/feature/summoner/level-3/conjured-ward.md',
          quote:
            'You gain a +3 bonus to Stamina and that bonus increases by 3 at 4th, 7th, and 10th levels.',
        }),
        operation: 'add',
        amount,
      },
    ],
  };
  for (const [field, divisor, sentence] of [
    ['recoveryValue', 3, SENTENCES.recoveryValue],
    ['windedValue', 2, SENTENCES.winded],
  ] as const)
    out[field] = {
      value: Math.floor(stamina / divisor),
      provenance: [
        ...out.staminaMaximum.provenance,
        {
          decisionId: 'class.summoner.level-3.ward',
          source: ctx.sentence(sentence),
          operation: 'floor-divide',
          amount: divisor,
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
  const range = 5 + r;
  const chosen = [
    ...(ctx.list(`class.summoner.portfolio.${circle.toLowerCase()}.1`) ?? []),
    ...(ctx.list(`class.summoner.portfolio.${circle.toLowerCase()}.3`) ?? []),
    ctx.single(`class.summoner.portfolio.${circle.toLowerCase()}.5`),
  ];
  const fixture = SUMMONER_FIXTURES.find(f => f.circle === circle);
  const hasFixture = ctx.available.has(`class.summoner.level-2.dominion.${circle.toLowerCase()}`);
  const kit = ctx.available.has('class.summoner.level-3.features');
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
    range,
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
            quote:
              m.cost === 1
                ? '1 essence per minion summoned'
                : m.cost === 3
                  ? '3 essence for two minions'
                  : '5 essence for three minions',
          }),
        },
        ...(formation === 'Elite' ? [provenance] : []),
      ],
    })),
    ...(hasFixture && fixture
      ? {
          fixture: {
            name: fixture.name,
            sourcePath: fixture.sourcePath,
            size: fixture.size,
            // Labelled interpretation (Q-SUMMONER-2): the printed "20 + your level" only; Elite
            // Formation's minion +3 is not applied, since whether the fixture is a minion is open.
            stamina: 20 + ctx.level,
            traits: [...fixture.traits],
          },
        }
      : {}),
    // feature/summoner/level-3/summoners-kit.md: Summoner Strike damage 2 × Reason, potency
    // R < AVERAGE, distance your Summoner's Range. Labelled interpretation (Q-SUMMONER-2): the
    // literal distance replaces "Melee 1 or Ranged 5"; the alternative keeps the Melee 1 option.
    ...(kit ? { strike: { damage: 2 * r, potency: 'R < AVERAGE', distance: range } } : {}),
    provenance: [
      ...(formation === 'Horde' ? [provenance] : []),
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
