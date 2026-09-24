// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest';
import { COMPARISON_REPORT, SELECTION } from '../../scripts/foes/batches.ts';
import { readFileSync } from 'node:fs';
import { generateFoes, readInputs } from '../../scripts/ingest-foes.ts';
import {
  applyCorrections,
  fingerprint,
  importFoes,
  REVISION,
  tags,
} from '../../scripts/foes/import.ts';
import { sourceFeatures } from '../../scripts/foes/source-adaptations.ts';
import type { Input, Identity } from '../../scripts/foes/import.ts';
import { compareBlock, compareFoes, validateComparisonReport } from '../../scripts/foes/compare.ts';
import type { Fields, FoeObject, FoePackage, Json } from '../../shared/contracts/foes.ts';
import { foeReference, resolveFoe, searchFoes } from '../../shared/foes/catalog.ts';
import { repoRoot } from '../../scripts/lib/vendor.ts';
import { readPinnedSource } from '../helpers/pinned-source.ts';
const pack = JSON.parse(
  readFileSync(new URL('../../shared/content/foes/catalog.json', import.meta.url), 'utf8'),
) as FoePackage;
const identities = JSON.parse(
  readFileSync(new URL('../../scripts/foes/identities.json', import.meta.url), 'utf8'),
) as Identity[];
const oldEditions = [
  '6c6bbd40f2460c196511a2f0cc19b2ff9184ddee27be90245e5d5a8a915ed331',
  '24315df7920eadd03b5a546af9deae3f460bafa531c77e9650421cf628323425',
].map(
  edition =>
    JSON.parse(
      readFileSync(
        new URL(`../../shared/content/foes/editions/${edition}.json`, import.meta.url),
        'utf8',
      ),
    ) as FoePackage,
);
const legacyIds = new Set(oldEditions[1].objects.map(o => o.id));
const legacyPack = {
  ...pack,
  objects: pack.objects.filter(o => legacyIds.has(o.id)),
  search: pack.search.filter(o => legacyIds.has(o.id)),
};
const named = (name: string, parent?: string) =>
  legacyPack.objects.find(o => o.name === name && (!parent || o.parentId?.endsWith('/' + parent)))!;
const byId = new Map(pack.objects.map(o => [o.id, o]));
const parentAt = (path: string, book = 'monsters') =>
  pack.objects.find(o => !o.parentId && o.source.path === `en/books/${book}/md/${path}.md`)!;
const child = (path: string, name: string) => {
  const parent = parentAt(path);
  return parent.featureIds.map(id => byId.get(id)!).find(o => o.name === name)!;
};
// Read the large pinned corpus once; mutation fixtures receive fresh shallow input copies.
let cachedInputs: Input[] | undefined;
const sourceInputs = () => (cachedInputs ??= readInputs()).map(input => ({ ...input }));
/** Synthetic counterpart, NOT a captured third-party fixture. Literal source-derived sample. */
function skeletonCounterpart(): Fields {
  return {
    id: 'skeleton',
    name: 'Skeleton',
    source: { book: 'Monsters' },
    level: 1,
    ev: 3,
    role: 'Artillery',
    organization: 'Horde',
    keywords: ['Undead', 'Soulless'],
    size: '1M',
    speed: 5,
    stamina: 10,
    stability: 0,
    freeStrike: 2,
    withCaptain: '',
    characteristics: { might: 0, agility: 2, reason: 1, intuition: 0, presence: -1 },
    immunities: { corruption: 1, poison: 1 },
    weaknesses: {},
    movementTypes: ['walk'],
    items: [
      {
        type: 'ability',
        name: 'Bone Shards',
        ability_type: 'Signature Ability',
        keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
        usage: 'Main action',
        distance: 'Melee 1 or ranged 10',
        target: 'One creature or object',
        effects: [
          { roll: '2d10 + 2', tier1: '4 damage', tier2: '6 damage', tier3: '7 damage' },
          {
            name: 'Effect',
            effect:
              "Until the start of the skeleton's next turn, the target takes 2 damage the first time they willingly move on their turn.",
          },
        ],
      },
      {
        type: 'ability',
        name: 'Bone Spur',
        cost: '2 Malice',
        keywords: ['Area', 'Weapon'],
        usage: 'Maneuver',
        distance: '1 burst',
        target: 'Each enemy in the area',
        effects: [
          {
            roll: '2d10 + 2',
            tier1: '1 damage; M<0 bleeding (save ends)',
            tier2: '2 damage; M<1 bleeding (save ends)',
            tier3: '3 damage; M<2 bleeding (save ends)',
          },
          { name: 'Effect', effect: 'Each target takes a bane on their next strike.' },
        ],
      },
      {
        type: 'feature',
        name: 'Arise',
        effects: [
          {
            effect:
              "The first time the skeleton is reduced to 0 Stamina by damage that isn't fire damage or holy damage and their body isn't destroyed, they instead have 1 Stamina and fall prone.",
          },
        ],
      },
    ],
  };
}
describe('complete core source ingestion', () => {
  it('regenerates the committed package exactly and retains exact pinned input', async () => {
    // `pack` is the committed catalog written by an earlier CLI run; equality proves determinism across
    // processes, so a second in-process generation (about 13 s) would add nothing.
    const a = await generateFoes();
    expect(a).toEqual(pack);
    expect(a.objects.filter(o => o.kind === 'statblock')).toHaveLength(438);
    expect(a.objects.filter(o => o.kind === 'ability')).toHaveLength(1158);
    expect(a.objects.filter(o => o.kind === 'trait')).toHaveLength(642);
    expect(a.objects.filter(o => o.kind === 'malice' && o.parentId)).toHaveLength(206);
    expect(a.objects.filter(o => !o.parentId)).toHaveLength(501);
    expect(a.objects.filter(o => o.parentId)).toHaveLength(2006);
    expect(new Set(a.objects.map(o => o.id)).size).toBe(2507);
    for (const input of sourceInputs()) {
      const object = a.objects.find(
        o => o.source.path.endsWith(input.path + '.md') && !o.parentId,
      )!;
      expect(object.original.markdown).toBe(input.markdown);
      expect(object.original.json).toBe(input.json);
      expect(object.original.record).toEqual(JSON.parse(input.json));
      for (const id of object.featureIds) {
        const feature = a.objects.find(o => o.id === id)!;
        expect(input.markdown.slice(feature.source.start, feature.source.end)).toBe(
          feature.original.markdown,
        );
      }
      expect(object.original.linkedMarkdown).toBe(input.linkedMarkdown);
      const reconstructed =
        object.markdown +
        object.featureIds.map(id => a.objects.find(o => o.id === id)!.original.markdown).join('');
      expect(object.original.markdown.endsWith(reconstructed)).toBe(true);
    }
  }, 120_000);
  it('preserves V27/V30 source data, identities and exact historical references', () => {
    for (const old of oldEditions) {
      expect(old.edition).not.toBe(pack.edition);
      for (const object of old.objects) {
        const current = byId.get(object.id)!;
        const {
          group: _group,
          sourcebook: _sourcebook,
          relatedRules: _related,
          supportingIds: currentSupport,
          ...preserved
        } = current;
        const { supportingIds: oldSupport, ...original } = object;
        expect(preserved).toEqual(original);
        expect(currentSupport).toEqual(expect.arrayContaining(oldSupport));
        const ref = foeReference(old, object.id);
        expect(resolveFoe(old, ref)?.object).toEqual(object);
        expect(resolveFoe(pack, ref)).toBeUndefined();
        if (object.parentId)
          expect(
            identities.filter(
              i =>
                i.parent === object.parentId &&
                i.fingerprint === fingerprint(object.original.record),
            ),
          ).toEqual([
            {
              parent: object.parentId,
              fingerprint: fingerprint(object.original.record),
              id: object.id,
            },
          ]);
      }
    }
  });
  it('links each echelon to its own Malice and retains the prior-Malice reference', () => {
    const first = named('Undead Malice (Level 1+ Malice Features)');
    const second = named('Undead Malice (Level 4+ Malice Features)');
    for (const block of legacyPack.objects.filter(o => o.kind === 'statblock')) {
      expect(block.supportingIds).toEqual([block.fields.level === 1 ? first.id : second.id]);
      for (const id of block.featureIds)
        expect(resolveFoe(pack, foeReference(pack, id))?.parent).toBe(block);
    }
    expect(first.supportingIds).toEqual([]);
    expect(second.supportingIds).toEqual([first.id]);
    expect(second.featureIds.map(id => pack.objects.find(o => o.id === id)!.name)).toEqual([
      'Prior Malice Features',
      'Blood Hunger',
    ]);
  });
  it('retains source-derived second-echelon quantities, nested spending and complete triggers', () => {
    for (const name of ['Fleshflayed Shambler Zombie', 'Ghoul Craver', 'Hollowbone Launcher'])
      expect(named(name).ev).toEqual({ printed: '6 for four minions', amount: 6, quantity: 4 });
    expect(named('Binding Curse').activation?.costText).toBe('1 Malice');
    const curse = named('Binding Curse').fields.effects as Fields[];
    expect(curse[2]).toEqual({
      cost: '2+ Malice',
      effect:
        'This ability targets one additional target for each 2 [Malice](scc.v1:mcdm.monsters.v1/rule.monster/malice) spent.',
    });
    expect((named('Cursed Transference').fields.effects as Fields[])[1].cost).toBe('5 Malice');
    expect(named('Summon My Guard').fields.trigger).toBe(
      'The mummy lord is made [winded](scc.v1:mcdm.heroes.v1/rule.health/winded) for the first time in the encounter.',
    );
    expect(named("Land's Guardian").activation).toEqual({
      signature: false,
      villainAction: 2,
      costText: null,
    });
    expect(named('Blood Hunger').markdown).toContain('each undead within 5 squares');
    expect(
      searchFoes(legacyPack, 'Binding Curse', {
        kind: 'ability',
        keyword: 'Magic',
        usage: 'Main action',
      }).map(o => o.parentName),
    ).toEqual(['Mummy Lord']);
  });
  it('preserves source envelope, minion quantity, villain labels and complete ordered sections', () => {
    expect(named('Crawling Claw').ev).toEqual({
      printed: '3 for four minions',
      amount: 3,
      quantity: 4,
    });
    expect(named('Decrepit Skeleton').fields.with_captain).toBe('Gain an edge on strikes');
    expect(named('Ghost').fields.role).toBe('');
    expect(named('Paranormal Activity').activation).toEqual({
      signature: false,
      villainAction: 1,
      costText: null,
    });
    expect(named('Haunt').markdown).toContain('one additional target');
    expect(named('Shriek').fields.trigger).toBe(
      'A creature within distance targets the ghost with a strike.',
    );
    expect(named('Spirited Away').markdown).toContain('while flying this way');
    expect(named('Clobber and Clutch').markdown).toContain('Find a Cure downtime project');
    expect(named('Bone Shards').markdown).toContain('willingly move on their turn');
    const dust = named('Zombie Dust').markdown;
    expect(dust.indexOf('expelling a wave')).toBeLessThan(dust.indexOf('Power Roll'));
    expect(named('The Grasping, the Hungry').markdown).toContain('Agility test');
  });
  it('resolves exact public editions and searches independent parent-bound objects', () => {
    for (const name of ['Skeleton', 'Bone Shards', 'Arise']) {
      const object = named(name, name === 'Arise' ? 'skeleton' : undefined);
      expect(resolveFoe(pack, foeReference(pack, object.id))?.object).toBe(object);
      expect(
        resolveFoe(pack, { ...foeReference(pack, object.id), edition: 'old' }),
      ).toBeUndefined();
    }
    const arises = searchFoes(legacyPack, 'Arise', { kind: 'trait' });
    expect(arises.map(e => e.parentName).sort()).toEqual([
      'Flesh Mournling',
      'Ghoul',
      'Skeleton',
      'Soulwight',
    ]);
    expect(new Set(arises.map(e => e.id)).size).toBe(4);
    expect(
      searchFoes(legacyPack, 'Bone', {
        kind: 'ability',
        keyword: 'Ranged',
        usage: 'Main action',
      }).map(e => e.name),
    ).toEqual(['Bone Bow', 'Bone Shards', 'Hollowbone Slug']);
    expect(tags(['-', 'Magic', ''])).toEqual(['Magic']);
    expect(tags(null)).toEqual([]);
  });
  it('survives reordering without retargeting IDs and refuses missing or duplicate identity bindings', async () => {
    const inputs = sourceInputs().filter(i => i.path.endsWith('/skeleton'));
    const input = inputs[0],
      record = JSON.parse(input.json) as Fields;
    const features = record.features as Fields[];
    const skeleton = named('Skeleton');
    const spans = skeleton.featureIds.map(
      id => pack.objects.find(o => o.id === id)!.original.markdown,
    );
    const prefix = input.markdown.slice(0, input.markdown.indexOf(spans[0]));
    record.features = [...features].reverse();
    input.json = JSON.stringify(record);
    input.markdown = prefix + [...spans].reverse().join('');
    const reordered = await importFoes(inputs, identities);
    expect(reordered.objects[0].featureIds).toEqual([...skeleton.featureIds].reverse());
    await expect(importFoes(inputs, [])).rejects.toThrow('identity');
    await expect(
      importFoes(inputs, [...identities, identities.find(i => i.parent === skeleton.id)!]),
    ).rejects.toThrow('identity');
  });
  it('supports duplicate names with distinct explicit identities and refuses unresolvable identical records', async () => {
    const input = sourceInputs().find(i => i.path.endsWith('/skeleton'))!;
    const record = JSON.parse(input.json) as Fields;
    const features = record.features as Fields[];
    features[1].name = 'Bone Shards';
    input.json = JSON.stringify(record);
    input.markdown = input.markdown.replace('Bone Spur', 'Bone Shards');
    const mapped = [
      ...identities,
      {
        parent: named('Skeleton').id,
        fingerprint: fingerprint(features[1]),
        id: 'synthetic:second-bone-shards',
      },
    ];
    const result = await importFoes([input], mapped);
    expect(result.objects.filter(o => o.name === 'Bone Shards')).toHaveLength(2);
    features[1] = features[0];
    input.json = JSON.stringify(record);
    await expect(importFoes([input], mapped)).rejects.toThrow('identity');
  });
  it('uses generic whitespace extraction across multiple fixtures, rejects lost text and stat disagreements', async () => {
    const inputs = sourceInputs().filter(i => /\/(skeleton|zombie)$/.test(i.path));
    for (const input of inputs) input.markdown = input.markdown.replace(/^> /gm, '>   ');
    expect((await importFoes(inputs, identities)).objects.filter(o => o.parentId)).toHaveLength(6);
    inputs[0].markdown = inputs[0].markdown.replace(
      'Each target takes a bane on their next strike.',
      '',
    );
    await expect(importFoes(inputs, identities)).rejects.toThrow('Missing/reordered source text');
    const fresh = sourceInputs().filter(i => i.path.endsWith('/skeleton'));
    fresh[0].markdown = fresh[0].markdown.replace('**10**<br>Stamina', '**99**<br>Stamina');
    await expect(importFoes(fresh, identities)).rejects.toThrow('Printed stat');
  });
  it('checks feature table fields and optional-spend labels against printed Markdown', async () => {
    const skeleton = sourceInputs().find(i => i.path.endsWith('/skeleton'))!;
    skeleton.markdown = skeleton.markdown.replace(
      'Melee, Ranged, Strike, Weapon',
      'Melee, Strike, Weapon',
    );
    await expect(importFoes([skeleton], identities)).rejects.toThrow('Feature envelope');
    const ghost = sourceInputs().find(i => i.path.endsWith('/ghost'))!;
    ghost.markdown = ghost.markdown.replace(
      '**2 [Malice](scc.v1:mcdm.monsters.v1/rule.monster/malice):**',
      '**Optional:**',
    );
    await expect(importFoes([ghost], identities)).rejects.toThrow('Missing/reordered source text');
  });
  it('rejects incoherent corrections and reports additional parent prose', async () => {
    const leap = named('Leap');
    const correction = {
      id: leap.id,
      revision: REVISION,
      field: 'usage',
      expected: 'Maneuver' as Json,
      replacement: 'Main action' as Json,
      reason: 'Synthetic inconsistent correction',
    };
    await expect(
      importFoes(
        sourceInputs().filter(i => i.path.endsWith('/ghoul')),
        identities,
        [
          correction,
          {
            ...correction,
            field: '$markdown',
            expected: leap.markdown,
            replacement: leap.markdown,
          },
        ],
      ),
    ).rejects.toThrow('Feature envelope');
    const input = sourceInputs().find(i => i.path.endsWith('/skeleton'))!;
    input.markdown = input.markdown.replace(
      '> ⚔️',
      'A synthetic additional parent consequence.\n\n> ⚔️',
    );
    const changed = await importFoes([input], identities);
    expect(changed.objects[0].diagnostics.join(' ')).toContain('Unmodeled parent text');
    expect(compareBlock(changed, changed.objects[0], [skeletonCounterpart()]).status).toBe(
      'review',
    );
    const external = skeletonCounterpart();
    external.evQuantity = 99;
    expect(compareBlock(pack, named('Skeleton'), [external]).status).toBe('review');
  });
  it('keeps unfamiliar source text readable and flags it for comparison review', async () => {
    const input = sourceInputs().find(i => i.path.endsWith('/skeleton'))!;
    input.markdown += '\n> A synthetic additional consequence.\n';
    const changed = await importFoes([input], identities);
    const arise = changed.objects.find(o => o.name === 'Arise')!;
    expect(arise.html).toContain('synthetic additional consequence');
    expect(arise.diagnostics.join(' ')).toContain('Unmodeled source text');
    expect(compareBlock(changed, changed.objects[0], [skeletonCounterpart()]).status).toBe(
      'review',
    );
  });
  it('applies revision/expected-value guarded corrections, preserving originals and exact older editions', async () => {
    const object = named('Leap');
    const correction = {
      id: object.id,
      revision: REVISION,
      field: 'usage',
      expected: 'Maneuver' as Json,
      replacement: 'Synthetic usage' as Json,
      reason: 'Synthetic correction fixture',
    };
    const inputs = sourceInputs().filter(i => i.path.endsWith('/ghoul'));
    const corrected = await importFoes(inputs, identities, [
      correction,
      {
        ...correction,
        field: '$markdown',
        expected: object.markdown,
        replacement: object.markdown.replace('Maneuver', 'Synthetic usage'),
      },
    ]);
    const changed = corrected.objects.find(o => o.id === object.id)!;
    expect(changed.usage).toBe('Synthetic usage');
    expect(changed.html).toContain('Synthetic usage');
    expect(changed.original.record.usage).toBe('Maneuver');
    expect(changed.original.markdown).toBe(object.original.markdown);
    expect(corrected.edition).not.toBe(pack.edition);
    expect(resolveFoe(pack, foeReference(pack, object.id))?.object.usage).toBe('Maneuver');
    expect(() =>
      applyCorrections(
        structuredClone(pack.objects),
        [{ ...correction, revision: 'stale' }],
        REVISION,
      ),
    ).toThrow('Stale');
    expect(() =>
      applyCorrections(
        structuredClone(pack.objects),
        [{ ...correction, expected: 'wrong' }],
        REVISION,
      ),
    ).toThrow('Stale');
    expect(() =>
      applyCorrections([structuredClone(object), structuredClone(object)], [correction], REVISION),
    ).toThrow('ambiguous');
  });
});
describe('full-core source formats and dependencies', () => {
  it('covers every pinned statblock exactly once and preserves exceptional printed values', () => {
    const sourceBlocks = sourceInputs().filter(
      input => JSON.parse(input.json).type === 'statblock',
    );
    expect(sourceBlocks).toHaveLength(438);
    expect(sourceBlocks.filter(input => input.book === 'heroes')).toHaveLength(1);
    const actualIds = pack.objects
      .filter(o => o.kind === 'statblock')
      .map(o => o.id)
      .sort();
    expect(actualIds).toEqual(
      sourceBlocks.map(input => JSON.parse(input.json).metadata.scc).sort(),
    );
    const counts = new Map<string, number>();
    for (const input of sourceBlocks) {
      const source = JSON.parse(input.json) as Fields;
      counts.set(String(source.organization), (counts.get(String(source.organization)) ?? 0) + 1);
      const object = byId.get((source.metadata as Fields).scc as string)!;
      for (const field of [
        'size',
        'speed',
        'stamina',
        'stability',
        'free_strike',
        'might',
        'agility',
        'reason',
        'intuition',
        'presence',
        'movement',
        'immunities',
        'weaknesses',
        'with_captain',
        'level',
        'organization',
        'role',
      ])
        expect(object.fields[field]).toEqual(source[field]);
    }
    expect(Object.fromEntries(counts)).toEqual({
      Horde: 76,
      Platoon: 68,
      Elite: 97,
      Minion: 116,
      Leader: 30,
      Solo: 22,
      Retainer: 21,
      '': 8,
    });
    const blocks = pack.objects.filter(o => o.kind === 'statblock');
    expect(blocks.filter(o => o.ev?.quantity === 4)).toHaveLength(116);
    expect(blocks.filter(o => o.ev?.amount === null && o.ev.printed === '-')).toHaveLength(28);
    expect(parentAt('monster/kobold/statblock/shieldscale-drangolin').fields.size).toBe('2 or 3');
    const noncombatant = parentAt('monster/noncombatant/statblock/noncombatant');
    expect(noncombatant.fields.size).toBe('1S-2');
    expect(noncombatant.original.record.features).toBeUndefined();
    expect(noncombatant.featureIds).toEqual([]);
    expect(parentAt('monster/retainer/statblock/gnoll-gnasher').ev).toEqual({
      printed: '60',
      amount: 60,
      quantity: 1,
    });
    expect(
      blocks.filter(o => (o.fields.weaknesses as string[] | undefined)?.includes('fire')),
    ).toHaveLength(7);
  });

  it('retains source-guarded Gnoll and Hag repairs without losing the original extraction', () => {
    const gnoll = parentAt('monster/gnoll/gnoll-malice');
    expect(gnoll.featureIds.map(id => byId.get(id)!.name)).toEqual([
      'Iron Jaws',
      'Bloodpool',
      'Echoes of Laughter',
    ]);
    expect(gnoll.original.record.features).toHaveLength(4);
    const jaws = child('monster/gnoll/gnoll-malice', 'Iron Jaws');
    expect(jaws.fields.distance).toBe('1 cube within 3');
    expect(jaws.fields.target).toBe('Special');
    expect(jaws.original.records).toEqual((gnoll.original.record.features as Fields[]).slice(0, 2));
    expect(jaws.fields.effects).toEqual((gnoll.original.record.features as Fields[])[1].effects);
    expect(jaws.html).toContain('While an enemy is');
    expect(jaws.html).toContain('gains an edge on strikes');
    const hag = parentAt('monster/hag/hag-malice');
    expect(hag.featureIds.map(id => byId.get(id)!.name)).toEqual([
      'Casting Curses and Bodies',
      'Hag Wyrd',
      'Solo Action',
      'House Call',
      'Kick',
    ]);
    expect(hag.original.record.features).toHaveLength(4);
    const curses = child('monster/hag/hag-malice', 'Casting Curses and Bodies');
    expect(curses.original.records).toEqual([]);
    expect(curses.original.record).toEqual({});
    expect(curses.activation?.costText).toBe('3 Malice');
    expect(curses.html).toContain('each enemy within 2 squares of them up to 3 squares');
    const kick = child('monster/hag/hag-malice', 'Kick');
    expect(kick.original.record.cost).toBe('Signature');
    expect(kick.activation).toEqual({ signature: true, villainAction: null, costText: null });
    expect(child('monster/hag/hag-malice', 'House Call').html).toContain(
      'house can take only the following main action',
    );
    for (const path of ['monster/gnoll/gnoll-malice', 'monster/hag/hag-malice']) {
      const original = sourceInputs().find(input => input.path === path)!;
      const record = JSON.parse(original.json) as Fields;
      expect(() => sourceFeatures(original, record)).not.toThrow();
      expect(() => sourceFeatures({ ...original, json: original.json + '\n' }, record)).toThrow(
        'Stale source adaptation',
      );
      expect(() =>
        sourceFeatures(
          { ...original, markdown: original.markdown.replace('Malice', 'Resource') },
          record,
        ),
      ).toThrow('Stale source adaptation');
    }
  });

  it('keeps nested Vampire actions and envelope-free Lich target tests readable', async () => {
    const sacrifice = child('monster/undead/3rd-echelon/statblock/vampire-lord', 'Sacrifice');
    expect(sacrifice.activation?.villainAction).toBe(3);
    expect(sacrifice.sections.filter(section => section.type === 'table')).toHaveLength(2);
    expect(sacrifice.html).toContain('Wave of Blood');
    expect(sacrifice.html).toContain('20 burst');
    expect(sacrifice.html).toContain('11 corruption damage');
    const rejuvenation = child('monster/lich/statblock/lich', 'Rejuvenation');
    expect(rejuvenation.kind).toBe('ability');
    expect(rejuvenation.usage).toBeNull();
    for (const key of ['distance', 'target', 'usage', 'keywords'])
      expect(rejuvenation.fields[key]).toBeUndefined();
    expect(rejuvenation.html).toContain('Might test');
    expect(rejuvenation.html).toContain('300');
    expect(rejuvenation.html).toContain('100');
    for (const [path, lost] of [
      ['monster/undead/3rd-echelon/statblock/vampire-lord', '11 corruption damage'],
      [
        'monster/lich/statblock/lich',
        'A compelled creature must do everything in their power to move toward and touch the soulstone.',
      ],
    ]) {
      const input = sourceInputs().find(candidate => candidate.path === path)!;
      input.markdown = input.markdown.replace(lost, '');
      await expect(importFoes([input], identities)).rejects.toThrow(
        'Missing/reordered source text',
      );
    }
  });

  it('links exact source support without granting unrelated dragon, eye or retainer Malice', () => {
    for (const dragon of ['crucible', 'gloom', 'meteor', 'omen', 'thorn']) {
      const block = parentAt(`monster/dragon/statblock/${dragon}-dragon`);
      expect(block.supportingIds).toEqual([parentAt(`monster/dragon/${dragon}-dragon-malice`).id]);
      expect(block.relatedRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'mcdm.monsters.v1/monster.group/dragon',
            relationship: 'group context',
          }),
        ]),
      );
    }
    for (const group of ['demon', 'undead', 'war-dog']) {
      const fourth = parentAt(
        `monster/${group}/4th-echelon/${group}-malice-level-10-malice-features`,
      );
      expect(fourth.supportingIds).toEqual([
        parentAt(`monster/${group}/1st-echelon/${group}-malice-level-1-malice-features`).id,
        parentAt(`monster/${group}/2nd-echelon/${group}-malice-level-4-malice-features`).id,
        parentAt(`monster/${group}/3rd-echelon/${group}-malice-level-7-malice-features`).id,
      ]);
    }
    const xorannox = parentAt('monster/xorannox-the-tyract/statblock/xorannox-the-tyract');
    for (const eye of [
      'compulsion-eye',
      'demolition',
      'mover-eye',
      'necrotic-eye',
      'toxic-eye',
      'zapper-eye',
    ]) {
      const block = parentAt(`monster/xorannox-the-tyract/statblock/${eye}`);
      expect(block.supportingIds).toEqual([]);
      expect(block.relatedRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: xorannox.id, relationship: 'controlling creature' }),
        ]),
      );
    }
    for (const block of pack.objects.filter(
      o => o.kind === 'statblock' && o.fields.organization === 'Retainer',
    )) {
      expect(block.supportingIds).toEqual([]);
      expect(block.relatedRules?.map(link => link.relationship)).toEqual([
        'retainer rules',
        'retainer advancement',
        'role advancement option',
      ]);
    }
    const source = parentAt('monster/summon/elementalist/statblock/source-of-earth', 'heroes');
    expect(source.supportingIds).toEqual([]);
    expect(source.relatedRules).toEqual([
      expect.objectContaining({
        id: 'mcdm.heroes.v1/feature.ability.elementalist.level-8/summon-source-of-earth',
        relationship: 'summoning ability',
      }),
    ]);
    expect(
      parentAt('monster/ajax-the-invincible/statblock/ajax-the-invincible').relatedRules,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mcdm.monsters.v1/monster.ajax-the-invincible/tactical-stance',
        }),
      ]),
    );
  });

  it('keeps source-qualified groups, search facets and every related Rules identity valid', () => {
    const checkedRules = new Set<string>();
    for (const object of pack.objects) {
      const parent = object.parentId ? byId.get(object.parentId)! : object;
      expect(object.sourcebook).toBe(
        parent.source.path.includes('/books/heroes/') ? 'Heroes' : 'Monsters',
      );
      expect(object.group).toEqual(parent.group);
      expect(object.group?.id).toBeTruthy();
      expect(object.group?.name).toBeTruthy();
      const search = pack.search.find(entry => entry.id === object.id)!;
      expect(search.group).toEqual(object.group);
      expect(search.sourcebook).toBe(object.sourcebook);
      if (typeof parent.fields.level === 'number') expect(search.level).toBe(parent.fields.level);
      for (const id of object.supportingIds) expect(byId.get(id)?.kind).toBe('malice');
      for (const link of object.relatedRules ?? []) {
        if (checkedRules.has(link.path)) continue;
        checkedRules.add(link.path);
        const [book, ...segments] = link.path.split('/');
        const source = JSON.parse(
          readPinnedSource(
            repoRoot,
            `vendor/steel-compendium/en/books/${book}/json/${segments.join('/')}.json`,
          ),
        );
        const sourceIds = source.metadata?.scc ?? source.scc;
        expect(typeof link.id).toBe('string');
        expect(Array.isArray(sourceIds) ? sourceIds : [sourceIds]).toContain(link.id);
        expect(link.name).toBe(source.name);
      }
    }
    expect(SELECTION).toHaveLength(501);
    expect(parentAt('monster/retainer/statblock/goblin-guide').group).toEqual({
      id: 'mcdm.monsters.v1/chapter/retainers',
      name: 'Retainers',
    });
    const rivals = searchFoes(pack, 'Rival Conduit', { kind: 'statblock' });
    expect(rivals).toHaveLength(4);
    expect(new Set(rivals.map(entry => entry.id)).size).toBe(4);
    expect(rivals.map(entry => entry.level).sort((a, b) => a! - b!)).toEqual([2, 5, 8, 10]);
  });
});
describe('exhaustive external comparison', () => {
  it('guards every unavailable disposition and rejects source or displayed-content drift', () => {
    const inventory = JSON.parse(
      readFileSync(
        new URL('../../scripts/foes/comparison-inventory.json', import.meta.url),
        'utf8',
      ),
    ) as { unavailable: { id: string }[] };
    expect(inventory.unavailable).toHaveLength(26);
    for (const entry of inventory.unavailable)
      expect(compareBlock(pack, byId.get(entry.id)!, []).status).toBe('unavailable');

    const baseline = parentAt('monster/lightbender/statblock/lightbender');
    expect(baseline.featureIds.length).toBeGreaterThan(1);
    const mutations: [string, (changed: FoePackage, block: FoeObject) => void][] = [
      [
        'printed Stamina',
        (_changed, block) => {
          block.fields.stamina = '999';
        },
      ],
      [
        'encounter-value projection',
        (_changed, block) => {
          block.ev!.amount = 999;
        },
      ],
      [
        'parent diagnostic',
        (_changed, block) => {
          block.diagnostics.push('New unreviewed content');
        },
      ],
      [
        'removed child text',
        (changed, block) => {
          const feature = changed.objects.find(object => object.id === block.featureIds[0])!;
          feature.markdown = feature.markdown.slice(0, -20);
        },
      ],
      [
        'changed child effect',
        (changed, block) => {
          const feature = changed.objects.find(object => object.id === block.featureIds[0])!;
          feature.fields.effects = [];
        },
      ],
      [
        'removed feature',
        (_changed, block) => {
          block.featureIds.pop();
        },
      ],
      [
        'reordered features',
        (_changed, block) => {
          block.featureIds.reverse();
        },
      ],
      [
        'missing feature object',
        (changed, block) => {
          changed.objects = changed.objects.filter(object => object.id !== block.featureIds[0]);
        },
      ],
      [
        'raw JSON source',
        (_changed, block) => {
          block.original.json += ' ';
        },
      ],
      [
        'raw Markdown source',
        (_changed, block) => {
          block.original.markdown += ' ';
        },
      ],
      [
        'package revision',
        changed => {
          changed.sourceRevision = 'unreviewed-revision';
        },
      ],
      [
        'object revision',
        (_changed, block) => {
          block.source.revision = 'unreviewed-revision';
        },
      ],
    ];
    for (const [label, mutate] of mutations) {
      // Comparison only needs this parent and its children; avoid copying the entire corpus.
      const objects = structuredClone([baseline, ...baseline.featureIds.map(id => byId.get(id)!)]);
      const changed = { ...pack, objects };
      mutate(changed, objects[0]);
      expect(compareBlock(changed, objects[0], []).status, label).toBe('review');
    }
    for (const field of ['name', 'level']) {
      const changed = structuredClone(baseline);
      if (field === 'name') changed.name = 'Unreviewed creature';
      else changed.fields.level = 99;
      expect(compareBlock(pack, changed, []).status).toBe('missing');
    }
  });
  it('refuses a stale or incomplete committed comparison record', () => {
    const report = JSON.parse(
      readFileSync(new URL(`../../${COMPARISON_REPORT}`, import.meta.url), 'utf8'),
    );
    expect(() => validateComparisonReport(pack, report)).not.toThrow();
    expect(() => validateComparisonReport(pack, { ...report, edition: 'old' })).toThrow('stale');
    expect(() => validateComparisonReport(pack, { ...report, rows: report.rows.slice(1) })).toThrow(
      'incomplete',
    );
  });
  it('preserves reviewed minion quantities and refuses explicit disagreement or changed EV', () => {
    const block = structuredClone(named('Skeleton'));
    block.ev = { printed: '6 for four minions', amount: 6, quantity: 4 };
    const external = skeletonCounterpart();
    external.ev = 6;
    const row = compareBlock(pack, block, [external]);
    expect(row.differences.find(d => d.field === 'ev.quantity')?.classification).toBe('explained');
    external.evQuantity = 1;
    expect(compareBlock(pack, block, [external]).status).toBe('review');
    delete external.evQuantity;
    external.ev = 7;
    expect(compareBlock(pack, block, [external]).status).toBe('review');
  });
  it('matches distinct Malice counterparts and refuses substituting the first echelon', () => {
    const first = named('Undead Malice (Level 1+ Malice Features)');
    const second = named('Undead Malice (Level 4+ Malice Features)');
    const external: Fields = {
      id: 'undead-malice-4',
      name: 'Undead Malice',
      level: 4,
      type: 'featureblock',
      featureblockType: '+ Malice Features',
      source: { book: 'Monsters' },
      flavor:
        "At the start of any level 4 or higher undead's turn, you can spend Malice to activate one of the following features.",
      features: [
        {
          type: 'feature',
          name: 'Prior Malice Features',
          cost: '2-7+ Malice',
          effects: [
            {
              effect:
                'The undead activates a Malice feature available to undead of level 3 or lower.',
            },
          ],
        },
        {
          type: 'feature',
          name: 'Blood Hunger',
          cost: '5 Malice',
          effects: [
            {
              effect:
                'One undead acting this turn uses a signature ability against a creature who is bleeding. As a free triggered action, each undead within 5 squares of the first undead moves up to their speed and can make a free strike against the same target.',
            },
          ],
        },
      ],
    };
    expect(compareBlock(pack, second, [external]).status).toBe('explained');
    expect(compareBlock(pack, first, [external]).status).toBe('missing');
    expect(compareBlock(pack, second, [external, external]).status).toBe('ambiguous');
    external.level = 1;
    expect(compareBlock(pack, second, [external]).status).toBe('review');
    external.level = 4;
    ((external.features as Fields[])[1].effects as Fields[])[0].effect =
      'One undead uses a signature ability.';
    expect(compareBlock(pack, second, [external]).status).toBe('review');
  });
  it('reports all parents even if counterparts are missing or ambiguous', () => {
    const report = compareFoes(pack, []);
    expect(report.rows).toHaveLength(501);
    expect(report.counts.missing).toBe(475);
    expect(report.counts.unavailable).toBe(26);
    const external = skeletonCounterpart();
    expect(compareBlock(pack, named('Skeleton'), [external, external]).status).toBe('ambiguous');
  });
  it('distinguishes a source-equivalent counterpart and presentation variants from material changes', () => {
    const external = skeletonCounterpart();
    expect(compareBlock(pack, named('Skeleton'), [external]).status).toBe('explained');
    external.stamina = 10;
    expect(
      compareBlock(pack, named('Skeleton'), [external]).differences.find(d => d.field === 'stamina')
        ?.classification,
    ).toBe('presentation');
    external.stamina = 11;
    expect(compareBlock(pack, named('Skeleton'), [external]).status).toBe('review');
  });
  it('flags missing paragraphs, reordered effects, changed labels, missing metadata and malformed input', () => {
    for (const mutate of [
      (e: Fields) => {
        ((e.items as Fields[])[0].effects as Fields[]).pop();
      },
      (e: Fields) => {
        ((e.items as Fields[])[0].effects as Fields[]).reverse();
      },
      (e: Fields) => {
        ((e.items as Fields[])[0].effects as Fields[])[1].name = 'Trigger';
      },
      (e: Fields) => {
        delete (e.items as Fields[])[0].target;
      },
    ]) {
      const e = skeletonCounterpart();
      mutate(e);
      expect(compareBlock(pack, named('Skeleton'), [e]).status).toBe('review');
    }
    const malformed = skeletonCounterpart();
    malformed.items = null;
    expect(compareBlock(pack, named('Skeleton'), [malformed]).status).toBe('error');
  });
});
