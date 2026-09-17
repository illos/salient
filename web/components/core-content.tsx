// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react';
import { presentSourceHtml, renderSource } from '../../shared/presentation/content';
import { tokenizeGlyphText } from '../../shared/presentation/glyphs';
import { Glyph } from './glyph';
import './core-content.css';

/** Text-only operational excerpts share the same finite semantic vocabulary. */
export function GlyphText({ text }: { text: string }) {
  return (
    <>
      {tokenizeGlyphText(text).map((run, i) =>
        typeof run === 'string' ? run : <Glyph key={i} token={run} />,
      )}
    </>
  );
}
export function CoreSource({ source, title }: { source: string; title?: string }) {
  const html = useMemo(() => renderSource(source, title), [source, title]);
  return <div className="ds-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
export function SourceHtml({ html, title }: { html: string; title?: string }) {
  const rendered = useMemo(() => presentSourceHtml(html, title), [html, title]);
  return <div className="ds-content" dangerouslySetInnerHTML={{ __html: rendered }} />;
}
