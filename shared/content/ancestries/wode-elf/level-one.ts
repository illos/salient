// SPDX-License-Identifier: GPL-3.0-only
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
const trait = (slug: string) => path(`feature/trait/wode-elf/${slug}`);
export const levelOneDecisions: Decision[] = [
  auto('ancestry.wode-elf.base-statistics', 'ancestry.choice', 'Wode Elf', SENTENCES.baseStatistics.path, SENTENCES.baseStatistics.quote),
  auto('ancestry.wode-elf.signature-trait', 'ancestry.choice', 'Wode Elf', trait('wode-elf-glamor'), 'You can magically alter your appearance to better blend in with your surroundings.', [grant('ancestry-signature-trait', 'Wode Elf Glamor', trait('wode-elf-glamor'))]),
  choice('ancestry.wode-elf.purchased-traits', 'ancestry.choice', 'Wode Elf', trait('wode-elf-traits'), 'You have 3 ancestry points to spend on the following traits.', [
    option('Forest Walk',trait('forest-walk'),{cost:1}),
    option('Otherworldly Grace',trait('otherworldly-grace'),{cost:2}),
    option('Quick and Brutal',trait('quick-and-brutal'),{cost:1}),
    option('Revisit Memory',trait('revisit-memory'),{cost:1}),
    option('Swift',trait('swift'),{cost:1}),
    option('The Wode Defends',trait('the-wode-defends'),{cost:2,grants:[grant('ancestry-ability','The Wode Defends',path('feature/ability/wode-elf/the-wode-defends'))]}),
  ], {shape:{type:'points',budget:3,costField:'cost'}}),
];
