// SPDX-License-Identifier: GPL-3.0-only
import { describeGlyph, type Glyph as GlyphToken } from '../../shared/presentation/glyphs';
import './glyph.css';
import fontLicense from '../assets/draw-steel/FontLicense.txt?url';

/** Same semantic function as generated HTML. Callers cannot supply role, label or raw font codes. */
export function Glyph({ token }: { token: GlyphToken }) {
  const p = describeGlyph(token);
  return (
    <span className="ds-symbol" {...p.accessibility}>
      <span className="ds-symbol-visual" aria-hidden="true">
        <span className="ds-glyph" data-glyph={p.characters} />
        {p.suffix}
      </span>
      <span className="ds-symbol-text" aria-hidden="true">
        {p.text}
      </span>
    </span>
  );
}

/** Opt in only once the exact face is available. Failed/blocked fonts retain visible plain text. */
export async function loadGlyphFont() {
  try {
    const faces = await document.fonts.load('16px "Draw Steel Glyphs"');
    if (faces.length > 0 && faces.every(face => face.status === 'loaded'))
      document.documentElement.classList.add('ds-font-ready');
  } catch {
    /* The semantic text fallback is already visible. */
  }
}

/** Attribution travels with the unmodified font in the web build. */
export function GlyphFontNotice() {
  return (
    <span>
      Glyph font © 2025 MCDM Productions, LLC · <a href={fontLicense}>CC BY-SA 4.0</a> · unmodified.
    </span>
  );
}
