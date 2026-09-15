// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Invite your players" callout card (campaign-home.png; V21 item 11): title, grey sentence,
 * the share code with its icon-only copy control (docs/accounts-and-access-spec.md#5: the code is
 * displayed separately from the URL), the invitation link with the ink COPY button beside it, the
 * replace link, then JOIN REQUESTS with the pending count in brick red and one row per request
 * with a disc, the name and APPROVE / DECLINE. Every control submits its existing mutation
 * (`campaigns.regenerateShareCode`, `campaigns.approveRequest`, `campaigns.declineRequest`).
 */
import { useEffect, useId, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Disc } from '../components/disc';
import { ErrorNotice, useCommand } from '../ui';

/** Clipboard write with the "Copied" state held for two seconds. */
function useCopy(value: string) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copied = copiedValue === value;
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopiedValue(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied, copiedValue]);
  async function copy() {
    setError(null);
    setCopiedValue(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
    } catch {
      setError('Could not copy. Select the field and copy it manually.');
    }
  }
  return { copied, error, copy };
}

/**
 * A read-only field with an icon-only copy control beside it. The mockup draws a filled COPY
 * button next to the invitation link, but docs/accounts-and-access-spec.md#5 requires "an
 * icon-only copy button beside each field (no visible button label; accessible names identify
 * [them])" — a written specification, so both fields take the icon.
 */
function CopyField({
  label,
  value,
  copyLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
}) {
  const id = useId();
  const { copied, error, copy } = useCopy(value);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="caps text-muted-foreground">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <Input
          id={id}
          readOnly
          className="h-10 min-w-0 font-mono text-sm"
          value={value}
          onFocus={e => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="size-10"
          aria-label={copyLabel}
          title={copied ? 'Copied' : copyLabel}
          onClick={() => void copy()}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
      </div>
      <span className="sr-only" role="status">
        {copied ? `${label} copied.` : ''}
      </span>
      <ErrorNotice error={error} />
    </div>
  );
}

export function InviteCard({
  campaignId,
  shareCode,
  requests,
}: {
  campaignId: Id<'campaigns'>;
  shareCode: string;
  requests: { id: Id<'joinRequests'>; userId: Id<'users'>; displayName: string }[];
}) {
  const regenerate = useMutation(api.campaigns.regenerateShareCode);
  const command = useCommand();
  return (
    <Card data-testid="invite-card">
      <CardContent className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl">Invite your players</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share this link. You approve who joins.
          </p>
        </div>
        <CopyField
          label="Invitation link"
          value={`${window.location.origin}/join/${shareCode}`}
          copyLabel="Copy link"
        />
        <CopyField label="Campaign share code" value={shareCode} copyLabel="Copy code" />
        <div className="flex flex-col gap-1">
          <Button
            variant="link"
            className="w-fit text-sm text-muted-foreground"
            disabled={command.pending}
            onClick={() =>
              void command.run(
                commandId => regenerate({ campaignId, commandId }),
                JSON.stringify(['campaign.rotate', { campaignId }]),
              )
            }
          >
            Replace code and link
          </Button>
          <ErrorNotice error={command.error} />
        </div>
        <div className="rule-soft border-t pt-4">
          <p className="caps mb-2 text-muted-foreground">
            Join requests
            {requests.length > 0 && (
              <span className="ml-2 text-primary" data-testid="join-request-count">
                {requests.length}
              </span>
            )}
          </p>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {requests.map(r => (
                <ReviewRequest key={r.id} request={r} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewRequest({ request }: { request: { id: Id<'joinRequests'>; displayName: string } }) {
  const approve = useMutation(api.campaigns.approveRequest);
  const decline = useMutation(api.campaigns.declineRequest);
  const command = useCommand();
  return (
    <li className="flex flex-col gap-2 py-2" data-testid="join-request">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden>
            <Disc name={request.displayName} size="sm" />
          </span>
          <strong className="truncate">{request.displayName}</strong>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            disabled={command.pending}
            onClick={() =>
              void command.run(
                commandId => approve({ requestId: request.id, commandId }),
                JSON.stringify(['campaign.approve', { requestId: request.id }]),
              )
            }
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={command.pending}
            onClick={() =>
              void command.run(
                commandId => decline({ requestId: request.id, commandId }),
                JSON.stringify(['campaign.decline', { requestId: request.id }]),
              )
            }
          >
            Decline
          </Button>
        </div>
      </div>
      <ErrorNotice error={command.error} />
    </li>
  );
}
