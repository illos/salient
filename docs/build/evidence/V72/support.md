# V72 live compiled ability support

Structural support, current grant/loading availability and live execution are separate. Source drift never silently falls back; historical results are never recompiled on read.

Source: `fb83a789da8f0327a389c277a0c790b1648d5810`; content: `sha256:65beca9bf41771ceee44fe4b706d570ba94fc5aa32556bba98ca47c01e30e41f`.

Currently reachable compiled: 7; unchanged reachable compatibility: 123; structurally supported but unavailable: 3.

| Ability | Population | Pure execution | Live boundary | Diagnostics |
| --- | --- | --- | --- | --- |
| Corrupt Spirit | granted | manual | legacy-compatibility | grammar, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Draconian Pride | granted | manual | legacy-compatibility | unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Dragon Breath | granted | manual | legacy-compatibility | unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Motivate Earth | granted | manual | legacy-compatibility | grammar, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Share Head | granted | manual | legacy-compatibility | grammar, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Contact Spirits | granted | manual | legacy-compatibility | grammar, unsafe-tier-remainder, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Stone Eyes | granted | manual | legacy-compatibility | unaccounted-paragraph, manual-section, compatibility-boundary |
| Psychic Blast | granted | manual | legacy-compatibility | grammar, unsafe-tier-remainder, source-title, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Telekinetic Grasp | granted | manual | legacy-compatibility | grammar, unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Issue Order | granted | manual | legacy-compatibility | grammar, unaccounted-paragraph, manual-section, compatibility-boundary |
| Posthumous Retirement | granted | manual | legacy-compatibility | grammar, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Rogue Wave | granted | manual | legacy-compatibility | grammar, unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Rotting Fist | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Stolen Vitality | foe-ability | manual | not-reachable | grammar, manual-section |
| Decaying Touch | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Clobber and Clutch | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Heat Death | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Leap | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Paranormal Activity | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Hidden Movement | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Bone Spur | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Bone Bow | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Soulstealer Longsword | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Chilling Grasp | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Spirited Away | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Awful Wail | foe-ability | manual | not-reachable | manual-section, target-boundary, action-type, cost |
| Shriek | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Razor Claws | foe-ability | supported | not-reachable |  |
| Zombie Dust | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Fingernails | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Freezing Dark | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Life Drain | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Haunt | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Shadow Jump | foe-ability | manual | not-reachable | grammar, unaccounted-paragraph, manual-section, target-boundary |
| Bone Shards | foe-ability | manual | not-reachable | manual-section |
| Claw Dirt | hero-standalone | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary |
| Dragon's Fire | hero-standalone | manual | not-reachable | grammar, target-boundary |
| Escape Grab | hero-standalone | manual | not-reachable | grammar, unsafe-tier-remainder, source-block-mismatch, unaccounted-paragraph, manual-section, target-boundary |
| Grab | hero-standalone | manual | not-reachable | grammar, unsafe-tier-remainder, source-block-mismatch, unaccounted-paragraph, manual-section |
| Knockback | hero-standalone | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Melee Weapon Free Strike | hero-standalone | supported | compiled |  |
| Ranged Weapon Free Strike | hero-standalone | supported | compiled |  |
| Draconian Pride | hero-standalone | manual | legacy-compatibility | target-boundary |
| Dragon Breath | hero-standalone | manual | legacy-compatibility | manual-section, target-boundary |
| Afflict a Bountiful Decay | hero-standalone | manual | not-reachable | manual-section |
| Behold the Mystery | hero-standalone | manual | not-reachable | manual-section, target-boundary |
| Bifurcated Incineration | hero-standalone | manual | legacy-compatibility | target-boundary |
| Breath of Dawn Remembered | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary, action-type |
| Conflagration | hero-standalone | manual | legacy-compatibility | manual-section, target-boundary |
| Explosive Assistance | hero-standalone | manual | legacy-compatibility | grammar, manual-section, target-boundary, action-type |
| Grasp of Beyond | hero-standalone | manual | not-reachable | manual-section |
| Hurl Element | hero-standalone | manual | legacy-compatibility | manual-section |
| Instantaneous Excavation | hero-standalone | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Invigorating Growth | hero-standalone | manual | not-reachable | manual-section |
| Meteoric Introduction | hero-standalone | supported | not-reachable |  |
| Motivate Earth | hero-standalone | manual | not-reachable | grammar, source-block-mismatch, unaccounted-paragraph, manual-section, target-boundary |
| No More Than a Breeze | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary |
| Practical Magic | hero-standalone | manual | legacy-compatibility | grammar, source-block-mismatch, unaccounted-paragraph, manual-section, target-boundary |
| Ray of Agonizing Self-Reflection | hero-standalone | supported | not-reachable |  |
| Return to Formlessness | hero-standalone | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Ripples in the Earth | hero-standalone | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Shared Void Sense | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary |
| Skin Like Castle Walls | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary, action-type |
| Subtle Relocation | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary, action-type |
| Test of Rain | hero-standalone | manual | not-reachable | manual-section, target-boundary |
| The Flesh, a Crucible | hero-standalone | manual | legacy-compatibility | manual-section |
| The Green Within, the Green Without | hero-standalone | manual | not-reachable | manual-section |
| Unquiet Ground | hero-standalone | manual | not-reachable | manual-section, target-boundary |
| Viscous Fire | hero-standalone | supported | compiled |  |
| Back! | hero-standalone | manual | not-reachable | target-boundary |
| Blood for Blood! | hero-standalone | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Brutal Slam | hero-standalone | supported | compiled |  |
| Furious Change | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary, action-type |
| Hit and Run | hero-standalone | manual | not-reachable | manual-section |
| Impaled! | hero-standalone | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Lines of Force | hero-standalone | manual | legacy-compatibility | grammar, manual-section, target-boundary, action-type |
| Make Peace With Your God! | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary |
| Out of the Way! | hero-standalone | manual | legacy-compatibility | unsafe-tier-remainder, manual-section |
| Thunder Roar | hero-standalone | manual | legacy-compatibility | manual-section, target-boundary |
| Tide of Death | hero-standalone | manual | not-reachable | manual-section, target-boundary |
| To the Death! | hero-standalone | manual | not-reachable | manual-section |
| To the Uttermost End | hero-standalone | manual | not-reachable | manual-section |
| Unearthly Reflexes | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary, action-type |
| Your Entrails Are Your Extrails! | hero-standalone | manual | not-reachable | manual-section |
| Special Delivery | hero-standalone | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Wrecking Ball | hero-standalone | manual | legacy-compatibility | grammar, unsafe-tier-remainder, source-block-mismatch, unaccounted-paragraph, manual-section, target-boundary |
| Shadowmeld | hero-standalone | manual | legacy-compatibility | grammar, source-block-mismatch, unaccounted-paragraph, manual-section, target-boundary |
| Detonate Sigil | hero-standalone | manual | legacy-compatibility | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Concussive Slam | hero-standalone | manual | not-reachable | grammar, unsafe-tier-remainder, empty-clause |
| Minor Acceleration | hero-standalone | manual | not-reachable | grammar, manual-section, target-boundary |
| Psionic Bolt | hero-standalone | manual | not-reachable | grammar, unsafe-tier-remainder |
| The Wode Defends | hero-standalone | manual | legacy-compatibility | unsafe-tier-remainder |
| Exploding Arrow | kit-signature | manual | legacy-compatibility | grammar, unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Unmooring | kit-signature | manual | legacy-compatibility | grammar, unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Bear Claws | kit-signature | manual | not-reachable | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Fade | kit-signature | manual | legacy-compatibility | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Wing Buffet | kit-signature | manual | not-reachable | unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Double Strike | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Forward Thrust, Backward Smash | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Battle Grace | kit-signature | manual | legacy-compatibility | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Pain for Pain | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, compatibility-boundary |
| Devastating Rush | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, compatibility-boundary |
| Let's Dance | kit-signature | manual | legacy-compatibility | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Driving Pounce | kit-signature | manual | not-reachable | unaccounted-paragraph, manual-section, compatibility-boundary |
| Raider's Awe | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, compatibility-boundary |
| Hamstring Shot | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, compatibility-boundary |
| Two Shot | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary |
| Net and Stab | kit-signature | manual | legacy-compatibility | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Protective Attack | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, compatibility-boundary |
| Patient Shot | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, compatibility-boundary |
| Leaping Lightning | kit-signature | manual | legacy-compatibility | grammar, unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Where I Want You | kit-signature | manual | legacy-compatibility | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Fancy Footwork | kit-signature | manual | legacy-compatibility | unaccounted-paragraph, manual-section, compatibility-boundary |
| Shield Bash | kit-signature | manual | legacy-compatibility | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Unbalancing Attack | kit-signature | manual | not-reachable | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Weakening Brand | kit-signature | manual | legacy-compatibility | grammar, unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Extension of My Arm | kit-signature | manual | legacy-compatibility | unsafe-tier-remainder, unaccounted-paragraph, manual-section, compatibility-boundary |
| Arcane Trick | granted | manual | legacy-compatibility | grammar, source-header, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary, action-type |
| Area of Expertise: Inspect Object | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Creature Sense | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Criminal Contacts | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Eidetic Memory: Memorize Text | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Engrossing Monologue | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Familiar: Restore | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Forgettable Face | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Friend Catapult | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Gum Up the Works | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Improvisation Creation | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Invisible Force | granted | manual | legacy-compatibility | grammar, source-header, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary, action-type |
| I've Got You! | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| I've Read About This Place | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Lie Detector | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Open Book | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Psychic Whisper | granted | manual | legacy-compatibility | grammar, source-header, unaccounted-paragraph, manual-section, target-boundary, compatibility-boundary, action-type |
| Ritualist | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Slipped Lead: Escape Bonds | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| So Tell Me... | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Thingspeaker | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Traveling Artisan | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Traveling Sage | granted | manual | legacy-compatibility | grammar, source-header, target-boundary, compatibility-boundary, action-type |
| Shadow Chains | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, target-boundary |
| Portal to the Void | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Drill Press | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Bull Rush | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Maul | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Lightning Strike | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Syringe Crossbow | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Heartstopper | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Snapjaw | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Covetous Bolts | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| The Silver Wolf's Final Stratagem | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Manifold Blade | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Executioner's Swing | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Fairness Is a Human Concept | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Trundle | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Floor to Flesh | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Dissolve | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Gore | foe-ability | manual | not-reachable | target-boundary |
| Hollow Grasp | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Stun | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Food Frenzy | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Build Wall | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Stone Bone Storm | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Razor's Edge | foe-ability | manual | not-reachable | manual-section |
| Dagger's Bite | foe-ability | manual | not-reachable | grammar |
| Heartpiercer | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Bolt Launcher | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Daggers | foe-ability | manual | not-reachable | target-boundary |
| Envenomed Steel | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Choking Grasp | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Tumbling Gore | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Bound Ahead | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Catcher | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Intercepting Shield | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Parting Gift | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Erupt | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Bone Dozer | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Crescent Sweep | foe-ability | manual | not-reachable | manual-section |
| Quick Shield | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Chop | foe-ability | manual | not-reachable | grammar, source-title, manual-section |
| Golden Sickles | foe-ability | manual | not-reachable | manual-section |
| Imbue with Might | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Overture | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Writhing Envelopment | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, compatibility-boundary |
| Snaring Crossbow | foe-ability | manual | legacy-compatibility | manual-section |
| Laser Lancet | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, source-block-count, source-block-mismatch, unaccounted-paragraph, manual-section |
| Whistling Axes | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Chill of Death | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder |
| Watch Your Six! | foe-ability | manual | not-reachable | grammar, manual-section |
| Glaive Rush | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section |
| Thunder of Heavens | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Put It Out! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Trick of the Eye | foe-ability | manual | not-reachable | grammar, manual-section |
| Draining Rake | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Verdant Rains | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Mind Jolt | foe-ability | manual | not-reachable | target-boundary |
| Bite | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Soul Burn | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Crestfall | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary |
| Gatling Bolt Gun | foe-ability | manual | not-reachable | target-boundary |
| Firetail Pilum | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Tongue Slap | foe-ability | manual | not-reachable | grammar, manual-section |
| Twist Shape | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Scaleshatter Burst | malice | manual | not-reachable | manual-section, target-boundary, compatibility-boundary |
| Enveloping Umbrage | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary, action-type, cost |
| My Power Alone | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| You Come With Me | foe-ability | manual | not-reachable | grammar, unaccounted-paragraph, manual-section, target-boundary |
| Flail and Blade | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Hrraaaaaagh! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Instill Regret | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Rejuvenation | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, source-block-count, source-block-mismatch, source-header, unaccounted-paragraph, manual-section, target-boundary, action-type |
| Natural Weapon | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Resonate Rune | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Gift From an Accursed Tome | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, compatibility-boundary |
| Activate Trap | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Mind Blown | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Portable Ballista | foe-ability | manual | legacy-compatibility | manual-section |
| Unload Rocks | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Mindpunk | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Blazing Leap | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Burning Kick | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Back! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Convocation of Waves | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Agonizing Harmony | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Feast | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Malign Thicket | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Fuse-Iron Knives | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Debilitating Poison | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Overcharge | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| The Writhing Green | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Crack the Earth | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Stoneshift | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Break Armor | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Command the Awakened | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Shadow Veil | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section |
| Aetherweb | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Surging Power | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Windwalk | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Corrupted Ash Daggers | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Barb Launch | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Dive | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| What Are You Waiting For? | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary, action-type, cost |
| Dual Targeting Shot | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Halberd | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Rise, My Minions | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, cost |
| Retaliatory Strike | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Detonation | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| The Voice | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Prickly Situation | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Glare of the Old Judgments | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Mug and Tear | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Ambuscade | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Absence of All Light | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Horrible Bellow | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Wrecking Ball | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Convocation of Quartz | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Growing Longsword | foe-ability | manual | not-reachable | manual-section |
| Repelling Psihander | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| No Matter the Cost | foe-ability | manual | not-reachable | manual-section, target-boundary, action-type, cost |
| Plaguecaster | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| You Ain't Getting Away | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Blight Rain | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Panoptibeam | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| So Long and Goodnight | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| From the Shadows | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Disarrange Thoughts | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| The Thriving Wilds | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Burning Legion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Bear Hug | foe-ability | manual | not-reachable | grammar, manual-section |
| Noxious Bubble | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Phantom Pain | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Stinging Ovipositor | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| The Depths Hunger | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Voracious Mastication | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Swat the Fly | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Blade Rake | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Bilious Expulsion | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Concussive Shockwave | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Overgrowth | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Catcher | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Retaliatory Dive | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sanguine Stimulants | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Poison Blow Dart | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Disemboweling Horns | foe-ability | manual | not-reachable | manual-section |
| No. | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Psionic Slam | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Grasping Tendons | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Agonizing Stinger | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Despair Bolt | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Flame Jet | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| The Earth Devours | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Adjudicator's Interdiction | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section |
| Houndcannon | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Gladius | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder |
| Conductor of Combat | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Death Blossom | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Haymaker Greataxe | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Kinetic Danse | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Siegeworks | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Edacity | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Air Raid! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Invigorated March | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Thunderclap | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Ssstop and Lisssten | malice | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary, compatibility-boundary |
| Animal Rally | foe-ability | manual | not-reachable | grammar, manual-section |
| Harrying Claws | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary |
| Petrifying Eye Beams | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Flyby Bite | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Swamp Gas | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Justice Turns Its Gaze | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Concussive Bolts | foe-ability | manual | legacy-compatibility | manual-section |
| Concentrate All Fire on That Hero! | foe-ability | manual | not-reachable | grammar, manual-section |
| Split Space | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Command Saber | foe-ability | manual | not-reachable | manual-section |
| Telekinetic Beam | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Natural Weapon | foe-ability | manual | not-reachable | target-boundary |
| Eyes-On-Me-Shot | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Dissipate | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Heavy Arrow | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Cages of Wasting | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Power Wing Buffet | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary |
| Jumplance | foe-ability | manual | not-reachable | target-boundary |
| Steely Skewer | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Throw | foe-ability | manual | not-reachable | grammar, manual-section |
| Emergency Beacon | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Reverberating Blast | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Tonguelash | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Swat the Fly | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Reactive Charm | foe-ability | manual | not-reachable | grammar, manual-section |
| Whiptail | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section |
| Eye Flash | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Maw | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Wilting Visions | foe-ability | manual | not-reachable | manual-section |
| Ruinous Temptation | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Cower! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Pneumatic Punch | foe-ability | manual | not-reachable | target-boundary |
| Psionic Rifle Burst | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Axe | foe-ability | manual | legacy-compatibility | target-boundary |
| Combined Arms | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Boom Pilum! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Accursed Bite | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Petrify | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Magnetic Pull | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Chain Hook | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Deterring Sting | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Vivace Vivace! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Castle Stone Shape | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Emergent Horrors | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Ready to Strike | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Chief's Command | foe-ability | manual | not-reachable | grammar, manual-section |
| Control Synapses | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Armor-Piercing Shell | foe-ability | manual | not-reachable | grammar, manual-section |
| You Next! | foe-ability | manual | not-reachable | grammar, manual-section |
| Cry Havoc | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, compatibility-boundary |
| Bonesplitter's Cackletongue | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Lightning Beam | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Corpse Bomb | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Subdermal Shielding | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Wode Sickness | foe-ability | manual | not-reachable | grammar, manual-section |
| Expanding Doom | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| A Hero Faces the Void | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Soulstorm | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Snackies for Sweeties | foe-ability | manual | not-reachable | extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Fireball Volley | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Howl | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Rotten Kick | foe-ability | manual | not-reachable | target-boundary |
| Let Us Feast! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Tail Spike | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section |
| Toxic Winds | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| In Our Sights | foe-ability | manual | not-reachable | grammar, manual-section |
| Lash Out | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Erupt | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Step and Swap | foe-ability | manual | not-reachable | grammar, manual-section |
| Thermodynamic Flight | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Nimble Escape | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Wizard Ripper | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Thorny Scales | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| For the Queen! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Get Them, You Dolts! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, cost |
| Crush Underfoot | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Ripping Claws | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| New Dawn | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| I'll Do This Myself | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Hostile Acquisition | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Thorned Armor | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Houndblade | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Fires of Dracul | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Three-Tail Flail | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Noxious Bite | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Rapier and Dagger | foe-ability | manual | not-reachable | manual-section |
| Flower of Frost | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Leaping Fury | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Where I End the Woods Begin | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Tooth! Tusk! Claw! | foe-ability | manual | not-reachable | manual-section |
| Thunderous Slam | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Summer's Bolt | foe-ability | manual | not-reachable | grammar, manual-section |
| Megaquake | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, compatibility-boundary |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Dirt Devil | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Smoke Bomb | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Buckler Bash | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Burning Oil | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Grasping Jaws | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| And the Sun Forsook Her Children | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Prehensile Tongue | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Crossbow | foe-ability | manual | not-reachable | target-boundary |
| Ashes to Ashes | foe-ability | manual | not-reachable | grammar, manual-section |
| Wax Fling | foe-ability | manual | not-reachable | manual-section |
| Frozen Retribution | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Claw Swipes | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Daggers | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Briar Bindings | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary, action-type, cost |
| Lugged Spear | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Summon Elemental | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Devilish Charm | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Buzz Off! | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Tile Slide | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Tactical Reposition | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Claw Swing | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Soul Sword | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Elemental Charge | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Ripper Shrikegun | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Incapacitate | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| The World Consumes | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Soul Prism | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Bloodshot | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Vicious Pursuit | foe-ability | manual | not-reachable | manual-section |
| Tongue Grab | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Soul Stinger | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Stomp | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Claim Them for the Body Banks | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Quick Blast | foe-ability | manual | not-reachable | manual-section |
| Wild Ax | foe-ability | manual | not-reachable | manual-section |
| Razor Bite | foe-ability | manual | not-reachable | manual-section |
| Levitating Axes | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Phantom Tail Swing | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Ever-Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Deaden | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Sinkhole | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Shieldbreaker Talisman | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Neurotoxin Splash | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Grasping Shadow | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Reel Them In | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Bloodletting Claws | foe-ability | manual | not-reachable | target-boundary |
| Sunderbuss | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Earth Pillar | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Houndgun and Houndblade | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Portal to the Sky | foe-ability | manual | not-reachable | grammar, manual-section |
| Troll Roar | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary, cost |
| Composting | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Greatsword and Roar | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Bladestorm | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Umbral Hunger | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Elemental Discharge | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Leapfrog | foe-ability | manual | not-reachable | grammar, source-title, manual-section |
| Leech | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| En Garde | foe-ability | manual | not-reachable | manual-section, target-boundary |
| You Activated My Trap! | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Acidic Stun | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Don't Turn Away | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Turn Green | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Rune-Signed Blade | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Cacophony | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Sprint | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Rondo of Rat | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Ensnarer Cannon | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Baleful Swap | foe-ability | manual | not-reachable | grammar, manual-section |
| Greedy Hands | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Barbed Tongues | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Carnage's Cackletongue | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Exsanguinating Bite | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Fuse-Iron Rocket | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Make an Example of Them | foe-ability | manual | not-reachable | grammar, manual-section, action-type, cost |
| Safeguard | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Flaming Punch | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Skeletal Eruption | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Soul Flay | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Hag Wyrd | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, compatibility-boundary |
| Mass Petrify | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Blood For Blood | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Convocation of Squalls | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Gloom Dagger | foe-ability | manual | not-reachable | grammar, manual-section |
| Jaws of the Void | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Burning Legion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Spear Charge | foe-ability | supported | compiled |  |
| Oozing Transformation | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Roughed Up | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Artillery Enfilade | foe-ability | manual | not-reachable | manual-section, target-boundary |
| I'm Not a Steed, You're Equipment | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, cost |
| Tail Whip | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Valiar Axe | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Corrosive Blade | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Blizzard Surge | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Grim Thrust | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Override | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Pilum | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Hammer and Anvil | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Swooping Torment | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| The Wode Protects Us | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Shrikegun Shot | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Fiery Claws | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Fire Flail | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Lumber | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Kinetic Crush | foe-ability | manual | not-reachable | manual-section |
| Spit | foe-ability | manual | not-reachable | target-boundary |
| Muddle the Mind | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder |
| Vault | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Optical Flare | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Longarm Shrikegun | foe-ability | manual | not-reachable | manual-section |
| Mind Requital | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| I Am Fire! I Am Death! | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Twin Flamebelchers | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Forward! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Sweeping Blade | foe-ability | manual | not-reachable | manual-section |
| Stinging Departure | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Hypnotic Mane | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Wall of Roses | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Flamelash | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Stick and Poke | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Vermilion Fangs | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Necrotic Form | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Carpe Quadratum | foe-ability | manual | not-reachable | grammar, manual-section |
| Barbed Tail Swing | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Psionic Retribution | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Dark Longbow | foe-ability | manual | not-reachable | manual-section |
| Do Not Hesitate in the Wode | foe-ability | manual | not-reachable | grammar, source-block-mismatch, manual-section, target-boundary |
| Death Grip | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Toss | foe-ability | manual | not-reachable | grammar, manual-section |
| Spear | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Many Maws | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Death Scythe | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Knife in the Dark | foe-ability | manual | not-reachable | manual-section |
| Duskfall | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, cost |
| Crushing Despair | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| The Chasm Engulfs | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Lay the Foundation | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Biokinetic Ballista | foe-ability | manual | not-reachable | manual-section, target-boundary |
| The Forest's Embrace | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Sunder the Very Skies | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Convocation of Verdure | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Four Swords Swing | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Nip | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Demonic Egress | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Form Up! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Grabby Hand | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Shatterstone | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Vanish | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Synlirii Grafts | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Return to Perfection | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Ajax Will Pay Well for These Specimens | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary, action-type, cost |
| Final Warning Fissure | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Gust of Wind | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Mark of Agony | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Slam Into Dirt | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Virulent Breath | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Envious Imitation | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Polarize Aura | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Needle-Knife | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Mindshatter | foe-ability | manual | not-reachable | manual-section, target-boundary, action-type, cost |
| Berserker Slash | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Mobile Mine Field | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Turned Upside Down | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Advance! | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Dolabra and Net | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Magic Siphon | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Pall of Nightmares | foe-ability | manual | not-reachable | manual-section, target-boundary, action-type, cost |
| Seismic Slam | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Lumina Mark | foe-ability | manual | not-reachable | manual-section |
| Enough! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Edge of the Law | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Drangolin Plume | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Thunder Rush | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Flaming Kick | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Hard Light Field | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Foreseen Punishment | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| The Natural Cycle | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Breach of Nihility | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Rotten Scraps | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Inspiring Strike | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section |
| Fetid Wrappings | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Brutal Impact | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Flurry | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Stunning Surge | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section |
| Hampering Roots | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Searing Grasp | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Sanguineous Flourish | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Writ of Execution | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Spirit Form | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Snack Attack | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Meat Shield | foe-ability | manual | legacy-compatibility | grammar, manual-section |
| Concealed Dagger | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Tempting Offer | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, cost |
| Fountains Roar, Now Free From the Earth | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Quickshot | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Vengeance for the Slain | foe-ability | manual | not-reachable | grammar, manual-section |
| Guardian From Afar | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Sanguine Mist | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Spinning Bone Blade | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Fight Me, Coward! | foe-ability | manual | not-reachable | grammar, manual-section |
| Polish Stone Shape | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Aggressive Mimicry | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Send in the Second Wave | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Rip and Tear | foe-ability | manual | not-reachable | target-boundary |
| Flying Sawblade | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Call to Self-Sabotage | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Advance! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Moment of Brutality | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Spitfire | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Greed Is Good | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Tower Shield Smash | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Cosmic Tail Ray | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Wings of Second Wind | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Your Weapon Is Useless | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Drag Through Hell | foe-ability | manual | not-reachable | grammar, manual-section |
| Blade | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Haymaker | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Signum | foe-ability | manual | not-reachable | manual-section |
| Full Wolf | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Tracer Longbow | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Stalker's Afterimage | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Prismacore Cannon | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Longbow | foe-ability | manual | not-reachable | target-boundary |
| Plague of Frogs | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Headway | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Compulsion Beam | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Snap and Toss | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| I'll Cover You! | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Go. | foe-ability | manual | not-reachable | grammar, manual-section |
| Grasping Tonguetacles | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Wasn't Aiming For You | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Earth Breach | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Tail Stinger | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Charging Chomp | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Snap, Crackle, Pop | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Ice Dance | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sandstorm | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Optical Collusion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Chaotic Entrancing Harmony | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Summoner's Cackletongue | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Cadenza | foe-ability | manual | not-reachable | grammar, manual-section |
| Lay Waste | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Iron Banner | foe-ability | manual | not-reachable | grammar, source-block-mismatch, unaccounted-paragraph, manual-section, target-boundary, cost |
| Chain Shotput | foe-ability | manual | not-reachable | target-boundary |
| Mace Lariat | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Call to Victory | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Throw Fit | foe-ability | manual | not-reachable | unaccounted-paragraph, manual-section, target-boundary |
| Overwatch | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Unhallowed Ground | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| You Would Flounder Your Assault? | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Kick | malice | manual | not-reachable | unsafe-tier-remainder, target-boundary, compatibility-boundary |
| Bomber Wasp Warfare | foe-ability | manual | not-reachable | target-boundary, action-type, cost |
| Fuse-Iron Bomb | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Earth Bump | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Abyssal Strike | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Splinter Dagger | foe-ability | manual | not-reachable | manual-section |
| Investiture of Verdure | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Venomous Spit | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Roiling Fist | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Wodeblade | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Burning Aurora | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Houndaxe | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Salt Wounds | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Breath Weapon | malice | manual | not-reachable | manual-section, target-boundary, compatibility-boundary |
| Lava Pillar | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Javelin and Bellow | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Flashing Fangs | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, source-block-count, source-block-mismatch, unaccounted-paragraph, manual-section |
| Glory to the Legion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Petrifying Eye Beams | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Skitter | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Ice Javelins | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Tether Down | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Don't Let Them Escape! | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary, action-type, cost |
| Barbed Stinger | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Encroaching Darkness | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Awe of the Iron Crown | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Agony Wail | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Get in Here! | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Close In | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| I'll Cut A Path | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Dine and Dash | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Shadow Step | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Phase Chant | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Sleep Grenade | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Caustic Detonator | foe-ability | manual | not-reachable | extra-roll-or-tiers, manual-section |
| Enemies in the Dark | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Wild Slam | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Four-Way Grasp | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| An Army From Blood | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Flail | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Blazing Trail | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Primal Bay | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Hellfire | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Wink | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Brainstorm | foe-ability | manual | not-reachable | manual-section, target-boundary, action-type, cost |
| Overwhelming Rend | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Gore Horn | foe-ability | manual | not-reachable | manual-section, target-boundary |
| We Will Won! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Feign Death | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Explosive Mote | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Memory Thief | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, compatibility-boundary |
| Precognitive Shift | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Breaking Palm | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Spew Slide | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Bonebreaker | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Bright Bolt | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Reclamation | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Verdict | foe-ability | manual | not-reachable | manual-section |
| Psi-Sickle | foe-ability | manual | not-reachable | grammar, manual-section |
| Labyrinth of Bone | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Snake Bites | foe-ability | manual | not-reachable | target-boundary |
| Miner Inconvenience | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Destructive Rollout | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Tongue Pull | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Explosion | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Horn Vault | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Release the Thralls | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Flux Gnash | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| No Escape | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, extra-roll-or-tiers, source-block-count, source-block-mismatch, unaccounted-paragraph, manual-section, target-boundary, action-type, cost |
| Warp Perceptions | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| You Will All Witness my Blade | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Imbue with Power | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Jagged Stone Club | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Catcher | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Roar | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Crash Through | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Steelfist | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Ram's Defiance | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Open the Oven | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Slushfall | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Marauder's Cackletongue | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Dismissal with Prejudice | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Nimble Step | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Convocation of Flames | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Scramble | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Bola Knock | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Bloodstones | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Cut 'Em Low! | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Ravenous Overgrowth | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary, action-type, cost |
| Bluster | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Quick Strike | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Trick Crossbow | foe-ability | manual | not-reachable | manual-section |
| Consume | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Bite | foe-ability | supported | compiled |  |
| Fury Flail | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Far Flung | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Ice Lob | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Upchuck | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, compatibility-boundary |
| Repent! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Power Chord | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Galvanic Arc | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Fall Back! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sinkhole | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Pain Unending | foe-ability | manual | not-reachable | manual-section |
| Frenzied Deluge | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary, action-type, cost |
| Kill! | foe-ability | manual | legacy-compatibility | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Rallying Ostinato | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Eye of Surlach | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder |
| Handaxes | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Sword Stab | foe-ability | manual | legacy-compatibility | manual-section |
| You Would Dare?! | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Carving Dagger | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Heart of the Forge | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary, action-type, cost |
| King's Fissure | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Flash Swipe | foe-ability | manual | not-reachable | manual-section |
| Pain Absorption | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Fire Curse | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Handaxe | foe-ability | manual | legacy-compatibility | manual-section, target-boundary |
| Devour Soul | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Club Charge | foe-ability | manual | legacy-compatibility | target-boundary |
| Piercing Tails | foe-ability | manual | not-reachable | manual-section |
| Castling | foe-ability | manual | not-reachable | grammar, manual-section |
| Buss Buffe | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Dagger Dance | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Gore | foe-ability | manual | not-reachable | manual-section |
| Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Zweihander Swing | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Investiture of Gravity | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Rampage | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Sword Lunge | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Psionic Intrusion | foe-ability | manual | not-reachable | target-boundary |
| Acquired Taste | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Psychic Pulse | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Shield Bash | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Ensnaring Chains | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Shed Some Skin | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Serrated Saber | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Tail Bite | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Caustic Paste Bomb | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Shield Bash | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Divine Vine | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Jaunt | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Cold Axe | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Hasta | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Kiss of Death | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Canis Shrikegun | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Caldera | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Swat | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Brace and Break | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Arise, My Children | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Lurching Swipe | foe-ability | manual | not-reachable | grammar |
| Grasping Shadow | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary |
| Mystic Battery | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Mindwipe | foe-ability | manual | not-reachable | grammar, manual-section |
| Arms of Necrosis | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Heckle | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Time Is Money | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Command From the Back | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Blazing Leap | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Nostalgic Wanderlust | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Hrraaaaaagh! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Guardian Block | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Spinous Tail Swing | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Impale | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Ribcage Chomp | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Tentacle | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Cobblestone Shape | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section |
| Handaxes | foe-ability | manual | legacy-compatibility | manual-section, target-boundary |
| Skulls Abound | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Battlefield Control | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Demonwarp Tears | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Heavy Crossbolt | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Zephyr Feint | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Liquify | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Dusk Cleave | foe-ability | manual | not-reachable | manual-section |
| Blowgun | foe-ability | manual | not-reachable | manual-section |
| Shrapnel Whip | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Kneel, Peasant! | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Steal Time | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Predator's Alacrity | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Horrifying Form | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Take the Opening | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| On My Mark! | foe-ability | manual | not-reachable | grammar, manual-section |
| Web | foe-ability | manual | legacy-compatibility | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Trample | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Retaliatory Strike | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Spinning Spit | foe-ability | manual | not-reachable | target-boundary |
| Snaking Entrails | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Show Me Who You Are | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Meat Shield | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sacrifice | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, source-block-mismatch, source-header, unaccounted-paragraph, manual-section, target-boundary, action-type, cost |
| Kinetic Lane | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Snaring Javelin | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Inertial Flow | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Who's Hesitating? | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Corrupted Ash Teleport | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Catcher | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Shield Warden | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Skitter | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Buck | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Blotting Bolt | foe-ability | manual | not-reachable | manual-section |
| Twystrd | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Disorientate | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Phoenix Wing King | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Timely Intervention | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Entangling Vines | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Notched Axe | foe-ability | manual | not-reachable | grammar |
| Leg Blade | foe-ability | manual | legacy-compatibility | target-boundary |
| Better Out Than In | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Wall Leap | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Break Ground | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Deceptive Stratagem | foe-ability | manual | not-reachable | grammar, manual-section, action-type, cost |
| Death Roll | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Quill Pushing | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Headlam Rampage | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary, action-type, cost |
| Enter the Fray | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Anyone Can Do That | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Slime Spew | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Bury the Point | foe-ability | supported | compiled |  |
| Soulbind | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Soul Steal | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Carnivorous Bite | foe-ability | manual | not-reachable | manual-section |
| Concealing Strike | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Poison the Blade | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Shared Sickness | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Acid and Claws | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary, action-type, cost |
| Weakening Glare | malice | manual | not-reachable | unsafe-tier-remainder, compatibility-boundary |
| Targeting Beam | foe-ability | manual | not-reachable | manual-section |
| Armor of Corpses | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Focus Fire | foe-ability | manual | legacy-compatibility | grammar, manual-section, action-type, cost |
| Forward Assault | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Bat Form | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, cost |
| Armor of the Ancients | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Composite Bow | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Inspiring Swordplay | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Thunderstruck | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Blistering Element | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Preserve and Protect | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Steam-Powered Snare | foe-ability | manual | legacy-compatibility | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Blade of the Gol King | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Chorus of Destruction | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Immortal Flare | foe-ability | manual | not-reachable | grammar, manual-section |
| Crag Burst | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Banded Dagger | foe-ability | manual | not-reachable | target-boundary |
| Stay Back! | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Natural Weapon | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Blight Pus | foe-ability | manual | not-reachable | manual-section |
| Redirected Charm | foe-ability | manual | not-reachable | grammar, manual-section |
| My Spear, My Foe | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Over Here, Thanks | foe-ability | manual | not-reachable | grammar, manual-section |
| Shield Smash | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Spirit Meld | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Haymaker | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Enchantments of War | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Hop and Chop | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Shoot! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Lop | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Solo Act | foe-ability | manual | not-reachable | grammar, manual-section, action-type, cost |
| Devilish Charm | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Wyrd Warp | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sneering Disregard | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Deepest Wounds | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Laugh It Off | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Portal to the Mantle | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Cast Away All Hope | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Punishing Flail | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Goring Horns | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Ripper Spear | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Courtesy Call | foe-ability | manual | not-reachable | grammar, manual-section |
| Striking Afterimage | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Break Armor | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Shapeshifter | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Psionic Boom | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Blaster Volley | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Chitin Bash | foe-ability | manual | not-reachable | target-boundary |
| Stick to the Plan! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Still Your Tongue! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Maw of the Abyss | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Clawed Kick | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Spitfire | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Grav Spike | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Unlimited Power! | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary, action-type, cost |
| Swift Serration | foe-ability | manual | not-reachable | manual-section, target-boundary |
| First Warning Quake | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Poison Dart | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Hair Whip | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Hopeless Place | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| I've Learned Their Tricks | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Swing | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Take Point! | foe-ability | manual | not-reachable | grammar, manual-section |
| Tentacle Toss | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Lumina Assault | foe-ability | manual | not-reachable | manual-section |
| Lightning Rod | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Vengeance of Rhöl | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Parry! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| All Rise | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary, action-type, cost |
| Natural Weapon | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Red Tide | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Challenge | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, action-type, cost |
| Tongue Whip | foe-ability | manual | not-reachable | grammar, manual-section |
| Rose Thorn Lash | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Reactive Rebuke | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Familial Reinforcements | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Poison the Blade | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Stabbity Stab | foe-ability | manual | not-reachable | grammar, manual-section |
| Throw | foe-ability | manual | not-reachable | grammar, manual-section |
| Elevate | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Concussive Maul | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section |
| Ashes to Ashes | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Grasping Claws | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Spittlesplash | foe-ability | manual | not-reachable | target-boundary |
| Bead of Hell | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Numb | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Longshot | foe-ability | manual | not-reachable | grammar, manual-section |
| Tentacle Grab | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Forked Knife | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Devolving Tentacles | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Forge Hammer Tail Slam | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Bite | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section |
| Recall | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Whip Frenzy | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Killer Claws | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Blightblade | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section |
| Boulder Bash | foe-ability | manual | not-reachable | action-type |
| Magnetomancy | foe-ability | manual | legacy-compatibility | grammar, manual-section |
| Flame Wad | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Dragon's Eruption | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Trouser Cut | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, compatibility-boundary |
| You! | foe-ability | manual | not-reachable | grammar, manual-section |
| Necrotic Bolt | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Golden Scythe | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Valiar Cloak | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Heed My Decree | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Compel the Jury | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Baneful Blade | foe-ability | manual | not-reachable | grammar, source-title, manual-section |
| Kicking the Nest | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Throw | foe-ability | manual | not-reachable | grammar, manual-section |
| Voidlight Breath | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary, action-type, cost |
| Suffusing Strike | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Dive Bomb | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Alchemical Device | malice | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, compatibility-boundary |
| Natural Weapon | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Bow | foe-ability | manual | legacy-compatibility | manual-section, target-boundary |
| Sucker Punch | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Viridescent Storm | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Engulf | foe-ability | manual | not-reachable | grammar, manual-section |
| Spear of the Damned | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Catcher | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Reflexive Instinct | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sand Slam | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Litigation | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Lash Out | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Armageddon | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| What You Deserve | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Precognitive Shift | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Misdirection | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Barbed Tongues | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| The Wode Protects Us | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Final Orders | foe-ability | manual | not-reachable | grammar, manual-section |
| People Bowling | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Travel By Fire | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Tangled Nest | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary |
| Agile Stride | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Water Wing | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Fire and Brimstone | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Claw and Blade | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Impactful Arrival | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Vine Lash | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Hill Quake | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Juke | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Are You Not Entertained?! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Damning Gaze | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Night Knife | foe-ability | manual | not-reachable | manual-section |
| Corroding Breath | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Hop To It | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Your Obsession With Me Betrays You | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Chainsaw Whip | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Arm and a Leg | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Gore | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder |
| Portal to the Firing Line | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Clobberin' Club | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Serpent Wings | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Retaliatory Strike | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Poisoned Dagger | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Roaring Gambit | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Call Up From the Abyss | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Inhale | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Quid Pro Quo | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Fifth Fist | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Abyssal Protectors | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Summon Elemental | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Slag Spew | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Acid Spew | foe-ability | manual | not-reachable | manual-section, target-boundary, action-type, cost |
| Raging Tempest | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Lead From the Front | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Engulf | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Get Reckless! | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary |
| Choking Bolt | foe-ability | manual | not-reachable | manual-section |
| Fog of War | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| I Can Throw My Blade and So Should You! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Sputter | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Bully the Weak | foe-ability | manual | not-reachable | grammar, manual-section, action-type, cost |
| Earth-Breaking Jump | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Stone Wave | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Gravity Well | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Heavy Longbow | foe-ability | manual | not-reachable | target-boundary |
| Flamebelcher | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Wing Buffet | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Savoring Bite | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Importunity | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Poison Fumes | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Toxic Vapors | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Baneful Blade | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| The Lay of Cor'thoroth | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Begone, Smallfolk! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Archer's Cackletongue | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Overture of Destruction | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Experimental Treasure | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Testudo! | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Highest Posthumous Promotion | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Piercing Trill | foe-ability | manual | not-reachable | manual-section |
| Refulgent Beams | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Snare Bow | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Field Collapse | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Web Vial | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sedating Stinger | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Focus Fire | foe-ability | manual | not-reachable | grammar, manual-section |
| Ossuary Assault | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Brutal Flail | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Decree by the Jade Hand | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Disruption Beam | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary, action-type, cost |
| Eager Claws | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Pilium | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Spiked Maul | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Breath of Brume | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Mudslide | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Impede | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Pounce | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Expunging Exhalation | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Hook and Chain | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Rapier Flunge | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| It Is Day | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Several Arms | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| A Hush of Ash | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Gnash | foe-ability | manual | not-reachable | grammar, source-title, manual-section |
| Brawny Buffe | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Power Burst | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Tearing Recoil | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Violent Thrashing | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Corrosive Claws | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Mourning Cry | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Lockdown | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Claws | foe-ability | manual | legacy-compatibility | manual-section, target-boundary |
| Dagger Feint | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Marble From a Great Sling | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Summon the Onyx Tower | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Illusory Feint | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Infernal Pike | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Devilish Charm | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Necro Beam | foe-ability | manual | not-reachable | manual-section |
| Lockjaw | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Facepalm and Head Slam | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Shadow Drag | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Construction Arm | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| But We Will Change Her Mind | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Fearsome Bay | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Adaptability | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Tail Sweep | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Lion's Toss | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder |
| You Didn't Pay Attention! | foe-ability | manual | not-reachable | grammar, manual-section |
| Swordplay | foe-ability | manual | legacy-compatibility | manual-section |
| Brain Drain | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Fuse-Iron Lance | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Ready Rodent | foe-ability | manual | not-reachable | grammar, manual-section |
| Clever Trick | foe-ability | manual | not-reachable | grammar, manual-section |
| Conditioning Spear | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Flesh-Eater Knife | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Suppressing Volley | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Morningstar and Javelin | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Lightning Bolt | foe-ability | manual | not-reachable | manual-section |
| Is This What They Taught You? | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Jaws and Claws | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Whip and Magic Longsword | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Acidic Anguish | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Visions in the Dark | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sparkling Tail Whip | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Imbue with Power | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Arcane Telum | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Blood of the Abyss | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Skewer | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Exposed Crux | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Infernal Decree | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Feeding Frenzy | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Assail and Serrate | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Spiteful Retort | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Tonguelash | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Adaptability | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Wild Swing | foe-ability | manual | not-reachable | target-boundary |
| Cerebral Suplex | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Black Flame | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder |
| Sun Lamp | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Strangle | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Acid Grasp | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Cornered Predator | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Mark Targets | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Boot and Blade | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Devilish Charm | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Fissures of Darkness | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Stone Puppets | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Shutout | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Fold Space | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Pitchfork Catapult | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Elemental Uproar | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Heavy Landing | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Crimson Embrace | foe-ability | manual | not-reachable | manual-section |
| Poison the Blade | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Sea-Salted Wounds | foe-ability | manual | not-reachable | grammar, manual-section |
| Tempo Changer | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Enflame | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Cackler's Cackletongue | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Ice Dance | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| All Eyes, All Rise | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| I Thrive on Pain | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Precog Reflexes | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Thresher Thrasher | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Blood Haze | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Is It Now or Is It Then? | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Chroma Cloak | foe-ability | manual | not-reachable | grammar, unaccounted-paragraph, manual-section, target-boundary |
| Running Cacophony | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Dust Cloud | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Seismic Crush | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Earthwave | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Law and Order | foe-ability | manual | not-reachable | grammar, manual-section |
| Circle and Strike | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Dagger Storm | foe-ability | manual | not-reachable | grammar, unaccounted-paragraph, manual-section, target-boundary |
| Trumpeting Howl | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, target-boundary, action-type, cost |
| Awash | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Buried in Sand | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Shadow Cloak | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Let's Tussle | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Throw | foe-ability | manual | not-reachable | grammar, manual-section |
| Dampening Grenade | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Fire Crossbow | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Gourmet Flesh | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Conflagration | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Pillar | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Kill Zone | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Mourning Till Dusk | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary |
| Warp Touch | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Vengeful Tusker | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Wide Axe | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section |
| Infernal Injunction | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Heat and Pressure | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary |
| Gladius | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| All to Cinders | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Gloom Bolt | foe-ability | manual | not-reachable | target-boundary |
| Pugio | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Celestial Furor | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Concussive Grenade | foe-ability | manual | legacy-compatibility | unsafe-tier-remainder, manual-section, target-boundary |
| Stomp | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Bloody Whirlwind | foe-ability | manual | not-reachable | manual-section, target-boundary |
| See Only Me | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, manual-section, target-boundary, action-type, cost |
| Breathsnipe | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Fuel for the Fire | foe-ability | manual | not-reachable | grammar, manual-section |
| Rush | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Frightening Tones | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Big Bite | foe-ability | manual | not-reachable | grammar, manual-section |
| Pile Bunker Gauntlet | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Hookclaw | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Throw | foe-ability | manual | not-reachable | grammar, manual-section |
| Shocking Bolt | foe-ability | manual | not-reachable | manual-section |
| Takeoff | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Call Abyssal Hyenas | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Red Mist Rising | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Gore | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Polarity Chaos | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, source-header, manual-section, target-boundary, action-type, cost |
| Souls of the Broken | foe-ability | manual | not-reachable | grammar, unsafe-tier-remainder, manual-section, target-boundary, action-type, cost |
| Living Blaze | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Gatling Blaster | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Magnetic Trickery | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary, action-type, cost |
| Forced Gestation | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Vortex of Pain | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Lumina Arrow | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Hunting Leap | foe-ability | manual | not-reachable | grammar, manual-section |
| Blazing Charge | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Club Swing | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Empyrean Boon | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Tractor Beam | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Toothful Thrashing | foe-ability | manual | not-reachable | unsafe-tier-remainder |
| Disarming Glare | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Fuel the Fire | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Violent Transformation | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Bite | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Test Your Metal! | foe-ability | manual | legacy-compatibility | grammar, manual-section, target-boundary, action-type, cost |
| Throw | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Trundle | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Fire Solo | foe-ability | manual | not-reachable | grammar, source-header, manual-section, target-boundary, action-type, cost |
| Splitbow | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Dizzying Hex | foe-ability | manual | legacy-compatibility | grammar, unsafe-tier-remainder |
| Stunning Blast | foe-ability | manual | legacy-compatibility | target-boundary |
| Devilish Suggestion | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, unaccounted-paragraph, manual-section, target-boundary |
| Talons | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Dweomer Plume | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Wall of Flesh | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Flurry of Bites | foe-ability | manual | not-reachable | target-boundary |
| Land's Guardian | foe-ability | manual | not-reachable | grammar, extra-roll-or-tiers, source-header, manual-section, target-boundary, action-type, cost |
| Horrid Wail | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section, target-boundary |
| Chilling Gravetouch | foe-ability | manual | not-reachable | manual-section |
| Multiarm Strike | foe-ability | manual | not-reachable | manual-section |
| Unbound Horrors | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary, action-type, cost |
| Hollowbone Slug | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Blast of Mummy Dust | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Vampiric Celerity | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Summon My Guard | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Stolen Vitality | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Bone Carvers | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Rotten Smash | foe-ability | manual | not-reachable | unsafe-tier-remainder, target-boundary |
| Accursed Slam | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Accursed Bindings | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Hidden Movement | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Exsanguinating Bite | foe-ability | manual | not-reachable | manual-section |
| Eldritch Curse | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Knocking Heads | foe-ability | manual | not-reachable | grammar, manual-section, target-boundary |
| Binding Curse | foe-ability | manual | not-reachable | unsafe-tier-remainder, manual-section |
| Taste | foe-ability | manual | not-reachable | manual-section, target-boundary |
| Plague of Flies | foe-ability | manual | not-reachable | manual-section, target-boundary, action-type, cost |
