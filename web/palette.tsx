// SPDX-License-Identifier: GPL-3.0-only
// Minimal command palette: renders `commands.list` (every registered operation, its argument schema
// and whether the viewer can use it now). Picking an entry only fills the console's text; execution
// always goes through the shared mutation. Owning specification:
// docs/engine-architecture.md#command-registry-and-palette.
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Button } from './components/ui/button';
import { Loading } from './ui';

export function Palette({
  campaignId,
  onPick,
}: {
  campaignId: Id<'campaigns'>;
  onPick: (syntax: string) => void;
}) {
  const operations = useQuery(api.commands.list, { campaignId });
  return (
    <details className="rule-soft border-t pt-3">
      <summary className="caps cursor-pointer text-sm">
        Command palette{operations ? ` (${operations.length})` : ''}
      </summary>
      {operations === undefined ? (
        <Loading>Loading registered commands…</Loading>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {operations.map(operation => (
            <li key={operation.id} className="flex items-start justify-between gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <div>
                  <strong>{operation.title}</strong> <code>{operation.syntax}</code>
                </div>
                <p className="text-muted-foreground">{operation.description}</p>
                {operation.arguments.length > 0 && (
                  <ul className="text-muted-foreground">
                    {operation.arguments.map(argument => (
                      <li key={argument.name}>
                        <code>{argument.name}</code> ({argument.type}
                        {argument.required ? ', required' : ''}) — {argument.description}
                      </li>
                    ))}
                  </ul>
                )}
                {!operation.available && operation.unavailableReason && (
                  <p className="text-muted-foreground">{operation.unavailableReason}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onPick(operation.syntax.replace(/\[?@Actor\]? ?/, '').replace(/…/g, ''))
                }
              >
                Use
              </Button>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
