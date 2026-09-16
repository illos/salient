// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest';
import { COMPARISON_REPORT } from '../../scripts/foes/batches.ts';
import { readFileSync } from 'node:fs';
import { generateFoes, readInputs } from '../../scripts/ingest-foes.ts';
import {
  applyCorrections,
  fingerprint,
  importFoes,
  REVISION,
  tags,
} from '../../scripts/foes/import.ts';
import type { Identity } from '../../scripts/foes/import.ts';
import { compareBlock, compareFoes, validateComparisonReport } from '../../scripts/foes/compare.ts';
import type { Fields, FoePackage, Json } from '../../shared/contracts/foes.ts';
import { foeReference, resolveFoe, searchFoes } from '../../shared/foes/catalog.ts';
const pack = JSON.parse(
  readFileSync(new URL('../../shared/content/foes/catalog.json', import.meta.url), 'utf8'),
) as FoePackage;
const identities = JSON.parse(
  readFileSync(new URL('../../scripts/foes/identities.json', import.meta.url), 'utf8'),
) as Identity[];
const named = (name: string, parent?: string) =>
  pack.objects.find(o => o.name === name && (!parent || o.parentId?.endsWith('/' + parent)))!;
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
describe('undead source ingestion', () => {
  it('regenerates twice byte-for-byte and retains exact pinned input', async () => {
    const a = await generateFoes(),
      b = await generateFoes();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a).toEqual(pack);
    expect(a.objects.filter(o => o.kind === 'statblock')).toHaveLength(20);
    expect(a.objects.filter(o => o.kind === 'ability')).toHaveLength(44);
    expect(a.objects.filter(o => o.kind === 'trait')).toHaveLength(24);
    expect(a.objects.filter(o => o.kind === 'malice' && o.parentId)).toHaveLength(6);
    for (const input of readInputs()) {
      const object = a.objects.find(
        o => o.source.path.endsWith(input.path + '.md') && !o.parentId,
      )!;
      expect(object.original.markdown).toBe(input.markdown);
      expect(object.original.json).toBe(input.json);
      expect(object.original.linkedMarkdown).toBe(input.linkedMarkdown);
      const reconstructed =
        object.markdown +
        object.featureIds.map(id => a.objects.find(o => o.id === id)!.original.markdown).join('');
      expect(object.original.markdown.endsWith(reconstructed)).toBe(true);
    }
  }, 30_000);
  it('preserves every V27 object, identity binding and exact historical reference', () => {
    const old = JSON.parse(
      readFileSync(
        new URL(
          '../../shared/content/foes/editions/6c6bbd40f2460c196511a2f0cc19b2ff9184ddee27be90245e5d5a8a915ed331.json',
          import.meta.url,
        ),
        'utf8',
      ),
    ) as FoePackage;
    expect(old.edition).not.toBe(pack.edition);
    for (const object of old.objects) {
      expect(pack.objects.find(o => o.id === object.id)).toEqual(object);
      const ref = foeReference(old, object.id);
      expect(resolveFoe(old, ref)?.object).toEqual(object);
      expect(resolveFoe(pack, ref)).toBeUndefined();
      if (object.parentId)
        expect(
          identities.filter(
            i =>
              i.parent === object.parentId && i.fingerprint === fingerprint(object.original.record),
          ),
        ).toEqual([
          {
            parent: object.parentId,
            fingerprint: fingerprint(object.original.record),
            id: object.id,
          },
        ]);
    }
  });
  it('links each echelon to its own Malice and retains the prior-Malice reference', () => {
    const first = named('Undead Malice (Level 1+ Malice Features)');
    const second = named('Undead Malice (Level 4+ Malice Features)');
    for (const block of pack.objects.filter(o => o.kind === 'statblock')) {
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
      searchFoes(pack, 'Binding Curse', {
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
    const arises = searchFoes(pack, 'Arise', { kind: 'trait' });
    expect(arises.map(e => e.parentName).sort()).toEqual([
      'Flesh Mournling',
      'Ghoul',
      'Skeleton',
      'Soulwight',
    ]);
    expect(new Set(arises.map(e => e.id)).size).toBe(4);
    expect(
      searchFoes(pack, 'Bone', { kind: 'ability', keyword: 'Ranged', usage: 'Main action' }).map(
        e => e.name,
      ),
    ).toEqual(['Bone Bow', 'Bone Shards', 'Hollowbone Slug']);
    expect(tags(['-', 'Magic', ''])).toEqual(['Magic']);
    expect(tags(null)).toEqual([]);
  });
  it('survives reordering without retargeting IDs and refuses missing or duplicate identity bindings', async () => {
    const inputs = readInputs().filter(i => i.path.endsWith('/skeleton'));
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
    const input = readInputs().find(i => i.path.endsWith('/skeleton'))!;
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
    const inputs = readInputs().filter(i => /\/(skeleton|zombie)$/.test(i.path));
    for (const input of inputs) input.markdown = input.markdown.replace(/^> /gm, '>   ');
    expect((await importFoes(inputs, identities)).objects.filter(o => o.parentId)).toHaveLength(6);
    inputs[0].markdown = inputs[0].markdown.replace(
      'Each target takes a bane on their next strike.',
      '',
    );
    await expect(importFoes(inputs, identities)).rejects.toThrow('Missing/reordered source text');
    const fresh = readInputs().filter(i => i.path.endsWith('/skeleton'));
    fresh[0].markdown = fresh[0].markdown.replace('**10**<br>Stamina', '**99**<br>Stamina');
    await expect(importFoes(fresh, identities)).rejects.toThrow('Printed stat');
  });
  it('checks feature table fields and optional-spend labels against printed Markdown', async () => {
    const skeleton = readInputs().find(i => i.path.endsWith('/skeleton'))!;
    skeleton.markdown = skeleton.markdown.replace(
      'Melee, Ranged, Strike, Weapon',
      'Melee, Strike, Weapon',
    );
    await expect(importFoes([skeleton], identities)).rejects.toThrow('Feature envelope');
    const ghost = readInputs().find(i => i.path.endsWith('/ghost'))!;
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
        readInputs().filter(i => i.path.endsWith('/ghoul')),
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
    const input = readInputs().find(i => i.path.endsWith('/skeleton'))!;
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
    const input = readInputs().find(i => i.path.endsWith('/skeleton'))!;
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
    const inputs = readInputs().filter(i => i.path.endsWith('/ghoul'));
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
describe('exhaustive external comparison', () => {
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
    expect(report.rows).toHaveLength(22);
    expect(report.counts.missing).toBe(22);
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
