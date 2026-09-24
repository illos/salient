# Respite rules and V1 design questions

Respite is a character-specific period of recovery with a shared fictional context. The ordinary rule
requires 24 uninterrupted hours, restores Stamina and Recoveries, converts Victories into cumulative XP,
and permits one respite activity. Class features, complications, treasures and monster effects modify
each of those assumptions. A faithful application therefore needs to distinguish resting, undertaking
an activity, and receiving completion benefits.[^1][^2][^3]

The most consequential application decision is whether respite can remain available between game
sessions. The core book expressly supports that practice. Salient currently requires a running session
for gameplay and keeps closed sessions read-only, so between-session respite requires an explicit
product contract rather than an incidental exception.[^2]

**Revised product decision, 2026-09-14:** the Director selects respite participants, with the current
party selected by default and individual exclusions available. The earlier whole-party-only choice
is superseded following an explicit change of mind. Individual source effects still apply. The
[table spec](../table-spec.md#respite-mode) owns the confirmed contract.

This report supplies source findings and recommendations for the first stage of the
[V1 roadmap](../v1-roadmap.md). Recommendations and unanswered questions are not confirmed requirements.
Respite remains beyond the current v0.01 build; the existing exclusions of downtime-project tracking,
playable retainers/friendly monsters and supplemental content remain in force.

## 1. Source scope and confidence

The sole rules source is the pinned local Steel Compendium at
`fb83a789da8f0327a389c277a0c790b1648d5810`, examined on 2026-09-14. Findings concern MCDM's core
*Draw Steel: Heroes* and *Draw Steel: Monsters*. No internet rules sources or supplemental books are used.

A case-insensitive search for `respite` across the two book-specific Markdown trees identifies 145
files: 138 in Heroes and 7 in Monsters. The accompanying
[source inventory](respite-source-inventory.csv) records their book paths, SCC identifiers and local
reading paths. This is a discovery inventory, not 145 distinct mechanics or certified automation:
it includes repeated domain features, chapter summaries, links and narrative uses of the word.

All inventoried book paths have a corresponding unified file with matching SCC identity. Important
general rules and exceptions were read with surrounding text. The book-specific cleaned Heroes text
was also checked for advancement, Zeitgeist and selected timing/resource exceptions. Markdown, JSON
and cleaned book text are representations of the same corpus, not independent authorities.

Source limitations matter. For example, the standalone Zeitgeist feature ends by referring to choices
that live in separate entries; the cleaned book supplies Foreshadowing, Hear Ye, Hear Ye! and Latest Goss
in their original order. Searching only a short feature body would miss the actual choices.[^14]
The inventory does not prove that every indirect interaction or wording without `respite` has been found.

## 2. Ordinary respite lifecycle

### Starting and spending the time

A normal respite requires 24 uninterrupted hours focused on sleep, eating, tending wounds and
recuperating. A hero may also undertake one respite activity. An ordinary night's sleep does not count.
The rules allow consecutive respites without imposing a maximum number or a minimum Victory threshold.[^1]

The Director chapter strengthens the short rule's safety guidance: a location must be safe enough to
permit meaningful rest. Whether a wilderness camp qualifies is adjudicated by the Director. A barricaded
room in an enemy lair does not automatically qualify. The players decide when their heroes seek respite;
the Director judges the fictional circumstances. Recommendations about resting after roughly four to six
Victories are pacing advice, not eligibility tests.[^2]

**Application implication:** the already-confirmed Director Start/End controls can record the table's
decision without inventing an automatic safety detector or a real-world countdown. A 24-hour fictional
period can be resolved in minutes at the table. Rest duration and elapsed real time must not be conflated.
Location can be supplied when a source needs it; the ordinary flow need not demand a checklist of beds,
food, roofs or encounters.

### Completing

The ordinary completion gives each eligible hero all Stamina and Recoveries, awards XP equal to their
Victories, and resets those Victories to zero. XP is cumulative, not spent to buy the next level.[^1][^3]
This is restoration rather than spending each remaining Recovery to heal. Recovery value remains a
separate derived statistic: ordinarily one-third of maximum Stamina, rounded down.[^4]

For example, an otherwise unmodified level-one hero at 13 XP with 4 Victories finishes with 17 XP and
0 Victories and qualifies for level two. The source says a level earned this way is gained during that
same respite. It does not provide a software transaction order for level choices, changed maxima and
restoration.[^3][^5]

### Interruption

An attack or similarly serious distraction ends an ordinary respite early, denying the benefits of
finishing. The ordinary rule does not bank the first 20 hours toward a later four-hour completion.[^1]

This does not mean that everything that happened during the respite is undone. A start-triggered
effect, an already answered question, an expended object or a consequence of an activity has its own
source timing. Nor does every reference to disturbed sleep cause complete failure: Voice in Your Head
specifically reduces restored Recoveries by two, while other complications can remove an activity or
deny benefits under their own conditions.[^12]

**Recommendation:** distinguish interrupted rest from completed rest with reduced benefits, and
distinguish both from correcting an accidental app operation. Do not reuse combat Void/reset as the
meaning of a fictional interruption. Exact retention of particular activity outcomes still needs
source-specific treatment; there is no universal interrupted-activity rollback rule in the passages examined.

## 3. Participation and resting together

The basic rule speaks to a hero's own respite. Features add explicit relationships between those
finishing together. Inner Light and Revitalizing Ritual choose the caster or an ally also finishing a
respite. Oracular Warning benefits companions who finished with the caster. Nature's Bounty targets
companions who rested with the caster, while its benefit expires when the recipient finishes their
next respite.[^8][^9]

This establishes at least three distinct identities: the character resting, the character supplying a
benefit, and its recipient. The source of the expiry boundary can differ from its recipient. A party-wide
rest counter alone cannot reliably express those rules. Merely belonging to a campaign or having a browser
connected is not a rule-defined substitute for resting together.

**Recommendation, now adopted after reconsideration:** select participating heroes explicitly, with
the current party selected by default. Retain the heroes who rested together and each hero's
source-specific effects. The intervening whole-party-only decision is superseded. A creature
restored by resurrection is a target of a particular activity; it should not automatically receive every
ordinary participant benefit or XP conversion simply because it appears in the same screen.[^13]

The sources examined do not establish a general procedure for staggered starts, partially overlapping
respites, late arrivals or a split party under one digital mode. These are product/model choices that
need boundaries. They do not require implementing multiple nested structured activities in V1.

## 4. Respite activities and free choices

An activity is not synonymous with a project, a die roll or every decision shown during respite.
The baseline permits one activity, but many features provide choices at start or finish without calling
them respite activities. Kit changes explicitly consume an activity; changing Wyrmplate's damage
immunity at completion does not say that it does.[^1][^6][^15]

| Kind | Core examples | Consequence for the app |
| --- | --- | --- |
| One ordinary activity | Change a kit; perform a permitted class reconfiguration; Sanctified Weapon; Criminal Contacts | Track the activity and its actual source-defined choices, targets and results. |
| Several changes bundled into one activity | Conduit prayer and ward; Elementalist enchantment and ward; Talent augmentation and ward | Do not charge one activity for each field changed. |
| Completion choice without an activity cost | Wyrmplate immunity; Eidetic Memory skill; Inner Light recipient | Present separately from activity spending. |
| Additional unrestricted activity | Null Rapid Processing | Derive the allowance from features rather than hard-code one. |
| Conditional additional activity | Talent Doubling the Hours while at least 5 Victories | Evaluate at the source-relevant time, before blindly zeroing Victories. |
| Extra work with a restricted purpose | Tactician Grand Strategy or Shock and Awe | An extra research/crafting roll is not an unrestricted extra activity. |
| Particular change without giving up the activity | Fury Menagerie stormwight-kit swap | Preserve the named exception rather than grant another generic slot. |
| Activity denied, recovery still possible | Evanesceria, Ward, some monster effects | Track activity availability separately from rest success. |

These examples are sourced in the activity references and exceptional effects below.[^6][^7][^8][^10][^11][^12][^15]

### Changing a build

Ordinary tactical kit changes and named class reconfigurations have source-granted respite procedures.
They are distinct from replacing an unsatisfying character option for fun, which the rules address
separately. The book also offers an explicitly optional rule permitting any number of class signature
and heroic ability swaps as one respite activity. That optional rule is not automatically active because
full editing exists.[^5][^6]

**Confirmed 2026-09-15 (Q-CHAR-5):** Kit swapping has a dedicated, logged respite option without a
separate full-edit approval submission. It retains source eligibility and activity cost. Kits can
also change in the regular character editor with normal Director approval outside respite. Language
changes, including filling deferred slots, follow normal edits and existing Director approval.
Other class reconfiguration exemptions remain undecided; this is not a blanket permission or an
activation of optional general ability swapping. The owner still makes underlying build choices.
See the [wizard policy](../character-wizard-spec.md#language-edits-and-respite-kit-changes) and
[table policy](../table-spec.md#respite-mode); both UI and headless use the same operation.

### Downtime remains a separate scope boundary

Projects are a major use of respite, but not its only use. A project roll earns project points, has
special edge/bane arithmetic, and can generate a breakthrough allowing another roll for the same project
within the same activity. Therefore one activity cannot be represented as exactly one roll.[^16]

Project sources, guides, material prerequisites, project events and hired contributors extend that system.
The rules also include some project work outside respite. This report maps those interfaces; it does not
bring a project tracker into V1. Source-readable manual handling can preserve the current exclusion.
The representation of extra project activities must remain honest about their manual support.

## 5. Resources, durations and persistent consequences

### There is no universal reset-all operation

| State | Sourced behavior | Design consequence |
| --- | --- | --- |
| Stamina and Recoveries | Ordinary successful respite restores both; specific effects modify that result | Calculate the applicable result and record actual before/after values. |
| Victories and XP | Ordinarily convert Victories to XP, then reset Victories | Preserve actual XP gained and exceptions to conversion. |
| Ordinary Heroic Resources | Class descriptions generally discard them at encounter end, not refill them at respite | Do not invent a full-resource value for resting. |
| FreePlay ability reuse | Core class resource entries permit reuse of an otherwise unavailable paid ability after earning Victories or finishing respite | Refresh usage eligibility independently from the numeric resource pool. |
| Epic resources | Level-ten features award amounts tied to XP gained and retain unspent amounts | Rest can add to an existing persistent pool. |
| Hero tokens | Ordinary baseline is tied to game-session start/end, with explicit feature exceptions | Respite must not impersonate a new game session. |
| Malice | Unspent Malice is lost at encounter end; subsequent starting amount uses the heroes' Victories | Keep its own lifecycle; rest affects later inputs through Victory changes. |
| Conditions and other effects | Durations and removals follow the originating rule | No blanket deletion of every condition or curse merely because rest occurred. |

The supporting resource sources are explicit about their distinct boundaries.[^3][^4][^17][^18][^19][^20]

### Completion can create benefits as well as remove them

**Your Triumphs Are Remembered** grants its affected heroes one Victory after the conversion to XP,
and that particular Victory does not become XP at a subsequent respite. Ordinary numeric bookkeeping
that repeatedly converts the entire visible Victory count would create XP from consecutive rests.
This needs attributable nonconvertible value or an equivalent faithful representation, not a special
rule that all Victories are nonconvertible.[^21]

Level-ten epic resources are another dependency on the actual XP award. For example, Divine Power and
Vision increase by the XP gained and persist until spent. A zero-XP respite is not an excuse to replace
an existing epic balance with zero. Gaining level ten during the same respite creates a separate timing
question: whether the newly acquired feature participates in that very completion is not expressly
ordered by the general advancement and epic-resource passages.[^5][^18]

### Reduced recovery and resurrection

Sibling's Shield can cause one fewer Recovery to be regained; Waking Dreams can remove a Recovery at
finish; Voice in Your Head can reduce restoration by two. Preacher has a failure chain that can deny
respite benefits entirely. These are different consequences, not a single `interrupted` checkbox.[^12]

Minor Miracle returns a willing dead creature at respite end with full Stamina and half Recoveries,
and restores only half the performing Conduit's Recoveries. The Scroll of Resurrection has a similar
recovery cost with its own eligibility, willingness and consumption rules. The normal round-down rule
applies when halving odd numbers. For an otherwise unmodified maximum of seven, half is three.[^13][^22]

Master of Green can add Recoveries to companions who finished alongside the Elementalist; those extra
Recoveries expire at the recipient's next respite. Its own bonus and the recipient's temporary allowance
must remain distinct. Interactions with multiple recovery reductions need bounded arithmetic review;
there is no justification for choosing a global multiplier order from these examples alone.[^9]

### Effect ownership and boundary wording

Hear Ye, Hear Ye! can expire at the source character's next respite start. Inner Light expires when its
caster finishes another respite. Nature's Bounty expires on the recipient's next completion. Loner and
some temporary Stamina sources instead use an end-of-respite formulation. These phrases should retain
their source identity and boundary owner.[^8][^9][^12][^14]

An interrupted respite expressly ends early but does not grant the benefits of finishing. This makes
`start`, `end` and successful `finish` a material distinction. The safest provisional interpretation is
to preserve genuine start consequences and withhold successful-completion grants. Whether every
unqualified end-of-respite duration expires on a failed attempt is an unresolved source interpretation,
not a reason to silently normalize all three phrases to one event.

Monster consequences demonstrate why respite state must survive combat closure. High Elf Palinode,
Flesh Mournling and Rally the Rodents can deny the next respite activity. Werewolf rage ordinarily
disappears on finishing respite, but the lycanthropy clause expressly preserves it until the indicated
cure. Rest therefore cannot automatically cure all long-lived negative effects.[^11]

### Shortened rest is a feature exception

Tireless's Bounce Back Fast permits respite benefits after at least eight hours, then requires a
regular respite before reuse. This is not the ordinary sleep rule. Its wording does not enumerate
every activity, trigger and duration interaction, so the full meaning of gaining the benefit needs a
bounded interpretation before automation. Preserve the exception without treating every eight-hour
sleep as rest or demanding 24 hours from a hero who possesses it.[^23]

### Inventory can create required respite work

Carrying more than three leveled treasures triggers a Presence test during each respite. A low result
has the Director choose the treasure retained while the others are discarded in unknown locations;
a middle result prevents movement until the hero chooses three and leaves the rest behind. The trigger
is carrying, not simply owning or equipping. Moving an item to an unequipped slot is therefore not
automatically enough to avoid the test. This is source-specific required work, not the generic Director
test-request system already excluded from the app.[^24]

Bloodbound Bands can form voluntary bonds during respite that permit shared Recovery spending and use
of the best bonded recovery value. Their text does not call forming the bond a respite activity, and
its duration ends through the listed ring/bond/death events rather than at every respite. Respite must
not rebuild inventory or erase such relationships wholesale.[^25]

## 6. Advancement and completion ordering

Under standard advancement, level-two eligibility begins at 16 cumulative XP and increases in steps of
16 through level ten at 144 XP. The book also presents adjusted XP pacing, milestone advancement and
Director-chosen advancement. These are available campaign options in the rules, not already-selected
Salient settings.[^5]

The source says the new level is gained during the same respite. It does not prescribe whether a web
client must finish every level choice before the Director can exit the mode, whether an offline player's
choices can be deferred, or how to settle an intervening change to that hero's maximum Stamina.

**Recommended ordinary result:** a hero completing an ordinary uninterrupted respite and its associated
level-up should emerge fully restored against the applicable final build, subject to actual source
exceptions. This avoids a level-up leaving an otherwise fully rested hero artificially damaged. That
is a proposed reconciliation contract, not an explicit universal ordering rule in the text.

For illustration, suppose a hero's maximum Stamina is 30 before a sourced build change and 36 after it.
The proposed ordinary final result is 36 current Stamina, not a permanent 30/36 merely because restoration
ran before the build update. The example assumes those maxima; it asserts no particular class formula.

The sequence must also preserve earlier inputs. A Talent with five Victories can qualify for Doubling
the Hours while undertaking activities, even though ordinary completion later converts those Victories.
XP-dependent epic grants use the actual convertible XP award. A post-conversion Victory from Your
Triumphs Are Remembered must not feed back into the conversion that just happened.[^10][^18][^21]

## 7. Proposed application outline

The following is a discussion aid. The only established respite UI policy is a dedicated mode that the
Director starts and ends; the detailed stages below remain proposed.

1. **Start:** the Director selects participants, with the current party selected by default, and starts
   respite. Record the selected heroes and resolve actual
   start-triggered work, retaining current relevant inputs and resting-together relationships.
2. **Activities:** show each hero's eligible activities, allowances and separately granted choices. Use
   ordinary attributed action cards for required inputs or table adjudication. Display unsupported
   effects and their source, preserving manual resolution rather than pretending they were automated.
3. **Completion review:** the Director distinguishes successful completion from interruption. For a
   successful rest, show each hero's actual recovery/XP changes, affected ongoing effects and outstanding
   required choices. Apply source-specific activity costs and finish effects exactly once.
4. **Progression and return:** resolve the accepted level-up policy and return to the appropriate table
   state. Preserve a readable record of what each hero received and what remained manual.

A read-only preview is useful, but it cannot postpone every real consequence until a single final click:
some rules act at respite start or during an activity. Likewise, a response created during a respite
cannot borrow combat's next-turn cutoff when there is no individual turn boundary.

Retries and reconnects must not repeat XP, grant a second activity, reroll an already accepted test,
consume another scroll or activate an outdated build. These follow the project's existing shared-operation
and history requirements. Exact operation names and storage schemas are engineering work, not questions
for the product discussion.

## 8. Product decision queue

Question 1's participation choice is settled as Director-selected participants. Question 3 is now
partially settled for kits by Q-CHAR-5; other named class reconfiguration workflows remain undecided. The recommendations are independent proposals, not a package whose
acceptance is implied by continuing the discussion. Record decisions in the owning specs one at a time.

| Order | Question to resolve | Recommendation and reason |
| --- | --- | --- |
| 1 — settled | Whole-party respite or selectable participants? | Confirmed Director selection, with the current party selected by default and individual exclusions available. Supersedes the intervening whole-party-only choice. Source-specific differences in benefits remain; interruption behavior is still question 5. |
| 2 — settled | Can respite continue between closed game sessions so players can make their choices asynchronously? | Confirmed 2026-09-24: no. A session cannot be closed while a respite is open and unresolved; the respite is finished or interrupted first. The cross-session proposal was rejected as too complex. |
| 3 — kits settled | Which other source-permitted class reconfigurations need a dedicated respite path? | Q-CHAR-5 confirms dedicated kit swaps without full-edit review, while languages use normal edits/approval. No equivalent exemption is established for wards/prayers/augmentations; the earlier broad exemption recommendation is not accepted. Retain existing full-edit policy pending specific design. |
| 4 | Must eligible level-ups be completed before the Director finishes respite, or may a hero finish those choices later? | Prefer a completion flow that exposes and resolves required build choices, using the final baseline for restoration. Define an explicit deferral path if offline players must not delay the group; never choose a player's build silently. |
| 5 | How should the Director record an interruption and move back into play? | Provide an explicit interruption outcome, no ordinary completion benefits, and preservation of already-real consequences. Starting combat then follows its existing explicit setup; interruption is not a combat Void/reset. |
| 6 | Should optional ability swapping and alternative advancement modes have dedicated V1 controls? | Keep ordinary source-granted changes separate. Offer optional unrestricted class-ability swapping only through an explicit campaign choice; decide alternative advancement within the progression work, without silently selecting it here. |
| 7 | How should the Director finish when optional respite choices remain unused? | Show remaining opportunities and allow an explicit finish to close unused optional choices; require the information needed for mandatory consequences. Avoid a separate all-players-ready gate unless the desired experience requires one. |
| 8 | Can a completed respite be reversed, and how far can that reversal reach? | Propose finalizing it as a history boundary, with current-state corrections afterward. Any full reversal must reconcile progression, inventory, resurrection and cross-hero effects; do not inherit encounter rewind automatically. |

Questions 1–5 establish the main journey. The remaining questions refine its scope and history.
Rest duration can initially be handled through Director-confirmed fictional completion without introducing
a configurable calendar. Consecutive-rest bulk controls can wait until one full respite is well defined.
Neither recommendation expands the v0.01 milestone.

## 9. Bounded rules uncertainties

These are narrower than the product queue. Straightforward sourced mechanics above do not need
individual approval, and these uncertainties need not all be adjudicated before designing the main flow.

| Case | Evidence and unresolved point | Provisional research recommendation |
| --- | --- | --- |
| Interrupted rest and an effect lasting until its end | Basic respite ends early on interruption; individual effects use end/finish wording unevenly | Do not award completion benefits. Preserve exact expiry wording and resolve materially different cases against their source instead of a blanket duration replacement. |
| Becoming level ten at this completion | Advancement happens in the same respite; epic-resource feature grants XP-linked points each time respite finishes | Surface this as a specific ordering case before automation. No universal new-feature grant timing is established here. |
| Bounce Back Fast | Gives the benefit of respite after eight hours and requires a regular respite to recharge | Support the stated recovery exception, but settle its full activity/trigger coverage before treating it as every ordinary lifecycle event. |
| A newly created effect lasting until the next respite | Advanced Studies and several duration grants originate within or at completion of respite | Provisionally bind next respite to a later respite instance, avoiding immediate expiry of a newly granted benefit. Review exact source wording for each grant. |
| Multiple modifications to restored Recoveries | Half restoration, reduced restoration, additions and losses at finish coexist | Preserve each operation's timing and inputs; review a concrete combination before selecting noncommutative ordering. |
| Multiple extra-activity sources or repeated War-domain benefits | Sources grant specific extras but do not provide a complete combination algorithm in the respite passages | Consult applicable general combination rules when a concrete build requires them; do not assume all similarly worded grants stack. |

## 10. Acceptance examples for the later build

These are proposed verification cases derived from the findings, not executed tests or additional v0.01
requirements. Product-dependent expectations remain labeled.

| Example | Expected result or decision to preserve |
| --- | --- |
| Ordinary hero at 13 XP and 4 Victories completes | XP becomes 17; ordinary Victories become zero; recovery applies; the level-two flow is available during this respite. |
| Ordinary respite is interrupted after 20 fictional hours | No ordinary completion recovery or XP conversion; already-real consequences are not automatically reverted. |
| Respite participant selection opens | Select the current party by default and allow the Director to exclude individual heroes. Campaign membership alone does not add every attached character to the party. |
| One hero is excluded | No ordinary respite benefits or personal respite-boundary advancement for that hero merely because the party rests; source-specific effects on other creatures retain their own rules. |
| A monster effect denies the next activity | Hero can still receive ordinary recovery unless a separate source forbids it; record the activity restriction's disposition. |
| Null with Rapid Processing | Two ordinary respite activities are available before other applicable effects. |
| Talent has exactly 5 Victories and Doubling the Hours | Extra activity eligibility is evaluated while the relevant Victory state still applies, not lost by premature conversion. |
| Minor Miracle with unmodified maximum 7 Recoveries | Performer and revived target receive their source-defined half-restoration amounts, rounded down; no generic full-restoration overwrite. |
| Your Triumphs Are Remembered followed by another uneventful rest | Its granted Victory does not create XP at the next rest; ordinary newly earned Victories remain convertible. |
| Existing epic resource balance of 6, XP gain 4 | Applicable epic grant adds 4, producing 10 before any other recorded spending. |
| Caster and recipient finish different later respites | Expire each effect on the owner of the boundary named by its source. |
| Werewolf rage with and without lycanthropy | Ordinary rage clears on completion; the explicit lycanthropy exception persists. |
| Hero carries four leveled treasures, only three equipped | The source's carrying-based test still applies; a result requiring Director selection does not silently discard arbitrary items. |
| Completion is retried or the browser reloads | Same accepted XP, dice, inventory and build changes appear once. |
| Optional kit change alters maximum Stamina | Final restoration follows the chosen build-reconciliation contract; the proposed ordinary result is full applicable final Stamina. |
| Session closes with respite still open | Behavior follows decision 2; no accidental completion, benefits grant or write into a closed session. |

## Sources

All numbered references are MCDM core rules as represented in the pinned local Steel Compendium above.
Links point to local readable entries; SCC identity and book-specific paths are preserved in the inventory.
For original order, the locally available Git object is
`en/books/heroes/clean/Draw Steel Heroes.md`; read it with `git show` at the pinned revision.

[^1]: *Heroes*, [Respite](../../vendor/steel-compendium/en/unified/md/rule/resource/respite.md), SCC `mcdm.heroes.v1/rule.resource/respite`.
[^2]: *Heroes*, [For the Director — Running Respites](../../vendor/steel-compendium/en/unified/md/chapter/for-the-director.md#running-respites), especially Safe Place, Respites Between Sessions, and Victories and Respites.
[^3]: *Heroes*, [Experience](../../vendor/steel-compendium/en/unified/md/rule/resource/experience.md) and [Victories](../../vendor/steel-compendium/en/unified/md/rule/resource/victories.md).
[^4]: *Heroes*, [Recoveries and Recovery Value](../../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md) and [Stamina](../../vendor/steel-compendium/en/unified/md/rule/health/stamina.md).
[^5]: *Heroes*, [Making a Hero](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md), Changing Character Options, Optional Rule: Respite Ability Changes, Heroic Advancement, and its standard/adjusted XP tables.
[^6]: *Heroes*, [Kits](../../vendor/steel-compendium/en/unified/md/chapter/kits.md#changing-your-kit); Conduit [Prayer](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/prayer.md) and [Ward](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/conduit-ward.md); Elementalist [Enchantment](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment.md) and [Ward](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/elementalist-ward.md); Talent [Augmentation](../../vendor/steel-compendium/en/unified/md/feature/talent/level-1/psionic-augmentation.md) and [Ward](../../vendor/steel-compendium/en/unified/md/feature/talent/level-1/talent-ward.md); Null [Augmentation](../../vendor/steel-compendium/en/unified/md/feature/null/level-1/psionic-augmentation.md).
[^7]: *Heroes*, [Sanctified Weapon](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/sanctified-weapon.md), [Criminal Contacts](../../vendor/steel-compendium/en/unified/md/perk/criminal-contacts.md), [Seance](../../vendor/steel-compendium/en/unified/md/feature/censor/level-4/seance.md).
[^8]: *Heroes*, [Inner Light](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/inner-light.md), [Revitalizing Ritual](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/revitalizing-ritual.md), and Conduit [4th-Level Domain Feature](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-4/4th-level-domain-feature.md), including Oracular Warning and Saint's Epiphany.
[^9]: *Heroes*, [Nature's Bounty](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-7/natures-bounty.md) and [Master of Green](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-10/master-of-green.md).
[^10]: *Heroes*, [Rapid Processing](../../vendor/steel-compendium/en/unified/md/feature/null/level-2/rapid-processing.md), [Doubling the Hours](../../vendor/steel-compendium/en/unified/md/feature/talent/level-8/doubling-the-hours.md), [Menagerie](../../vendor/steel-compendium/en/unified/md/feature/fury/level-8/menagerie.md), [Grand Strategy](../../vendor/steel-compendium/en/unified/md/feature/tactician/level-7/grand-strategy.md), and [Shock and Awe](../../vendor/steel-compendium/en/unified/md/feature/tactician/level-7/shock-and-awe.md).
[^11]: *Monsters*, [High Elf Palinode](../../vendor/steel-compendium/en/unified/md/monster/elf-high/statblock/high-elf-palinode.md), [Flesh Mournling](../../vendor/steel-compendium/en/unified/md/monster/undead/2nd-echelon/statblock/flesh-mournling.md), [Radenwight Malice](../../vendor/steel-compendium/en/unified/md/monster/radenwight/radenwight-malice.md), and [Werewolf](../../vendor/steel-compendium/en/unified/md/monster/werewolf/statblock/werewolf.md).
[^12]: *Heroes*, complications [Evanesceria](../../vendor/steel-compendium/en/unified/md/complication/evanesceria.md), [Ward](../../vendor/steel-compendium/en/unified/md/complication/ward.md), [Sibling's Shield](../../vendor/steel-compendium/en/unified/md/complication/siblings-shield.md), [Waking Dreams](../../vendor/steel-compendium/en/unified/md/complication/waking-dreams.md), [Voice in Your Head](../../vendor/steel-compendium/en/unified/md/complication/voice-in-your-head.md), [Preacher](../../vendor/steel-compendium/en/unified/md/complication/preacher.md), [Loner](../../vendor/steel-compendium/en/unified/md/complication/loner.md), [Advanced Studies](../../vendor/steel-compendium/en/unified/md/complication/advanced-studies.md), and [Vampire Scion](../../vendor/steel-compendium/en/unified/md/complication/vampire-scion.md).
[^13]: *Heroes*, [Minor Miracle](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-3/minor-miracle.md) and [Scroll of Resurrection](../../vendor/steel-compendium/en/unified/md/treasure/2nd-echelon/consumable/scroll-of-resurrection.md).
[^14]: *Heroes*, [Zeitgeist](../../vendor/steel-compendium/en/unified/md/feature/troubadour/level-4/zeitgeist.md), [Foreshadowing](../../vendor/steel-compendium/en/unified/md/feature/troubadour/level-4/foreshadowing.md), [Hear Ye, Hear Ye!](../../vendor/steel-compendium/en/unified/md/feature/troubadour/level-4/hear-ye-hear-ye.md), and [Latest Goss](../../vendor/steel-compendium/en/unified/md/feature/troubadour/level-4/latest-goss.md). Cleaned Heroes text lines 15835–15853 at this pin restore their surrounding order.
[^15]: *Heroes*, [Wyrmplate](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/wyrmplate.md) and [Eidetic Memory](../../vendor/steel-compendium/en/unified/md/perk/eidetic-memory.md).
[^16]: *Heroes*, [Downtime Projects](../../vendor/steel-compendium/en/unified/md/chapter/downtime-projects.md), [Project Roll](../../vendor/steel-compendium/en/unified/md/rule/downtime/project-roll.md), [Project Source](../../vendor/steel-compendium/en/unified/md/rule/downtime/project-source.md), [Guide](../../vendor/steel-compendium/en/unified/md/rule/downtime/guide.md), [Follower Types](../../vendor/steel-compendium/en/unified/md/rule/general/follower-types.md), [Traveling Artisan](../../vendor/steel-compendium/en/unified/md/perk/traveling-artisan.md), and [Traveling Sage](../../vendor/steel-compendium/en/unified/md/perk/traveling-sage.md).
[^17]: *Heroes*, core level-one resource features: [Wrath](../../vendor/steel-compendium/en/unified/md/feature/censor/level-1/wrath.md), [Piety](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/piety.md), [Essence](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/essence.md), [Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md), [Discipline](../../vendor/steel-compendium/en/unified/md/feature/null/level-1/discipline.md), [Insight](../../vendor/steel-compendium/en/unified/md/feature/shadow/level-1/insight.md), [Focus](../../vendor/steel-compendium/en/unified/md/feature/tactician/level-1/focus.md), [Clarity and Strain](../../vendor/steel-compendium/en/unified/md/feature/talent/level-1/clarity-and-strain.md), and [Drama](../../vendor/steel-compendium/en/unified/md/feature/troubadour/level-1/drama.md).
[^18]: *Heroes*, [Divine Power](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-10/divine-power.md) and [Vision](../../vendor/steel-compendium/en/unified/md/feature/talent/level-10/vision.md); the other core level-ten epic-resource entries are included in the source inventory.
[^19]: *Heroes*, [Hero Tokens](../../vendor/steel-compendium/en/unified/md/rule/resource/hero-token.md), including Optional Rule: Hero Tokens Don't Reset, and [Local Hero](../../vendor/steel-compendium/en/unified/md/title/local-hero.md).
[^20]: *Monsters*, [Malice](../../vendor/steel-compendium/en/unified/md/rule/monster/malice.md).
[^21]: *Heroes*, [Your Triumphs Are Remembered](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-7/your-triumphs-are-remembered.md); the [Censor domain entry](../../vendor/steel-compendium/en/unified/md/feature/censor/level-7/your-triumphs-are-remembered.md) contains the same rule.
[^22]: *Heroes*, [Always Round Down](../../vendor/steel-compendium/en/unified/md/rule/general/always-round-down.md).
[^23]: *Heroes*, [Tireless](../../vendor/steel-compendium/en/unified/md/title/tireless.md), Bounce Back Fast.
[^24]: *Heroes*, [Leveled Treasures — Carry Three Safely](../../vendor/steel-compendium/en/unified/md/rule/treasure/leveled-treasure.md#carry-three-safely).
[^25]: *Heroes*, [Bloodbound Band](../../vendor/steel-compendium/en/unified/md/treasure/leveled/other/bloodbound-band.md), 1st-level effect.
