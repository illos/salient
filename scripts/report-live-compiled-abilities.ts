// SPDX-License-Identifier: GPL-3.0-only
/** V72 capability report: pure recognition and actual grant/loading reachability are separate. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCorpus, readInputs, type AuditInputs } from './audit-ability-grammar.ts';
import { compiledSupportReport } from './report-compiled-abilities.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
/**
 * Current public loading boundary, not a rules dispatch or per-ability approval list: since V02
 * every seeded stat block loads (ordinary foes through `foe.add`, minions through `squad.add`, whose
 * members use abilities individually through the same ability operations).
 */
const manifest = JSON.parse(
  readFileSync(join(root, 'shared/content/compendium/manifest.json'), 'utf8'),
) as { entries: { id: string; kind: string }[] };
const loadableFoes = new Set(
  manifest.entries.filter(entry => entry.kind === 'statblock').map(entry => entry.id),
);
const commonActions = new Set([
  'mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike',
  'mcdm.heroes.v1/feature.ability.common/ranged-weapon-free-strike',
]);

export function liveCompiledSupportReport(inputs: AuditInputs = readInputs()) {
  const corpus = buildCorpus(inputs);
  const pure = compiledSupportReport(inputs);
  const entries = pure.entries.map(entry => {
    const grants = corpus.grantsByEnvelope.get(entry.id) ?? [];
    const reachable =
      (['hero-standalone', 'kit-signature', 'granted'].includes(entry.context.corpus) &&
        (commonActions.has(entry.id) || grants.some(g => g.selectable === 'selectable'))) ||
      (entry.context.corpus === 'foe-ability' && loadableFoes.has(entry.context.parent ?? ''));
    const manualBeastheart = entry.id.startsWith('mcdm.beastheart.v1/');
    const boundary = manualBeastheart
      ? 'Explicit Beastheart/companion manual record; shared Ferocity payment only. Companion combat and turn integration deferred.'
      : entry.context.corpus === 'kit-signature'
        ? 'Unchanged kit signatures retain A05 compatibility.'
        : !reachable
          ? 'No current standalone grant or public ordinary-foe loading path.'
          : entry.execution === 'supported'
            ? 'Compiled damage and ordered manual instructions through registered ability operations.'
            : 'Unchanged bundled source retains explicitly manual A05 compatibility; changed source is refused automation.';
    return {
      ...entry,
      live: reachable
        ? entry.execution === 'supported' && !manualBeastheart
          ? 'compiled'
          : 'legacy-compatibility'
        : 'not-reachable',
      boundary,
      grants,
      movementFacts: entry.tiers.some(nodes => nodes.some(node => node.kind === 'push'))
        ? 'Known precise sizes/stability; final movement coverage remains explicit missing/manual work.'
        : 'No compiled push.',
    };
  });
  return {
    ...pure,
    generator: 'V72/1',
    scope:
      'Structural support, current grant/loading availability and live execution are separate. Source drift never silently falls back; historical results are never recompiled on read.',
    liveCounts: {
      compiled: entries.filter(e => e.live === 'compiled').length,
      compatibility: entries.filter(e => e.live === 'legacy-compatibility').length,
      compiledButUnavailable: entries.filter(
        e => e.execution === 'supported' && e.live === 'not-reachable',
      ).length,
    },
    entries,
  };
}
export function renderLiveCompiledSupport(report: ReturnType<typeof liveCompiledSupportReport>) {
  return (
    '# V72 live compiled ability support\n\n' +
    report.scope +
    '\n\n' +
    `Source: \`${report.sourceRevision}\`; content: \`${report.contentHash}\`.\n\n` +
    `Currently reachable compiled: ${report.liveCounts.compiled}; unchanged reachable compatibility: ${report.liveCounts.compatibility}; structurally supported but unavailable: ${report.liveCounts.compiledButUnavailable}.\n\n` +
    '| Ability | Population | Pure execution | Live boundary | Diagnostics |\n| --- | --- | --- | --- | --- |\n' +
    report.entries
      .map(
        e =>
          `| ${e.name.replaceAll('|', '\\|')} | ${e.context.corpus} | ${e.execution} | ${e.live} | ${[...new Set(e.diagnostics.map(d => d.code))].join(', ')} |`,
      )
      .join('\n') +
    '\n'
  );
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // Detect a changed loader boundary instead of silently retaining obsolete report availability.
  const loader = readFileSync(join(root, 'convex/lib/foeOperations.ts'), 'utf8');
  const source = readFileSync(join(root, 'convex/lib/foeSource.ts'), 'utf8');
  if (
    !loader.includes('requireStatBlock(ctx, String(args.definition))') ||
    !source.includes('export async function requireStatBlock')
  )
    throw new Error(
      'Public foe loading boundary changed; update report reachability from that loader.',
    );
  const report = liveCompiledSupportReport();
  const checking = process.argv.includes('--check');
  const destination = join(
    root,
    process.argv.slice(2).find(arg => arg !== '--check') ?? 'docs/build/evidence/V72/support',
  );
  const outputs = {
    json: JSON.stringify(report, null, 2) + '\n',
    md: renderLiveCompiledSupport(report),
  };
  if (checking) {
    for (const [extension, expected] of Object.entries(outputs))
      if (readFileSync(`${destination}.${extension}`, 'utf8') !== expected)
        throw new Error(
          `Stale V72 report ${extension}; regenerate and inspect changed live eligibility before migration.`,
        );
    console.log(
      'V72 support report matches current source, grammar and grant/loading reachability.',
    );
  } else {
    mkdirSync(dirname(destination), { recursive: true });
    for (const [extension, content] of Object.entries(outputs))
      writeFileSync(`${destination}.${extension}`, content);
  }
}
