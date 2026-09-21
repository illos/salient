// SPDX-License-Identifier: GPL-3.0-only
/** Printed level-one stat blocks; sourcePath cites each companion. */
export const BEASTHEART_COMPANIONS = [
  {
    name: 'Basilisk',
    slug: 'basilisk',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/basilisk.md',
    size: '1L',
    speed: 5,
    stability: 2,
    movement: '—',
    immunity: 'Poison 3',
    skill: 'Alertness',
    characteristics: {
      M: 2,
      A: 1,
      R: -1,
      I: 2,
      P: 2,
    },
    features: [
      {
        name: 'Stoned',
        path: 'en/unified/md/feature/companion/beastheart/basilisk/level-1/stoned.md',
      },
    ],
    abilities: [
      {
        name: 'Petrify',
        path: 'en/unified/md/feature/ability/companion/beastheart/basilisk/level-1/petrify.md',
      },
    ],
  },
  {
    name: 'Bear',
    slug: 'bear',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/bear.md',
    size: '1L',
    speed: 5,
    stability: 2,
    movement: 'Climb',
    immunity: '—',
    skill: 'Intimidate',
    characteristics: {
      M: 2,
      A: 1,
      R: -1,
      I: 2,
      P: 2,
    },
    features: [
      {
        name: 'Strong Like Bear',
        path: 'en/unified/md/feature/companion/beastheart/bear/level-1/strong-like-bear.md',
      },
    ],
    abilities: [
      {
        name: 'Backhand',
        path: 'en/unified/md/feature/ability/companion/beastheart/bear/level-1/backhand.md',
      },
    ],
  },
  {
    name: 'Boar',
    slug: 'boar',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/boar.md',
    size: '1M',
    speed: 5,
    stability: 2,
    movement: '—',
    immunity: '—',
    skill: 'Search',
    characteristics: {
      M: 2,
      A: 1,
      R: -1,
      I: 2,
      P: 2,
    },
    features: [
      {
        name: 'Spiteful Endurance',
        path: 'en/unified/md/feature/companion/beastheart/boar/level-1/spiteful-endurance.md',
      },
    ],
    abilities: [
      {
        name: 'Gore',
        path: 'en/unified/md/feature/ability/companion/beastheart/boar/level-1/gore.md',
      },
    ],
  },
  {
    name: 'Condor',
    slug: 'condor',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/condor.md',
    size: '1M',
    speed: 7,
    stability: 0,
    movement: 'Fly',
    immunity: '—',
    skill: 'Alertness',
    characteristics: {
      M: 2,
      A: 1,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Moving Target',
        path: 'en/unified/md/feature/companion/beastheart/condor/level-1/moving-target.md',
      },
    ],
    abilities: [
      {
        name: 'Flurry of Wings',
        path: 'en/unified/md/feature/ability/companion/beastheart/condor/level-1/flurry-of-wings.md',
      },
    ],
  },
  {
    name: 'Deinonychus',
    slug: 'deinonychus',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/deinonychus.md',
    size: '1M',
    speed: 7,
    stability: 1,
    movement: '—',
    immunity: '—',
    skill: 'Track',
    characteristics: {
      M: 2,
      A: 2,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Blood Frenzy',
        path: 'en/unified/md/feature/companion/beastheart/deinonychus/level-1/blood-frenzy.md',
      },
    ],
    abilities: [
      {
        name: 'Terrible Claws',
        path: 'en/unified/md/feature/ability/companion/beastheart/deinonychus/level-1/terrible-claws.md',
      },
    ],
  },
  {
    name: 'Drake',
    slug: 'drake',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/drake.md',
    size: '1M',
    speed: 5,
    stability: 1,
    movement: 'Fly',
    immunity: 'attuned',
    skill: 'Intimidate',
    characteristics: {
      M: 2,
      A: 1,
      R: -1,
      I: 2,
      P: 2,
    },
    features: [
      {
        name: 'Elementally Attuned',
        path: 'en/unified/md/feature/companion/beastheart/drake/level-1/elementally-attuned.md',
      },
      {
        name: 'Shared Scales',
        path: 'en/unified/md/feature/companion/beastheart/drake/level-1/shared-scales.md',
      },
    ],
    abilities: [
      {
        name: 'Drake Breath',
        path: 'en/unified/md/feature/ability/companion/beastheart/drake/level-1/drake-breath.md',
      },
    ],
  },
  {
    name: 'Elemental Spark',
    slug: 'elemental-spark',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/elemental-spark.md',
    size: '1M',
    speed: 7,
    stability: 1,
    movement: '—',
    immunity: 'Lightning 3',
    skill: 'Magic',
    characteristics: {
      M: 2,
      A: 2,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Electric Surge',
        path: 'en/unified/md/feature/companion/beastheart/elemental-spark/level-1/electric-surge.md',
      },
    ],
    abilities: [
      {
        name: 'Static Shock',
        path: 'en/unified/md/feature/ability/companion/beastheart/elemental-spark/level-1/static-shock.md',
      },
    ],
  },
  {
    name: 'Gummy Ball',
    slug: 'gummy-ball',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/gummy-ball.md',
    size: '1L',
    speed: 5,
    stability: 2,
    movement: '—',
    immunity: 'Acid 3',
    skill: 'Sneak',
    characteristics: {
      M: 2,
      A: 2,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Gelatinous',
        path: 'en/unified/md/feature/companion/beastheart/gummy-ball/level-1/gelatinous.md',
      },
    ],
    abilities: [
      {
        name: 'Absorb',
        path: 'en/unified/md/feature/ability/companion/beastheart/gummy-ball/level-1/absorb.md',
      },
    ],
  },
  {
    name: 'Hellhound',
    slug: 'hellhound',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/hellhound.md',
    size: '1M',
    speed: 7,
    stability: 1,
    movement: '—',
    immunity: 'Fire 3',
    skill: 'Intimidate',
    characteristics: {
      M: 2,
      A: 2,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Hellish Pact',
        path: 'en/unified/md/feature/companion/beastheart/hellhound/level-1/hellish-pact.md',
      },
    ],
    abilities: [
      {
        name: 'Fire Breath',
        path: 'en/unified/md/feature/ability/companion/beastheart/hellhound/level-1/fire-breath.md',
      },
    ],
  },
  {
    name: 'Lightbender',
    slug: 'lightbender',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/lightbender.md',
    size: '1L',
    speed: 7,
    stability: 2,
    movement: '—',
    immunity: '—',
    skill: 'Hide',
    characteristics: {
      M: 2,
      A: 1,
      R: -1,
      I: 2,
      P: 2,
    },
    features: [
      {
        name: 'Avoidance',
        path: 'en/unified/md/feature/companion/beastheart/lightbender/level-1/avoidance.md',
      },
    ],
    abilities: [
      {
        name: 'Sparking Tail Whip',
        path: 'en/unified/md/feature/ability/companion/beastheart/lightbender/level-1/sparking-tail-whip.md',
      },
    ],
  },
  {
    name: 'Panther',
    slug: 'panther',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/panther.md',
    size: '1M',
    speed: 7,
    stability: 1,
    movement: 'Climb',
    immunity: '—',
    skill: 'Sneak',
    characteristics: {
      M: 2,
      A: 2,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Mighty Spring',
        path: 'en/unified/md/feature/companion/beastheart/panther/level-1/mighty-spring.md',
      },
    ],
    abilities: [
      {
        name: 'Pounce',
        path: 'en/unified/md/feature/ability/companion/beastheart/panther/level-1/pounce.md',
      },
    ],
  },
  {
    name: 'Spider',
    slug: 'spider',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/spider.md',
    size: '1M',
    speed: 5,
    stability: 1,
    movement: 'Climb',
    immunity: '—',
    skill: 'Sneak',
    characteristics: {
      M: 2,
      A: 2,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Come Into My Parlor',
        path: 'en/unified/md/feature/companion/beastheart/spider/level-1/come-into-my-parlor.md',
      },
    ],
    abilities: [
      {
        name: 'Web Shot',
        path: 'en/unified/md/feature/ability/companion/beastheart/spider/level-1/web-shot.md',
      },
    ],
  },
  {
    name: 'Sporeling',
    slug: 'sporeling',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/sporeling.md',
    size: '1S',
    speed: 5,
    stability: 0,
    movement: '—',
    immunity: 'Poison 3',
    skill: 'Track',
    characteristics: {
      M: 2,
      A: 2,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Skulker',
        path: 'en/unified/md/feature/companion/beastheart/sporeling/level-1/skulker.md',
      },
    ],
    abilities: [
      {
        name: 'Spore Puff',
        path: 'en/unified/md/feature/ability/companion/beastheart/sporeling/level-1/spore-puff.md',
      },
    ],
  },
  {
    name: 'Wolf',
    slug: 'wolf',
    sourcePath: 'en/unified/md/monster/companion/beastheart/statblock/wolf.md',
    size: '1M',
    speed: 7,
    stability: 1,
    movement: '—',
    immunity: '—',
    skill: 'Track',
    characteristics: {
      M: 2,
      A: 2,
      R: -1,
      I: 2,
      P: 1,
    },
    features: [
      {
        name: 'Retriever',
        path: 'en/unified/md/feature/companion/beastheart/wolf/level-1/retriever.md',
      },
    ],
    abilities: [
      {
        name: 'Clamping Jaws',
        path: 'en/unified/md/feature/ability/companion/beastheart/wolf/level-1/clamping-jaws.md',
      },
    ],
  },
] as const;
