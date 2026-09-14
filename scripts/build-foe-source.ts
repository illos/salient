// SPDX-License-Identifier: GPL-3.0-only
/** Copies the single reviewed source into a server-only snapshot; never updates the corpus. */
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadMonster, SOURCE_REVISION } from '../src/content.ts';

const root = fileURLToPath(new URL('../vendor/steel-compendium/', import.meta.url));
const revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
if (revision !== SOURCE_REVISION)
  throw new Error('Review the changed Compendium pin before regenerating foe content.');
if (execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' }).trim())
  throw new Error('Foe generation requires an unmodified pinned Compendium checkout.');
const path = 'monster/goblin/statblock/goblin-warrior';
const loaded = await loadMonster(path, 'source:goblin-warrior', 'goblin-warrior', root);
const { entity } = loaded;
const snapshot = {
  source: { id: entity.definitionId, path: `en/unified/md/${path}.md`, revision },
  name: entity.name,
  text: await readFile(
    new URL(`../vendor/steel-compendium/en/unified/md/${path}.md`, import.meta.url),
    'utf8',
  ),
  definition: JSON.parse(
    await readFile(
      new URL(`../vendor/steel-compendium/en/unified/json/${path}.json`, import.meta.url),
      'utf8',
    ),
  ),
  baseline: {
    level: entity.level,
    maxStamina: entity.maxStamina,
    characteristics: entity.characteristics,
    size: entity.size,
    sizeCategory: entity.sizeCategory,
    stability: entity.stability,
    traits: entity.traits,
    meleeDamageBonus: entity.meleeDamageBonus,
    freeStrikeDamage: entity.freeStrikeDamage,
  },
  initialLive: {
    stamina: entity.stamina,
    temporaryStamina: entity.temporaryStamina,
    resources: entity.resources,
    conditions: entity.conditions,
  },
  abilities: loaded.abilities,
};
const output = `${JSON.stringify(snapshot, null, 2)}\n`;
const target = new URL('../shared/goblin-warrior.json', import.meta.url);
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')) !== output)
    throw new Error(
      'The committed Goblin Warrior snapshot differs from its pinned source. Regenerate and review it.',
    );
  console.log('Goblin Warrior snapshot matches the clean pinned Compendium.');
} else {
  await writeFile(target, output);
  console.log('Generated the Goblin Warrior source snapshot.');
}
