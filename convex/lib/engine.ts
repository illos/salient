// SPDX-License-Identifier: GPL-3.0-only
/**
 * Engine adapter: the application service calls the pure TypeScript engine in `src/` in-process,
 * inside the mutation that will commit the accepted outcome. Projections of live entities go in,
 * a structured `Resolution` comes out; the adapter never generates dice (S02's shared dice operation
 * supplies faces before the call) and never touches the database.
 *
 * Owning specifications: docs/engine-architecture.md#app-backend (placement, recorded as an
 * implementation note), #proposed-boundaries (engine independent of storage and authentication),
 * #standalone-engine-and-portability (TypeScript; in-process library is one delivery mechanism).
 * No registered operation uses this adapter yet; A05 is the first slice with mechanical meaning.
 */
import { applyManual, resolveAbility } from '../../src/engine.ts';
import type {
  AbilityCommand,
  GameState,
  ManualCommand,
  ParsedAbility,
  Resolution,
} from '../../src/contracts.ts';

/** Recorded with accepted resolutions so history names the engine that produced them. */
export const ENGINE = {
  module: 'src/engine.ts',
  language: 'typescript',
  placement: 'in-process',
} as const;

export type EngineRequest =
  | { kind: 'use-ability'; state: GameState; ability: ParsedAbility; command: AbilityCommand }
  | { kind: 'manual'; state: GameState; command: ManualCommand };

/** Pure and synchronous: the same inputs give the same resolution in Convex, Node or a browser. */
export function evaluate(request: EngineRequest): Resolution {
  return request.kind === 'use-ability'
    ? resolveAbility(request.state, request.ability, request.command)
    : applyManual(request.state, request.command);
}
