// SPDX-License-Identifier: GPL-3.0-only
// A01 acceptance check 4: every grammar fixture in docs/research/table-command-syntax-cases.json
// parses (or is rejected) as the research recognizer specifies, and the cases that assert a tree
// match it exactly. Expected values come from the fixture file, not from running the parser.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  BindingError,
  ParseError,
  parseCommand,
  toEnvelope,
  tryParseCommand,
} from '../../shared/commands/parse';
import type { CommandTree } from '../../shared/commands/envelope';

interface Fixture {
  id: string;
  valid: boolean;
  input: string;
  expected?: CommandTree;
  note?: string;
}
const fixtures: Fixture[] = JSON.parse(
  readFileSync(
    new URL('../../docs/research/table-command-syntax-cases.json', import.meta.url),
    'utf8',
  ),
);

describe('grammar conformance fixtures', () => {
  for (const fixture of fixtures) {
    test(`${fixture.id}: ${fixture.valid ? 'accepted' : 'rejected'} ${JSON.stringify(fixture.input)}`, () => {
      if (fixture.valid) {
        const tree = parseCommand(fixture.input);
        expect(tree).toHaveProperty('path');
        if (fixture.expected) expect(tree).toEqual(fixture.expected);
      } else {
        expect(() => parseCommand(fixture.input)).toThrow(ParseError);
        const outcome = tryParseCommand(fixture.input);
        expect(outcome.ok).toBe(false);
        if (!outcome.ok) expect(outcome.error.offset).toBeGreaterThanOrEqual(0);
      }
    });
  }
});

describe('parsed shapes the fixtures describe in prose', () => {
  test('string escapes decode as JSON and quoted names keep their spelling', () => {
    expect(
      parseCommand('/table note text="A \\"quote\\", a \\\\ slash, and a\\nline"').arguments,
    ).toEqual({
      text: 'A "quote", a \\ slash, and a\nline',
    });
    expect(parseCommand('@"Élwin the Kind" /test roll characteristic=presence')).toEqual({
      actor: { name: 'Élwin the Kind' },
      path: ['test', 'roll'],
      arguments: { characteristic: { symbol: 'presence' } },
    });
    expect(parseCommand('/table note text="\\uD83D\\uDE00"').arguments).toEqual({ text: '😀' });
  });
  test('reserved words, references and numbers are distinguished inside collections', () => {
    expect(
      parseCommand(
        '/card respond card=@{interaction:c1} answer={"values":[true,false,null,[],{},-1.5,2e3,truex,@true]}',
      ).arguments,
    ).toEqual({
      card: { refKind: 'interaction', id: 'c1' },
      answer: {
        record: {
          values: [
            true,
            false,
            null,
            [],
            { record: {} },
            -1.5,
            2000,
            { symbol: 'truex' },
            { name: 'true' },
          ],
        },
      },
    });
    expect(parseCommand('@Thorn /resource adjust resource=clarity amount=-3').arguments).toEqual({
      resource: { symbol: 'clarity' },
      amount: -3,
    });
  });
  test('whitespace around "=" and at the ends is accepted; tabs count as whitespace', () => {
    expect(parseCommand(' \t@Thorn /test roll characteristic = might\t skill=climb ')).toEqual({
      actor: { name: 'Thorn' },
      path: ['test', 'roll'],
      arguments: { characteristic: { symbol: 'might' }, skill: { symbol: 'climb' } },
    });
  });
  test('diagnostics name the problem and its offset', () => {
    expect(() => parseCommand('/test roll edges=1 edges=2')).toThrow('Duplicate argument "edges"');
    expect(() => parseCommand('/card respond answer={"edges":1,"\\u0065dges":2}')).toThrow(
      'Duplicate record key "edges"',
    );
    expect(() => parseCommand('/ability use targets=[@Goblin5,]')).toThrow('position 31');
    expect(() => parseCommand('/test roll edges=1 extra')).toThrow('Path words cannot follow');
    expect(() => parseCommand('/table note text="\\uD800"')).toThrow('Unicode scalar');
    expect(() => parseCommand('/test roll edges=1e309')).toThrow('not representable');
  });
});

describe('lowering to the envelope', () => {
  test('the operation id is the dotted path and arguments keep their parsed shape', () => {
    const tree = parseCommand('@Thorn /table roll dice="2d10"');
    expect(
      toEnvelope(tree, { commandId: 'command-1', campaignId: 'campaign-1', expectedRevision: 3 }),
    ).toEqual({
      schemaVersion: 1,
      commandId: 'command-1',
      campaignId: 'campaign-1',
      operation: 'table.roll',
      actor: { name: 'Thorn' },
      arguments: { dice: '2d10' },
      expectedRevision: 3,
    });
    expect(
      toEnvelope(parseCommand('/session note text="Hi"'), { commandId: 'c', campaignId: 'k' }),
    ).not.toHaveProperty('expectedRevision');
  });
  test('the self-needs-binding fixture parses but cannot become an envelope', () => {
    const tree = parseCommand('@self /ability use');
    expect(tree.actor).toEqual({ selector: 'self' });
    expect(() => toEnvelope(tree, { commandId: 'c', campaignId: 'k' })).toThrow(BindingError);
  });
});
