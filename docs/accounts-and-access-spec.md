# Accounts, roles, ownership, and sharing

Version: 0.8 — account-screen implementation status, 2026-09-20 (0.7: implementation-status text corrected, 2026-09-14).

**Status:** the accounts, roles, ownership, sharing, and friendship discussion is captured for future
implementation. **Confirmed requirements** record product decisions. **Proposals** make those requirements
concrete for review. **Open decisions** remain unsettled; checkpointing this document does not approve its
proposed defaults. Section 1 records which of these workflows the checkout implements; the fuller access
workflows remain unimplemented.

This is the primary specification for account and social relationships and application access. The
[feature inventory](product-features.md) summarizes it; the
[character wizard specification](character-wizard-spec.md) retains authority over build and review behavior;
the [data architecture](data-architecture-spec.md) retains authority over storage and gameplay history. The
[v1 tech stack](v1-tech-stack-spec.md) records technology rationale and hosting portability. Follow
the specific confirmed requirements here when older supporting notes use broader terms such as “full-sheet
access.”

## 1. Current implementation and scope

The [v0.01 scope checkpoint](pre-alpha-design-gaps.md) controls immediate delivery. The requirements in
later sections describe the fuller product; apply these confirmed prototype qualifications first.

| Area | Included in v0.01 | Deferred beyond v0.01 |
| --- | --- | --- |
| Accounts | Sign-up/in/out, profile and credential editing, password recovery, devices and account deletion | Friends, blocking and personal share codes |
| Campaign access | Campaign creation, invitations and membership through the established flow | Separate friends system, including discovery, requests and friendship management |
| Director | Campaign creator serves as Director | Appointing another Director, including standing delegation and session-only appointments |
| Character control | Players control their own admitted characters; Director can act for table characters | Player-to-player character-control sharing |
| Communication | Visible game log under existing gameplay-history access rules | Campaign text chat |

Authentication and authorization remain required for exposed operations. Friendship is not an admission
prerequisite. Keep campaign ownership, Director role, character ownership and permission to act distinct so
future delegation and grants fit the design. Director table authority does not permit selecting another
player's build choices; existing review, session, roster and gameplay restrictions still apply.

Blocking, campaign deletion and other membership/departure exceptions have existing fuller-product policies
below, but their prototype depth is not independently settled by these deferrals. Chat messages and recorded
game activity remain separate concepts. Do not infer removal of privacy or access boundaries from reduced
feature scope.

Convex is the application backend and Better Auth the authentication library; both are installed and running
in this checkout (verified 2026-09-14 against [package.json](../package.json), [convex/schema.ts](../convex/schema.ts),
[convex/auth.ts](../convex/auth.ts), [convex/campaigns.ts](../convex/campaigns.ts) and
[convex/sessions.ts](../convex/sessions.ts)). Implemented: email/password sign-up, sign-in, sign-out, recovery,
password and email changes, signed-in device revocation, profile name and portrait editing, and account deletion through
`@convex-dev/better-auth`, with an application `users` profile mapped to the auth identity; campaign creation;
share-code join requests with owner approve/decline and requester withdraw; owner-only share-code regeneration;
member listing; Director (campaign owner) session start/pause/resume/close and session-player selection;
idempotent `commandId` retries; an attributed campaign event log; private character drafts; and Director-only
foe loading. Tables: `users`, `campaigns`, `memberships`, `joinRequests`, `sessions`, `events`, `commands`,
plus the character and foe tables. Not implemented: member kick/leave, friends, blocking, Director delegation
or session-only appointments, character grants, and owner-initiated campaign deletion. Campaign chat is
implemented; account deletion applies the confirmed campaign deletion policy to campaigns the account owns.
`requireDirector` in `convex/lib/access.ts` currently resolves to the
campaign owner; keep that seam for future delegation. The engine's `actorId` identifies a game entity, not an
authenticated user, and [the local history implementation](../src/history.ts) is the retained headless
experiment, not the application store. Engine validation of ability ownership is not user authorization. See
[app status](workstream-app-status.md) for evidence.

This spec covers regular accounts, friendship and blocking, the separate administration boundary, campaign
discovery and membership, Director delegation, character ownership and delegated play, and implications for
authored content and history. The [data architecture](data-architecture-spec.md) controls storage/session
lifetimes; the [character wizard spec](character-wizard-spec.md) controls builds and review.

## 2. Confirmed product requirements

### Accounts and administration

- A normal user can sign up and manage their account, including name, password, and email.
- Users can create core-rules characters, campaigns, and saved encounters in v1. Homebrew authoring is future
  scope; see the [v1 checkpoint](v1-spec-checkpoint.md).
- V1 has no administration-dashboard functionality. Earlier separate-admin sign-in and powers are future
  design work, not v1 requirements.
- **Better Auth is selected for v1**, using its Convex integration. This supersedes the earlier provisional
  Convex Auth preference and the treatment of Better Auth as an alternative. Convex remains the data system.
- Email-provider integration and the future LAN deployment's recovery/delivery arrangement are deferred
  decisions. Password reset remains the only v1 email flow; its feature requirement is unchanged.

### Friends and blocking

Confirmed v1 chat policy: authors cannot edit or delete their sent campaign-chat messages. This does not alter
campaign deletion, which removes its chat, or account deletion, which preserves username attribution in other
retained campaigns. No separate Director moderation power is established by this decision.

Campaign chat is the only v1 messaging surface. Private direct messages are deferred, independently of
friendship and blocking controls.

- Include a friends mechanic early as a foundation for later features.
- V1 user discovery for friendship uses a personal share code and URL, analogous to campaign share codes/URLs;
  username search is not included. Friend requests, campaign join requests, and character review requests
  surface in the relevant UI areas. There is no notification system in v1. All notifications, including email
  and push event alerts, are deferred beyond v1. Password reset is the only email flow to design for v1. Both
  personal and campaign share codes/URLs can be regenerated by their owner at any time, invalidating the old
  code/link without invalidating already-pending requests.
- Users can send friend requests, approve or deny incoming requests, and revoke requests. Provide the controls
  needed to manage friendship and blocking.
- The basic relationship categories are unaffiliated, friend, and blocked. Pending requests need
  incoming/outgoing presentation within this model.
- Friendship initially provides no additional campaign, character, content, or statistics access. Future
  features may allow users to make campaigns or statistics visible to friends; those visibility features are
  not part of the initial scope.
- A shared mechanism for friendship and blocking is a preferred design direction, not a settled physical
  schema. Their detailed transitions are proposed below.

### Campaigns

- Each campaign has an owner and joined members.
- Campaign/account deletion follows the [lifecycle contract](#campaign-and-account-deletion); v1 has no
  campaign archiving or ownership transfer.
- Each campaign has a share code/URL through which players can request to join. Campaigns default to unlisted;
  the public directory and opt-in listing are deferred beyond v1.
- The owner approves membership requests and can kick members.
- V1 has one user-to-user Block control and no separate campaign-ban feature or independently managed ban.
  Blocking removes the target from every campaign owned by the blocker and prevents new membership
  requests/admission to those campaigns, including future campaigns. It also revokes character shares between
  the two users in both directions. Unblocking lifts the campaign restriction caused by that block. Unblocking
  does not restore removed memberships or revoked character shares; those require fresh admission approval or
  owner-issued sharing. If the blocker owns a campaign whose active Director is the blocked user, active
  Director control immediately returns to the campaign owner. In a campaign owned by someone else where both
  users remain members, blocking does not hide either user's campaign-chat messages: chat access follows
  campaign membership. Remaining active-combat removal handling and invitation behavior still need definition.
- Ownership/membership and play role are separate. A joined member defaults to player; the campaign owner
  defaults to active Director.
- User decision (2026-09-20, campaign home): on campaign-level surfaces every member who is not the
  active Director is presented as a **player**. Observer is a session-level state (a member not selected
  for the current session) and is never shown as a campaign-level tag. The **owner** has a dedicated
  badge, distinct from the **Director** badge; a member who is both shows both. Until active-Director
  delegation is implemented the owner is always the Director, so both badges sit on the owner's card.
- Exactly one Director is active at all times. The owner can promote a player to active Director, either for
  the current session if one is active, or until revoked.
- Being Director does not prevent having campaign characters; a participant can have multiple characters.
- A campaign has only one active session at a time. The Director starts, pauses, and ends it, selects
  participants from campaign members, and can change the session roster when no encounter is active. Encounter
  start locks party players/characters until it ends or is voided. These controls are distinct from the
  campaign owner's power to approve or remove campaign members. See the [table specification](table-spec.md).

### Characters

Confirmed character management outside combat: owners may edit names, appearance, biography, and notes without
Director review, and may detach their own characters without Director approval. Notes retain owner-only
visibility. Pending full edits survive departure as a private draft; detachment does not activate that draft.
Duplication copies the currently active build, excluding pending edits, while retaining the established
independent inventory/history and cleared campaign-value rules. Owners may withdraw a submitted review before
the Director decides. Both the character owner and campaign owner may detach a character. The campaign owner
can kick a player or remove individual attached characters; removing a character alone does not remove its
owner's campaign membership. Director status alone does not grant this campaign-management power. Removed
characters remain owned by their creators and follow the established detachment policy. Existing combat locks
and separate campaign/account deletion rules remain in force.

- A character always belongs to the user who created it. Campaign attachment and sharing do not transfer
  ownership.
- A character is unattached or attached to one campaign only.
- The campaign owner and active Director can view an attached character's sheet and progression history.
  Character notes are private to their owner, including from the Director and campaign owner. Any other
  private-field exclusions remain open. The newer discussion qualifies earlier references to the “full sheet.”
- A character owner can grant another player access to view and run their character in combat, for the current
  session or until revoked.
- Build choices remain with the character owner. Campaign admission and full edits require active Director
  approval unless the active Director owns that character, in which case the change is logged without
  approval. Scoped level-ups are not review gated. Pending full edits leave the existing effective build in
  use.
- Detachment clears campaign values including XP and Victories, retaining current level, build/history,
  authored details, and inventory. Duplication creates an independent character; campaign values clear in the
  duplicate without changing the original.

### Separate relationships and roles

| Concept | Scope and authority |
| --- | --- |
| Regular account | Identifies the user who owns creations and participates in relationships and campaigns. |
| Administrator — future | No v1 app admin-dashboard functionality. Separate administrative access and powers remain future design work. |
| Campaign owner / joined member | Campaign relationship. The owner manages admission, removal, and Director appointments. |
| Active Director / player | Play role within a campaign. Exactly one Director is active; delegation does not transfer campaign ownership. |
| Character owner / delegated controller | The creator retains ownership and build choices; a grant permits another player to view and run the character. |
| Unaffiliated / friend / blocked | Personal relationship, with pending friend requests tracked separately. Friendship initially grants no content access. |

These concepts can overlap for one person. A campaign owner can play while another member directs; either can
own characters. A friend is not automatically a campaign member, and permission to run a character does not
make its recipient a Director.

### Director table capability doctrine

Confirmed direction: **anything a player can do at the table, the Director can also do.** All player table
operations must have a Director equivalent, including choosing Take turn and acting on behalf of characters.
This applies in free play and encounters, and is the default for other table activities. Director authority
remains scoped to the campaign they direct and subject to applicable session/pause constraints. Game-rule
conflicts ordinarily warn under the adaptation principles. Two confirmed limits also apply to Director
invocations: unaffordable abilities cannot execute, and prior-turn events cannot be directly modified
after the next individual turn starts without rewinding first. Source-legal payment exceptions remain
valid. Account/data permissions remain distinct from rules compliance and historical-edit policy.

Character progression is explicitly a separate track. An active Director's own character admission and full
edits are logged and require no approval step. Other characters retain Director review. This exemption does
not bypass build validation, campaign source limits, or combat character-edit locks. The owner makes build and
level-up choices; the Director retains the existing admission/full-edit review role. The doctrine does not
expand character ownership or account administration, and private-field rules continue to apply. This resolves
the earlier scope question; the owner-only rows below remain current requirements.

## 3. Authentication investigation

**Decision, 2026-09-11:** use Better Auth through `@convex-dev/better-auth`. The library comparison is complete.
The checkout installs `better-auth` 1.6.15 and `@convex-dev/better-auth` 0.12.5 ([package.json](../package.json))
and exercises email/password sign-up, sign-in and sign-out; the remaining verification items below are open. The
[v1 tech stack](v1-tech-stack-spec.md#7-authentication-and-email) records the selected integration and the
requirement to preserve a future self-hosted LAN deployment.

Better Auth documents email/password authentication and credential-management operations, including password
changes with optional revocation of other sessions. Its Convex integration provides explicit React/Vite SPA
and TanStack Start setup guides. These support the chosen direction without requiring an additional cloud
identity provider. Configure and test the actual account flows rather than assuming provider defaults match
this spec. [Account management](https://better-auth.com/docs/concepts/users-accounts),
[React integration](https://labs.convex.dev/better-auth/framework-guides/react),
[TanStack Start integration](https://labs.convex.dev/better-auth/framework-guides/tanstack-start).

The earlier Convex Auth research informed this choice; it is not a remaining selection gate. Admin-dashboard
authentication remains outside v1. Provider support for verification emails, OAuth, or MFA does not add those
features to release scope. In particular, password reset is the only v1 email flow; the credential-change
mechanism must respect that boundary. Editing a profile email alone is not changing the login credential.

**Implementation verification:** pin compatible Better Auth/Convex integration versions and exercise signup,
signin, sign-out, forgotten-password recovery, authenticated credential changes, session revocation, and
account deletion. Verify configured origins/session behavior for the selected frontend and future local
deployment. Cloudflare Email Service is selected below; test-message inbox receipt is confirmed, while the local recovery arrangement remains pending; no earlier
Resend suggestion selects a provider. Use provider-supported credential handling rather than custom password
cryptography. Authentication verification does not replace the application authorization cases below.

### Cloudflare account email — 2026-09-17

User selected Cloudflare Email Service and sender `salient@blackgate.studio`; the domain is
reported onboarded. V39 implements password recovery only. Better Auth owns tokens and credential
updates; reset links expire after 30 minutes and a successful reset revokes all provider sessions.
The public request response does not disclose account existence. Reset mail is queued through an
internal Convex action with a canonical `SITE_URL` link and text/HTML content. The sending token is
server-only `CLOUDFLARE_EMAIL_API_TOKEN`, scoped to Blackgate Studio with Email Sending: Edit.

Recovery remains unavailable unless the sending token and site URL are configured. Better Auth
request limits use its persisted database adapter (three recovery requests/minute/client IP and
five reset attempts/minute/client IP); its other auth defaults remain in force. These provider limits
are abuse mitigation, not a strict atomic quota. Convex must supply a trusted client IP header for
IP limits; mail failures are recorded as sanitized internal action errors, without exposing provider
payloads to callers. Queued delivery is acceptance by the mail service, not proof of inbox arrival.

[V39](build/V39-account-email.md) is merged and live on hosted development. Actual hosted browser
checks passed password/session replacement, token reuse rejection and request limiting. Cloudflare
accepted/queued a separate test message to the selected inbox, and the user confirmed receiving it.
V95 adds authenticated profile, credential-change, device-revocation and account-deletion flows.
Offline LAN recovery remains separate work.

### Proposed regular-account behavior

- Give the application user a stable ID independent of email, name, and provider. Resolve validated auth
  identity to that ID server-side. Email changes preserve campaigns, user blocks, characters, and grants.
- Keep login identifiers and credentials separate from public profile fields. Expose display name and an
  appropriate profile identifier in campaign UI, not account email by default.
- V1 email scope is password reset only. The earlier proposed email-verification gate for membership
  requests/sharing is superseded; do not introduce verification email as a v1 dependency.
- Propose recent authentication for credential changes, collision checks, and consistent provider-identity
  updates. Verification of a replacement email and notifications to the old address are not v1 email flows
  under the confirmed password-reset-only scope. The exact email-change mechanism remains to be designed with
  the selected auth provider. Do not link accounts just because a client supplies a matching email.
- Provide sign-out and recovery. Specify and test session revocation on password reset/change rather than
  relying on provider defaults. Account deletion deletes all campaigns owned by that user. Their characters
  and saved encounters are also deleted, including during active combat in another campaign. Past actions and
  chat in retained campaigns keep their username attribution. A deleted active Director is replaced by the
  campaign owner in retained campaigns. Account export and affected combat-participation handling remain open.
- Apply provider-supported credential protection and request limits; keep credentials and verification codes
  out of gameplay logs and public records. Email delivery uses the Cloudflare configuration above;
  storing auth in Convex does not itself deliver mail.
  [Better Auth password recovery](https://better-auth.com/docs/authentication/email-password)

### Proposed admin boundary — future work, outside v1

Confirmed: no app admin-dashboard functionality is required in v1. The proposals below do not create a v1
admin sign-in, role, or capability workstream; ordinary application authorization remains required.

Use explicitly provisioned administrator identities and a separate admin sign-in/session policy. An ordinary
user session, campaign ownership, active Director role, or matching email is insufficient. Every
administrative server operation validates the admin identity, active access, and required sign-in assurance. A
separate URL alone does not establish that boundary.

Prefer MFA for administrators, with recovery and administrator removal specified before release. Whether
admins use completely separate credentials/provider or an explicitly linked identity is open. Define
administrative capabilities individually, including whether any support workflow may inspect private content.
Do not make a generic `admin` flag an implicit bypass of all character/privacy checks. Record administrative
changes separately from game events. The app's admin dashboard is distinct from developer access to the Convex
deployment dashboard.

## 4. Friendship and blocking foundation

**Proposed relationship model:** friendship is mutual after acceptance; blocking is unilateral. Either user
may remove a friendship, and each user controls only their own block. Keep unaffiliated/friend/blocked as the
primary relationship states, with a pending request represented separately as incoming or outgoing. Sending a
request does not make either person a friend yet.

Propose one authoritative record per unordered pair of application user IDs, created only when needed. It can
contain an accepted-friendship timestamp, one pending request with requester and request ID, and a separate
block flag/timestamp for each user. This keeps friendship and blocking in one relationship mechanism while
recording who took each action. Do not create records for every possible pair of users. Lookup must support a
user's bounded friend list, incoming/outgoing requests, and their own blocked list.

The effective internal state is blocked if either user's block is present; otherwise friend if accepted;
otherwise unaffiliated. Blocks and friendship/pending requests cannot coexist as active states. Each user can
inspect their own block status; a block by the other person need not be disclosed. Proposed recipient
presentation is simply unavailable for friendship, rather than exposing who blocked whom. Request history, if
retained for abuse controls, is not an active pending request.

| Control | Who may use it | Proposed result |
| --- | --- | --- |
| Send friend request | Either unaffiliated user, when neither has blocked the other | Create one pending request; show outgoing to sender and incoming to recipient. |
| Approve | Recipient of the current pending request | Clear the request and establish mutual friendship. |
| Deny | Recipient of the current pending request | Clear the request; remain unaffiliated. |
| Revoke/cancel request | Sender of the current pending request | Clear the request; remain unaffiliated. |
| Remove friend | Either friend | End friendship for both; return to unaffiliated. No approval required. |
| Block | Either user | Set that user's block, end any friendship, and cancel pending requests in either direction. Prevent new friendship requests/acceptance while either block remains. Remove the target from blocker-owned campaigns, prevent admission to those campaigns, and revoke character shares in both directions. |
| Unblock | User who placed that block | Remove only their block and lift its restriction on admission to blocker-owned campaigns. Do not restore removed memberships or revoked shares; require fresh admission approval or sharing. Proposed: do not restore friendship or a request; the other user's block remains effective. |

**Proposed consistency rules:** reject self-requests/blocks; repeated sends do not create duplicates. If the
other person has already sent a request, show the incoming request for explicit acceptance rather than
silently approving it through a second send. Each request gets an identity so a delayed
approval/denial/cancellation cannot affect a newer request. Validate caller and both block directions in the
same transaction as each transition. Concurrent approval and blocking must leave the relationship blocked once
the block commits; a retry must not recreate friendship.

**Confirmed discovery and request presentation:** each user has a share code and URL through which others can
reach the friend-request flow, analogous to campaign sharing. V1 has no username search. Relevant screens
surface their requests; no notification system is included in v1. All notifications are deferred; password
reset is the only v1 email flow. Personal and campaign share codes can be regenerated at any time,
invalidating old codes/URLs while preserving pending requests. **Proposed interface:** friends,
incoming/outgoing requests, the blocked list, and code entry/link handling. Propose private relationship
lists, a block list visible only to the blocker, generic unavailable responses for blocked/deactivated
targets, and bounded request rates. Code rotation is confirmed; re-request cooldown remains open. A code/link
locates the request entry point; it does not establish friendship, bypass recipient approval or blocking, or
grant private content access.

**Initial feature boundary:** these records and controls do not themselves grant campaign membership, Director
authority, character viewing/control, homebrew access, or statistics visibility. Friendship removal alone does
not revoke independently granted campaign membership or character access. Future friends-only visibility
should be an explicit resource policy evaluated against current friendship, rather than copying grants to
every friend or exposing data as soon as someone accepts a request. Friend-of-friend access is not implied.

**Confirmed unified blocking policy:** V1 has one user-to-user Block control and no separate campaign-ban
feature or independently managed ban. Blocking removes the target from every campaign owned by the blocker and
prevents new membership requests/admission to those campaigns, including future campaigns. It also revokes
character shares between the two users in both directions. Unblocking lifts the campaign restriction caused by
that block. Unblocking does not restore removed memberships or revoked character shares; those require fresh
admission approval or owner-issued sharing. If the blocker owns a campaign whose active Director is the
blocked user, active Director control immediately returns to the campaign owner. In a campaign owned by
someone else where both users remain members, blocking does not hide either user's campaign-chat messages:
chat access follows campaign membership. Remaining active-combat removal handling and invitation behavior
still need definition. Site-wide suspension remains administrative.

## 5. Campaign discovery, requests, and blocking

**Confirmed campaign sharing (2026-09-15):** codes must be usable when spoken to another person:
at most eight characters, letters and numbers only. Display the code separately from its invitation
URL, with an icon-only copy button beside each field (no visible button label; accessible names identify
which value is copied). The URL uses that same short code as `/join/<code>`. The campaign finder
accepts either the code or the full URL. One replacement action rotates both together.

**Implementation note (2026-09-15):** generate eight uppercase characters from
`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, excluding I/1 and O/0; accept either letter case and trim
surrounding whitespace. Allocation checks uniqueness transactionally and retries collisions. Codes
identify a join-request entry point, never grant membership. Copy buttons show a check icon after
success, announce success accessibly, and report failure with a manual-copy fallback. Existing
32-character tokens are replaced through the paginated internal `campaigns:upgradeShareCodes`
operation: old codes/URLs stop working, while pending requests and memberships remain intact.

**Confirmed v1 discovery:** the public directory is deferred; campaigns are unlisted by default and discovered
through share codes/URLs. **Proposed link-preview contract:** invitation links expose only a recruitment
preview: campaign name, owner display identity, description, and whether requests are open. Public discovery
does not publish sheets, rosters, chat, encounters, private notes, or archives. Public-directory readership is
outside v1; link-preview access and membership remain separate permissions.

The share URL/code identifies a campaign's request entry point; it never creates membership by itself.
Confirmed for both personal and campaign codes: owners can regenerate them at any time. Regeneration
invalidates the old code and URL, preserves already-pending requests, and does not remove established
friendships or campaign memberships. Campaign lookup uses the confirmed short code above; request
limits remain proposed. Pending requests retain their target identity independently of the code used to create
them. Rotation does not bypass blocking or ordinary approval checks.

Proposed request lifecycle: `pending` → `approved`, `declined`, or `withdrawn`. At most one pending request
per campaign/user. Repeated submissions return that request. Approval checks current ownership, campaign
state, requester eligibility, and the campaign owner's user block before atomically creating membership. An
approved member does not need a new request. After decline/kick, another request is allowed unless blocked by
the owner, subject to a proposed cooldown.

Use the user-to-user block as the authoritative restriction; do not add a separate campaign-ban record or
unban control in v1. Check the campaign owner's block against the requester both when requesting and
approving. A pending request cannot bypass a later block. Unblocking permits future requests under normal
membership rules; removed membership and revoked shares do not return automatically and require fresh
approval/sharing.

**Confirmed existing-access behavior:** blocking removes existing memberships in all campaigns owned by the
blocker and revokes character shares between the users in both directions. Proposed implementation also
rejects pending requests to those campaigns and invalidates stale approvals. If the blocked user is the active
Director of a blocker-owned campaign, the owner immediately takes back Director control. Live encounter
removal handling still needs definition; ordinary combat locks must be reconciled with this removal policy.

## 6. Exactly one active Director

For v0.01, the campaign creator is the Director and delegation is deferred, as recorded in section 1.
The following delegation model describes the fuller product.

**Proposed representation:** a campaign has a standing Director, initially its owner, and at most one
current-session override. There is one effective Director, calculated server-side:

1. Use the override if it belongs to the current open session and its target remains an eligible campaign
   participant.
2. On expiry of a current-session appointment, return control to the campaign owner and clear the temporary
   assignment and any prior standing assignment that would otherwise resume.
3. With no session appointment expiring, use the eligible standing Director.
4. Otherwise fall back to the campaign owner.

All other participants have the player role for play. The owner retains campaign-management powers and
attached-sheet visibility while someone else directs. An until-revoked appointment replaces the standing
Director; a current-session appointment overrides that assignment for the session. Confirmed: when the
session-only appointment ends, the campaign owner takes back control; the previous standing Director does not
resume automatically. A new standing appointment clears any override to take effect immediately. A new session
appointment replaces the previous override rather than stacking temporary appointments.

**Confirmed return policy:** expiry of a session-only appointment returns active Director control to the
campaign owner. **Proposed expiry timing:** session-only authority ends when the session leaves `open`, before
archival completes. Closing with an active encounter first requires its keep/reset void choice; validate the
closing Director and commit that outcome with closure before expiring session-only authority. Canceling the
choice leaves the session open. A pause, disconnect, encounter end, midnight, or browser sign-out is not a
session end. Under the proposed lifecycle, pause stays within `open`; it does not expire session-only
authority, although gameplay is frozen. If there is no open session, reject “current session” rather than
silently making it permanent. Closing a session never resurrects an expired grant. Closed sessions are
permanently read-only in v1 and cannot be reopened, including by the Director.

Confirmed example: Alice owns the campaign; Ben was Director until revoked. Alice appoints Cara for session
12. Cara alone directs session 12; on closure Alice resumes. Ben would need a new appointment to direct again.

The owner can revoke/replace appointments. For ordinary removal, restoring eligible standing authority or the
owner atomically remains proposed. Confirmed: when the campaign owner blocks the active Director, control
immediately returns to the owner; a prior standing Director does not resume. Loss of connectivity does not
remove a role. Confirmed: it also never automatically pauses or closes the session, even when the Director or
all clients disconnect. Available player operations retain their normal authorization and rules constraints;
Director absence does not grant Director authority. “Active” denotes assigned authority, not continuous online
presence. Delegates cannot further delegate Director authority unless a future requirement grants it.

**Confirmed constraint:** only one active session per campaign. The [table specification](table-spec.md)
places the table inside that session and proposes retaining the slot while paused or closing. Session roster
membership, online presence, and selected characters are distinct from campaign membership. Owner account
deletion deletes their owned campaigns. Suspension still needs a policy so an operational campaign is never
left with an ineligible sole fallback. Campaign ownership transfer and archiving are excluded from v1; do not
assume automatic succession.

### Observing a session

Any current campaign member may observe the active table without selection as a session player and may use
campaign-level party chat. Observers cannot interact with the session or invoke its gameplay commands.
Character ownership/sharing alone does not bypass player selection; the active Director retains their separate
authority. Observation does not alter the encounter's locked party roster. Becoming a player requires Director
selection when no encounter is active and the session is not paused.

Observer reads expose only the permitted table audience view. This permission does not grant private sheets,
owner notes, or Director-only information. Players and observers cannot inspect monster stat blocks at the
table; the Director controls each foe's show/hide toggle, and visible foes receive the campaign-selected
Numerical, Bar, or Winded health presentation. Proposed audience queries omit hidden foes from the roster
payload. Showing a foe grants neither full stat-block access nor control. Hidden foes remain usable by the
Director, including attacking players without first showing their roster entry; visibility does not determine
gameplay activity or grant in-game concealment. For now, a hidden foe's name is not concealed in game-log
entries; that does not reveal its roster entry or full stat block. The Director manages catalog additions,
removals, and saved-encounter replace/append loads through the foes roster. The Director may manage the foes
roster between sessions and during running combat, including adding/removing participating monsters or
loading templates. Pausing locks both rosters until resume, including session-player/character changes,
foe additions/removals, regrouping and saved-encounter loads. Executing monster gameplay actions retains the separate running-session
requirement. The active Director can change that campaign setting at any time and retains full monster access.
Show Malice is a campaign setting, off by default, managed by the active Director. The current shared
Malice pool is always Director-visible and shown to players/observers only while enabled; enforce this
in shared audience reads, not just the widget. It does not alter Malice mechanics or full action-source
disclosure. Director Void is an explicit lifecycle exception while paused: the existing keep/reset operation may
end the encounter without resuming, and the session pause/roster lock remains. Ordinary gameplay and
roster editing are still blocked. Public glossary access is unaffected. Full peer sheets are not visible by default; party Stamina/Recoveries
are shared. Ordinary rolls are public and planned tower results are Director-only. Historical disclosure and
proposed explicit content sharing still need definition. Proposed queries should distinguish campaign-member
reads/chat from selected-player gameplay permissions. Losing session-player status can leave observation/chat
access through continuing campaign membership; losing campaign membership removes that basis for access.

### Table rolls and content disclosure

Confirmed refinement: every used action exposes its complete verbatim source ability/action text through
the shared game log, including monster actions and actions the parser cannot resolve. The table can compare
that text with the actual resolution. This grants neither full live monster-stat-block access nor unrelated
private sheet fields. See [rules adaptation principles](rules-adaptation-principles.md).

Rolls are public to the permitted table audience by default. Planned tower rolls expose the result only to the
active Director, not to the submitting player or observers. Authorize the result independently of the right to
request the roll; do not include hidden results in the submitter's response. Later reveal and historical
readership remain open.

A way to deliberately share abilities, sheets, and monster blocks is proposed, potentially through campaign
chat. Its audience, content snapshot/live behavior, and private-field exclusions need definition. Showing
content is distinct from granting character control or build rights; ordinary table privacy remains until a
supported explicit sharing operation permits disclosure.

## 7. Character visibility and delegated play

The [encounter sheet lock](table-spec.md#character-sheet-lock-during-encounters) blocks sheet editing,
progression, and build activation while a character is in an encounter, for owners and Directors alike.
Authorized encounter gameplay updates the main sheet immediately. Viewing and chat remain available; pausing
retains the edit lock.

Confirmed default: players cannot inspect other players' full sheets, but can see their Stamina and
Recoveries. Existing owner, campaign-owner/Director, and explicit character-grant permissions still apply. A
configurable party-resource visibility policy is a possible later extension.

**Confirmed privacy boundary:** character notes are visible only to the character owner, including hidden from
the Director. **Proposed implementation:** store owner-private notes separately from the shareable sheet and
mechanical progression history. Exclude them server-side from other users' sheet queries, exports, search
results, subscriptions, review snapshots, and archives. Merely hiding a notes panel is insufficient. Private
notes should not enter engine inputs or game events. Imported opaque data may contain notes and needs the same
treatment.

All nonowners, including campaign owners, Directors, and delegated players, receive the sheet permitted by
their role without owner-private notes. This preserves mechanical review access without treating every
authored field as public to the campaign.

**Confirmed sharing scope:** grants are limited to current members of the character's campaign. An owner may
share with several eligible campaign members simultaneously, each with their own grant. They provide sheet
viewing, progression-history viewing, and combat control together, with owner-private notes excluded and
personal inventory still restricted to its owner and active Director. History access does not grant editing or
restoration. Proposed persistence binds each grant to the specific campaign attachment. A separate view-only
option is not yet required.

| Capability | Character owner | Campaign owner | Active Director | Player with a valid character grant | Other campaign member |
| --- | --- | --- | --- | --- | --- |
| View attached sheet | Yes | Yes | Yes | Yes | No full-sheet access by default; party Stamina and Recoveries are visible |
| View progression history | Yes | Yes | Yes | Yes, within the shared campaign | No default access |
| View owner-private notes | Yes | Only for own character | Only for own character | No | No |
| Choose build/level-up options | Yes, under wizard rules | Only for own character | Only for own character | No | No |
| Approve campaign admission/full edits | If active Director, own changes are logged without approval | Only if active Director, for others' characters | Approves others; own admission/full edits are logged without approval | No | No |
| Run this character in combat | Yes, if admitted and otherwise eligible | Not granted by ownership of campaign alone | Yes, for any character at the table, without an owner share; session/pause constraints apply and game-rule conflicts warn | Yes, within authorized operations, including deliberate rules departures | No |
| Grant/revoke access to this character | Yes | Only for own character | Only for own character | No | No |
| Delete, duplicate, export, or detach the character | Outside combat, own detachment needs no Director approval; duplication uses active build. Export is not required in v1. | May detach attached characters or kick a player; does not acquire ownership or character deletion/duplication rights | Director role alone grants no confirmed detachment authority over others | Not granted | Not granted |

Rows combine permissions when one person holds several roles. No row grants a global write endpoint: combat
control permits validated operations and their resolved effects, including spending items/resources where the
game permits it, not arbitrary build or inventory edits. The Director now has confirmed session
start/pause/end and roster controls, and awards applicable encounter Victories through the table workflow. The
Director can also void an encounter without normal ending benefits/consequences, choosing current or
pre-encounter character/monster state. The active Director can take gameplay actions on behalf of any
character at the table without an owner-issued share, whether or not its owner is connected. This retains
session/pause/turn constraints and does not delegate build choices. Players sequentially undo their
character's uninterrupted latest actions only to the nearest seam, with turn/FreePlay start as outer
bounds. Another character's action or committed Director correction closes the window, even when
characters share a controller. Director sequential undo/redo crosses seams within the current encounter. Enable user undo is a confirmed campaign
setting, enabled by default. Disabling it blocks player undo while preserving Director undo/redo. The table spec owns
remaining undo-unit/concurrency, correction and XP/reward details; the sequential undo seam is settled. Effects from
another actor may still legitimately change a hero through authorized game resolution.

Proposed grant fields: character, attachment, recipient membership, grantor, scope (`session` or
`untilRevoked`), explicit session ID for session scope, and revocation metadata. Membership/attachment
identity prevents old grants reviving after someone rejoins or a character reattaches. Sheet viewing and chat
remain available while paused and outside sessions under their existing access policies. “Until revoked”
viewing can operate between sessions while that relationship remains valid; session-only grants still expire
under the closure policy. Gameplay actions require an eligible running, unpaused session. Inventory management
is character data, and transfers between a player's character inventory and party inventory are allowed
between sessions under current access rules; this does not revive expired grants. Always-available access does
not revive expired grants or expose another user's private sheet.

The [table specification](table-spec.md) lets selected participants choose owned or granted characters for
session play, including free-play actions and encounters. A combat-only label must not prevent their permitted
free-play use; build editing remains owner-only. Ordinary session removal is blocked while an encounter locks
the party roster; end or void it first. Removal then stops session commands. Continuing sheet access and
underlying grants remain separately governed. Campaign removal or grant revocation still invalidates access
immediately even during a locked encounter; this exception needs recovery behavior rather than delayed
authorization enforcement.

An existing session player may take over an existing encounter character only through a valid share already
granted by its owner to that specific player. The active Director has separate on-behalf authority without
such a grant. Both can operate without ending the encounter because the party roster is unchanged. This does
not admit a new player through the encounter roster lock.

The owner retains their access while another player runs the character. Multiple simultaneous recipients are
confirmed. Concurrent-command handling remains proposed: serialize accepted commands against current state
without introducing exclusive possession implicitly. Attribute each command to the authenticated user and
separately to the controlled character.

Session grants expire at the same session boundary as Director overrides. Explicit revocation, recipient
departure/removal, or attachment termination invalidates the relevant grant immediately for future authorized
operations. These relationship-based invalidations are proposed defaults. A grant cannot be forwarded,
transferred to a duplicate, carried into another campaign, or used to approve builds.

### Encounter-builder campaign imports

Confirmed: users may import party stubs into the encounter builder from any campaign they own or for which
they are the active Director. Either role suffices; ordinary membership alone does not. Proposed enforcement
revalidates that role on import and returns only the summary/rules inputs needed for planning. The builder
also supports hypothetical stubs with adjustable levels. Removing an imported stub, editing its planning
level, or resetting it to its source character's current actual level only changes the planning party, never
its source character or campaign roster. Proposed reset reads must use current authorized character access.
This planning access does not grant live gameplay authority or another character's progression choices.

### Inventory and object sharing

Observers cannot claim items from the visible Director's stash; they cannot interact with the session. Stash
visibility alone does not grant claim authority. Outside-session allocations retain their separately
established flow.

Confirmed v1 direction includes campaign-level character and party inventories, equipped/unequipped mechanics,
and transfers between them, including between sessions. Inventory management is character data, not a
gameplay-action exception; inventory management works while paused unless the character is combat-locked.
Personal inventory inspection is limited to its owner and active Director; this is the specific inventory
boundary where broader character-sheet permissions would otherwise be read as granting peer access. V1 has no
direct character-to-character transfers, player-created personal inventory entries, or free-text custom items.
Starting equipment is part of character creation; players obtain later loot through the Director's stash with
final allocation approval; transfers of existing party items remain supported. Players may discard items from
their own or the shared party inventory but cannot return items to the Director's stash. The Director can
review, undo, and redo inventory transfers, discards, and edits from their history. Players can read their own
character inventory history; all current campaign members can read party inventory history. These read
permissions do not grant player undo or access to unrelated private character inventories. Players cannot undo
changes to their own inventory or changes they made to the shared party inventory, even when campaign gameplay
undo is enabled. Owners retain access to their character's personal inventory history after it leaves the
campaign; this personal-history permission leaves party-history access governed by current campaign
membership. Dependency handling remains open. The active Director can directly edit character inventories
beyond inspection and loot allocation, subject to the existing combat character-edit lock; this does not grant
progression choices. The Director's stash lets party members claim awarded/discovered loot into party or
individual inventories. The Director can add/remove stash contents at any time, including before, during, and
after encounter wrap-up; direct character-inventory editing is separately authorized as above, while its
existing combat lock remains in force. The whole stash is hidden until the Director shares it, with a
show/hide toggle proposed. The Director can reveal it at any time. Whenever visible, players can propose
taking items inside or outside wrap-up; the Director adjudicates and approves the final end state before
deposits occur. Once a claim is accepted, its item is unavailable for a second claim; the Director retains the
ability to reassign it before approval, and a player may withdraw their own unapproved claim to make the item
available again. This allocation flow is sufficient for v1 sharing and richer mechanisms are deferred.
Revealing it does not itself transfer items. During encounter wrap-up, players can freely submit provisional
claims, and the Director may adjudicate/reassign allocations. Only Director approval of the final allocation
deposits items into the final destinations, through wrap-up completion or the same finalization outside
wrap-up; a player claim does not itself grant item possession or use. Hiding the stash cancels provisional
claims and blocks Director approval until visible again. Item stacks are excluded from v1. Remaining
shared-character action authority and detailed item-operation timing remain open in the
[inventory specification](inventory-spec.md). General object sharing through messages is a reinforced product
direction; displaying an object does not itself transfer items, grant control, or expose its whole source
inventory.

## 8. Membership removal, history, and other owned content

### Campaign and account deletion

V1 has no campaign archiving or campaign ownership transfer. The campaign owner can delete a campaign;
deletion is the only campaign end-of-life operation in v1. Deletion automatically detaches attached characters
under the existing detachment rules: retain current level, build, authored details, inventory, and personal
history, while clearing campaign values including XP and Victories. It permanently removes campaign chat,
session logs, the foes roster, party inventory, and the Director's stash. The owner does not have to close a
running or paused session before deleting the campaign. Campaign deletion does not offer the combat keep/reset
choice. Proposed default: preserve the character's current recorded state before applying the confirmed
detachment resets, without restoring the encounter-start checkpoint or running encounter rewards. Saved
encounters are user content, not campaign content, and survive campaign deletion. Deleting a user account also
deletes every campaign that account owns, using the campaign deletion policy; other users retain their
detached characters. Account deletion also deletes that user's characters and saved encounters. In other
users' retained campaigns, their past actions and chat remain attributed to their username, not a generic
deleted-user label. Account deletion is allowed even while their character is in another campaign's active
combat; combat locks must not prevent deletion. Historical attribution does not preserve a usable account or
live character. If a deleted account was the active Director of another user's retained campaign, that
campaign's owner automatically becomes the active Director. This changes the play role, not campaign
ownership. Handling affected combat participation still needs an operational contract. The deletion flow must
terminate live campaign activity and release its character locks without requiring a separate prior
session-close operation. This does not remove the existing closed-session history and storage-compression
requirements for retained campaigns.

### Membership departure and retained history

Propose that kick/leave immediately removes campaign access and invalidates membership-dependent control.
Restore Director authority in the same transition when necessary. The departing user's characters remain
theirs. Proposed cleanup detaches those characters, clearing campaign values under existing rules while
preserving retained character data; the exact reconciliation during an unresolved combat action remains open.
Loss of authorization must take effect even if bounded cleanup continues later.

Confirmed: all current campaign members can read all past session logs by default, including sessions they did
not attend. Session attendance is not a history-access requirement. Separate Director-only history views can
be introduced when specific information requires them; do not require a distinct history view for each role in
advance. Existing live-table/tower visibility requirements remain separate, and this does not grant access to
unrelated private character/account data.

Existing events remain campaign records with historical actor attribution and the necessary historical
sheet/content snapshots. Removing a member or grant does not undo their already committed game actions. Future
reads follow current history policy; former-member archive access and historical Director secrets require
decisions. Character notes remain owner-private and must be excluded from shared history. Never authorize a
present-day character edit merely because a caller can inspect an old snapshot.

Saved encounters retain their creator's ownership and can be duplicated as independent owned templates.
Homebrew ownership/access below is future architecture, outside v1. **Confirmed v1 saved-encounter policy:**
private to the creator; sharing is deferred. Campaign membership or Director authority does not grant access
to another user's saved templates. Loading one's own template produces independent roster instances governed
by campaign/table access, without sharing the source template. **Proposed homebrew default:** private until
explicitly shared or published. Do not inherit public visibility from a campaign listing, or grant access to a
person's whole homebrew library because one character uses a definition from it. Proposal: permit the campaign
to read the exact mechanical revision required by an admitted character/loaded encounter, while keeping
unrelated drafts private; confirm this derivative-use permission before implementation.

Saved encounter loads already create independent snapshots. Changes or later withdrawal of the source must not
rewrite historical outcomes. Define which retained snapshots remain available when source access is revoked,
and whether shared homebrew can be copied, edited, exported, or publicly published. Do not automatically apply
character control grants to homebrew or encounter authoring.

## 9. Proposed Convex authorization and data contracts

Authenticate at every private server entry point, then load current application ownership, memberships, user
blocks, grants, and lifecycle state. Convex provides identity in server functions. The v0.01 checks (signed-in profile, campaign
membership, owner-as-Director) exist in `convex/lib/access.ts`; grant, block and delegation authorization still
need implementation. [Auth in functions](https://docs.convex.dev/auth/functions-auth)

Keep the rules engine independent of Convex and authentication. Online UI and headless clients submit to the
same authorized application operations; the application resolves which game entities that user may control
before invoking the deterministic engine. Do not trust caller-supplied owner IDs, role flags, session scope,
or game `actorId` as identity proof.

| Logical records | Main purpose and lookup |
| --- | --- |
| Users and auth identity mapping | Stable application identity, private settings, public profile projection, personal share code/URL lookup; no v1 username search. Authentication lookup uses validated issuer/subject or provider user ID as appropriate. |
| Admin identities/access — future, outside v1 | Separate provisioning and sign-in policy; lookup by validated admin identity. Exact schema depends on selected admin auth. |
| Campaigns | Owner, standing Director, current session/override, and share-code lookup; owner/member listings. Public directory indexing is future work. |
| Memberships and join requests | Campaign/user membership generation and request state; lookup by campaign/user and user/status. |
| User relationships | One pair record for friendship, current directed request, and each user's block; participant lookups for private lists and current-state authorization. |
| User blocks and invite tokens | Directional user blocks govern admission/removal across blocker-owned campaigns; no independent campaign bans. Token lookup remains scoped to campaign and rotation state. |
| Character identities/attachments | Creator owner ID, current/reserved campaign attachment and generation. |
| Character grants and private notes | Grants indexed by character/recipient/context; notes queried only through owner authorization. |
| Access-change records | Who approved, removed, blocked, unblocked, delegated, revoked, or performed an administrative operation, with appropriate restricted readership. |

These are logical records, not a committed schema. Use indexed bounded reads for actual access paths. Enforce
uniqueness and the one-effective-Director/one-attachment invariants inside mutations, including under
concurrent requests.

Authorization is evaluated against current records for each operation. Recheck when committing results of work
that ran outside a mutation. If a member is kicked or a grant expires while a command resolves, it cannot
later commit under stale authority. A legitimately committed action remains committed if its response races
with revocation.

Authorized reactive queries must read the membership/grant/lifecycle records on which they depend so
permission changes update subscribed results. Remove no-longer-authorized data from client state. Revocation
controls future server access; it cannot erase material a person already viewed or downloaded. Private
file/archive delivery also needs access-aware serving: a raw storage URL must not become a permanent
alternative to authorization checks.

Keep ownership, friendships, friend requests, blocks, memberships, grants, credentials, and private notes
outside gameplay before/after snapshots. Game undo must never restore a friendship or revoked grant, remove a
block, reinstate a kicked member, change a password, or make an expired session assignment valid. Archive
workers receive bounded internal work references and must preserve audience separation.

## 10. Acceptance scenarios for implementation

These are target behaviors, not tests already implemented or passing. Proposed outcomes depend on the
corresponding policy being accepted.

| Scenario | Expected outcome |
| --- | --- |
| Email/password change | Authorized changes preserve application identity and owned records; old credentials/session behavior matches the chosen revocation policy. V1 only designs password-reset email; credential-change details remain open. |
| Share code regeneration | Personal and campaign owners can regenerate codes anytime. Old codes/URLs stop accepting new requests; pending requests and established relationships/memberships remain intact. |
| Request presentation | Relevant screens surface requests without a notification system; email/push notifications are deferred. Password-reset email remains in scope. |
| Future admin boundary (outside v1) | A normal session, including one for a campaign owner or a matching admin email, cannot invoke admin operations without separate valid admin authorization. |
| Friend request lifecycle | Only the recipient approves/denies and only the sender cancels the current request. Acceptance creates one mutual friendship; denial/cancellation leave users unaffiliated. |
| Remove friend | Either participant can remove friendship; independent campaign membership and character grants remain unchanged. |
| Block/unblock | Blocking removes blocker-owned campaign memberships and revokes character shares both ways. Unblocking lifts the restriction but restores neither membership nor shares; fresh approval/sharing is required. Proposed friendship/request cleanup remains separate. |
| Blocked Director | Blocking the active Director of a campaign you own immediately returns Director control to you. |
| Shared campaign chat | Where both users remain members of a third-party-owned campaign, blocks do not hide their campaign-chat messages. Membership still governs access. |
| Relationship races | Duplicate/crossed requests do not create two pending requests or silently accept friendship. Stale request controls cannot affect a new request; blocking wins over concurrent acceptance. |
| Social privacy and scope | A third party cannot list private relationships, requests, or blocks. Friendship alone exposes no private campaigns, sheets, homebrew, or statistics. |
| Monster visibility | Player/observer table reads omit stat blocks and provide only the selected health presentation; the Director can inspect full state and change the campaign health mode at any time. Public glossary access remains available. |
| Campaign observer | Current member outside the player roster can watch and use campaign chat, but cannot take turns, roll for session actions, or otherwise operate the session. Ownership/sharing does not bypass selection. |
| Share-code/link discovery | Visitor can see only the recruitment preview; possession of code or campaign ID does not expose private data or grant membership. |
| Approval race | Duplicate approval produces one membership; an owner's block between request and approval prevents admission. |
| User block and campaign access | Blocking removes the target from blocker-owned campaigns and prevents new requests/admission, including future campaigns; revokes character shares in both directions. Unblocking lifts this restriction. No separate campaign-ban feature exists. |
| Temporary Director | Exactly one effective Director; closure expires the override even if archival fails. The campaign owner resumes; a previous standing Director does not automatically resume. |
| Deleted Director | In a retained campaign, account deletion automatically assigns the active Director role to the campaign owner; campaign ownership is unchanged. |
| Removed Director | Kick/revocation restores eligible authority atomically; stale delegated commands and review approvals fail. |
| Character grant | Recipient can view permitted sheet data and run admitted character; takeover requires a valid owner-issued share to that specific user. Cannot edit build, forward grant, or read private notes. |
| Director on-behalf action | Active Director can act for any table character without a share or disconnect prerequisite, subject to pause/session/rules. Log identifies Director and character separately; campaign ownership alone does not grant this power. |
| Grant expiry/rejoin | Session closure expires session-scoped grants only; until-revoked grants can persist. Revocation, applicable removal, and detach invalidate the affected access. Rejoining/reattaching or starting a new session does not revive the old grant; closed sessions cannot reopen in v1. |
| Character privacy | Notes cannot leak via sheet, review, import download, export, subscription, search, engine payload, or archive. |
| Concurrent commands | Owner/delegate retries and simultaneous actions cannot duplicate spending or overwrite a newer accepted result. |
| Account deletion | Deletes owned campaigns, characters, and saved encounters even during combat in another campaign. Other users retain their characters under campaign detachment rules; retained campaigns keep historical actions/chat attributed to the original username. |
| Private edits and review withdrawal | Outside combat, owners edit names/appearance/biography/notes without review and can withdraw an undecided submission. Departure preserves pending edits privately; duplication excludes them. |
| Character removal authority | Character owners can detach their own; campaign owners can remove an individual character or kick a player. Director status alone does not grant that authority; character ownership is retained. |
| Chat authorship | Authors cannot edit or delete sent campaign-chat messages. Campaign deletion still removes campaign chat; account deletion preserves attribution in retained campaigns. |
| Character departure | Creator retains character; campaign values clear without losing level/history/inventory; historical records cannot alter its new attachment. |
| Undo and snapshots | Undo affects game state only; blocks and revocations stay effective. Source edits/revocations do not reinterpret recorded outcomes. |
| Cross-scope attack | Guessed character/session/storage IDs, forged owner IDs, and grants for another attachment cannot read or mutate protected data. |

## 11. Remaining decisions

The [v1 checkpoint](v1-spec-checkpoint.md) separates release scope from implementation work. Do not reopen
settled roster, sharing, blocking, privacy, discovery, or notification decisions.

- Define forced removal and grant-revocation recovery during combat, without delaying loss of authorization.
  Ordinary roster changes still follow the combat lock; campaign/account deletion and access revocation have
  separate contracts.
- Specify early Director revocation/removal beyond the confirmed owner fallback on session expiry, owner
  block, and account deletion.
- Define any private fields beyond owner-private notes and restricted personal inventories, and any historical
  disclosure for tower rolls/Director secrets. Current members' default access to session history is settled.
- Complete regular-account credential-change/reset and session-revocation behavior using the selected Better
  Auth integration. Email delivery and future LAN recovery arrangements remain deferred decisions. Password
  reset is the only v1 email flow; no admin-dashboard implementation is required.
- Resolve campaign-deletion character-state settlement: no keep/reset prompt is confirmed; retaining current
  recorded values before detachment resets remains a proposed default.
- Define remaining invitation/block races, re-request cooldown, and former-member campaign-history access.
  Personal inventory-history retention is already confirmed.
- Define correction/reward authority and gameplay undo dependencies in the deferred rules/resolution
  workstream. Inventory review/undo permissions are already specified separately.

Admin suspension workflows, homebrew publication rights, and friends-only statistics visibility belong to
future scope.

Resolve the decisions needed by exposed features before implementing their dependent operations. For
v0.01, prioritize basic accounts, campaign invitations/membership, private character ownership, creator as
Director and authorized table access. Friends, delegation, character-control grants, chat and expanded
account management follow their explicit deferrals in section 1. Blocking scope and lifecycle exceptions
remain separate decisions; do not make every fuller-product access feature an initial prerequisite.
