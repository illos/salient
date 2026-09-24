// SPDX-License-Identifier: GPL-3.0-only
/** V67 uses the V64 corpus/readers; reporting never changes live resolution. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCorpus, readInputs, type AuditInputs } from './audit-ability-grammar.ts';
import { compileAbility, type CompileEnvelope } from '../shared/resolve/compileAbility.ts';
import type { Envelope } from '../shared/resolve/abilityGrammar.ts';

/** Supply source-declared flavor and parent context, never infer flavor from arbitrary italics. */
export function compilerEnvelope(envelope: Envelope, inputs: AuditInputs): CompileEnvelope {
  const entry = inputs.abilities.find(candidate => candidate.id === envelope.id);
  const manifest = inputs.manifest.compendium as { revision?: string } | undefined;
  const foe = inputs.foes.objects.find(candidate => candidate.id === envelope.id);
  const sourceRevision = foe?.source.revision ?? manifest?.revision;
  if (!sourceRevision) throw new Error(`Missing source revision for ${envelope.id}`);
  const parent = envelope.parent
    ? inputs.foes.objects.find(candidate => candidate.id === envelope.parent)
    : undefined;
  return {
    ...envelope,
    sourceRevision,
    ...(typeof entry?.structured.flavor === 'string'
      ? { declaredFlavor: [entry.structured.flavor] }
      : {}),
    ...(parent
      ? { parentContext: { id: parent.id, name: parent.name, fields: parent.fields } }
      : {}),
  };
}

export function compiledSupportReport(inputs: AuditInputs = readInputs()) {
  const source = inputs.manifest.compendium as { revision?: string } | undefined;
  if (
    !source?.revision ||
    inputs.foes.sourceRevision !== source.revision ||
    inputs.foes.objects.some(object => object.source.revision !== source.revision)
  )
    throw new Error(
      'Compiler report requires a consistent pinned Compendium and foe source revision.',
    );
  const corpus = buildCorpus(inputs);
  const entries = corpus.envelopes
    .map(envelope => {
      const compiled = compileAbility(compilerEnvelope(envelope, inputs));
      return {
        id: compiled.id,
        name: compiled.name,
        context: compiled.context,
        source: compiled.source,
        execution: compiled.execution,
        // V157: an ability without a power roll; absent for every other entry.
        ...(compiled.effectOnly ? { effectOnly: true as const } : {}),
        tiers: compiled.tiers,
        sections: compiled.sections,
        diagnostics: compiled.diagnostics,
        live: 'not-wired',
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const totals: Record<string, { total: number; supported: number; manual: number }> = {};
  for (const entry of entries) {
    const population = (totals[entry.context.corpus] ??= { total: 0, supported: 0, manual: 0 });
    population.total++;
    population[entry.execution]++;
  }
  return {
    generator: 'V67/1',
    contentHash: inputs.manifest.contentHash,
    sourceRevision: inputs.foes.sourceRevision,
    foesEdition: inputs.foes.edition,
    scope: 'Pure compilation only; no live execution migrated. Minions remain compile-only.',
    totals,
    entries,
  };
}

export function renderCompiledSupport(report: ReturnType<typeof compiledSupportReport>) {
  return (
    '# V67 pure compiler support\n\n' +
    report.scope +
    '\n\n' +
    `Source: \`${report.sourceRevision}\`; content: \`${report.contentHash}\`.\n\n` +
    '| Population | Discovered | Pure supported | Manual |\n| --- | --- | --- | --- |\n' +
    Object.entries(report.totals)
      .map(([name, count]) => `| ${name} | ${count.total} | ${count.supported} | ${count.manual} |`)
      .join('\n') +
    '\n\n' +
    '| Ability | Population | Pure execution | Diagnostics |\n| --- | --- | --- | --- |\n' +
    report.entries
      .map(
        entry =>
          `| ${entry.name.replaceAll('|', '\\|')} | ${entry.context.corpus} | ${entry.execution} | ${[...new Set(entry.diagnostics.map(d => d.code))].join(', ')} |`,
      )
      .join('\n') +
    '\n'
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = compiledSupportReport();
  const root = fileURLToPath(new URL('../', import.meta.url));
  const destination = join(root, process.argv[2] ?? 'docs/build/evidence/V67/support');
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(`${destination}.json`, JSON.stringify(report, null, 2) + '\n');
  writeFileSync(`${destination}.md`, renderCompiledSupport(report));
}
