// SPDX-License-Identifier: GPL-3.0-only
/**
 * V173 triggered-action cards: the open `triggered-offer` interactions of the campaign, each with
 * Accept and Pass. Accept answers the card (`card.respond` through interactions.respond), whose
 * continuation is the offered `ability.use`; Pass closes it (`card.close`). The server decides who
 * may answer (the owning player or the Director) and re-checks eligibility on Accept; nothing here
 * decides a rule. V174: a damage-changing response with a Spend section also offers "Accept and
 * spend", answering with the printed amount (`spend`); larger amounts go through the command line.
 * V202: so does a turn-boundary response with a Spend section of table work (`offer.spend`).
 * V175: Mark cards (`mark-offer`) answer with one of the offered benefits (`benefit`) or a new
 * target among the encounter's creatures (`targets`); the server re-checks both.
 * Owning specifications: docs/lasting-effects-design.md#4-triggered-actions-and-reactions,
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
  const offers = (cards ?? []).filter(
    card => card.kind === 'triggered-offer' || card.kind === 'mark-offer',
  );
  if (!offers.length) return null;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Triggered action offers">
      {offers.map(card => {
        // V202: a turn-boundary response's own Spend section (no revision) sits on `offer.spend`.
        const offered = card.offer as {
          revision?: { spend?: { cost: string; amount: number } };
          spend?: { cost: string; amount: number };
        } | null;
        const spend = offered?.revision?.spend ?? offered?.spend;
        const mark = (
          card.offer as {
            mark?: {
              kind: 'benefit' | 'retarget';
              options?: { kind: string; text: string }[];
              candidates?: { kind: string; id: string; name: string }[];
            };
          } | null
        )?.mark;
        const accept = (answer: Record<string, unknown>, key: string) =>
          void command.run(
            commandId =>
              respond({
                interactionId: card.id,
                answer,
                commandId,
                expectedRevision: card.revision,
              }),
            JSON.stringify([key, campaignId, card.id]),
          );
        return (
          <li key={card.id} className="inset-controls flex flex-col gap-2 rounded-md bg-muted p-3">
            <span className="[overflow-wrap:anywhere]">
              {(card.offer as { text?: string } | null)?.text ?? card.actorLabel}
            </span>
            {card.mayAnswer && (
              <span className="flex flex-wrap gap-2">
                {!mark && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={command.pending}
                    onClick={() => accept({}, 'trigger.accept')}
                  >
                    Accept
                  </Button>
                )}
                {mark?.kind === 'benefit' &&
                  (mark.options ?? []).map(option => (
                    <Button
                      key={option.kind}
                      type="button"
                      size="sm"
                      title={option.text}
                      disabled={command.pending}
                      onClick={() =>
                        accept({ benefit: option.kind }, `mark.benefit.${option.kind}`)
                      }
                    >
                      {option.kind.replace('-', ' ')}
                    </Button>
                  ))}
                {mark?.kind === 'retarget' &&
                  (mark.candidates ?? []).map(candidate => (
                    <Button
                      key={candidate.id}
                      type="button"
                      size="sm"
                      disabled={command.pending}
                      onClick={() =>
                        accept(
                          { targets: [{ refKind: candidate.kind, id: candidate.id }] },
                          `mark.retarget.${candidate.id}`,
                        )
                      }
                    >
                      Mark {candidate.name}
                    </Button>
                  ))}
                {spend && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={command.pending}
                    onClick={() => accept({ spend: spend.amount }, 'trigger.accept-spend')}
                  >
                    Accept and {spend.cost.toLowerCase()}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={command.pending}
                  onClick={() =>
                    void command.run(
                      commandId =>
                        close({
                          interactionId: card.id,
                          commandId,
                          expectedRevision: card.revision,
                        }),
                      JSON.stringify(['trigger.pass', campaignId, card.id]),
                    )
                  }
                >
                  Pass
                </Button>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
