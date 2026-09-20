// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { revenantPurchaseId } from '../../content/ancestries/revenant/level-one.ts';
import { SENTENCES } from '../sources.ts';

const BORROWED: Record<string, { kind: string; value: number | string; quote: string }> = {
  'devil/beast-legs': {
    kind: 'speed',
    value: 6,
    quote: 'Your powerful legs make you faster. You have speed 6.',
  },
  'devil/impressive-horns': {
    kind: 'save',
    value: 5,
    quote:
      "Your cherished horns are larger than the average devil's, and a hardened representation of your force of will. Whenever you make a saving throw, you succeed on a roll of 5 or higher.",
  },
  'dwarf/grounded': {
    kind: 'stability',
    value: 1,
    quote:
      'Your heavy stone body and connection to the earth make it difficult for others to move you. You have a +1 bonus to stability.',
  },
  'dwarf/great-fortitude': {
    kind: 'condition',
    value: 'weakened',
    quote:
      "Your hearty constitution prevents you from losing strength. You can't be made weakened.",
  },
  'dwarf/spark-off-your-skin': {
    kind: 'stamina',
    value: 6,
    quote:
      'Your stone skin affords you potent protection. You have a +6 bonus to Stamina, and that bonus increases by 6 at 4th, 7th, and 10th levels.',
  },
  'hakaan/great-fortitude': {
    kind: 'condition',
    value: 'weakened',
    quote:
      "Your hearty constitution prevents you from losing strength. You can't be made weakened.",
  },
  'human/staying-power': {
    kind: 'recoveries',
    value: 2,
    quote:
      'Your human physiology allows you to fight, run, and stay awake longer than others. You increase your number of Recoveries by 2.',
  },
  'polder/corruption-immunity': {
    kind: 'corruption',
    value: 3,
    quote:
      'Your innate shadow magic grants you resilience against the unnatural. You have corruption immunity equal to your level + 2.',
  },
  'polder/fearless': {
    kind: 'condition',
    value: 'frightened',
    quote: "Courage is all you know. You can't be made frightened.",
  },
  'polder/graceful-retreat': {
    kind: 'disengage',
    value: 1,
    quote:
      'Your small size makes it easier for you to slip away from the fray. You gain a +1 bonus to the distance you can shift when you take the Disengage move action.',
  },
  'orc/grounded': {
    kind: 'stability',
    value: 1,
    quote:
      'The magic in your blood makes it difficult for others to move you. You have a +1 bonus to stability.',
  },
  'orc/nonstop': {
    kind: 'condition',
    value: 'slowed',
    quote:
      "Your bloodfire supplies you with a constant rush of adrenaline. You can't be made slowed.",
  },
  'memonek/lightning-nimbleness': {
    kind: 'speed',
    value: 7,
    quote: 'You can push your body to move at incredible speeds. Your speed is 7.',
  },
  'memonek/nonstop': {
    kind: 'condition',
    value: 'slowed',
    quote:
      "Your connection to Axiom allows you to regulate your movement. You can't be made slowed.",
  },
  'memonek/unphased': {
    kind: 'condition',
    value: 'surprised',
    quote: "Your ordered mind can't be caught off guard. You can't be made surprised.",
  },
  'high-elf/graceful-retreat': {
    kind: 'disengage',
    value: 1,
    quote:
      'You gain a +1 bonus to the distance you can shift when you take the Disengage move action.',
  },
  'high-elf/otherworldly-grace': {
    kind: 'save',
    value: 5,
    quote:
      "Your elf body and mind can't be contained for long. Whenever you make a saving throw, you succeed on a roll of 5 or higher.",
  },
  'wode-elf/swift': { kind: 'speed', value: 6, quote: 'You have speed 6.' },
  'wode-elf/otherworldly-grace': {
    kind: 'save',
    value: 5,
    quote:
      "Your elf body and mind can't be contained for long. Whenever you make a saving throw, you succeed on a roll of 5 or higher.",
  },
  'high-elf/unstoppable-mind': {
    kind: 'condition',
    value: 'dazed',
    quote: "Your mind allows you to maintain your focus in any situation. You can't be made dazed.",
  },
  'time-raider/time-raider-traits': {
    kind: 'condition',
    value: 'dazed',
    quote: "Your mind allows you to maintain your focus in any situation. You can't be made dazed.",
  },
};

/** After class/kit vitals and ordinary ancestry contributions, before complication modifiers.
 * Only actual paid traits transfer. Former-life signature traits and their immunity never do. */
export function applyRevenantBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  if (!ctx.available.has('ancestry.revenant.base-statistics')) return;
  const former = ctx.single('ancestry.revenant.former-life');
  const source = (slug: string, quote: string) =>
    ctx.sentence({ path: `en/unified/md/feature/trait/revenant/${slug}.md`, quote });
  const base = (amount?: number): Provenance => ({
    decisionId: 'ancestry.revenant.base-statistics',
    source: source(
      'former-life',
      "Choose the ancestry you were before you died. Your size is that ancestry's size and your speed is 5.",
    ),
    operation: amount === undefined ? 'set' : 'base',
    ...(amount === undefined ? {} : { amount }),
  });
  if (former)
    out.size = {
      value: former === 'Polder' ? '1S' : former === 'Hakaan' ? '1L' : '1M',
      provenance: [base()],
    };
  out.speed = {
    value: 5 + (out.kit?.speedBonus.value ?? 0),
    provenance: [base(5), ...(out.kit?.speedBonus.provenance ?? [])],
  };
  if (out.kit || noKit)
    out.stability = {
      value: out.kit?.stabilityBonus.value ?? 0,
      provenance: [base(0), ...(out.kit?.stabilityBonus.provenance ?? [])],
    };
  const tough: Provenance = {
    decisionId: 'ancestry.revenant.signature-trait',
    source: source(
      'tough-but-withered',
      'Your undead body grants you immunity to cold, corruption, lightning, and poison damage equal to your level, but you have fire weakness 5.',
    ),
    operation: 'set',
    amount: ctx.level,
  };
  out.damageImmunities = ['cold', 'corruption', 'lightning', 'poison'].map(damageType => ({
    damageType,
    value: { value: ctx.level, provenance: [tough] },
  }));
  out.damageWeaknesses = [
    { damageType: 'fire', value: { value: 5, provenance: [{ ...tough, amount: 5 }] } },
  ];
  if (!former) return;
  const id = revenantPurchaseId(former);
  const chosen = ctx.list(id) ?? [];
  if (chosen.includes('Bloodless'))
    (out.conditionImmunities ??= []).push({
      condition: 'bleeding',
      provenance: {
        decisionId: id,
        selection: 'Bloodless',
        source: source('bloodless', "You can't be made bleeding even while dying."),
      },
    });
  for (const name of chosen) {
    const option = ctx.decisions.get(id)?.options?.find(o => o.value === name);
    if (!option?.source) continue;
    const slug = option.source.replace('en/unified/md/feature/trait/', '').replace('.md', '');
    const effect = BORROWED[slug];
    if (!effect || effect.kind === 'disengage') continue;
    const p: Provenance = {
      decisionId: id,
      selection: name!,
      source: ctx.sentence({ path: option.source, quote: effect.quote }),
      operation: 'add',
      ...(typeof effect.value === 'number' ? { amount: effect.value } : {}),
    };
    const n = Number(effect.value);
    switch (effect.kind) {
      case 'speed':
        out.speed = {
          value: n + (out.kit?.speedBonus.value ?? 0),
          provenance: [{ ...p, operation: 'set' }, ...(out.kit?.speedBonus.provenance ?? [])],
        };
        break;
      case 'stability':
        if (out.stability) {
          out.stability.value += n;
          out.stability.provenance.push(p);
        }
        break;
      case 'save':
        out.savingThrowThreshold = { value: n, provenance: [{ ...p, operation: 'set' }] };
        break;
      case 'condition':
        (out.conditionImmunities ??= []).push({ condition: String(effect.value), provenance: p });
        break;
      case 'recoveries':
        if (out.recoveriesMaximum) {
          out.recoveriesMaximum.value += n;
          out.recoveriesMaximum.provenance.push(p);
        }
        break;
      case 'corruption': {
        const immunity = out.damageImmunities.find(i => i.damageType === 'corruption')!;
        immunity.value = {
          value: ctx.level + 2,
          provenance: [{ ...p, operation: 'set', amount: ctx.level + 2 }],
        };
        break;
      }
      case 'stamina':
        if (out.staminaMaximum) {
          out.staminaMaximum.value += n;
          out.staminaMaximum.provenance.push(p);
          for (const [field, divisor, sentence] of [
            ['recoveryValue', 3, SENTENCES.recoveryValue],
            ['windedValue', 2, SENTENCES.winded],
          ] as const)
            out[field] = {
              value: Math.floor(out.staminaMaximum.value / divisor),
              provenance: [
                ...out.staminaMaximum.provenance,
                {
                  decisionId: id,
                  selection: name!,
                  source: ctx.sentence(sentence),
                  operation: 'floor-divide',
                  amount: divisor,
                },
              ],
            };
        }
        break;
    }
  }
}

/** Run after the shared default Disengage value has been established. */
export function applyRevenantDisengage(ctx: DerivationContext, out: PartialBaseline) {
  const former = ctx.single('ancestry.revenant.former-life');
  if (!former || !out.disengage) return;
  const id = revenantPurchaseId(former);
  if (!ctx.list(id)?.includes('Graceful Retreat')) return;
  const option = ctx.decisions.get(id)?.options?.find(o => o.value === 'Graceful Retreat');
  if (!option?.source) return;
  out.disengage.value += 1;
  out.disengage.provenance.push({
    decisionId: id,
    selection: 'Graceful Retreat',
    source: ctx.sentence({
      path: option.source,
      quote:
        'You gain a +1 bonus to the distance you can shift when you take the Disengage move action.',
    }),
    operation: 'add',
    amount: 1,
  });
}
