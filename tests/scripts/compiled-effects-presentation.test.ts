// SPDX-License-Identifier: GPL-3.0-only
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import type { CompiledPushOutcome } from '../../shared/resolve/compiledOutcome';
import type { Id } from '../../convex/_generated/dataModel';
import { CompiledEffects } from '../../web/table/targeting';

vi.mock('../../web/rules/link', () => ({ RuleLink: () => null }));
vi.mock('convex/react', () => ({ useMutation: () => vi.fn(), useQuery: vi.fn() }));
vi.mock('../../web/ui', () => ({ useCommand: () => ({ pending: false, run: vi.fn() }) }));

const push: CompiledPushOutcome = {
  kind: 'push',
  nodeId: 'tier-1-push',
  targetId: 'foe:original',
  locator: 'tier:1:1',
  clause: 'push 2',
  status: 'fact-needed',
  after: 'tier-1-damage',
  printed: 2,
  sizeBonus: 1,
  subtotal: 3,
  stability: 0,
  stabilityReduction: 'optional',
  requirements: ['actor.traits', 'target:foe:original.modifiers'],
  manualReasons: [],
  instruction: 'Ordinary push: away from the source. No route or destination is established.',
  manualScope: ['Actual movement', 'Paths and collisions'],
  rulePaths: ['movement/forced-movement.md'],
};
function render(
  effect: CompiledPushOutcome,
  options: { resolved?: boolean; mayResolve?: boolean; targetId?: string } = {},
) {
  const compiled: PublicCompiledResult = {
    version: 1,
    revision: 'corrected-event',
    // Presentation only consumes the selected source location, never its private input snapshot.
    definition: {
      source: { path: 'feature/ability/brutal-slam.md' },
    } as PublicCompiledResult['definition'],
    effects: [
      {
        id: '["use","node","foe:original","corrected-event"]',
        useEventId: 'use',
        revision: 'corrected-event',
        effect,
        ...(options.resolved
          ? { disposition: { eventId: 'disposition', note: 'Chose zero movement' } }
          : {}),
      },
    ],
  };
  return renderToStaticMarkup(
    createElement(CompiledEffects, {
      campaignId: 'campaign' as Id<'campaigns'>,
      eventId: 'use' as Id<'events'>,
      compiled,
      targets: [
        {
          originalTargetId: options.targetId ?? 'foe:original',
          target: { kind: 'foe', id: 'restored', name: 'Goblin' },
        },
      ],
      mayResolve: options.mayResolve ?? false,
    }),
  );
}
describe('saved compiled effect presentation without a browser', () => {
  it('keeps incomplete movement a subtotal and retains gaps after manual disposition', () => {
    const html = render(push, { resolved: true, mayResolve: true });
    expect(html).toContain('Subtotal 3; final allowance not established.');
    expect(html).not.toContain('Allowance 3 before');
    expect(html).toContain('actor.traits; target:foe:original.modifiers');
    expect(html).toContain('Optional stability reduction: 0');
    expect(html).toContain('Chose zero movement');
    expect(html).toContain('feature/ability/brutal-slam.md');
    expect(html).toContain('tier:1:1');
    expect(html).not.toContain('<button');
  });
  it('shows an established allowance only when present in the saved result', () => {
    const html = render({ ...push, status: 'instruction', allowance: 3, requirements: [] });
    expect(html).toContain('Allowance 3 before optional stability reduction.');
    expect(html).not.toContain('Subtotal');
    expect(html).toContain('Physical movement remains manual.');
    expect(html).not.toContain('<button');
  });
  it('uses the original occurrence and effective restored target only for an allowed disposition', () => {
    const html = render(push, { mayResolve: true });
    expect(html).toContain('target=@{foe:restored}');
    expect(html).toContain('occurrence=');
    expect(html).toContain('foe:original');
    expect(html).not.toContain('clause=');
    expect(html).toContain('<button');
    expect(render(push, { mayResolve: true, targetId: 'foe:different' })).not.toContain('<button');
  });
});
