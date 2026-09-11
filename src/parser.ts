import type { AbilitySource, Characteristic, EffectDefinition, Expression, ParsedAbility } from './contracts.ts';

/** Remove display markup only. Never evaluate expressions or follow links. */
export function plain(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^\n)]*\)/g, '$1').replace(/\*\*/g, '').replace(/[−–]/g, '-').trim();
}
function expression(text: string): Expression | undefined {
  const value = plain(text);
  if (/^\d+$/.test(value) && Number.isSafeInteger(Number(value))) return { constant: Number(value) };
  const names: Record<string, Characteristic> = { Might: 'M', Agility: 'A', Reason: 'R', Intuition: 'I', Presence: 'P' };
  if (names[value]) return { constant: 0, characteristic: names[value] };
  if (/^[MARIP]$/.test(value)) return { constant: 0, characteristic: value as Characteristic };
  const match = /^(\d+)\s*\+\s*([MARIP])$/.exec(value);
  if (match && Number.isSafeInteger(Number(match[1]))) return { constant: Number(match[1]), characteristic: match[2] as Characteristic };
  return undefined;
}
function effect(text: string): EffectDefinition | undefined {
  const value = plain(text);
  const damage = /^(.*?) (?:(acid|cold|corruption|fire|holy|lightning|poison|psychic|sonic) )?damage$/.exec(value);
  if (damage) {
    const amount = expression(damage[1]);
    if (amount) return { kind: 'damage', amount, ...(damage[2] ? { damageType: damage[2] } : {}) };
  }
  const push = /^push (\d+)$/.exec(value);
  if (push && Number.isSafeInteger(Number(push[1]))) return { kind: 'push', distance: Number(push[1]) };
  const condition = /^([MARIP]) < (-?\d+),? (bleeding|dazed|frightened|grabbed|prone|restrained|slowed|taunted|weakened) \((save ends|EoT)\)$/.exec(value);
  if (condition && Number.isSafeInteger(Number(condition[2]))) return { kind: 'condition', characteristic: condition[1] as Characteristic, threshold: Number(condition[2]), condition: condition[3], duration: condition[4] };
  return undefined;
}

/** Unknown mechanical text blocks automation; recognized fragments remain inspectable. */
export function parseAbility(source: AbilitySource): ParsedAbility {
  const result: ParsedAbility = { source, tiers: [[], [], []], diagnostics: [] };
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source.text);
  const body = source.text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  if (frontmatter) {
    const declaredCost = /^cost: (.+)$/m.exec(frontmatter[1])?.[1].replace(/^['"]|['"]$/g, '');
    if (plain(declaredCost ?? '') !== plain(source.cost ?? '')) result.diagnostics.push('Structured cost differs from full text frontmatter.');
  }
  let rollText: string | undefined;
  const tierTexts: (string | undefined)[] = [undefined, undefined, undefined];
  let headerRows = 0;
  let started = false;
  for (const original of body.split(/\r?\n/)) {
    const unquoted = original.replace(/^> ?/, '').trim();
    if (!unquoted) continue;
    // Initial italic paragraph is the source format's nonmechanical flavor field.
    if (!started && /^\*[^*]+\*$/.test(unquoted)) { started = true; continue; }
    const line = plain(unquoted);
    const title = line.replace(/^[^\p{L}\p{N}]+/u, '');
    if (!started && (title === source.name || title.startsWith(`${source.name} (`))) {
      const expected = source.cost ? `${source.name} (${plain(source.cost)})` : `${source.name} (Signature Ability)`;
      if (title !== expected && !(title === source.name && !source.cost)) result.diagnostics.push('Ability title contains unsupported or inconsistent cost/mechanics.');
      started = true; continue;
    }
    started = true;
    if (/^\|[-:|\s]+\|$/.test(line)) continue;
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      const expectedKeywords = source.keywords.map(plain).join(', ') || '-';
      if (cells.length === 2 && cells[0] === expectedKeywords && cells[1] === plain(source.usage) && headerRows === 0) { headerRows++; continue; }
      if (cells.length === 2 && cells[0] === `📏 ${plain(source.distance)}` && cells[1] === `🎯 ${plain(source.target)}` && headerRows === 1) { headerRows++; continue; }
      result.diagnostics.push(`Unsupported or inconsistent table row: ${line}`);
      continue;
    }
    const roll = /^Power Roll \+ (.+):$/.exec(line);
    if (roll) {
      if (rollText !== undefined) result.diagnostics.push('Multiple power rolls require manual resolution.');
      rollText = `Power Roll + ${roll[1]}`;
      result.roll = expression(roll[1]);
      if (!result.roll) result.diagnostics.push(`Unsupported roll expression: ${roll[1]}`);
      continue;
    }
    const tier = /^- (≤11|12-16|17\+): (.+)$/.exec(line);
    if (tier) {
      const index = ['≤11', '12-16', '17+'].indexOf(tier[1]);
      if (tierTexts[index] !== undefined) result.diagnostics.push(`Duplicate tier ${index + 1}.`);
      tierTexts[index] = tier[2];
      for (const clause of tier[2].split(';')) {
        const parsed = effect(clause);
        if (parsed) result.tiers[index].push(parsed);
        else result.diagnostics.push(`Unsupported tier ${index + 1} clause: ${clause.trim()}`);
      }
      continue;
    }
    result.diagnostics.push(`Unsupported body text: ${line}`);
  }
  if (headerRows !== 2) result.diagnostics.push('Missing or inconsistent ability header.');
  if (!rollText || tierTexts.some(tier => tier === undefined)) result.diagnostics.push('Requires one power roll and all three outcome tiers.');
  if (source.roll && plain(source.roll) !== rollText) result.diagnostics.push('Structured roll differs from full text.');
  if (source.tiers && source.tiers.some((tier, index) => plain(tier) !== tierTexts[index])) result.diagnostics.push('Structured tiers differ from full text.');
  if (source.cost) {
    const cost = /^(\d+) (Ferocity|Malice)$/.exec(plain(source.cost));
    if (cost && Number.isSafeInteger(Number(cost[1]))) result.cost = { resource: cost[2].toLowerCase(), amount: Number(cost[1]) };
    else result.diagnostics.push(`Unsupported resource cost: ${source.cost}`);
  }
  return result;
}
