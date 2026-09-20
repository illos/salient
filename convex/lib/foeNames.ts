// SPDX-License-Identifier: GPL-3.0-only
import manifest from '../../shared/content/compendium/manifest.json';

// Source paths, not the separate browser catalog, establish a parent for organization-less parts.
const statblocksByPath = new Map(
  manifest.entries.filter(row => row.kind === 'statblock').map(row => [row.sourcePath, row]),
);

export function foeDisplayName(entry: {
  name: string;
  sourcePath: string;
  structured: unknown;
}): string {
  const organization = (entry.structured as Record<string, unknown> | null)?.organization;
  if (typeof organization === 'string' && organization) return entry.name;
  const family = /^(.*\/md\/monster\/([^/]+)\/statblock\/)[^/]+\.md$/.exec(entry.sourcePath);
  if (!family) return entry.name;
  const parent = statblocksByPath.get(`${family[1]}${family[2]}.md`);
  return parent && parent.sourcePath !== entry.sourcePath
    ? `${parent.name}: ${entry.name}`
    : entry.name;
}
