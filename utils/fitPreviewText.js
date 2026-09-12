import { fitTextToBox, shouldFitText } from './textFit.js';

// Operates on a mounted text element after its real webfont has loaded.
// Called again after every text/style/zoom change; authored styles are retained.
export function fitPreviewText(element, zoom = 1) {
  const css = getComputedStyle(element);
  const mode = css.getPropertyValue('--text-fit').trim();
  const width = parseFloat(css.width) - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight) - parseFloat(css.borderLeftWidth) - parseFloat(css.borderRightWidth);
  const height = parseFloat(css.height) - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - parseFloat(css.borderTopWidth) - parseFloat(css.borderBottomWidth);
  if (!(width > 0 && height > 0) || !element.style.width || !element.style.height) return null;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return null;
  const fontSize = parseFloat(css.fontSize) / zoom;
  const letterSpacing = (parseFloat(css.letterSpacing) || 0) / zoom;
  const rawLeading = element.style.lineHeight || '1.5';
  const plain = element.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>\s*<div[^>]*>/gi, '\n');
  const scratch = document.createElement('div'); scratch.innerHTML = plain;
  let text = scratch.textContent || '';
  if (css.textTransform === 'uppercase') text = text.toUpperCase();
  if (css.textTransform === 'lowercase') text = text.toLowerCase();
  if (css.textTransform === 'capitalize') text = text.replace(/\b\p{L}/gu, char => char.toUpperCase());
  context.font = `${css.fontStyle} ${css.fontWeight} ${fontSize}px ${css.fontFamily}`;
  const overflowsWidth = text.split('\n').some(line =>
    context.measureText(line).width + Math.max(0,line.length-1)*letterSpacing > width/zoom);
  if (!shouldFitText({overflow:css.overflow, '--text-fit':mode}, overflowsWidth)) return null;
  let normalLeading = 1.2;
  if (rawLeading === 'normal') {
    // Measure the loaded font's real line box, not a generic 1.2 multiplier.
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;white-space:pre;padding:0;border:0;margin:0;';
    probe.style.font = `${css.fontStyle} ${css.fontWeight} 1000px/normal ${css.fontFamily}`;
    probe.textContent = 'Hg';
    document.body.append(probe);
    normalLeading = probe.getBoundingClientRect().height / 1000;
    probe.remove();
  }
  const fit = fitTextToBox({text, width:width/zoom, height:height/zoom, fontSize,
    minFontSize: parseFloat(css.getPropertyValue('--min-font-size')) || undefined,
    lineHeight: size => /^[\d.]+$/.test(rawLeading) ? Number(rawLeading)*size
      : rawLeading === 'normal' ? size*normalLeading : parseFloat(css.lineHeight)/zoom,
    measure(value,size) {
      context.font = `${css.fontStyle} ${css.fontWeight} ${size}px ${css.fontFamily}`;
      return context.measureText(value).width + Math.max(0, value.length-1)*letterSpacing;
    },
  });
  element.style.fontSize = `${fit.fontSize*zoom}px`;
  // One text node preserves flex anonymous-item alignment for multiline text.
  element.style.whiteSpace = 'pre';
  element.textContent = fit.text;
  const warning = !fit.fits ? 'Text does not fit. Increase the box size or reduce the text.'
    : fit.fontSize < fontSize*0.7 ? 'Text is small. Increase the box size for better readability.' : '';
  element.title = warning || text;
  element.dataset.textFit = !fit.fits ? 'overflow' : warning ? 'small' : 'fits';
  return fit;
}
