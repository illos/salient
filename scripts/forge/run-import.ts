// SPDX-License-Identifier: GPL-3.0-only
/**
 * V182 runner: builds the Forge level-two and level-three heroes of every class, asks the pinned
 * Forge logic whether each active choice is made, and imports each file with Salient's adapter,
 * comparing the imported class and kit decisions with the ledger selections the hero was built
 * from. Run from the repository root through the bundler, which executes and then deletes the
 * bundle: `SALIENT_FORGE_OUTPUT=<dir> SALIENT_FORGE_FAMILY=import node scripts/forge/build.mjs`.
 * Only summary.json is written to SALIENT_FORGE_OUTPUT; the heroes are not. With
 * SALIENT_FORGE_FIXTURE_DIR set, each hero is written gzipped, with a manifest, as the retained
 * fixtures of tests/forge-import-levels.test.ts (tests/fixtures/v182-forge/).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { FeatureLogic } from '@/logic/feature-logic';
import { HeroLogic } from '@/logic/hero-logic';
import { SourcebookLogic } from '@/logic/sourcebook-logic';
import { getDefinitions } from '../../shared/content/character-decisions.ts';
import { importForgeText } from '../../shared/interchange/forge-steel/import.ts';
import { featureRules, ruleKey } from '../../shared/interchange/forge-steel/mappings.ts';
import { resolveName } from '../../shared/interchange/forge-steel/names.ts';
import { createImportWitnesses, sourcebooks } from './import-witnesses.ts';

const output = process.env.SALIENT_FORGE_OUTPUT;
if (!output) throw new Error('Missing artifact directory');
const fixtures = process.env.SALIENT_FORGE_FIXTURE_DIR;
if (fixtures) mkdirSync(fixtures, { recursive: true });
console.error = () => {
  throw new Error('Forge reported an internal error; witness refused');
};

const classKeys = (selections: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(selections)
      .filter(([key]) => /^(class|kit)\./.test(key))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(Array.isArray(a) ? [...a].sort() : a) ===
  JSON.stringify(Array.isArray(b) ? [...b].sort() : b);

const results = createImportWitnesses().map(witness => {
  const text = JSON.stringify(witness.hero, null, 2) + '\n';
  const file = `${witness.id}.ds-hero`;
  if (fixtures) writeFileSync(join(fixtures, `${file}.gz`), gzipSync(text, { level: 9 }));
  const outstanding = HeroLogic.getFeatures(witness.hero)
    .map(entry => entry.feature)
    .filter(
      feature =>
        FeatureLogic.isChoice(feature) &&
        !(feature.data && 'selectAt' in feature.data && feature.data.selectAt === 'play') &&
        !FeatureLogic.isChosen(feature, witness.hero, sourcebooks),
    )
    .map(feature => `${feature.id} (${feature.type})`);
  const imported = importForgeText(text);
  const expected = classKeys(witness.selections);
  const actual = classKeys(imported.selections);
  const missing = Object.keys(expected).filter(key => !sameValue(expected[key], actual[key]));
  const extra = Object.keys(actual).filter(key => !(key in expected));
  return {
    id: witness.id,
    file,
    sha256: createHash('sha256').update(text).digest('hex'),
    bytes: Buffer.byteLength(text),
    level: imported.level,
    forgeOutstanding: outstanding,
    builderUnfilled: witness.unfilled,
    mappedClassDecisions: Object.keys(expected).length - missing.length,
    ledgerClassDecisions: Object.keys(expected).length,
    missing: missing.map(key => ({ key, ledger: expected[key], imported: actual[key] ?? null })),
    extra,
    diagnostics: imported.diagnostics.filter(d => d.path.startsWith('class')),
  };
});
/**
 * Name coverage: every option the pinned Forge offers for a mapped class choice (not only the ones
 * the ledgers pick) must resolve to one of the Salient decision's values, or the import of that
 * option would be a diagnostic.
 */
const definitions = getDefinitions(3);
const salientValues = (id: string): string[] | null => {
  const decision = definitions.steps.flatMap(step => step.decisions).find(row => row.id === id);
  if (!decision) return null;
  const pools = (ids: string | string[]) =>
    [ids].flat().flatMap(pool => definitions.pools[pool]?.values ?? []);
  if (decision.options) return decision.options.map(option => option.value);
  if (decision.optionsFrom) return pools(decision.optionsFrom);
  if (decision.optionsByParent)
    return Object.values(decision.optionsByParent).flatMap(row => [
      ...(row.values ?? []),
      ...pools(row.optionsFrom ?? []),
    ]);
  return null;
};
const kitNames = SourcebookLogic.getKits(sourcebooks).map(kit => kit.name);
const coverage: { rule: string; decision: string; unresolved: string[] }[] = [];
for (const heroClass of SourcebookLogic.getClasses(sourcebooks)) {
  const branches = [
    { scope: `class:${heroClass.id}`, rows: heroClass.featuresByLevel },
    ...heroClass.subclasses.map(subclass => ({
      scope: `class:${heroClass.id}/${subclass.id}`,
      rows: subclass.featuresByLevel,
    })),
  ];
  const allAbilities = [
    ...heroClass.abilities,
    ...heroClass.subclasses.flatMap(subclass => subclass.abilities),
  ];
  for (const branch of branches)
    for (const row of branch.rows.filter(r => r.level <= 3))
      for (const feature of row.features) {
        const key = ruleKey(`${branch.scope}@${row.level}`, feature.id);
        const rule = featureRules[key];
        if (rule?.kind !== 'decision' || rule.ids) continue;
        const allowed = salientValues(rule.decision);
        if (!allowed) continue;
        const data = feature.data as Record<string, unknown>;
        let names: string[];
        if (feature.type === 'Choice')
          names = (data.options as { feature: { name: string } }[]).map(o => o.feature.name);
        else if (feature.type === 'Summon Choice')
          names = (data.options as { name: string }[]).map(o => o.name);
        else if (feature.type === 'Kit') names = kitNames;
        else if (feature.type === 'Class Ability')
          names = allAbilities.filter(a => a.cost === data.cost).map(a => a.name);
        else continue;
        // Kits and cost pools span options Salient scopes elsewhere; only names with no loose
        // counterpart at all are reported for them.
        const unresolved = names.filter(name => resolveName(name, allowed) === null);
        const scoped = feature.type === 'Kit' || feature.type === 'Class Ability';
        if (unresolved.length)
          coverage.push({
            rule: key,
            decision: rule.decision,
            unresolved: scoped ? unresolved.map(name => `${name} (pool)`) : unresolved,
          });
      }
}
const summary = {
  family: 'import',
  coverage,
  forgeRevision: '5a846aadb623a9855a023e9403bb887a956c341f',
  heroes: results.length,
  results,
};
writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
if (fixtures)
  writeFileSync(
    join(fixtures, 'manifest.json'),
    JSON.stringify(
      {
        schemaVersion: 'v182-forge-built-1',
        kind: 'Forge-built from pinned definitions (not Forge UI exports)',
        forgeVendorRevision: summary.forgeRevision,
        generator:
          'SALIENT_FORGE_FIXTURE_DIR=tests/fixtures/v182-forge SALIENT_FORGE_FAMILY=import node scripts/forge/build.mjs',
        template: 'tests/fixtures/v45-reference/Grug-level-2.ds-hero (ancestry, culture, career)',
        selections: 'tests/fixtures/level-three-builds.ts',
        heroes: results.map(({ id, file, sha256, bytes, forgeOutstanding }) => ({
          id,
          path: `tests/fixtures/v182-forge/${file}.gz`,
          sha256,
          bytes,
          forgeOutstanding,
        })),
      },
      null,
      2,
    ) + '\n',
  );
console.log(JSON.stringify(summary, null, 2));
