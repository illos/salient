// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { Root, Text, Link } from 'mdast';
import { visit } from 'unist-util-visit';
import { Glyph, loadGlyphFont } from '../../../web/components/glyph';
import { glyphHtml, tokenizeGlyphText, knownGlyphExamples, describeGlyph, sourceIcon, type Characteristic, type Glyph as GlyphToken } from '../../../shared/presentation/glyphs';
import fixtures from './fixtures.json';
import '../../../web/style.css';
import './preview.css';

type Effect = { name?: string; cost?: string; effect?: string; roll?: string; tier1?: string; tier2?: string; tier3?: string };
type Feature = { name: string; icon?: string; keywords?: string[]; usage?: string; target?: string; distance?: string; cost?: string; ability_type?: string; flavor?: string; trigger?: string; effects?: Effect[] };
type Monster = Feature & { features: Feature[]; level: number; organization: string; role?: string; ev: string; size: string; speed: number; stamina: string; stability: number; free_strike: number; immunities?: string[]; weaknesses?: string[]; movement?: string | string[]; with_captain?: string; might: number; agility: number; reason: number; intuition: number; presence: number };

/** Prototype adapter: real Markdown links survive; generated glyph markup follows sanitization. */
function prose(source: string, tier = false): string {
  const processor = unified().use(remarkParse).use(remarkGfm).use(() => (tree: Root) => {
    visit(tree, 'link', (node: Link) => {
      if (node.url.startsWith('scc.v1:')) node.url = '/rules/' + node.url.slice(7).replace(/^mcdm\.(heroes|monsters)\.v1\//, '$1/').replaceAll('.', '/');
    });
    if (tier) visit(tree, 'text', (node: Text) => {
      // Known leading damage-expression grammar only; never replace the pronoun I in ordinary prose.
      node.value = node.value.replace(/^(\d+ \+ )([MAIRP](?:,? (?:or )?[MAIRP])*)(?= (?:\w+ )?damage)/,
        (_, prefix: string, expression: string) => prefix + expression.replace(/[MAIRP]/g, c => `\uE000${c}\uE001`));
    });
  }).use(remarkRehype).use(rehypeSanitize).use(() => tree => {
    type Node = { type: string; value?: string; tagName?: string; children?: Node[] };
    const walk = (node: Node, code = false) => {
      code ||= node.tagName === 'code' || node.tagName === 'pre';
      if (node.type === 'text' && node.value && !code) {
        const chunks = node.value.split(/(\uE000[MAIRP]\uE001)/);
        node.type = 'raw';
        node.value = chunks.map(chunk => /^\uE000[MAIRP]\uE001$/.test(chunk)
          ? glyphHtml({ kind: 'characteristic', characteristic: chunk[1] as Characteristic })
          : tokenizeGlyphText(chunk).map(run => typeof run === 'string'
            ? run.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            : glyphHtml(run)).join('')).join('');
      }
      node.children?.forEach(child => walk(child, code));
    };
    walk(tree as Node);
  }).use(rehypeStringify, { allowDangerousHtml: true });
  return String(processor.processSync(source));
}
function Prose({ text, tier = false }: { text: string; tier?: boolean }) {
  return <span className="book-prose" dangerouslySetInnerHTML={{ __html: prose(text, tier) }} />;
}
function FeatureBlock({ feature, hero = false }: { feature: Feature; hero?: boolean }) {
  const icon = feature.icon ? sourceIcon(feature.icon) : undefined;
  return <section className={`book-feature ${hero ? 'hero-feature' : ''}`}>
    <header className="feature-title">
      {icon && <Glyph token={icon} />}
      <h3>{feature.name}</h3>
      <strong className="feature-cost">{[feature.ability_type, feature.cost].filter(Boolean).join(' · ')}</strong>
    </header>
    {feature.flavor && <p className="flavor">{feature.flavor}</p>}
    {(feature.keywords || feature.usage) && <div className="feature-meta"><Prose text={feature.keywords?.join(', ') || '—'} /><span>{feature.usage}</span></div>}
    {feature.distance && <div className="feature-meta placement"><span><Glyph token={{ kind: 'icon', name: 'distance' }} /> <Prose text={feature.distance} /></span><span><Glyph token={{ kind: 'icon', name: 'target' }} /> <Prose text={feature.target || '—'} /></span></div>}
    {feature.trigger && <p><strong>Trigger: </strong><Prose text={feature.trigger} /></p>}
    {feature.effects?.map((effect, i) => <div key={i} className="effect">
      {effect.effect && <p>{(effect.cost || effect.name) && <strong>{effect.cost || effect.name}: </strong>}<Prose text={effect.effect} /></p>}
      {effect.roll && <p className="power-roll"><Prose text={effect.roll} /></p>}
      {effect.tier1 && <ol className="tiers">{([1, 2, 3] as const).map(t => <li key={t}><Glyph token={{ kind: 'tier', tier: t }} /><Prose text={effect[`tier${t}`] || ''} tier /></li>)}</ol>}
    </div>)}
    <div className="notch" aria-hidden="true" />
  </section>;
}
function MonsterBlock({ monster }: { monster: Monster }) {
  const scores = ['might', 'agility', 'reason', 'intuition', 'presence'] as const;
  const stats = [['Size', monster.size], ['Speed', monster.speed], ['Stamina', monster.stamina], ['Stability', monster.stability], ['Free Strike', monster.free_strike]];
  return <article className="book-block" aria-label={`${monster.name} stat block`}>
    <header className="monster-title"><div><h2>{monster.name}</h2><span>{monster.keywords?.join(', ')}</span></div><div className="identity"><strong>Level {monster.level} {monster.organization} {monster.role}</strong><span>EV {monster.ev}</span></div></header>
    <dl className="stat-row">{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="defenses"><span><strong>Immunity:</strong> {monster.immunities?.join(', ') || '—'}</span><span><strong>Weakness:</strong> {monster.weaknesses?.join(', ') || '—'}</span><span><strong>Movement:</strong> {(Array.isArray(monster.movement) ? monster.movement.join(', ') : monster.movement) || '—'}</span>{monster.with_captain && <span><strong>With Captain:</strong> {monster.with_captain}</span>}</div>
    <dl className="characteristics">{scores.map(score => <div key={score}><dt><Glyph token={{ kind: 'characteristicName', characteristic: score[0].toUpperCase() as Characteristic }} /></dt><dd>{monster[score] > 0 ? '+' : ''}{monster[score]}</dd></div>)}</dl>
    {monster.features.map((f, i) => <FeatureBlock key={i} feature={f} />)}
  </article>;
}
function Gallery() {
  return <section className="gallery" aria-label="Known glyph combinations"><h2>One vocabulary. Automatic semantics.</h2><p>Every example below uses the same renderer. The name shown is generated from its token.</p><div className="glyph-grid">{knownGlyphExamples().map((token, i) => <div key={i}><Glyph token={token} /><code>{describeGlyph(token).text || 'Decoration · hidden'}</code></div>)}</div></section>;
}
function Preview() {
  const [view, setView] = useState('monsters');
  const [dark, setDark] = useState(false);
  const [plain, setPlain] = useState(false);
  return <div className={plain ? 'preview plain' : 'preview'}>
    <header className="preview-header"><a href="/">SALIENT <span>/ DESIGN STUDY 33</span></a><div><button onClick={() => { setDark(!dark); document.documentElement.classList.toggle('dark'); }}>{dark ? 'Light theme' : 'Dark theme'}</button><button aria-pressed={plain} onClick={() => setPlain(!plain)}>Plain text</button></div></header>
    <main><div className="intro"><p className="eyebrow">CORE BOOK PRESENTATION</p><h1>Built to read at the table.</h1><p>The book’s hierarchy, with one accessible vocabulary behind every symbol.</p></div>
      <nav className="preview-tabs" aria-label="Design examples">{[['monsters','Monster stat blocks'],['solo','Solo creature'],['heroes','Hero abilities'],['glyphs','All glyph combinations']].map(([id,label]) => <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{label}</button>)}</nav>
      {view === 'monsters' && <div className="monster-grid">{fixtures.slice(0,2).map(f => <MonsterBlock key={f.record.name} monster={f.record as Monster} />)}</div>}
      {view === 'solo' && <div className="solo"><MonsterBlock monster={fixtures[2].record as Monster} /></div>}
      {view === 'heroes' && <div className="hero-examples">{fixtures.slice(3).map(f => <FeatureBlock key={f.record.name} feature={f.record as Feature} hero />)}</div>}
      {view === 'glyphs' && <Gallery />}
      <footer className="preview-footer"><p>Design prototype · pinned Core content · no gameplay controls</p><p>Draw Steel © 2026 MCDM Productions, LLC. Independent product under the <a href="https://www.mcdmproductions.com/draw-steel-creator-license">DRAW STEEL Creator License</a>; not affiliated with MCDM. Text prepared by Steel Compendium. Glyph font © 2025 MCDM, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</p></footer>
    </main>
  </div>;
}
void loadGlyphFont();
createRoot(document.getElementById('root')!).render(<Preview />);
// Exported only to typecheck the renderer's token contract alongside the real shared component.
export type PreviewGlyph = GlyphToken;
