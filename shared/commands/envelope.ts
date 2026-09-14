// SPDX-License-Identifier: GPL-3.0-only
/**
 * The structured invocation envelope shared by the parser, the Convex operations, the web console
 * and the CLI. Owning specification: docs/table-command-spec.md#structured-invocation-envelope.
 *
 * The authenticated issuer is never part of the client-supplied envelope; the mutation records it
 * from the authentication context (`RecordedEnvelope.issuerId`).
 */

/** A syntax-level reference as parsed from `@Name`, `@"Display Name"`, `@{kind:id}` or `@self`. */
export type Reference = { name: string } | { refKind: string; id: string } | { selector: 'self' };

/** A parsed argument value. Records and enum words are wrapped so they stay distinguishable from JSON. */
export type ParsedValue =
  | Reference
  | string
  | number
  | boolean
  | null
  | { symbol: string }
  | { record: Record<string, ParsedValue> }
  | ParsedValue[];

/** The syntax tree of one command; the shape asserted by the grammar conformance fixtures. */
export interface CommandTree {
  actor: Reference | null;
  path: string[];
  arguments: Record<string, ParsedValue>;
}

/** The envelope a client submits. Context is the campaign; the active session is resolved server-side. */
export interface CommandEnvelope {
  schemaVersion: 1;
  /** Caller-generated, once-only per issuer; a retry with identical content returns the same result. */
  commandId: string;
  campaignId: string;
  /** Stable operation id, `family.verb`. */
  operation: string;
  /** Explicit `@Character` actor when given; `@self` is not a valid actor prefix. */
  actor: Reference | null;
  arguments: Record<string, ParsedValue>;
  /** Active-session revision the caller saw; a mismatch is a stale submission. */
  expectedRevision?: number;
}

/** The envelope as recorded on the accepted event, with issuer and bound actor. */
export interface RecordedEnvelope extends CommandEnvelope {
  issuerId: string;
  boundActor: BoundActor | null;
}

/** A live actor the envelope's `@Character` reference resolved to. */
export interface BoundActor {
  kind: 'character' | 'foe';
  id: string;
  name: string;
}
