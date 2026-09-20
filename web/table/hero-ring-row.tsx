// SPDX-License-Identifier: GPL-3.0-only
/**
 * The combat portrait row in the Heroes pane (docs/design-mockups/quiet/README.md, heroes pane;
 * docs/table-spec.md#confirmed-combat-layout, 2026-09-15 decision): one 48px disc per hero in
 * the encounter with a thin Stamina bar beneath it, the acting hero outlined in accent with an
 * `Acting` caption, and a small tonal count with the hero's Heroic Resource when the projection
 * carries it (the Director and that hero's owner; peers never receive it, docs/table-spec.md
 * #party-sheets-and-resource-visibility). Clicking a disc selects that hero's sheet.
 * Presentation only: nothing here submits a command or decides a rule; whose turn it is, who is
 * Slain and every Stamina value come from the projections.
 */
import type { Id } from '../../convex/_generated/dataModel';
import { Disc } from '../components/disc';
import { HealthBar } from '../components/health-bar';
import type { Hero } from './heroes-pane';
import type { Encounter } from './setup-card';

export interface HeroRingRowProps {
  campaignId: Id<'campaigns'>;
  encounter: Encounter;
  heroes: Hero[];
  selectedId: string | null;
  onSelect: (heroId: string) => void;
}

/** Heroic Resource for the badge, present only in the full live projection (Director, owner). */
function resourceOf(hero: Hero): number | undefined {
  const live = hero.live;
  if (!live || !('heroicResource' in live)) return undefined;
  return live.heroicResource.current;
}

export function HeroRingRow({
  campaignId,
  encounter,
  heroes,
  selectedId,
  onSelect,
}: HeroRingRowProps) {
  void campaignId;
  const entries = encounter.groups.flatMap(group => group.entries);
  const participating = heroes.filter(hero =>
    entries.some(entry => entry.actor.kind === 'character' && entry.actor.id === hero.id),
  );
  const listed = participating.length ? participating : heroes;
  if (listed.length === 0) return null;
  const acting = encounter.activeTurn?.actor;
  return (
    <ul
      className="m-0 flex list-none flex-wrap items-start gap-x-5 gap-y-3 p-0"
      aria-label="Heroes in this combat"
      data-hero-ring-row
    >
      {listed.map(hero => {
        const own = entries.filter(
          entry => entry.actor.kind === 'character' && entry.actor.id === hero.id,
        );
        const isActing = acting?.kind === 'character' && acting.id === hero.id;
        const slain = own.length > 0 && own.every(entry => entry.slain);
        const away = own.length === 0;
        const selected = hero.id === selectedId;
        const badge = resourceOf(hero);
        const state = isActing ? 'acting' : slain ? 'Slain' : away ? 'away' : undefined;
        const label = `${hero.name}${state ? ` · ${state}` : ''}${
          badge === undefined ? '' : ` · ${badge} Heroic Resource`
        }`;
        return (
          <li key={hero.id} className="m-0 p-0">
            <button
              type="button"
              className="group/ring flex flex-col items-center rounded-md border-0 bg-transparent p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label={label}
              aria-pressed={selected}
              aria-current={isActing ? 'true' : undefined}
              title={label}
              data-hero-id={hero.id}
              data-state={state ?? 'ready'}
              onClick={() => onSelect(hero.id)}
            >
              <Disc
                name={hero.name}
                variant="ring"
                filled={isActing || selected}
                acting={isActing}
                badge={badge}
                caption={isActing ? 'Acting' : slain ? 'Slain' : away ? 'Away' : undefined}
                footer={
                  hero.live &&
                  hero.live.stamina !== null &&
                  hero.facts?.staminaMax !== undefined &&
                  hero.facts.staminaMax !== null ? (
                    <HealthBar
                      thin
                      tone="hero"
                      value={hero.live.stamina}
                      max={hero.facts.staminaMax}
                      low={hero.facts.windedValue ?? undefined}
                      label={`${hero.name} Stamina`}
                      className="w-12"
                    />
                  ) : undefined
                }
                muted={slain || away}
                label={label}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
