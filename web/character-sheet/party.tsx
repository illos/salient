// SPDX-License-Identifier: GPL-3.0-only
/**
 * The campaign page's party panel: admitted heroes, and the admission review queue
 * (docs/character-wizard-spec.md#7-revision-and-review-lifecycle: the Director approves or
 * declines the exact submitted revision through registered operations; owners see the state of
 * their own submissions). Mounted by web/campaigns.tsx.
 */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ErrorNotice, Loading, useCommand } from '../ui';
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
  return (
    <div className="flex flex-col gap-3">
      <h3>Party roster</h3>
      {roster.heroes.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">No heroes are admitted yet.</p>
      ) : (
        <ul className="m-0 list-none p-0 text-sm">
          {roster.heroes.map(hero => (
            <li key={hero.id} className="rule-soft flex items-baseline justify-between gap-3 py-2">
              <Link to="/characters/$characterId" params={{ characterId: hero.id }}>
                {hero.name}
              </Link>
              <span className="text-muted-foreground">
                {hero.ownerName}
                {hero.live
                  ? ` · Stamina ${hero.live.stamina} · Recoveries ${hero.live.recoveries}`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/characters" className="text-sm">
        Open your characters →
      </Link>
      <h3>{director ? 'Submissions awaiting your review' : 'Your submissions'}</h3>
      {reviews.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="m-0 list-none p-0 text-sm">
          {reviews.map(review => (
            <li key={review.id} className="rule-soft flex flex-col gap-2 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{review.characterName}</strong> · {review.ownerName} · revision{' '}
                  {review.revision} · {review.kind === 'admission' ? 'admission' : 'full edit'}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{review.status}</Badge>
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
                      <Decision characterId={review.characterId} action="approve" label="Approve" />
                      <Decision characterId={review.characterId} action="decline" label="Decline" />
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
  );
}
