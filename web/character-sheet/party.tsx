// SPDX-License-Identifier: GPL-3.0-only
/**
 * The campaign page's party section: admitted heroes, and the admission review queue
 * (docs/character-wizard-spec.md#7-revision-and-review-lifecycle: the Director approves or
 * declines the exact submitted revision through registered operations; owners see the state of
 * their own submissions). Mounted by web/campaigns.tsx. V21 presentation: a hard-rule "Party"
 * heading, hero rows with a disc, name and owner caps at the right, and the review rows with
 * APPROVE (primary) / DECLINE (outline). The roster projection carries no class or level, so the
 * second line shows the live Stamina and Recoveries the projection does supply.
 */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Disc } from '../components/disc';
import { ErrorNotice, Loading, SectionHeading, useCommand } from '../ui';
import { CharacterSheet } from './index';

function Decision({
  characterId,
  action,
  label,
}: {
  characterId: Id<'characters'>;
  action: 'approve' | 'decline';
  label: string;
}) {
  const approve = useMutation(api.characters.approve);
  const decline = useMutation(api.characters.decline);
  const command = useCommand();
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        size="sm"
        variant={action === 'approve' ? 'default' : 'outline'}
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => (action === 'approve' ? approve : decline)({ commandId, characterId }),
            JSON.stringify(['character', action, characterId]),
          )
        }
      >
        {label}
      </Button>
      <ErrorNotice error={command.error} />
    </span>
  );
}

export function PartyPanel({
  campaignId,
  director,
}: {
  campaignId: Id<'campaigns'>;
  director: boolean;
}) {
  const roster = useQuery(api.table.roster, { campaignId });
  const reviews = useQuery(api.characters.reviews, { campaignId });
  const [open, setOpen] = useState<Id<'characters'> | null>(null);
  if (!roster || !reviews) return <Loading>Loading the party…</Loading>;
  const pending = reviews.filter(review => review.status === 'pending').length;
  return (
    <section className="flex flex-col gap-2" aria-labelledby="party-heading">
      <SectionHeading
        aside={
          <span className="flex items-center gap-4">
            <Link to="/characters" className="normal-case tracking-normal">
              Your characters →
            </Link>
            <span>
              {roster.heroes.length} {roster.heroes.length === 1 ? 'hero' : 'heroes'}
            </span>
          </span>
        }
      >
        <span id="party-heading">Party</span>
      </SectionHeading>
      {roster.heroes.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">No heroes are admitted yet.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {roster.heroes.map(hero => (
            <li key={hero.id} className="rule-soft">
              <Link
                to="/characters/$characterId"
                params={{ characterId: hero.id }}
                className="flex items-center gap-4 py-3 transition-colors duration-(--motion-fast) hover:bg-muted hover:no-underline"
              >
                <span aria-hidden>
                  <Disc
                    name={hero.name}
                    variant={hero.ownerId === roster.viewerId ? 'ink' : 'grey'}
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-bold">{hero.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {hero.live && hero.live.stamina !== null
                      ? `Stamina ${hero.live.stamina} · Recoveries ${hero.live.recoveries ?? '—'}`
                      : 'No live values yet'}
                  </span>
                </span>
                <span className="caps shrink-0 text-muted-foreground">{hero.ownerName}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(director || reviews.length > 0) && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="caps text-muted-foreground">
            {director ? 'Awaiting your review' : 'Your submissions'}
            {director && pending > 0 && <span className="ml-2 text-primary">{pending}</span>}
          </p>
          {reviews.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">None.</p>
          ) : (
            <ul className="m-0 list-none p-0 text-sm">
              {reviews.map(review => (
                <li key={review.id} className="rule-soft flex flex-col gap-2 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <span aria-hidden>
                        <Disc name={review.characterName} size="sm" />
                      </span>
                      <span className="flex flex-col">
                        <strong>{review.characterName}</strong>
                        <span className="text-muted-foreground">
                          {review.ownerName} · revision {review.revision} ·{' '}
                          {review.kind === 'admission' ? 'admission' : 'full edit'}
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {(!director || review.status !== 'pending') && (
                        <Badge variant="outline">{review.status}</Badge>
                      )}
                      {director && review.status === 'pending' && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setOpen(open === review.characterId ? null : review.characterId)
                            }
                          >
                            {open === review.characterId
                              ? 'Hide proposed sheet'
                              : 'View proposed sheet'}
                          </Button>
                          <Decision
                            characterId={review.characterId}
                            action="approve"
                            label="Approve"
                          />
                          <Decision
                            characterId={review.characterId}
                            action="decline"
                            label="Decline"
                          />
                        </>
                      )}
                    </span>
                  </div>
                  {open === review.characterId && (
                    <CharacterSheet characterId={review.characterId} view="proposed" compact />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
