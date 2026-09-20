// SPDX-License-Identifier: GPL-3.0-only
/** Printed kit/perk ability fields shared by the character sheet and table operations.
 * This extracts source facts; it does not interpret or execute an effect or power roll.
 */
export interface EmbeddedAbilityMetadata {
  actionType: string;
  keywords: string[];
  distance: string;
  target: string;
  roll?: string;
  tiers?: [string, string, string];
  trigger?: string;
  effects?: { label: string; text: string }[];
}

export type EmbeddedAbilityResult =
  | { ok: true; text: string; metadata: EmbeddedAbilityMetadata }
  | { ok: false; name: string; reason: 'missing-section' | 'missing-header' };

const unquote = (line: string) => line.replace(/^(?:\s*>\s?)+/, '');
const plain = (text: string) =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim();

/** Exact named heading only: a missing signature must never fall back to its whole kit/perk. */
export function extractEmbeddedAbility(text: string, name: string): EmbeddedAbilityResult {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => unquote(line).trim() === `###### ${name}`);
  if (start < 0) return { ok: false, name, reason: 'missing-section' };
  const quoted = /^\s*>/.test(lines[start]!);
  let end = start + 1;
  for (; end < lines.length; end++) {
    const line = lines[end]!;
    if (/^#{1,6}\s/.test(unquote(line))) break;
    // A following paragraph outside the source callout is not part of its ability.
    if (quoted && line.trim() && !/^\s*>/.test(line)) break;
  }
  const section = lines.slice(start, end);
  const parsed = section.map(unquote);
  const rows = parsed.filter(line => line.startsWith('|')).map(line => plain(line).split('|'));
  const header = rows[0]?.map(cell => cell.trim());
  const target = rows.find(row => row.some(cell => cell.includes('🎯')))?.map(cell => cell.trim());
  if (!header?.[2] || !target?.[1] || !target?.[2])
    return { ok: false, name, reason: 'missing-header' };
  const roll = parsed
    .map(plain)
    .find(line => line.startsWith('Power Roll + '))
    ?.replace(/:$/, '');
  const tiers = ['≤11', '12-16', '17+'].map(label => {
    const line = parsed.find(value => plain(value).startsWith(`- ${label}:`));
    return line?.replace(/^[- ]*\*\*[^*]+\*\*\s*/, '').trim();
  });
  const effects: { label: string; text: string }[] = [];
  let trigger: string | undefined;
  for (let index = 0; index < parsed.length; index++) {
    const match = /^\*\*(Effect|Trigger):\*\*\s*(.*)$/.exec(parsed[index]!);
    if (!match) continue;
    const body = [match[2]!];
    while (
      index + 1 < parsed.length &&
      !/^\*\*[^*]+:\*\*/.test(parsed[index + 1]!) &&
      !parsed[index + 1]!.startsWith('|')
    )
      body.push(parsed[++index]!);
    const value = body.join('\n').trim();
    if (match[1] === 'Trigger') trigger = value;
    else effects.push({ label: 'Effect', text: value });
  }
  return {
    ok: true,
    text: section.join('\n').trim(),
    metadata: {
      actionType: header[2],
      keywords: (header[1] ?? '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean),
      distance: target[1].replace(/^📏\s*/, ''),
      target: target[2].replace(/^🎯\s*/, ''),
      ...(roll ? { roll } : {}),
      ...(tiers.every(tier => tier !== undefined)
        ? { tiers: tiers as [string, string, string] }
        : {}),
      ...(trigger ? { trigger } : {}),
      ...(effects.length ? { effects } : {}),
    },
  };
}
