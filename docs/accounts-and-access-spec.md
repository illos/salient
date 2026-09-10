# Accounts, roles, ownership, and sharing

Version: 0.3 — consolidated specification checkpoint, 2026-09-10.

**Status:** the accounts, roles, ownership, sharing, and friendship discussion is captured for future implementation. **Confirmed requirements** record product decisions. **Proposals** make those requirements concrete for review. **Open decisions** remain unsettled; checkpointing this document does not approve its proposed defaults. Authentication and these access workflows are not implemented by this work.

This is the primary specification for account and social relationships and application access. The [feature inventory](product-features.md) summarizes it; the [character wizard specification](character-wizard-spec.md) retains authority over build and review behavior; the [data architecture](data-architecture-spec.md) retains authority over storage and gameplay history. Follow the specific confirmed requirements here when older supporting notes use broader terms such as “full-sheet access.”

## 1. Current implementation and scope

Convex is the chosen application backend. This checkout currently has no Convex package, backend schema, account system, or multiplayer authorization implementation. [package.json](../package.json) contains only development dependencies; [the local history implementation](../src/history.ts) persists combat runs to files. The engine's `actorId` identifies a game entity, not an authenticated user. Engine validation of ability ownership is not user authorization.

This spec covers regular accounts, friendship and blocking, the separate administration boundary, campaign discovery and membership, Director delegation, character ownership and delegated play, and implications for authored content and history. The [data architecture](data-architecture-spec.md) controls storage/session lifetimes; the [character wizard spec](character-wizard-spec.md) controls builds and review.

## 2. Confirmed product requirements

### Accounts and administration

- A normal user can sign up and manage their account, including name, password, and email.
- Users can create characters, homebrew content, and campaigns. Saved encounters are also user-owned under the existing feature inventory.
- An administration dashboard has its own special sign-in requirements, separate from regular user accounts. Its exact authentication methods and administrative powers are not yet specified.
- Prefer Convex's auth system unless investigation identifies a good reason to choose otherwise. Convex remains the data system regardless of the authentication choice.
- The user explicitly accepts Better Auth as an alternative if Convex Auth does not meet the requirements; the final library choice remains open.

### Friends and blocking

- Include a friends mechanic early as a foundation for later features.
- Users can send friend requests, approve or deny incoming requests, and revoke requests. Provide the controls needed to manage friendship and blocking.
- The basic relationship categories are unaffiliated, friend, and blocked. Pending requests need incoming/outgoing presentation within this model.
- Friendship initially provides no additional campaign, character, content, or statistics access. Future features may allow users to make campaigns or statistics visible to friends; those visibility features are not part of the initial scope.
- A shared mechanism for friendship and blocking is a preferred design direction, not a settled physical schema. Their detailed transitions are proposed below.

### Campaigns

- Each campaign has an owner and joined members.
- Each campaign has a share code/URL through which players can request to join. A campaign can also be listed publicly in the site's campaign directory.
- The owner approves membership requests and can kick members.
- A user can ban another user; that person can no longer request to join campaigns owned by the banning user. This is an owner-wide restriction, not merely a restriction on the campaign where an incident occurred.
- Ownership/membership and play role are separate. A joined member defaults to player; the campaign owner defaults to active Director.
- Exactly one Director is active at all times. The owner can promote a player to active Director, either for the current session if one is active, or until revoked.
- Being Director does not prevent having campaign characters; a participant can have multiple characters.

### Characters

- A character always belongs to the user who created it. Campaign attachment and sharing do not transfer ownership.
- A character is unattached or attached to one campaign only.
- The campaign owner and active Director can view an attached character's sheet and progression history. Some fields, such as player notes, may be excluded; the precise private-field boundary is open. The newer discussion qualifies earlier references to the “full sheet.”
- A character owner can grant another player access to view and run their character in combat, for the current session or until revoked.
- Build choices remain with the character owner. Campaign admission and full edits require active Director approval; scoped level-ups are not review gated. Pending full edits leave the existing effective build in use.
- Detachment clears campaign values including XP and Victories, retaining current level, build/history, authored details, and inventory. Duplication creates an independent character; campaign values clear in the duplicate without changing the original.

### Separate relationships and roles

| Concept | Scope and authority |
| --- | --- |
| Regular account | Identifies the user who owns creations and participates in relationships and campaigns. |
| Administrator | Separate administrative access and sign-in requirements; its exact powers remain open. |
| Campaign owner / joined member | Campaign relationship. The owner manages admission, removal, and Director appointments. |
| Active Director / player | Play role within a campaign. Exactly one Director is active; delegation does not transfer campaign ownership. |
| Character owner / delegated controller | The creator retains ownership and build choices; a grant permits another player to view and run the character. |
| Unaffiliated / friend / blocked | Personal relationship, with pending friend requests tracked separately. Friendship initially grants no content access. |

These concepts can overlap for one person. A campaign owner can play while another member directs; either can own characters. A friend is not automatically a campaign member, and permission to run a character does not make its recipient a Director.

## 3. Authentication investigation

Official documentation checked on 2026-09-10. No package version is installed here; verify APIs against a pinned version during implementation.

| Candidate | Evidence and fit | Decision at this checkpoint |
| --- | --- | --- |
| Convex Auth (`@convex-dev/auth`) | Runs authentication in Convex. Documents passwords, email verification/recovery, email links/codes, and OAuth; remains beta. Client-side React and React Native are supported; Next.js server integration is experimental. [Overview](https://docs.convex.dev/auth/convex-auth) | Provisional choice for regular accounts, consistent with the user's preference. |
| Convex Auth for stronger admin sign-in | Its FAQ explicitly says built-in MFA, passkeys, hardware keys, and SSO are not supported. [FAQ](https://www.convex.dev/auth) | Do not assume ordinary password login satisfies the separate admin requirements. Determine those requirements before choosing the admin implementation. |
| Better Auth with the Convex integration | The integration lists Two Factor among its supported plugins. It is a distinct auth library integrated with Convex, not another name for Convex Auth. [Integration support](https://labs.convex.dev/better-auth/supported-plugins) | User-accepted alternative if stronger sign-in or account-management work makes Convex Auth a poor fit; no final selection or installation yet. |

Convex Auth's documented Password flows cover signup, signin, reset, reset verification, and email verification. They do not list dedicated change-email or authenticated change-password flows. This is an integration gap to investigate, not proof those features are impossible. Editing a profile email alone must not be mistaken for changing the login credential. [Password API](https://labs.convex.dev/auth/api_reference/providers/Password)

Better Auth explicitly documents verified email changes and password changes using the current password, with an option to revoke other sessions. These are reasons to compare implementation effort if the Convex Auth account-settings spike needs substantial custom credential logic. [Account management](https://better-auth.com/docs/concepts/users-accounts)

**Proposed decision process:** evaluate signup, verification, signin, forgotten-password recovery, authenticated password change, verified email change, and session revocation against the admin requirements. Convex Auth is the starting preference; Better Auth on Convex is an accepted alternative for the account system if it meets the combined requirements more cleanly. A separate admin provider remains an option, not a requirement. Verify the selected library with a pinned-version implementation spike before committing to it. Do not write custom MFA or password cryptography to preserve a tentative library choice. This spike is future implementation work.

### Proposed regular-account behavior

- Give the application user a stable ID independent of email, name, and provider. Resolve validated auth identity to that ID server-side. Email changes preserve campaigns, bans, characters, and grants.
- Keep login identifiers and credentials separate from public profile fields. Expose display name and an appropriate profile identifier in campaign UI, not account email by default.
- Require verified email before membership requests and sharing. Exactly what an unverified user may create privately remains a product choice.
- Use recent authentication for credential changes. Verify a replacement email before activating it; notify the old address. Check collisions and update the provider identity consistently. Do not link accounts just because a client supplies a matching email.
- Provide sign-out and recovery. Specify and test session revocation on password reset/change rather than relying on provider defaults. Account deletion, export, and ownership of campaigns after deletion need a separate lifecycle decision.
- Apply provider-supported credential protection and request limits; keep credentials and verification codes out of gameplay logs and public records. Email delivery still needs configuration; storing auth in Convex does not itself deliver mail. [Password setup](https://labs.convex.dev/auth/config/passwords)

### Proposed admin boundary

Use explicitly provisioned administrator identities and a separate admin sign-in/session policy. An ordinary user session, campaign ownership, active Director role, or matching email is insufficient. Every administrative server operation validates the admin identity, active access, and required sign-in assurance. A separate URL alone does not establish that boundary.

Prefer MFA for administrators, with recovery and administrator removal specified before release. Whether admins use completely separate credentials/provider or an explicitly linked identity is open. Define administrative capabilities individually, including whether any support workflow may inspect private content. Do not make a generic `admin` flag an implicit bypass of all character/privacy checks. Record administrative changes separately from game events. The app's admin dashboard is distinct from developer access to the Convex deployment dashboard.

## 4. Friendship and blocking foundation

**Proposed relationship model:** friendship is mutual after acceptance; blocking is unilateral. Either user may remove a friendship, and each user controls only their own block. Keep unaffiliated/friend/blocked as the primary relationship states, with a pending request represented separately as incoming or outgoing. Sending a request does not make either person a friend yet.

Propose one authoritative record per unordered pair of application user IDs, created only when needed. It can contain an accepted-friendship timestamp, one pending request with requester and request ID, and a separate block flag/timestamp for each user. This keeps friendship and blocking in one relationship mechanism while recording who took each action. Do not create records for every possible pair of users. Lookup must support a user's bounded friend list, incoming/outgoing requests, and their own blocked list.

The effective internal state is blocked if either user's block is present; otherwise friend if accepted; otherwise unaffiliated. Blocks and friendship/pending requests cannot coexist as active states. Each user can inspect their own block status; a block by the other person need not be disclosed. Proposed recipient presentation is simply unavailable for friendship, rather than exposing who blocked whom. Request history, if retained for abuse controls, is not an active pending request.

| Control | Who may use it | Proposed result |
| --- | --- | --- |
| Send friend request | Either unaffiliated user, when neither has blocked the other | Create one pending request; show outgoing to sender and incoming to recipient. |
| Approve | Recipient of the current pending request | Clear the request and establish mutual friendship. |
| Deny | Recipient of the current pending request | Clear the request; remain unaffiliated. |
| Revoke/cancel request | Sender of the current pending request | Clear the request; remain unaffiliated. |
| Remove friend | Either friend | End friendship for both; return to unaffiliated. No approval required. |
| Block | Either user | Set that user's block, end any friendship, and cancel pending requests in either direction. Prevent new requests/acceptance while either block remains. |
| Unblock | User who placed that block | Remove only their block. Do not restore friendship or a request; if the other user also blocked, friendship remains unavailable. |

**Proposed consistency rules:** reject self-requests/blocks; repeated sends do not create duplicates. If the other person has already sent a request, show the incoming request for explicit acceptance rather than silently approving it through a second send. Each request gets an identity so a delayed approval/denial/cancellation cannot affect a newer request. Validate caller and both block directions in the same transaction as each transition. Concurrent approval and blocking must leave the relationship blocked once the block commits; a retry must not recreate friendship.

**Proposed initial interface:** friends, incoming requests, outgoing requests, and the user's blocked list, plus an entry point for sending a request to a particular user. User lookup by public handle, profile URL, or another identifier is still open; do not infer an email-searchable public directory. Propose private relationship lists for participants and a block list visible only to the blocker, generic unavailable responses for blocked/deactivated targets, and bounded request rates. Cooldown and notification behavior remain open.

**Initial feature boundary:** these records and controls do not themselves grant campaign membership, Director authority, character viewing/control, homebrew access, or statistics visibility. Friendship removal alone does not revoke independently granted campaign membership or character access. Future friends-only visibility should be an explicit resource policy evaluated against current friendship, rather than copying grants to every friend or exposing data as soon as someone accepts a request. Friend-of-friend access is not implied.

**Blocking versus campaign bans remains open:** an owner-wide campaign ban already prevents requests to that owner's campaigns. The user has not yet specified whether the same Block control must also apply that ban. The relationship layer can supply shared pair lookup and controls without assuming the two policies are identical. Until that decision is made, keep their effects explicit: friend blocking governs the request/friendship lifecycle proposed here; campaign bans govern campaign admission. Do not silently remove existing campaign memberships, Director assignments, or character grants on a social block. The treatment of existing shared play, chat, invitations, and character grants needs confirmation before those block integrations ship. Site-wide suspension remains administrative.

## 5. Campaign discovery, requests, and bans

**Proposed contract:** directory listings and invitation links expose only a recruitment preview: campaign name, owner display identity, description, and whether requests are open. Public discovery does not publish sheets, rosters, chat, encounters, private notes, or archives. Directory readership without login is proposed; the requirement currently establishes listing, not anonymous browsing policy.

The share URL/code identifies a campaign's request entry point; it never creates membership by itself. Use an unguessable, revocable token with server-side lookup and request limits. Allow the owner to rotate it. Rotation prevents new use of the old link; it does not remove approved members. Whether rotation also cancels already pending requests is open; retaining them is proposed.

Proposed request lifecycle: `pending` → `approved`, `declined`, or `withdrawn`. At most one pending request per campaign/user. Repeated submissions return that request. Approval checks current ownership, campaign state, requester eligibility, and the owner-wide ban before atomically creating membership. An approved member does not need a new request. After decline/kick, another request is allowed unless banned, subject to a proposed cooldown.

Store a ban by `(banningUserId, bannedUserId)` so it covers all campaigns currently owned by that user, including campaigns they create later. Check it both when requesting and approving; a request that predates a ban cannot bypass it. Unbanning allows future requests, without restoring membership or expired grants automatically.

**Open ban behavior:** prevention of future join requests is confirmed; automatic expulsion from other existing campaigns is not. Propose rejecting pending requests across the owner's campaigns and offering an explicit removal action for existing memberships. The [friendship and blocking section](#4-friendship-and-blocking-foundation) records the unresolved connection between personal blocks and campaign bans.

## 6. Exactly one active Director

**Proposed representation:** a campaign has a standing Director, initially its owner, and at most one current-session override. There is one effective Director, calculated server-side:

1. Use the override if it belongs to the current open session and its target remains an eligible campaign participant.
2. Otherwise use the eligible standing Director.
3. Otherwise fall back to the campaign owner.

All other participants have the player role for play. The owner retains campaign-management powers and attached-sheet visibility while someone else directs. An until-revoked appointment replaces the standing Director; a current-session appointment temporarily overrides that assignment. A new standing appointment clears any override to take effect immediately. A new session appointment replaces the previous override rather than stacking temporary appointments.

**Proposed expiry:** session-only authority ends when the session leaves `open`, before archival completes. A disconnect, encounter end, midnight, or browser sign-out is not a session end. If there is no open session, reject “current session” rather than silently making it permanent. Closing or reopening a session never silently resurrects an expired grant; reopening policy itself remains open.

Example proposal: Alice owns the campaign; Ben is Director until revoked. Alice appoints Cara for session 12. Cara alone directs session 12; on closure Ben resumes. If Ben has left, Alice resumes. Returning specifically to the previous standing Director rather than always the owner needs confirmation.

The owner can revoke/replace appointments. Removal of the effective Director restores eligible standing authority or the owner atomically. Loss of connectivity does not remove a role. “Active” denotes assigned authority, not continuous online presence. Delegates cannot further delegate Director authority unless a future requirement grants it.

**Proposed initial constraint:** one open session per campaign, making “current session” unambiguous and retaining one campaign-wide active Director. Concurrent tables/sessions remain open in the data architecture; this proposal must be settled before implementing session-scoped permissions. Owner account deletion/suspension also needs a campaign closure or succession policy so an operational campaign is never left with an ineligible sole fallback.

## 7. Character visibility and delegated play

**Proposed privacy boundary:** store owner-private notes separately from the shareable sheet and mechanical progression history. Exclude them server-side from other users' sheet queries, exports, search results, subscriptions, review snapshots, and archives. Merely hiding a notes panel is insufficient. Private notes should not enter engine inputs or game events. Imported opaque data may contain notes and needs the same treatment.

Until the exact boundary is confirmed, propose that all nonowners, including campaign owners, Directors, and delegated players, receive the sheet needed for their role without owner-private notes. This preserves mechanical review access without treating every authored field as public to the campaign.

**Proposed sharing scope:** grants target an individual current member of the same campaign and the character's specific attachment. Confirm whether sharing outside a common campaign is also wanted. A grant provides sheet viewing and combat control together, matching the stated request; a separate view-only option is not yet required.

| Capability | Character owner | Campaign owner | Active Director | Player with a valid character grant | Other campaign member |
| --- | --- | --- | --- | --- | --- |
| View attached sheet | Yes | Yes | Yes | Yes | Not established; propose deny full-sheet access |
| View progression history | Yes | Yes | Yes | Open; propose effective sheet only | No default access |
| View owner-private notes | Yes | Proposed no | Proposed no | Proposed no | Proposed no |
| Choose build/level-up options | Yes, under wizard rules | Only for own character | Only for own character | No | No |
| Approve campaign admission/full edits | If active Director; self-review open | Only if active Director | Yes; self-review open | No | No |
| Run this character in combat | Yes, if admitted and otherwise eligible | Not granted by ownership of campaign alone | General adjudication authority remains to be specified | Yes, within legal game operations | No |
| Grant/revoke access to this character | Yes | Only for own character | Only for own character | No | No |
| Delete, duplicate, export, or detach the character | Owning-user operations; active-play details open | No authority established over someone else's character | No authority established over someone else's character | Not granted | Not granted |

Rows combine permissions when one person holds several roles. No row grants a global write endpoint: combat control permits validated operations and their resolved effects, including spending items/resources where the game permits it, not arbitrary build or inventory edits. The Director's exact ability to issue corrections, operate others' heroes, award XP/Victories, or undo play remains a separate decision. Effects from another actor may still legitimately change a hero through authorized game resolution.

Proposed grant fields: character, attachment, recipient membership, grantor, scope (`session` or `untilRevoked`), explicit session ID for session scope, and revocation metadata. Membership/attachment identity prevents old grants reviving after someone rejoins or a character reattaches. “Until revoked” viewing can operate between sessions while that relationship remains valid; combat commands still require an eligible active game context.

The owner retains their access while another player runs the character. Multiple recipients and owner/delegate concurrent control are open; propose allowing several grants and serializing accepted commands against current state, rather than introducing exclusive possession implicitly. Attribute each command to the authenticated user and separately to the controlled character.

Session grants expire at the same session boundary as Director overrides. Explicit revocation, recipient departure/removal, or attachment termination invalidates the relevant grant immediately for future authorized operations. These relationship-based invalidations are proposed defaults. A grant cannot be forwarded, transferred to a duplicate, carried into another campaign, or used to approve builds.

## 8. Membership removal, history, and other owned content

Propose that kick/leave immediately removes campaign access and invalidates membership-dependent control. Restore Director authority in the same transition when necessary. The departing user's characters remain theirs. Proposed cleanup detaches those characters, clearing campaign values under existing rules while preserving retained character data; the exact reconciliation during an unresolved combat action remains open. Loss of authorization must take effect even if bounded cleanup continues later.

Existing events remain campaign records with historical actor attribution and the necessary historical sheet/content snapshots. Removing a member or grant does not undo their already committed game actions. Future reads follow current history policy; former-member archive access, historical Director secrets, and notes visibility require decisions. Never authorize a present-day character edit merely because a caller can inspect an old snapshot.

Homebrew and saved encounters retain their creator's ownership. **Proposed default:** private until explicitly shared or published. Do not inherit public visibility from a campaign listing, or grant access to a person's whole homebrew library because one character uses a definition from it. Proposal: permit the campaign to read the exact mechanical revision required by an admitted character/loaded encounter, while keeping unrelated drafts private; confirm this derivative-use permission before implementation.

Saved encounter loads already create independent snapshots. Changes or later withdrawal of the source must not rewrite historical outcomes. Define which retained snapshots remain available when source access is revoked, and whether shared homebrew can be copied, edited, exported, or publicly published. Do not automatically apply character control grants to homebrew or encounter authoring.

## 9. Proposed Convex authorization and data contracts

Authenticate at every private server entry point, then load current application ownership, memberships, bans, grants, and lifecycle state. Convex provides identity in server functions; application authorization still needs implementation. [Auth in functions](https://docs.convex.dev/auth/functions-auth)

Keep the rules engine independent of Convex and authentication. Online UI and headless clients submit to the same authorized application operations; the application resolves which game entities that user may control before invoking the deterministic engine. Do not trust caller-supplied owner IDs, role flags, session scope, or game `actorId` as identity proof.

| Logical records | Main purpose and lookup |
| --- | --- |
| Users and auth identity mapping | Stable application identity, private settings, public profile projection; lookup by validated issuer/subject or provider user ID as appropriate. |
| Admin identities/access | Separate provisioning and sign-in policy; lookup by validated admin identity. Exact schema depends on selected admin auth. |
| Campaigns | Owner, discoverability, standing Director, current session/override; indexed directory and owner listings. |
| Memberships and join requests | Campaign/user membership generation and request state; lookup by campaign/user and user/status. |
| User relationships | One pair record for friendship, current directed request, and each user's block; participant lookups for private lists and current-state authorization. |
| Owner bans and invite tokens | Unique owner/target bans; token lookup scoped to campaign and rotation state. Whether owner bans share the relationship record is open. |
| Character identities/attachments | Creator owner ID, current/reserved campaign attachment and generation. |
| Character grants and private notes | Grants indexed by character/recipient/context; notes queried only through owner authorization. |
| Access-change records | Who approved, removed, banned, delegated, revoked, or performed an administrative operation, with appropriate restricted readership. |

These are logical records, not a committed schema. Use indexed bounded reads for actual access paths. Enforce uniqueness and the one-effective-Director/one-attachment invariants inside mutations, including under concurrent requests.

Authorization is evaluated against current records for each operation. Recheck when committing results of work that ran outside a mutation. If a member is kicked or a grant expires while a command resolves, it cannot later commit under stale authority. A legitimately committed action remains committed if its response races with revocation.

Authorized reactive queries must read the membership/grant/lifecycle records on which they depend so permission changes update subscribed results. Remove no-longer-authorized data from client state. Revocation controls future server access; it cannot erase material a person already viewed or downloaded. Private file/archive delivery also needs access-aware serving: a raw storage URL must not become a permanent alternative to authorization checks.

Keep ownership, friendships, friend requests, blocks, memberships, bans, grants, credentials, and private notes outside gameplay before/after snapshots. Game undo must never restore a friendship or revoked grant, remove a block, reinstate a kicked member, change a password, or make an expired session assignment valid. Archive workers receive bounded internal work references and must preserve audience separation.

## 10. Acceptance scenarios for implementation

These are target behaviors, not tests already implemented or passing. Proposed outcomes depend on the corresponding policy being accepted.

| Scenario | Expected outcome |
| --- | --- |
| Email/password change | Verified change preserves application identity and owned records; old credentials/session behavior matches the chosen revocation policy. |
| Admin boundary | A normal session, including one for a campaign owner or a matching admin email, cannot invoke admin operations without separate valid admin authorization. |
| Friend request lifecycle | Only the recipient approves/denies and only the sender cancels the current request. Acceptance creates one mutual friendship; denial/cancellation leave users unaffiliated. |
| Remove friend | Either participant can remove friendship; independent campaign membership and character grants remain unchanged. |
| Block/unblock | Blocking ends friendship and pending requests, and prevents new requests. Unblocking never restores them or clears the other user's block. |
| Relationship races | Duplicate/crossed requests do not create two pending requests or silently accept friendship. Stale request controls cannot affect a new request; blocking wins over concurrent acceptance. |
| Social privacy and scope | A third party cannot list private relationships, requests, or blocks. Friendship alone exposes no private campaigns, sheets, homebrew, or statistics. |
| Public discovery/invite | Visitor can see only the recruitment preview; possession of code or campaign ID does not expose private data or grant membership. |
| Approval race | Duplicate approval produces one membership; a ban between request and approval prevents admission. |
| Owner-wide ban | Banned person cannot request any campaign of that owner, including a newly created one; campaigns of other owners are unaffected by this rule alone. |
| Temporary Director | Exactly one effective Director; closure expires the override even if archival fails. Proposed standing fallback resumes. |
| Removed Director | Kick/revocation restores eligible authority atomically; stale delegated commands and review approvals fail. |
| Character grant | Recipient can view permitted sheet data and run admitted character; cannot edit build, forward grant, or read private notes. |
| Grant expiry/rejoin | Session closure, revocation, removal, and detach stop subsequent access. Rejoining/reattaching/reopening does not revive the old grant. |
| Character privacy | Notes cannot leak via sheet, review, import download, export, subscription, search, engine payload, or archive. |
| Concurrent commands | Owner/delegate retries and simultaneous actions cannot duplicate spending or overwrite a newer accepted result. |
| Character departure | Creator retains character; campaign values clear without losing level/history/inventory; historical records cannot alter its new attachment. |
| Undo and snapshots | Undo affects game state only; bans and revocations stay effective. Source edits/revocations do not reinterpret recorded outcomes. |
| Cross-scope attack | Guessed character/session/storage IDs, forged owner IDs, and grants for another attachment cannot read or mutate protected data. |

## 11. Decisions to resolve next

1. What are the admin sign-in requirements: MFA, passkeys/security keys, a specific identity provider, or another policy? What can each administrator do?
2. After a session-only Director appointment expires, does the previous until-revoked Director resume, or does authority always return to the owner?
3. Is one open session per campaign acceptable initially? If not, which session governs the single active Director?
4. Which character fields are owner-private? Does delegated viewing include progression history? Do ordinary members see a limited public character summary?
5. Must character sharing stay within a common campaign, and can several people receive access simultaneously?
6. Does personal blocking also impose the owner-wide campaign ban? Does either action remove existing memberships, character grants, or Director appointments? What happens to shared chat and invitations?
7. What game operations belong to the Director, campaign owner, and character controller: corrections, inventory changes, XP/Victories, session closure, and undo? Who reviews a Director's own character?
8. What happens to an owned campaign when its owner leaves, deletes their account, or is suspended? Campaign transfer is open; character ownership remains with its creator.
9. What survives departure as readable history, and what homebrew sharing/publication/copying rights are intended?
10. How do users find someone to send a friend request: public handle, profile link, or another identifier? What notifications and re-request cooldown are wanted? Friends-only campaign/statistics visibility remains a future feature.

Resolve these through product discussion, then refine operation contracts before schema/UI implementation. Include the friend-request, friendship, and blocking foundation early alongside regular accounts and private character ownership. Membership, delegation, sharing, and any later friends-only visibility follow once their dependent policies are settled.
