// SPDX-License-Identifier: GPL-3.0-only
/** Exact language rows and individual usage paragraphs from the pinned V37 source ledger.
 * Languages share the Background chapter rather than standalone source articles.
 * Owning specification: docs/build/V37-supporting-character-choices.md.
 */
export interface SupportingLanguage {
  name: string;
  type: 'common' | 'cultural' | 'dead' | 'regional';
  source: { revision: string; path: string; scc: string; sections: string[] };
  tableRows: Record<string, string>[];
  sourceText: string;
  usageText?: string;
}

export const SUPPORTING_LANGUAGES: Record<string, SupportingLanguage> = {
  Ananjali: {
    name: 'Ananjali',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'Ananjali',
        ancestry: 'Old hobgoblin',
        relatedLanguages: 'Anjali',
        commonTopics: 'Zodiakol, the bloodmetal',
      },
    ],
    sourceText:
      'language: Ananjali | ancestry: Old hobgoblin | relatedLanguages: Anjali | commonTopics: Zodiakol, the bloodmetal',
  },
  Anjali: {
    name: 'Anjali',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Anjali',
        ancestry: 'Devils, hobgoblins',
        notes: 'Language of contract law',
      },
    ],
    sourceText: 'language: Anjali | ancestry: Devils, hobgoblins | notes: Language of contract law',
    usageText:
      "Just as Zaliac is used in engineering, contract law isn't written purely in **Anjali**, the dominant language of the Seven Cities of Hell. But a lot of the legal jargon in any contract, as well as some of the language of trial courts, features many Anjali words. People are sticklers for detail in the Seven Cities, and this makes their language popular among lawyers.",
  },
  Axiomatic: {
    name: 'Axiomatic',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Axiomatic',
        ancestry: 'Memonek',
        notes: 'Native language of Axiom, and the common language of the timescape by trade',
      },
    ],
    sourceText:
      'language: Axiomatic | ancestry: Memonek | notes: Native language of Axiom, and the common language of the timescape by trade',
  },
  Caelian: {
    name: 'Caelian',
    type: 'common',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Caelian',
        ancestry: 'Orden denizens',
        notes: 'Common language of Orden',
      },
    ],
    sourceText: 'language: Caelian | ancestry: Orden denizens | notes: Common language of Orden',
  },
  Filliaric: {
    name: 'Filliaric',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Filliaric',
        ancestry: 'Angulotls',
        notes: '',
      },
    ],
    sourceText: 'language: Filliaric | ancestry: Angulotls | notes: ',
  },
  Higaran: {
    name: 'Higaran',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table'],
    },
    tableRows: [
      {
        region: 'Higara',
        language: 'Higaran',
      },
    ],
    sourceText: 'region: Higara | language: Higaran',
  },
  'High Kuric': {
    name: 'High Kuric',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'High Kuric',
        ancestry: 'Bredbeddles, giants, ogres, trolls',
        notes: '',
      },
    ],
    sourceText: 'language: High Kuric | ancestry: Bredbeddles, giants, ogres, trolls | notes: ',
  },
  'High Rhyvian': {
    name: 'High Rhyvian',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'High Rhyvian',
        ancestry: 'Sun elf',
        relatedLanguages: 'Hyrallic, Yllyric',
        commonTopics: 'Liannar, the sunmetal',
      },
    ],
    sourceText:
      'language: High Rhyvian | ancestry: Sun elf | relatedLanguages: Hyrallic, Yllyric | commonTopics: Liannar, the sunmetal',
  },
  Hyrallic: {
    name: 'Hyrallic',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Hyrallic',
        ancestry: 'High elves',
        notes: 'Language of interspecies diplomacy',
      },
    ],
    sourceText:
      'language: Hyrallic | ancestry: High elves | notes: Language of interspecies diplomacy',
    usageText:
      "**Hyrallic** is the primary language of the [high elves](scc.v1:mcdm.heroes.v1/ancestry/high-elf) in [Orden](scc.v1:mcdm.heroes.v1/rule.world/orden). Although young for an elf language, Hyrallic is older than almost all other modern cultural languages, save those of the [dwarves](scc.v1:mcdm.heroes.v1/ancestry/dwarf). As a result, while anyone who lives near or trades with a [human](scc.v1:mcdm.heroes.v1/ancestry/human) culture probably speaks at least a little Caelian, most nobles across all ancestries make sure their children or offspring speak Hyrallic. Caelian is new from many cultures' point of view, while Hyrallic as a language for diplomacy is considered cultured and traditional.",
  },
  Illyvric: {
    name: 'Illyvric',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Illyvric',
        ancestry: 'Shadow elves',
        notes: '',
      },
    ],
    sourceText: 'language: Illyvric | ancestry: Shadow elves | notes: ',
  },
  Kalliak: {
    name: 'Kalliak',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Kalliak',
        ancestry: 'Orcs',
        notes: 'Offshoot of Zaliac',
      },
    ],
    sourceText: 'language: Kalliak | ancestry: Orcs | notes: Offshoot of Zaliac',
  },
  Kethaic: {
    name: 'Kethaic',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Kethaic',
        ancestry: 'Kobolds',
        notes: 'Patois of Vastariax and Caelian',
      },
    ],
    sourceText: 'language: Kethaic | ancestry: Kobolds | notes: Patois of Vastariax and Caelian',
  },
  Khamish: {
    name: 'Khamish',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'Khamish',
        ancestry: 'Beast lord',
        relatedLanguages: 'Khoursirian',
        commonTopics: 'Beast magic',
      },
    ],
    sourceText:
      'language: Khamish | ancestry: Beast lord | relatedLanguages: Khoursirian | commonTopics: Beast magic',
  },
  Khelt: {
    name: 'Khelt',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Khelt',
        ancestry: 'Bugbears, fey',
        notes: 'Offshoot of Kheltivari',
      },
    ],
    sourceText: 'language: Khelt | ancestry: Bugbears, fey | notes: Offshoot of Kheltivari',
  },
  Kheltivari: {
    name: 'Kheltivari',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'Kheltivari',
        ancestry: 'Old fae',
        relatedLanguages: 'Yllyric, Khelt',
        commonTopics: 'Using a wode to travel through time',
      },
    ],
    sourceText:
      'language: Kheltivari | ancestry: Old fae | relatedLanguages: Yllyric, Khelt | commonTopics: Using a wode to travel through time',
  },
  Khemharic: {
    name: 'Khemharic',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table'],
    },
    tableRows: [
      {
        region: 'Khemhara',
        language: 'Khemharic',
      },
    ],
    sourceText: 'region: Khemhara | language: Khemharic',
  },
  Khoursirian: {
    name: 'Khoursirian',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table', 'Languages by Ancestry Table'],
    },
    tableRows: [
      {
        region: 'Khoursir',
        language: 'Khoursirian',
      },
      {
        language: 'Khoursirian',
        ancestry: 'Polder, humans',
        notes: 'Distant offshoot of Khamish',
      },
    ],
    sourceText:
      'region: Khoursir | language: Khoursirian\n\nlanguage: Khoursirian | ancestry: Polder, humans | notes: Distant offshoot of Khamish',
  },
  'Low Kuric': {
    name: 'Low Kuric',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Low Kuric',
        ancestry: 'Elementals',
        notes: '',
      },
    ],
    sourceText: 'language: Low Kuric | ancestry: Elementals | notes: ',
  },
  'Low Rhyvian': {
    name: 'Low Rhyvian',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'Low Rhyvian',
        ancestry: 'Sky elf',
        relatedLanguages: 'Hyrallic',
        commonTopics: 'Flying castles',
      },
    ],
    sourceText:
      'language: Low Rhyvian | ancestry: Sky elf | relatedLanguages: Hyrallic | commonTopics: Flying castles',
  },
  Mindspeech: {
    name: 'Mindspeech',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Mindspeech',
        ancestry: 'Voiceless talkers',
        notes: 'A symbolic language shared among native telepaths',
      },
    ],
    sourceText:
      'language: Mindspeech | ancestry: Voiceless talkers | notes: A symbolic language shared among native telepaths',
  },
  Oaxuatl: {
    name: 'Oaxuatl',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table'],
    },
    tableRows: [
      {
        region: 'Ix',
        language: 'Oaxuatl',
      },
    ],
    sourceText: 'region: Ix | language: Oaxuatl',
  },
  'Old Variac': {
    name: 'Old Variac',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'Old Variac',
        ancestry: 'Olothec, voiceless talkers',
        relatedLanguages: 'Variac',
        commonTopics: 'Kollar, the sinmetal',
      },
    ],
    sourceText:
      'language: Old Variac | ancestry: Olothec, voiceless talkers | relatedLanguages: Variac | commonTopics: Kollar, the sinmetal',
  },
  Phaedran: {
    name: 'Phaedran',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table'],
    },
    tableRows: [
      {
        region: 'Phaedros',
        language: 'Phaedran',
      },
    ],
    sourceText: 'region: Phaedros | language: Phaedran',
  },
  Phorialtic: {
    name: 'Phorialtic',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'Phorialtic',
        ancestry: 'Old elemental',
        relatedLanguages: 'Low and High Kuric',
        commonTopics: 'Moving between manifolds',
      },
    ],
    sourceText:
      'language: Phorialtic | ancestry: Old elemental | relatedLanguages: Low and High Kuric | commonTopics: Moving between manifolds',
  },
  'Proto-Ctholl': {
    name: 'Proto-Ctholl',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Proto-Ctholl',
        ancestry: 'Lower demons',
        notes: 'Incomplete precursor of Tholl',
      },
    ],
    sourceText:
      'language: Proto-Ctholl | ancestry: Lower demons | notes: Incomplete precursor of Tholl',
  },
  Rallarian: {
    name: 'Rallarian',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'Rallarian',
        ancestry: 'Steel dwarf',
        relatedLanguages: 'Zaliac',
        commonTopics: 'Valiar, the truemetal',
      },
    ],
    sourceText:
      'language: Rallarian | ancestry: Steel dwarf | relatedLanguages: Zaliac | commonTopics: Valiar, the truemetal',
  },
  Riojan: {
    name: 'Riojan',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table'],
    },
    tableRows: [
      {
        region: 'Rioja',
        language: 'Riojan',
      },
    ],
    sourceText: 'region: Rioja | language: Riojan',
  },
  Szetch: {
    name: 'Szetch',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Szetch',
        ancestry: 'Goblins, radenwights',
        notes: '',
      },
    ],
    sourceText: 'language: Szetch | ancestry: Goblins, radenwights | notes: ',
  },
  'The First Language': {
    name: 'The First Language',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'The First Language',
        ancestry: 'Elder dragons',
        notes: 'Language of magic',
      },
    ],
    sourceText: 'language: The First Language | ancestry: Elder dragons | notes: Language of magic',
  },
  Tholl: {
    name: 'Tholl',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Tholl',
        ancestry: 'Higher demons, gnolls',
        notes: '',
      },
    ],
    sourceText: 'language: Tholl | ancestry: Higher demons, gnolls | notes: ',
  },
  Ullorvic: {
    name: 'Ullorvic',
    type: 'dead',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Dead Languages Table'],
    },
    tableRows: [
      {
        language: 'Ullorvic',
        ancestry: 'Star elf',
        relatedLanguages: 'Hyrallic, Yllyric',
        commonTopics: 'Rovion, the starmetal',
      },
    ],
    sourceText:
      'language: Ullorvic | ancestry: Star elf | relatedLanguages: Hyrallic, Yllyric | commonTopics: Rovion, the starmetal',
  },
  Urollialic: {
    name: 'Urollialic',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Urollialic',
        ancestry: 'Olothec',
        notes: '',
      },
    ],
    sourceText: 'language: Urollialic | ancestry: Olothec | notes: ',
  },
  Uvalic: {
    name: 'Uvalic',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table'],
    },
    tableRows: [
      {
        region: 'The Gol',
        language: 'Uvalic',
      },
    ],
    sourceText: 'region: The Gol | language: Uvalic',
  },
  Vaniric: {
    name: 'Vaniric',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table'],
    },
    tableRows: [
      {
        region: 'Vanigar',
        language: 'Vaniric',
      },
    ],
    sourceText: 'region: Vanigar | language: Vaniric',
  },
  Variac: {
    name: 'Variac',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Variac',
        ancestry: 'Olothec, trolls, voiceless talkers',
        notes: 'Common language of the World Below',
      },
    ],
    sourceText:
      'language: Variac | ancestry: Olothec, trolls, voiceless talkers | notes: Common language of the World Below',
    usageText:
      'In the same way that intelligent creatures in [Orden](scc.v1:mcdm.heroes.v1/rule.world/orden) who live near or trade with other cultures use Caelian as a common language, the denizens of the World Below, the Dark Under All, often speak **Variac**, the language of the voiceless talkers.',
  },
  Vaslorian: {
    name: 'Vaslorian',
    type: 'regional',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Vaslorian Human Languages Table'],
    },
    tableRows: [
      {
        region: 'Vasloria',
        language: 'Vaslorian',
      },
    ],
    sourceText: 'region: Vasloria | language: Vaslorian',
  },
  Vastariax: {
    name: 'Vastariax',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Vastariax',
        ancestry: 'Dragons, dragon knights',
        notes: '',
      },
    ],
    sourceText: 'language: Vastariax | ancestry: Dragons, dragon knights | notes: ',
  },
  Vhoric: {
    name: 'Vhoric',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Vhoric',
        ancestry: 'Hakaan',
        notes: 'Offshoot of the stone giant dialect of High Kuric',
      },
    ],
    sourceText:
      'language: Vhoric | ancestry: Hakaan | notes: Offshoot of the stone giant dialect of High Kuric',
  },
  Voll: {
    name: 'Voll',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Voll',
        ancestry: 'Time raiders',
        notes: '',
      },
    ],
    sourceText: 'language: Voll | ancestry: Time raiders | notes: ',
  },
  Yllyric: {
    name: 'Yllyric',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Yllyric',
        ancestry: 'Wode elves',
        notes: 'Language of druids',
      },
    ],
    sourceText: 'language: Yllyric | ancestry: Wode elves | notes: Language of druids',
    usageText:
      '**Yllyric** is the cultural language of [wode elves](scc.v1:mcdm.heroes.v1/ancestry/wode-elf), and also the common language among those who defend and protect the natural forests of [Orden](scc.v1:mcdm.heroes.v1/rule.world/orden).',
  },
  "Za'hariax": {
    name: "Za'hariax",
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: "Za'hariax",
        ancestry: 'Overminds',
        notes: '',
      },
    ],
    sourceText: "language: Za'hariax | ancestry: Overminds | notes: ",
  },
  Zaliac: {
    name: 'Zaliac',
    type: 'cultural',
    source: {
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      path: 'en/books/heroes/clean/Draw Steel Heroes.md',
      scc: 'mcdm.heroes.v1/chapter/background',
      sections: ['Languages by Ancestry Table'],
    },
    tableRows: [
      {
        language: 'Zaliac',
        ancestry: 'Dwarves',
        notes: 'Language of engineering',
      },
    ],
    sourceText: 'language: Zaliac | ancestry: Dwarves | notes: Language of engineering',
    usageText:
      "Within any document concerning the workings of machines, masonry, or geology, you are likely to find a healthy supply of jargon using **Zaliac**, the most popular [dwarf](scc.v1:mcdm.heroes.v1/ancestry/dwarf) language. Even when such texts aren't fully written in Zaliac, they use a lot of [dwarf](scc.v1:mcdm.heroes.v1/ancestry/dwarf) language when describing esoteric, complex ideas.",
  },
};
