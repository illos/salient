// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Director's "Manage players" pop-up (V68; docs/design-mockups/v2/README.md decisions). Opened
 * by INVITE PLAYERS, MANAGE PLAYERS and the join-request count. Three sections in the app-wide
 * OverlayCard: Invite (link and share code with icon-only copy controls per
 * docs/accounts-and-access-spec.md#5-campaign-discovery-requests-and-blocking, and Replace), Join
 * requests (APPROVE / DECLINE through `campaigns.approveRequest` / `declineRequest`) and Hero
 * admissions (the character review queue through `characters.approve` / `decline`,
 * docs/character-wizard-spec.md#7-revision-and-review-lifecycle). Every control submits the same
 * mutation it did on the old inline cards; nothing is decided in the UI.
 */
import { useEffect, useId, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Disc } from '../components/disc';
import { OverlayCard } from '../components/overlay-card';
import { Loading, useCommand } from '../ui';
import { useToast } from '../toast';

export type ManageSection = 'invite' | 'requests' | 'admissions';

/** Clipboard write with the "Copied" state held for two seconds. */
function useCopy(value: string) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const showError = useToast();
  const copied = copiedValue === value;
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopiedValue(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied, copiedValue]);
  async function copy() {
    setCopiedValue(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
    } catch {
      showError('Could not copy. Select the field and copy it manually.');
    }
  }
  return { copied, copy };
}

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
  const { copied, copy } = useCopy(value);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted-foreground">
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
    </div>
  );
}

function Section({
  id,
  title,
  count,
  children,
}: {
  id: ManageSection;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section id={`manage-${id}`} aria-labelledby={`manage-${id}-heading`} className="py-5">
      <p className="mb-3 text-sm text-muted-foreground">
        <span id={`manage-${id}-heading`}>{title}</span>
        {count !== undefined && count > 0 && <span className="ml-2 text-primary">{count}</span>}
      </p>
      {children}
    </section>
  );
}

function JoinRequest({ request }: { request: { id: Id<'joinRequests'>; displayName: string } }) {
  const approve = useMutation(api.campaigns.approveRequest);
  const decline = useMutation(api.campaigns.declineRequest);
  const command = useCommand();
  return (
    <li className="flex items-center justify-between gap-3 py-2" data-testid="join-request">
      <span className="flex min-w-0 items-center gap-3">
        <span aria-hidden>
          <Disc name={request.displayName} size="sm" />
        </span>
        <strong className="truncate">{request.displayName}</strong>
      </span>
      <span className="flex shrink-0 items-center gap-2">
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
      </span>
    </li>
  );
}

function Admission({
  review,
}: {
  review: {
    id: Id<'characterReviews'>;
    characterId: Id<'characters'>;
    characterName: string;
    ownerName: string;
    kind: string;
    status: string;
    revision: number;
  };
}) {
  const approve = useMutation(api.characters.approve);
  const decline = useMutation(api.characters.decline);
  const command = useCommand();
  const decide = (action: 'approve' | 'decline') =>
    void command.run(
      commandId =>
        (action === 'approve' ? approve : decline)({ commandId, characterId: review.characterId }),
      JSON.stringify(['character', action, review.characterId]),
    );
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2" data-testid="admission">
      <span className="flex min-w-0 items-center gap-3">
        <span aria-hidden>
          <Disc name={review.characterName} size="sm" />
        </span>
        <span className="flex min-w-0 flex-col">
          <strong className="truncate">{review.characterName}</strong>
          <span className="text-sm text-muted-foreground">
            {review.ownerName} · revision {review.revision} ·{' '}
            {review.kind === 'admission' ? 'admission' : 'full edit'}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {review.status !== 'pending' ? (
          <Badge variant="outline">{review.status}</Badge>
        ) : (
          <>
            <Button size="sm" disabled={command.pending} onClick={() => decide('approve')}>
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={command.pending}
              onClick={() => decide('decline')}
            >
              Decline
            </Button>
          </>
        )}
      </span>
    </li>
  );
}

export function ManagePlayersCard({
  open,
  section,
  onOpenChange,
  campaignId,
  campaignName,
  shareCode,
  requests,
}: {
  open: boolean;
  section: ManageSection;
  onOpenChange: (open: boolean) => void;
  campaignId: Id<'campaigns'>;
  campaignName: string;
  shareCode: string;
  requests: { id: Id<'joinRequests'>; userId: Id<'users'>; displayName: string }[];
}) {
  const regenerate = useMutation(api.campaigns.regenerateShareCode);
  const command = useCommand();
  const reviews = useQuery(api.characters.reviews, open ? { campaignId } : 'skip');
  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() =>
      document.getElementById(`manage-${section}`)?.scrollIntoView({ block: 'start' }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [open, section]);
  return (
    <OverlayCard
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={campaignName}
      title="Manage players"
      className="max-w-2xl"
      bodyKey={section}
    >
      <div className="divide-y divide-border">
        <Section id="invite" title="Invite your players">
          <p className="mb-3 text-sm text-muted-foreground">
            Share this link. You approve who joins.
          </p>
          <div className="flex flex-col gap-4">
            <CopyField
              label="Invitation link"
              value={`${window.location.origin}/join/${shareCode}`}
              copyLabel="Copy link"
            />
            <CopyField label="Campaign share code" value={shareCode} copyLabel="Copy code" />
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
          </div>
        </Section>
        <Section id="requests" title="Join requests" count={requests.length}>
          {requests.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {requests.map(r => (
                <JoinRequest key={r.id} request={r} />
              ))}
            </ul>
          )}
        </Section>
        <Section
          id="admissions"
          title="Hero admissions"
          count={reviews?.filter(r => r.status === 'pending').length}
        >
          {!reviews ? (
            <Loading>Loading the review queue…</Loading>
          ) : reviews.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">No heroes awaiting review.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {reviews.map(review => (
                <Admission key={review.id} review={review} />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </OverlayCard>
  );
}
