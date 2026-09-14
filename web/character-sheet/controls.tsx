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
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ErrorNotice, useCommand } from '../ui';

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
      <ErrorNotice error={command.error} />
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
      <ErrorNotice error={command.error} />
    </form>
  );
}

/** One labeled on/off toggle per core condition, each a `/condition on|off` submission. */
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
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0 sm:grid-cols-3">
        {CONDITIONS.map(condition => {
          const on = conditions[condition.id] ?? false;
          const text = `${actorRef(characterId)} /condition ${on ? 'off' : 'on'} name=${condition.id}`;
          return (
            <li key={condition.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                aria-label={condition.name}
                checked={on}
                disabled={!canToggle || !campaignId || command.pending}
                onChange={() =>
                  campaignId &&
                  void command.run(
                    commandId => submit({ campaignId, text, commandId }),
                    JSON.stringify(['condition', campaignId, text]),
                  )
                }
              />
              <span className={on ? 'font-bold' : ''}>{condition.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setOpen(open === condition.id ? null : condition.id)}
              >
                {open === condition.id ? 'Hide' : 'Text'}
              </Button>
            </li>
          );
        })}
      </ul>
      {open && <SourceText text={CONDITIONS.find(c => c.id === open)!.text} label={open} />}
      <ErrorNotice error={command.error} />
    </div>
  );
}

export function ActiveConditionBadges({ conditions }: { conditions: Record<string, boolean> }) {
  const active = CONDITIONS.filter(c => conditions[c.id]);
  if (!active.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {active.map(c => (
        <Badge key={c.id} variant="outline">
          {c.name}
        </Badge>
      ))}
    </span>
  );
}

/** Verbatim source text, shown as the file prints it. */
export function SourceText({ text, label }: { text: string; label?: string }) {
  return (
    <pre
      aria-label={label ? `Source text: ${label}` : 'Source text'}
      className="mt-1 max-h-96 overflow-auto border-l-2 border-rule-strong pl-3 font-sans text-xs whitespace-pre-wrap [overflow-wrap:anywhere]"
    >
      {text}
    </pre>
  );
}
