// SPDX-License-Identifier: GPL-3.0-only
/**
 * Parser for the accepted human command syntax: optional `@Character` actor, `/family verb` path and
 * named `key=value` arguments. Owning specification: docs/table-command-spec.md#accepted-human-syntax;
 * formal grammar and disambiguation rules: docs/research/table-command-grammar.md#formal-grammar.
 *
 * Parsing proves syntax only. Binding (does `@Thorn` exist, may the caller act for them), schema
 * validation and authority are shared execution checks in convex/lib/registry.ts. This module has no
 * dependencies so the same code runs in the Convex runtime, the browser and Node.
 */
import type { CommandEnvelope, CommandTree, ParsedValue, Reference } from './envelope.ts';

/** A syntax error with the offset (in UTF-16 code units) where it was detected. */
export class ParseError extends Error {
  constructor(
    message: string,
    readonly offset: number,
  ) {
    super(`${message} at position ${offset}.`);
    this.name = 'ParseError';
  }
}

const KEY = /^[a-z][a-z0-9-]*/;
const REFNAME = /^[A-Za-z][A-Za-z0-9_-]*/;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_:./-]*/;
const NUMBER = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/;

class Reader {
  i = 0;
  constructor(readonly s: string) {}
  fail(why: string): never {
    throw new ParseError(why, this.i);
  }
  /** Skips horizontal whitespace; reports whether any was present. */
  ws(): boolean {
    const start = this.i;
    while (this.i < this.s.length && (this.s[this.i] === ' ' || this.s[this.i] === '\t')) this.i++;
    return this.i > start;
  }
  at(text: string): boolean {
    return this.s.startsWith(text, this.i);
  }
  lit(text: string): void {
    if (!this.at(text)) this.fail(`Expected "${text}"`);
    this.i += text.length;
  }
  token(pattern: RegExp, what: string): string {
    const match = pattern.exec(this.s.slice(this.i));
    if (!match) this.fail(`Expected ${what}`);
    this.i += match[0].length;
    return match[0];
  }
  /** A JSON string (RFC 8259 section 7): no literal control characters, valid escapes, paired surrogates. */
  string(): string {
    if (!this.at('"')) this.fail('Expected a double-quoted string');
    let j = this.i + 1;
    for (;;) {
      if (j >= this.s.length) this.fail('Unterminated string');
      const code = this.s.charCodeAt(j);
      if (code < 0x20) this.fail('Strings cannot contain literal control characters');
      if (this.s[j] === '\\') {
        j += 2;
        continue;
      }
      if (this.s[j] === '"') break;
      j++;
    }
    let value: unknown;
    try {
      value = JSON.parse(this.s.slice(this.i, j + 1));
    } catch {
      this.fail('Invalid JSON string escape');
    }
    if (typeof value !== 'string') this.fail('Expected a string');
    for (let k = 0; k < value.length; k++) {
      const unit = value.charCodeAt(k);
      if (unit >= 0xd800 && unit <= 0xdbff) {
        const next = value.charCodeAt(k + 1);
        if (!(next >= 0xdc00 && next <= 0xdfff)) this.fail('Invalid Unicode scalar sequence');
        k++;
      } else if (unit >= 0xdc00 && unit <= 0xdfff) this.fail('Invalid Unicode scalar sequence');
    }
    this.i = j + 1;
    return value;
  }
  reference(): Reference {
    this.lit('@');
    if (this.at('{')) {
      this.i++;
      const refKind = this.token(KEY, 'a reference kind');
      this.lit(':');
      const id = this.token(OPAQUE_ID, 'a reference id');
      this.lit('}');
      return { refKind, id };
    }
    if (this.at('"')) return { name: this.string() };
    const name = this.token(REFNAME, 'a reference name');
    return name === 'self' ? { selector: 'self' } : { name };
  }
  value(): ParsedValue {
    if (this.i >= this.s.length) this.fail('Expected a value');
    const c = this.s[this.i]!;
    if (c === '@') return this.reference();
    if (c === '"') return this.string();
    if (c === '[') {
      this.i++;
      this.ws();
      const out: ParsedValue[] = [];
      if (this.at(']')) {
        this.i++;
        return out;
      }
      for (;;) {
        out.push(this.value());
        this.ws();
        if (this.at(']')) {
          this.i++;
          return out;
        }
        this.lit(',');
        this.ws();
      }
    }
    if (c === '{') {
      this.i++;
      this.ws();
      const record: Record<string, ParsedValue> = {};
      if (this.at('}')) {
        this.i++;
        return { record };
      }
      for (;;) {
        const keyOffset = this.i;
        const key = this.string();
        this.ws();
        this.lit(':');
        this.ws();
        if (Object.hasOwn(record, key))
          throw new ParseError(`Duplicate record key "${key}"`, keyOffset);
        record[key] = this.value();
        this.ws();
        if (this.at('}')) {
          this.i++;
          return { record };
        }
        this.lit(',');
        this.ws();
      }
    }
    if ((c >= '0' && c <= '9') || c === '-') {
      const text = this.token(NUMBER, 'a number');
      const number = Number(text);
      if (!Number.isFinite(number)) this.fail('Number is not representable');
      return number;
    }
    const word = this.token(REFNAME, 'a value');
    if (word === 'true') return true;
    if (word === 'false') return false;
    if (word === 'null') return null;
    return { symbol: word };
  }
  command(): CommandTree {
    this.ws();
    let actor: Reference | null = null;
    if (this.at('@')) {
      actor = this.reference();
      if (!this.ws()) this.fail('Expected a space after the actor');
    }
    this.lit('/');
    const path = [this.token(KEY, 'a command path')];
    const args: Record<string, ParsedValue> = {};
    let started = false;
    while (this.i < this.s.length) {
      if (!this.ws()) this.fail('Expected a space before the next argument or path word');
      if (this.i === this.s.length) break;
      const wordOffset = this.i;
      const word = this.token(KEY, 'an argument name or path word');
      const after = this.i;
      this.ws();
      if (this.at('=')) {
        started = true;
        this.i++;
        this.ws();
        if (Object.hasOwn(args, word))
          throw new ParseError(`Duplicate argument "${word}"`, wordOffset);
        args[word] = this.value();
      } else {
        if (started) throw new ParseError('Path words cannot follow arguments', wordOffset);
        path.push(word);
        this.i = after;
      }
    }
    return { actor, path, arguments: args };
  }
}

/** Parses one command. Throws `ParseError`; never executes or binds anything. */
export function parseCommand(text: string): CommandTree {
  return new Reader(text).command();
}

/** Result of a non-throwing parse for input surfaces that show diagnostics. */
export type ParseOutcome = { ok: true; tree: CommandTree } | { ok: false; error: ParseError };

export function tryParseCommand(text: string): ParseOutcome {
  try {
    return { ok: true, tree: parseCommand(text) };
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, error };
    throw error;
  }
}

/** Binding-level check the grammar reserves: `@self` cannot select the actor it depends on. */
export class BindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BindingError';
  }
}

/**
 * Lowers a syntax tree into the invocation envelope. Arguments keep their parsed shape; the operation's
 * schema interprets them. The operation id is the path joined with dots (`session.note`).
 */
export function toEnvelope(
  tree: CommandTree,
  context: { commandId: string; campaignId: string; expectedRevision?: number },
): CommandEnvelope {
  if (tree.actor && 'selector' in tree.actor)
    throw new BindingError('@self cannot be the actor: self resolves to the acting character.');
  return {
    schemaVersion: 1,
    commandId: context.commandId,
    campaignId: context.campaignId,
    operation: tree.path.join('.'),
    actor: tree.actor,
    arguments: tree.arguments,
    ...(context.expectedRevision === undefined
      ? {}
      : { expectedRevision: context.expectedRevision }),
  };
}
