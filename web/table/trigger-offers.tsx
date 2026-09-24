// SPDX-License-Identifier: GPL-3.0-only
/**
 * V173 triggered-action cards: the open `triggered-offer` interactions of the campaign, each with
 * Accept and Pass. Accept answers the card (`card.respond` through interactions.respond), whose
 * continuation is the offered `ability.use`; Pass closes it (`card.close`). The server decides who
 * may answer (the owning player or the Director) and re-checks eligibility on Accept; nothing here
 * decides a rule. Owning specifications: docs/lasting-effects-design.md#4-triggered-actions-and-reactions,
 * docs/table-spec.md#inline-interaction-cards-in-the-game-log.
 */
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { useCommand } from '../ui';

export function TriggerOffers({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const cards = useQuery(api.interactions.list, { campaignId });
  const respond = useMutation(api.interactions.respond);
  const close = useMutation(api.interactions.close);
  const command = useCommand();
  const offers = (cards ?? []).filter(card => card.kind === 'triggered-offer');
  if (!offers.length) return null;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Triggered action offers">
      {offers.map(card => (
        <li key={card.id} className="inset-controls flex flex-col gap-2 rounded-md bg-muted p-3">
          <span className="[overflow-wrap:anywhere]">
            {(card.offer as { text?: string } | null)?.text ?? card.actorLabel}
          </span>
          {card.mayAnswer && (
            <span className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={command.pending}
                onClick={() =>
                  void command.run(
                    commandId =>
                      respond({
                        interactionId: card.id,
                        answer: {},
                        commandId,
                        expectedRevision: card.revision,
                      }),
                    JSON.stringify(['trigger.accept', campaignId, card.id]),
                  )
                }
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={command.pending}
                onClick={() =>
                  void command.run(
                    commandId =>
                      close({ interactionId: card.id, commandId, expectedRevision: card.revision }),
                    JSON.stringify(['trigger.pass', campaignId, card.id]),
                  )
                }
              >
                Pass
              </Button>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
