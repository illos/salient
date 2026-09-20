// SPDX-License-Identifier: GPL-3.0-only
/** A07 closeout: authoritative choices and awards, submitted through shared operations. */
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { SectionHeading, useCommand } from '../ui';
import { RuleLink } from '../rules/link';
import { readableRuleText } from '../rules/reference';
import { GlyphText } from '../components/core-content';
import { CommandButton } from './setup-card';

type Closeout = NonNullable<FunctionReturnType<typeof api.closeout.current>>;

function CleanupChoices({
  campaignId,
  choices,
  mayManage,
}: {
  campaignId: Id<'campaigns'>;
  choices: Closeout['optionalChoices'];
  mayManage: boolean;
}) {
  return choices.map((choice, index) => (
    <div
      key={`${choice.eventId}:${index}`}
      className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-base"
    >
      <p>
        <strong className="font-medium">
          {choice.actor.name} · {choice.abilityName}
          <RuleLink id={choice.abilityId} label={choice.abilityName} />
        </strong>
      </p>
      {choice.target && <p>Target: {choice.target.name}</p>}
      <p className="whitespace-pre-wrap">
        <GlyphText text={readableRuleText(choice.clause)} />
      </p>
      {mayManage && (
        <CommandButton
          campaignId={campaignId}
          text={`/ability resolved event=${JSON.stringify(choice.eventId)} ${choice.occurrence ? `occurrence=${JSON.stringify(choice.occurrence)}` : `clause=${JSON.stringify(choice.clause)}`}${choice.target ? ` target=@{${choice.target.kind}:${choice.target.id}}` : ''}`}
          label={`Resolved at table · ${choice.actor.name}`}
        />
      )}
    </div>
  ));
}

function VictoryAward({
  campaignId,
  closeout,
}: {
  campaignId: Id<'campaigns'>;
  closeout: Closeout;
}) {
  const invoke = useMutation(api.commands.invoke);
  const command = useCommand();
  const [amount, setAmount] = useState('1');
  const [recipients, setRecipients] = useState<string[]>([]);
  if (closeout.victory.confirmed)
    return (
      <p className="text-base" role="status">
        Victory award confirmed: {closeout.victory.amount} to{' '}
        {closeout.heroes
          .filter(hero => closeout.victory.recipients.includes(hero.id))
          .map(hero => hero.name)
          .join(', ') || 'no recipients'}
        .
      </p>
    );
  if (!closeout.mayManage)
    return (
      <p className="text-sm text-muted-foreground">
        Waiting for the Director to confirm Victories.
      </p>
    );
  const valid = amount.trim() !== '' && Number.isSafeInteger(Number(amount)) && Number(amount) >= 0;
  return (
    <fieldset disabled={command.pending} className="flex flex-col gap-3">
      <legend className="mb-2 font-medium">Victory award</legend>
      <p className="text-sm text-muted-foreground">
        Choose the source-earned amount and eligible recipients. The initial value awards nothing
        until confirmed; choose 0 when no Victory is earned.
      </p>
      <label className="flex items-center gap-2 text-base">
        Victories to award
        <input
          className="h-8 w-20 rounded-md border-0 bg-placeholder px-2 text-sm text-foreground caret-primary tabular-nums outline-none"
          type="number"
          min={0}
          step={1}
          value={amount}
          onChange={event => setAmount(event.target.value)}
        />
      </label>
      {closeout.heroes.map(hero => (
        <label key={hero.id} className="flex items-center gap-2 text-base">
          <input
            type="checkbox"
            className="size-[18px] accent-primary"
            checked={recipients.includes(hero.id)}
            onChange={event =>
              setRecipients(current =>
                event.target.checked ? [...current, hero.id] : current.filter(id => id !== hero.id),
              )
            }
          />
          Award to {hero.name} · {hero.victories} current Victories
        </label>
      ))}
      <Button
        className="w-fit"
        size="sm"
        disabled={!valid || command.pending || (Number(amount) > 0 && recipients.length === 0)}
        onClick={() =>
          void command.run(
            commandId =>
              invoke({
                campaignId,
                operation: 'combat.victories',
                arguments: {
                  amount: Number(amount),
                  recipients,
                  encounter: closeout.encounterId,
                },
                commandId,
              }),
            JSON.stringify(['combat.victories', closeout.encounterId, amount, recipients]),
          )
        }
      >
        Confirm Victory award
      </Button>
    </fieldset>
  );
}

export function CloseoutCard({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const closeout = useQuery(api.closeout.current, { campaignId });
  if (!closeout || closeout.phase !== 'closeout') return null;
  return (
    <div className="rounded-md bg-muted p-5">
      <div className="flex flex-col gap-4">
        <SectionHeading className="mb-0">Combat closeout</SectionHeading>
        <p className="text-sm text-muted-foreground">
          Structured turns have ended. Review each hero’s remaining choices before the Director
          finishes cleanup. Unchosen options are not executed. Other source-specific ending effects
          remain manual.
        </p>
        <p className="text-sm text-muted-foreground">
          Finish cleanup clears remaining surges and temporary Stamina. Source-specific exceptions
          remain manual.
        </p>
        {closeout.heroes.map(hero => {
          const choices = closeout.optionalChoices.filter(
            choice => choice.actor.kind === 'character' && choice.actor.id === hero.id,
          );
          return (
            <section key={hero.id} aria-label={`Cleanup for ${hero.name}`}>
              <h3 className="text-base font-medium">{hero.name}</h3>
              {choices.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No pending cleanup options. Spend nothing.
                </p>
              )}
              <CleanupChoices
                campaignId={campaignId}
                choices={choices}
                mayManage={closeout.mayManage}
              />
            </section>
          );
        })}
        <CleanupChoices
          campaignId={campaignId}
          choices={closeout.optionalChoices.filter(
            choice =>
              !closeout.heroes.some(
                hero => choice.actor.kind === 'character' && choice.actor.id === hero.id,
              ),
          )}
          mayManage={closeout.mayManage}
        />
        <VictoryAward key={closeout.encounterId} campaignId={campaignId} closeout={closeout} />
        {closeout.mayManage && (
          <CommandButton
            campaignId={campaignId}
            text={`/combat finish encounter=${closeout.encounterId}`}
            label="Finish cleanup"
            variant="default"
            disabled={!closeout.mayFinish}
          />
        )}
      </div>
    </div>
  );
}
