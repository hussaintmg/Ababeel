// Shared by the browser preview and PDF renderer. Measurements are supplied by
// the actual font engine; character counts are not a proxy for rendered width.
export function shouldFitText(styles, overflowsWidth = false) {
  return styles['--text-fit'] === 'shrink' ||
    (styles['--text-fit'] !== 'none' && (overflowsWidth || ['hidden', 'clip'].includes(styles.overflow)));
}

export function fitTextToBox({text, width, height, fontSize, minFontSize = fontSize * 0.5, measure, lineHeight}) {
  const minimum = Math.min(fontSize, Math.max(0.5, minFontSize));
  const graphemes = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, {granularity:'grapheme'}) : null;
  const chars = value => graphemes ? [...graphemes.segment(value)].map(s => s.segment) : Array.from(value);
  function layout(size) {
    const lines = [];
    for (const paragraph of String(text).split('\n')) {
      let line = '';
      for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (measure(candidate, size) <= width) { line = candidate; continue; }
        if (line) { lines.push(line); line = ''; }
        if (measure(word, size) <= width) { line = word; continue; }
        for (const char of chars(word)) {
          if (line && measure(line + char, size) > width) { lines.push(line); line = ''; }
          line += char;
        }
      }
      lines.push(line);
    }
    const leading = lineHeight(size);
    return {fontSize:size, lineHeight:leading, text:lines.join('\n'), lines,
      fits: lines.length * leading <= height + 0.01 && lines.every(line => measure(line,size) <= width + 0.01)};
  }
  const original = layout(fontSize);
  if (original.fits || width <= 0 || height <= 0) return original;
  let best = layout(minimum);
  if (!best.fits) return best;
  let low = minimum, high = fontSize;
  for (let i = 0; i < 14; i++) {
    const candidate = layout((low + high) / 2);
    if (candidate.fits) { best = candidate; low = candidate.fontSize; }
    else high = candidate.fontSize;
  }
  // A small common safety margin prevents browser rounding from adding a line.
  return layout(Math.max(minimum, Math.floor(best.fontSize * 100) / 100 - 0.02));
}
