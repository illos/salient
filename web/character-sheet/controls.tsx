import { ConditionSources, type ConditionSource } from '../condition-sources';
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sheet controls that submit registered operations as slash text through `commands.submit`: the
 * same path as the palette, the console and the headless CLI. Nothing here resolves a rule; the
 * server validates actor, session, authority and values on commit
 * (docs/character-sheet-spec.md#resource-and-condition-interaction).
 */
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import conditions from '../../shared/content/core-conditions.json';
import { cn } from 'cn';
import { Chip } from '../components/chip';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useCommand } from '../ui';
import { RuleLink } from '../rules/link';

export const CONDITIONS = (
  conditions as { conditions: { id: string; name: string; text: string }[] }
).conditions;

export function actorRef(characterId: string) {
  return `@{character:${characterId}}`;
}

/** One button, one slash command. */
export function SlashButton({
  campaignId,
  text,
  label,
  disabled,
  variant = 'outline',
  title,
}: {
  campaignId: Id<'campaigns'>;
  text: string;
  label: string;
  disabled?: boolean;
  variant?: 'outline' | 'ghost' | 'default';
  title?: string;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={disabled || command.pending}
        title={title ?? text}
        onClick={() =>
          void command.run(
            commandId => submit({ campaignId, text, commandId }),
            JSON.stringify(['sheet', campaignId, text]),
          )
        }
      >
        {label}
      </Button>
    </span>
  );
}

/**
 * Director numeric edit: Edit, enter an absolute value, then Save or Cancel. Save submits
 * `/adjust <field>`; allowed values come from the shared operation, not from here.
 */
export function AdjustControl({
  campaignId,
  characterId,
  field,
  label,
  current,
  disabled,
}: {
  campaignId: Id<'campaigns'>;
  characterId: string;
  field: string;
  label: string;
  current: number;
  disabled?: boolean;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current));
  if (!editing)
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={disabled}
        aria-label={`Edit ${label}`}
        onClick={() => {
          setValue(String(current));
          setEditing(true);
        }}
      >
        Edit
      </Button>
    );
  const text = `${actorRef(characterId)} /adjust ${field} value=${value.trim()}`;
  return (
    <form
      className="inline-flex flex-col gap-1"
      onSubmit={async event => {
        event.preventDefault();
        if (!value.trim()) return;
        const ok = await command.run(
          commandId => submit({ campaignId, text, commandId }),
          JSON.stringify(['adjust', campaignId, text]),
        );
        if (ok) setEditing(false);
      }}
    >
      <span className="flex items-center gap-1">
        <Input
          aria-label={`New ${label}`}
          className="h-7 w-20"
          inputMode="numeric"
          value={value}
          onChange={event => setValue(event.target.value)}
          autoFocus
        />
        <Button type="submit" size="xs" disabled={command.pending}>
          Save
        </Button>
        <Button type="button" size="xs" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </span>
    </form>
  );
}

/**
 * One labeled on/off toggle per core condition, each a `/condition on|off` submission, styled as
 * the mockup's chips (filled when active). The native checkbox keeps its label for tests and
 * assistive technology; the chip is its visible form.
 */
export function ConditionToggles({
  campaignId,
  characterId,
  conditions,
  canToggle,
  reason,
}: {
  campaignId: Id<'campaigns'> | null;
  characterId: string;
  conditions: Record<string, boolean>;
  canToggle: boolean;
  reason: string | null;
}) {
  const submit = useMutation(api.commands.submit);
  const command = useCommand();
  const disabled = !canToggle || !campaignId || command.pending;
  return (
    <div className="flex flex-col gap-2">
      {reason && <p className="m-0 text-xs text-muted-foreground">{reason}</p>}
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Condition toggles">
        {CONDITIONS.map(condition => {
          const on = conditions[condition.id] ?? false;
          const text = `${actorRef(characterId)} /condition ${on ? 'off' : 'on'} name=${condition.id}`;
          return (
            <li key={condition.id} className="inline-flex items-center">
              <label
                className={cn(
                  'caps inline-flex h-6 cursor-pointer items-center rounded-(--chip-radius) border-(length:--chip-border) px-1.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  on
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-input text-foreground hover:bg-muted',
                  disabled && 'cursor-default opacity-60',
                )}
                title={canToggle ? text : undefined}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  aria-label={condition.name}
                  checked={on}
                  disabled={disabled}
                  onChange={() =>
                    campaignId &&
                    void command.run(
                      commandId => submit({ campaignId, text, commandId }),
                      JSON.stringify(['condition', campaignId, text]),
                    )
                  }
                />
                {condition.name}
              </label>
              <RuleLink id={`mcdm.heroes.v1/condition/${condition.id}`} label={condition.name} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Active conditions as ink-filled chips; shown in the header so they survive body scrolling. */
export function ActiveConditionBadges({
  conditions,
  instances,
}: {
  conditions: Record<string, boolean>;
  instances?: readonly ConditionSource[];
}) {
  const active = CONDITIONS.filter(c => conditions[c.id]);
  if (!active.length) return null;
  return (
    <span className="flex flex-wrap items-center gap-1" aria-label="Active conditions">
      {active.map(c => (
        <span key={c.id} className="inline-flex flex-col gap-1">
          <span className="inline-flex items-center">
            <Chip kind="result" caps>
              {c.name}
            </Chip>
            <RuleLink id={`mcdm.heroes.v1/condition/${c.id}`} label={c.name} />
          </span>
          <ConditionSources condition={c.id} instances={instances} />
        </span>
      ))}
    </span>
  );
}

/** A05 shared Recovery operation owns both free-play recovery and combat maneuver allowance. */
export function CatchBreathButton({
  campaignId,
  characterId,
  disabled,
}: {
  campaignId: Id<'campaigns'>;
  characterId: string;
  disabled: boolean;
}) {
  const invoke = useMutation(api.commands.invoke);
  const command = useCommand();
  return (
    <span className="inline-flex flex-col">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || command.pending}
        onClick={() =>
          void command.run(
            commandId =>
              invoke({
                campaignId,
                commandId,
                operation: 'ability.use',
                actor: { refKind: 'character', id: characterId },
                arguments: { ability: 'mcdm.heroes.v1/feature.common.maneuvers/catch-breath' },
              }),
            JSON.stringify(['catch-breath', campaignId, characterId]),
          )
        }
      >
        Catch Breath
      </Button>
    </span>
  );
}
