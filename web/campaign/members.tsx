// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Members" section of the campaign home (campaign-home.png; V21 item 11): hard-rule heading
 * with the count aside, one row per member with a disc (ink for the viewer), the name and the
 * right-aligned tag. The tag is derived exactly as before: DIRECTOR for the owner, PLAYER when
 * the active session selects the member, OBSERVER otherwise (docs/table-spec.md#3-table-surfaces;
 * docs/design-mockups/v1/README.md departures: not a standing membership role).
 */
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { Disc } from '../components/disc';
import { SectionHeading } from '../ui';
import type { Member, Session } from './header';

export function MembersSection({
  members,
  ownerId,
  viewerId,
  active,
}: {
  members: Member[];
  ownerId: Id<'users'>;
  viewerId: Id<'users'>;
  active: Session | undefined;
}) {
  return (
    <section aria-labelledby="members-heading">
      <SectionHeading aside={String(members.length)}>
        <span id="members-heading">Members</span>
      </SectionHeading>
      <ul className="m-0 list-none p-0">
        {members.map(m => {
          const tag =
            m.userId === ownerId
              ? 'Director'
              : active?.selectedPlayerIds.includes(m.userId)
                ? 'Player'
                : 'Observer';
          return (
            <li
              key={m.userId}
              className="rule-soft flex items-center gap-4 py-3"
              data-testid="member-row"
            >
              <span aria-hidden>
                <Disc name={m.displayName} variant={m.userId === viewerId ? 'ink' : 'grey'} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.displayName}</span>
              <Badge variant={tag === 'Director' ? 'default' : 'outline'} className="border">
                {tag}
              </Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
