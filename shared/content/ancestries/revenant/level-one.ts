// SPDX-License-Identifier: GPL-3.0-only
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
const trait = (slug: string) => path(`feature/trait/revenant/${slug}`);
export const FORMER_ANCESTRIES = [
  'Devil',
  'Dragon Knight',
  'Dwarf',
  'Hakaan',
  'High Elf',
  'Human',
  'Memonek',
  'Orc',
  'Polder',
  'Time Raider',
  'Wode Elf',
];
export const formerSlug = (name: string) => name.toLowerCase().replaceAll(' ', '-');
export const revenantPurchaseId = (former: string) =>
  `ancestry.revenant.${formerSlug(former)}.purchased-traits`;
export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.revenant.base-statistics',
    'ancestry.choice',
    'Revenant',
    trait('former-life'),
    "Choose the ancestry you were before you died. Your size is that ancestry's size and your speed is 5.",
  ),
  auto(
    'ancestry.revenant.former-life-trait',
    'ancestry.choice',
    'Revenant',
    trait('former-life'),
    "Choose the ancestry you were before you died. Your size is that ancestry's size and your speed is 5.",
    [grant('ancestry-signature-trait', 'Former Life', trait('former-life'))],
  ),
  auto(
    'ancestry.revenant.signature-trait',
    'ancestry.choice',
    'Revenant',
    trait('tough-but-withered'),
    'Your undead body grants you immunity to cold, corruption, lightning, and poison damage equal to your level, but you have fire weakness 5.',
    [grant('ancestry-signature-trait', 'Tough But Withered', trait('tough-but-withered'))],
  ),
  choice(
    'ancestry.revenant.former-life',
    'ancestry.choice',
    'Revenant',
    trait('former-life'),
    'Choose the ancestry you were before you died.',
    FORMER_ANCESTRIES.map(name => option(name, path(`ancestry/${formerSlug(name)}`))),
  ),
];

/** Previous Life shares one budget with native purchases. A borrowed purchase keeps its original
 * name/source/grants; each distinct one-point purchase can occur once, as the source requires. */
export function createRevenantDecisions(ancestryDecisions: Decision[]): Decision[] {
  const result = structuredClone(levelOneDecisions);
  for (const former of FORMER_ANCESTRIES) {
    const prefix = `ancestry.${formerSlug(former)}.`;
    const original = ancestryDecisions.find(d => d.id === `${prefix}purchased-traits`);
    const purchaseId = revenantPurchaseId(former);
    result.push(
      choice(
        purchaseId,
        'ancestry.revenant.former-life',
        former,
        trait('tough-but-withered'),
        'You have 2 ancestry points to spend on the following traits, or 3 ancestry points if your size is 1S.',
        [
          option('Bloodless', trait('bloodless'), { cost: 2 }),
          option('Undead Influence', trait('undead-influence'), { cost: 1 }),
          option('Vengeance Mark', trait('vengeance-mark'), {
            cost: 2,
            grants: [
              grant(
                'ancestry-ability',
                'Detonate Sigil',
                path('feature/ability/revenant/detonate-sigil'),
              ),
            ],
          }),
          ...(original?.options ?? [])
            .filter(o => o.cost === 1 || o.cost === 2)
            .map(o => ({
              ...structuredClone(o),
              ...(o.value === 'Prismatic Scales'
                ? {
                    supportedInV001: false,
                    requiresFeature: 'Wyrmplate',
                    unavailableReason:
                      'Prismatic Scales requires Wyrmplate; Former Life does not grant the former ancestry’s signature traits.',
                  }
                : {}),
            })),
        ],
        {
          label: `${former} Previous Life and Revenant Traits`,
          shape: { type: 'points', budget: former === 'Polder' ? 3 : 2, costField: 'cost' },
        },
      ),
    );
    // Clone only the purchase-dependent subtree. Signature choices never transfer.
    const included = new Set([`${prefix}purchased-traits`]);
    const descendants: Decision[] = [];
    let added = true;
    while (added) {
      added = false;
      for (const d of ancestryDecisions) {
        if (!d.id.startsWith(prefix) || included.has(d.id)) continue;
        if ([d.availableWhen, ...(d.conditions ?? [])].some(c => c && included.has(c.decision))) {
          included.add(d.id);
          descendants.push(d);
          added = true;
        }
      }
    }
    const remap = (id: string) =>
      id === `${prefix}purchased-traits`
        ? purchaseId
        : included.has(id)
          ? id.replace(prefix, `ancestry.revenant.${formerSlug(former)}.`)
          : id;
    for (const originalChild of descendants) {
      const child = structuredClone(originalChild);
      child.id = remap(child.id);
      if (child.availableWhen)
        child.availableWhen.decision =
          child.availableWhen.decision === 'ancestry.choice'
            ? 'ancestry.revenant.former-life'
            : remap(child.availableWhen.decision);
      child.conditions = (child.conditions ?? []).map(c => ({
        ...c,
        decision:
          c.decision === 'ancestry.choice' ? 'ancestry.revenant.former-life' : remap(c.decision),
      }));
      child.conditions.push({ decision: 'ancestry.revenant.former-life', value: former });
      if (child.dependsOn) child.dependsOn = child.dependsOn.map(remap);
      if (child.selectedPool) child.selectedPool.decision = remap(child.selectedPool.decision);
      result.push(child);
    }
  }
  return result;
}
