// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { BEASTHEART_COMPANIONS } from '../../content/classes/beastheart/companions.ts';
const selected = (ctx: DerivationContext) =>
  ctx.single('class.choice') === 'Beastheart'
    ? BEASTHEART_COMPANIONS.find(c => c.name === ctx.single('class.beastheart.companion'))
    : undefined;
export function applyBeastheartModifiers(ctx: DerivationContext, out: PartialBaseline) {
  const c = selected(ctx);
  if (!c) return;
  const p = (name: string, quote: string): Provenance => ({
    decisionId: 'class.beastheart.companion',
    selection: c.name,
    source: ctx.sentence({ path: c.features.find(f => f.name === name)!.path, quote }),
  });
  if (c.name === 'Bear' && out.stability)
    out.stability = {
      value: out.stability.value + 1,
      provenance: [
        ...out.stability.provenance,
        {
          ...p('Strong Like Bear', 'You gain a +1 bonus to your stability.'),
          operation: 'add',
          amount: 1,
        },
      ],
    };
  const type =
    c.name === 'Drake'
      ? ctx.single('class.beastheart.drake-attunement')?.toLowerCase()
      : c.name === 'Hellhound'
        ? 'fire'
        : undefined;
  if (type)
    out.damageImmunities = [
      ...(out.damageImmunities ?? []),
      {
        damageType: type,
        value: {
          value: 3,
          provenance: [
            {
              ...p(
                c.name === 'Drake' ? 'Shared Scales' : 'Hellish Pact',
                c.name === 'Drake'
                  ? "You have immunity 3 to the drake's attuned damage type."
                  : "You have fire immunity equal to the hellhound's fire immunity.",
              ),
              operation: 'base',
              amount: 3,
            },
          ],
        },
      },
    ];
}
export function deriveBeastheartCompanion(ctx: DerivationContext, out: PartialBaseline) {
  const c = selected(ctx);
  if (!c || !out.staminaMaximum || !out.kit || !out.recoveryValue || !out.skills) return;
  const kit = out.kit;
  const p: Provenance = {
    decisionId: 'class.beastheart.companion',
    selection: c.name,
    source: ctx.sentence({ path: c.sourcePath, quote: 'Level 1' }),
  };
  const rules: Provenance = {
    decisionId: 'class.beastheart.companion',
    source: ctx.sentence({
      path: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
      quote: "Your companion's Stamina maximum equals your Stamina maximum.",
    }),
  };
  const kitRule: Provenance = {
    decisionId: 'class.beastheart.companion-melee-bonus',
    source: ctx.sentence({
      path: 'en/unified/md/feature/beastheart/level-1/kit.md',
      quote:
        'You and your companion both gain the benefits of the kit, with the following exceptions:',
    }),
  };
  out.companion = {
    name: c.name,
    sourcePath: c.sourcePath,
    characteristics: { ...c.characteristics },
    size: c.size,
    speed: c.speed + kit.speedBonus.value,
    stability: c.stability + kit.stabilityBonus.value,
    disengage: 1 + kit.disengageBonus.value,
    movement: c.movement,
    staminaMaximum: out.staminaMaximum.value,
    recoveriesMaximum: 0,
    recoveryValue: out.recoveryValue.value,
    windedValue: Math.floor(out.staminaMaximum.value / 2),
    freeStrike: 1 + c.characteristics.M,
    meleeDamageBonus:
      ctx.single('class.beastheart.companion-melee-bonus') === 'Kit bonus'
        ? [...kit.meleeDamageBonus.value]
        : [0, 0, 4],
    rangedDamageBonus: [...kit.rangedDamageBonus.value],
    meleeDistanceBonus: kit.meleeDistanceBonus.value,
    rangedDistanceBonus: kit.rangedDistanceBonus.value,
    potency: {
      weak: c.characteristics.M - 2,
      average: c.characteristics.M - 1,
      strong: c.characteristics.M,
    },
    immunity:
      c.name === 'Drake'
        ? `${ctx.single('class.beastheart.drake-attunement') ?? 'Attuned damage type'} 3`
        : c.immunity,
    skills: out.skills.map(s => s.name),
    features: c.features.map(f => f.name),
    abilities: ['Feral Strike', ...c.abilities.map(a => a.name)],
    provenance: [
      p,
      rules,
      kitRule,
      ...out.staminaMaximum.provenance,
      ...kit.speedBonus.provenance,
      ...kit.stabilityBonus.provenance,
    ],
  };
}
