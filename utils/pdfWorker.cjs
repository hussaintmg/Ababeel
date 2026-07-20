'use strict';

const { workerData, parentPort } = require('worker_threads');
const React = require('react');
const { Document, Page, Text, Image, Font, pdf } = require('@react-pdf/renderer');
const path = require('path');
const fs = require('fs');

const { pagesData, title, cwd, fontFaces } = workerData;

// ─── Font registration ──────────────────────────────────────────────────────
try {
  Font.register({
    family: 'Helvetica',
    fonts: [
      { src: 'Helvetica', fontWeight: 'normal' },
      { src: 'Helvetica-Bold', fontWeight: 'bold' },
    ],
  });
  for (const font of (fontFaces || [])) {
    const { family, weight, style, path: fontPath } = font;
    const fullPath = path.join(cwd, 'public', fontPath);
    if (fs.existsSync(fullPath)) {
      Font.register({ family, fonts: [{ src: fullPath, fontWeight: weight, fontStyle: style }] });
    }
  }
} catch (err) {}

// ─── Helpers ────────────────────────────────────────────────────────────────
function resolvePageDimensions(config = {}) {
  const { format = 'A4', customWidth, customHeight, margin = 0, scale = 1 } = config;
  const formats = {
    A4: { width: 595, height: 842 },
    A3: { width: 842, height: 1191 },
    LETTER: { width: 612, height: 792 },
    LEGAL: { width: 612, height: 1008 },
    CUSTOM: { width: customWidth || 595, height: customHeight || 842 },
  };
  let dims = formats[(format || 'A4').toUpperCase()] || formats.A4;
  if ((format || '').toUpperCase() === 'CUSTOM' && customWidth && customHeight) {
    dims = { width: Number(customWidth) * 0.75, height: Number(customHeight) * 0.75 };
  }
  return { width: dims.width, height: dims.height, margin: Number(margin), scale: Number(scale) || 1 };
}

function resolveScript(script = []) {
  const resolved = {};
  for (const rule of script) {
    const cond = rule.condition || {};
    const { compare1, condition, compare2 } = cond;
    if (!condition) continue;
    const a = (compare1 || '').length;
    const b = Number(compare2);
    let passes = false;
    switch (condition) {
      case '>':  passes = a > b; break;
      case '>=': passes = a >= b; break;
      case '<':  passes = a < b; break;
      case '<=': passes = a <= b; break;
      case '==': passes = String(compare1) === String(compare2); break;
      case '!=': passes = String(compare1) !== String(compare2); break;
    }
    if (passes && rule.css) {
      for (const cssItem of rule.css) {
        if (!resolved[cssItem.property]) resolved[cssItem.property] = cssItem.value;
      }
    }
  }
  return resolved;
}

function mergeStyles(cssArray = [], scriptProps = {}) {
  const map = {};
  for (const { property, value } of cssArray) map[property] = value;
  Object.assign(map, scriptProps);
  return map;
}

function cssToReactPdfStyle(styleObj) {
  const reactStyle = {};
  for (const [prop, val] of Object.entries(styleObj)) {
    const camelProp = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
    
    if (prop === 'font-family') {
      reactStyle[camelProp] = 'Helvetica';
      continue;
    }

    let parsedVal = val;

    // Convert string numeric values
    if (typeof val === 'string') {
      if (/^\d+(\.\d+)?(px)?$/.test(val.trim())) {
        parsedVal = parseFloat(val);
      }
    }

    if (camelProp === 'zIndex') {
      parsedVal = Number(parsedVal) || 1;
    }

    if (camelProp === 'lineHeight') {
      const numVal = parseFloat(val);
      if (!isNaN(numVal) && /^\d+(\.\d+)?$/.test(String(val).trim())) {
        parsedVal = numVal;
      } else {
        // String unit like '1.5cm' will hang Yoga, discard it
        continue;
      }
    }

    const numericProps = [
      'top', 'left', 'right', 'bottom',
      'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
      'fontSize', 'borderRadius', 'borderWidth',
      'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
      'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'
    ];
    if (numericProps.includes(camelProp)) {
      if (typeof parsedVal === 'string') {
        const match = parsedVal.match(/^(\d+(?:\.\d+)?)(px|cm|in|pt|em|rem|%)?$/);
        if (match) {
          const num = parseFloat(match[1]);
          const unit = match[2];
          if (unit === 'cm') {
            parsedVal = num * 28.3465;
          } else if (unit === 'in') {
            parsedVal = num * 72;
          } else if (unit === 'pt') {
            parsedVal = num;
          } else {
            parsedVal = num;
          }
        } else {
          const num = parseFloat(parsedVal);
          if (!isNaN(num)) {
            parsedVal = num;
          }
        }
      }
    }

    reactStyle[camelProp] = parsedVal;
  }
  return reactStyle;
}

function buildElements(elements) {
  return (elements || []).map((el, idx) => {
    const { type, text, src, qrBase64, css = [], script = [] } = el;
    let style = cssToReactPdfStyle(mergeStyles(css, resolveScript(script)));
    if (style.top !== undefined || style.left !== undefined) {
      style = { position: 'absolute', ...style };
    } else {
      delete style.position;
    }

    if (type === 'qr') {
      return React.createElement(Image, { key: idx, source: { uri: qrBase64 || '' }, style });
    }
    if (type === 'image') {
      let imgSrc = src || '';
      if (imgSrc && !imgSrc.startsWith('data:') && !imgSrc.startsWith('http')) {
        try { imgSrc = `data:image/png;base64,${fs.readFileSync(imgSrc).toString('base64')}`; }
        catch { imgSrc = ''; }
      }
      return React.createElement(Image, { key: idx, source: { uri: imgSrc }, style });
    }
    return React.createElement(Text, { key: idx, style }, text || '');
  });
}

function buildDocument(pagesData, title) {
  const pages = pagesData.map((page, i) => {
    const dims = resolvePageDimensions(page.config || {});
    const children = buildElements(page.elements || []);
    const bg = page.backgroundImage
      ? React.createElement(Image, {
          key: 'bg',
          source: { uri: page.backgroundImage },
          style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
        })
      : null;
    return React.createElement(
      Page,
      { key: i, size: { width: dims.width, height: dims.height }, style: { position: 'relative' } },
      ...(bg ? [bg, ...children] : children)
    );
  });
  return React.createElement(Document, { title }, ...pages);
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('[Worker] Starting main PDF generation inside worker thread...');
  try {
    console.log('[Worker] Building document elements...');
    const doc = buildDocument(pagesData, title);
    
    console.log('[Worker] Calling pdf(doc).toBuffer()...');
    const start = Date.now();
    const buffer = await pdf(doc).toBuffer();
    console.log(`[Worker] pdf(doc).toBuffer() resolved successfully in ${Date.now() - start}ms! Buffer length:`, buffer.length);
    
    console.log('[Worker] Posting buffer back to parent thread...');
    parentPort.postMessage({ success: true, buffer });
  } catch (err) {
    console.error('[Worker] Fatal error inside worker thread:', err);
    parentPort.postMessage({ success: false, error: err.stack || err.message });
  }
}

main();
