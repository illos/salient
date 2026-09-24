import { readPinnedSource } from './helpers/pinned-source.ts';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import type {
  DerivedBaseline,
  DerivedValue,
  EvaluationInput,
  EvaluationResult,
  Provenance,
} from '../shared/contracts/characterEvaluation.ts';
import { vendorPath } from '../scripts/lib/vendor.ts';

// R02 acceptance checks 1, 2 and 4 for shared/content/character-evaluation-examples.json.
// Expected numbers are read from the pinned Compendium files (class and kit frontmatter, rule
// sentences), never from application code; the examples file and the document must agree with them.

interface Example {
  input: EvaluationInput;
  expected: EvaluationResult;
}
interface ExamplesFile {
  compendiumRevision: string;
  sourceRoot: string;
  definitions: string;
  document: string;
  examples: { complete: Example; incomplete: Example; invalid: Example };
}

const root = process.cwd();
const file = JSON.parse(
  readFileSync(join(root, 'shared/content/character-evaluation-examples.json'), 'utf8'),
) as ExamplesFile;
const sourceRoot = join(root, file.sourceRoot);
const fileCache = new Map<string, string>();

function normalize(text: string): string {
  let out = text.replace(/<br>/g, ' ');
  for (let i = 0; i < 4; i++) out = out.replace(/\[([^[\]]*)\]\([^()]*\)/g, '$1');
  out = out.replace(/\*/g, '');
  return out.replace(/\s+/g, ' ').trim();
}

function source(rel: string): string {
  let cached = fileCache.get(rel);
  if (cached === undefined) {
    const abs = join(sourceRoot, rel);
    cached = normalize(readPinnedSource(root, abs));
    fileCache.set(rel, cached);
  }
  return cached;
}

function frontmatterNumber(rel: string, key: string): number {
  const raw = readPinnedSource(root, join(sourceRoot, rel));
  const match = new RegExp(`^${key}: (\\d+)$`, 'm').exec(raw);
  assert.ok(match, `${rel} has no numeric frontmatter ${key}`);
  return Number(match[1]);
}

function frontmatterText(rel: string, key: string): string {
  const raw = readPinnedSource(root, join(sourceRoot, rel));
  const match = new RegExp(`^${key}: "?([^"\\n]+)"?$`, 'm').exec(raw);
  assert.ok(match, `${rel} has no frontmatter ${key}`);
  return normalize(match[1]!);
}

/** Walks every provenance entry in a baseline-like object. */
function provenanceEntries(value: unknown, path: string, out: [string, Provenance][]): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => provenanceEntries(item, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.provenance) && 'value' in record) {
      for (const p of record.provenance as Provenance[]) out.push([path, p]);
      return;
    }
    if (record.provenance && typeof record.provenance === 'object' && 'decisionId' in record) {
      out.push([path, record.provenance as Provenance]);
      return;
    }
    for (const [key, item] of Object.entries(record))
      provenanceEntries(item, `${path}.${key}`, out);
  }
}

const decisionIds = new Set(
  (
    JSON.parse(readFileSync(join(root, file.definitions), 'utf8')) as {
      steps: { decisions: { id: string }[] }[];
    }
  ).steps.flatMap(s => s.decisions.map(d => d.id)),
);

test('R02 check 1: every provenance quote is verbatim in its cited source and names an R01 decision', () => {
  const head = execFileSync('git', ['-C', vendorPath(sourceRoot, root), 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  });
  assert.equal(head.trim(), file.compendiumRevision);
  for (const [name, example] of Object.entries(file.examples)) {
    const entries: [string, Provenance][] = [];
    provenanceEntries(example.expected.baseline, `${name}.baseline`, entries);
    provenanceEntries(example.expected.partial, `${name}.partial`, entries);
    assert.ok(entries.length > 0, `${name}: no provenance found`);
    for (const [path, p] of entries) {
      assert.ok(decisionIds.has(p.decisionId), `${path}: unknown decision id ${p.decisionId}`);
      assert.equal(p.source.revision, file.compendiumRevision, `${path}: revision`);
      assert.ok(
        source(p.source.path).includes(normalize(p.source.quote)),
        `${path}: "${p.source.quote}" not verbatim in ${p.source.path}`,
      );
    }
    for (const list of Object.values(example.expected.diagnostics)) {
      for (const d of list) {
        assert.ok(decisionIds.has(d.decisionId), `${name}: diagnostic for unknown ${d.decisionId}`);
        if (d.source)
          assert.ok(
            source(d.source.path).includes(normalize(d.source.quote)),
            `${name}: diagnostic quote not verbatim in ${d.source.path}`,
          );
      }
    }
  }
});

test('R02 check 2: the complete example reproduces the numbers the source files establish', () => {
  const baseline = file.examples.complete.expected.baseline;
  assert.ok(baseline, 'complete example has a baseline');
  const b: DerivedBaseline = baseline;
  const v = <T>(d: DerivedValue<T>): T => d.value;

  const fury = 'en/unified/md/class/fury.md';
  const mountain = 'en/unified/md/kit/mountain.md';
  const startingStamina = frontmatterNumber(fury, 'starting_stamina');
  const recoveries = frontmatterNumber(fury, 'recoveries');
  const kitStamina = frontmatterText(mountain, 'stamina_bonus');
  const kitStability = frontmatterText(mountain, 'stability_bonus');
  const kitMelee = frontmatterText(mountain, 'melee_damage_bonus');
  assert.equal(kitStamina, '+9 per echelon');
  assert.equal(kitStability, '+2');
  assert.equal(kitMelee, '+0/+0/+4');
  assert.ok(
    source('en/unified/md/rule/general/echelon.md').includes('1st Echelon (1st to 3rd Level)'),
  );
  const echelon = 1;
  const staminaMaximum = startingStamina + 9 * echelon;

  assert.equal(v(b.staminaMaximum), staminaMaximum);
  assert.equal(v(b.staminaMaximum), 30);
  assert.equal(v(b.recoveriesMaximum), recoveries);
  assert.ok(
    source('en/unified/md/rule/health/recoveries.md').includes(
      'one-third of their Stamina maximum, rounded down',
    ),
  );
  assert.equal(v(b.recoveryValue), Math.floor(staminaMaximum / 3));
  assert.ok(source('en/unified/md/rule/health/winded.md').includes('half your Stamina maximum'));
  assert.equal(v(b.windedValue), Math.floor(staminaMaximum / 2));

  assert.ok(source(fury).includes('You start with a Might of 2 and an Agility of 2'));
  assert.equal(v(b.characteristics.M), 2);
  assert.equal(v(b.characteristics.A), 2);
  const array = file.examples.complete.input.selections['class.fury.characteristic-array'];
  assert.equal(array, '1, 0, 0');
  assert.ok(source(fury).includes('- 1, 0, 0'));
  assert.deepEqual(
    [v(b.characteristics.R), v(b.characteristics.I), v(b.characteristics.P)].sort(),
    [0, 0, 1],
  );

  assert.ok(
    source('en/unified/md/rule/character/speed.md').includes(
      'is size 1M and has speed 5 and stability 0.',
    ),
  );
  assert.ok(
    source('en/unified/md/feature/trait/devil/beast-legs.md').includes('You have speed 6.'),
  );
  assert.equal(v(b.speed), 6);
  assert.equal(v(b.stability), 0 + 2);
  assert.equal(v(b.size), '1M');
  assert.ok(
    source('en/unified/md/feature/common/move-actions/disengage.md').includes('shift 1 square'),
  );
  assert.equal(v(b.disengage), 1);

  assert.ok(source(fury).includes('Weak Potency: Might − 2'));
  assert.equal(v(b.potencyCharacteristic), 'M');
  assert.equal(v(b.potency.weak), 2 - 2);
  assert.equal(v(b.potency.average), 2 - 1);
  assert.equal(v(b.potency.strong), 2);

  assert.ok(
    source('en/unified/md/feature/trait/devil/impressive-horns.md').includes(
      'you succeed on a roll of 5 or higher',
    ),
  );
  assert.equal(v(b.savingThrowThreshold), 5);
  assert.ok(source('en/unified/md/career/soldier.md').includes('Renown: +1'));
  assert.equal(v(b.renown), 0 + 1);
  assert.equal(v(b.wealth), 1);
  assert.equal(v(b.heroicResource.name), 'ferocity');
  assert.equal(v(b.heroicResource.startingValue), 0);

  assert.ok(b.kit);
  assert.deepEqual(v(b.kit.meleeDamageBonus), [0, 0, 4]);
  assert.equal(v(b.kit.staminaBonusApplied), 9);
  assert.equal(v(b.kit.stabilityBonus), 2);
  assert.equal(v(b.kit.speedBonus), 0);

  assert.deepEqual(b.skills.map(s => s.name).sort(), [
    'Alertness',
    'Blacksmithing',
    'Climb',
    'Endurance',
    'Intimidate',
    'Jump',
    'Lift',
    'Nature',
    'Persuade',
    'Swim',
  ]);
  assert.deepEqual(
    b.languages.map(l => l.name),
    ['Caelian', 'Anjali', 'Vaslorian'],
  );
  assert.equal(b.languages.filter(l => l.duplicateOf).length, 0);
  assert.equal(
    b.traits
      .filter(t => t.kind === 'ancestry-purchased-trait')
      .reduce((n, t) => n + (t.cost ?? 0), 0),
    3,
  );
  assert.deepEqual(
    b.abilities.map(a => a.name),
    [
      'Brutal Slam',
      'Out of the Way!',
      'Thunder Roar',
      'Lines of Force',
      'Pain for Pain',
      'Melee Weapon Free Strike',
      'Ranged Weapon Free Strike',
    ],
  );
  assert.equal(b.abilities.find(a => a.name === 'Pain for Pain')?.kitBonusesIncluded, true);
  assert.equal(file.examples.complete.expected.status, 'complete');
  const warnings = Object.values(file.examples.complete.expected.diagnostics).flat();
  assert.deepEqual(
    warnings.map(w => [w.decisionId, w.severity]),
    [],
  );
});

test('R02 check 3: the incomplete and invalid examples name the R01 decision at fault', () => {
  const { incomplete, invalid } = file.examples;
  assert.equal(incomplete.expected.status, 'incomplete');
  assert.equal(incomplete.expected.baseline, null);
  assert.equal(incomplete.input.selections['kit.choice'], undefined);
  const kitDiag = incomplete.expected.diagnostics['kit.choice'];
  assert.ok(kitDiag);
  assert.deepEqual(
    kitDiag.map(d => [d.severity, d.code]),
    [['incomplete', 'required-choice-missing']],
  );
  assert.equal(incomplete.expected.partial?.staminaMaximum, undefined);
  assert.equal(incomplete.expected.partial?.speed?.value, 6);

  assert.equal(invalid.expected.status, 'invalid');
  assert.equal(invalid.expected.baseline, null);
  assert.deepEqual(invalid.input.selections['ancestry.devil.purchased-traits'], [
    'Impressive Horns',
    'Wings',
  ]);
  const horns = frontmatterText('en/unified/md/feature/trait/devil/impressive-horns.md', 'cost');
  const wings = frontmatterText('en/unified/md/feature/trait/devil/wings.md', 'cost');
  const budget = /You have (\d) ancestry points/.exec(
    source('en/unified/md/feature/trait/devil/devil-traits.md'),
  );
  assert.ok(budget);
  const cost = Number(horns.split(' ')[0]) + Number(wings.split(' ')[0]);
  assert.ok(cost > Number(budget[1]), `cost ${cost} exceeds budget ${budget[1]}`);
  const traitDiag = invalid.expected.diagnostics['ancestry.devil.purchased-traits'];
  assert.ok(traitDiag);
  assert.deepEqual(
    traitDiag.map(d => [d.severity, d.code]),
    [['invalid', 'budget-exceeded']],
  );
  assert.equal(invalid.expected.partial?.speed?.value, 5);
  assert.equal(invalid.expected.partial?.savingThrowThreshold?.value, 6);
  assert.equal(invalid.expected.partial?.staminaMaximum?.value, 30);
});

test('R02: the document states the example numbers and every question id the examples label', () => {
  const doc = readFileSync(join(root, file.document), 'utf8');
  for (const needle of [
    '| Stamina maximum | 30 |',
    '| Recoveries | 10 |',
    '| Recovery value | 10 |',
    '| Winded value | 15 |',
    '| Speed | 6 |',
    '| Stability | 2 |',
    '| Potency (weak / average / strong) | 0 / 1 / 2 |',
    '| Saving-throw threshold | 5 |',
  ])
    assert.ok(doc.includes(needle), `document lacks ${needle}`);
  const questions = readFileSync(join(root, 'docs/rules-questions-for-user.md'), 'utf8');
  const labels = new Set<string>();
  for (const example of Object.values(file.examples)) {
    for (const id of example.expected.baseline?.uncertainties ?? []) labels.add(id);
    for (const id of example.expected.partial?.uncertainties ?? []) labels.add(id);
  }
  for (const id of labels) {
    assert.ok(doc.includes(id), `document does not mention ${id}`);
    assert.ok(questions.includes(`### ${id}:`), `${id} missing from the questions file`);
  }
});
