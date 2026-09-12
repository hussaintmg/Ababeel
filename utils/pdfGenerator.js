import * as archiverModule from "archiver";
import path from "path";
import fs from "fs";
import { FONT_FACES } from "../constants/fontFaces.js";
import { fitTextToBox, shouldFitText } from "./textFit.js";
import * as pdfkitModule from "pdfkit";
const PDFDocument = pdfkitModule.default || pdfkitModule;

// ─── Helper: resolve page dimensions to PDF points ─────────────────────────
export function resolvePageDimensions(config = {}) {
  const {
    format = "A4",
    orientation = "portrait",
    customWidth,
    customHeight,
    margin = 0,
    scale = 1,
  } = config;
  const formats = {
    A4: { width: 595, height: 842 }, // points (1/72 inch)
    A3: { width: 842, height: 1191 },
    LETTER: { width: 612, height: 792 },
    LEGAL: { width: 612, height: 1008 },
    CUSTOM: { width: customWidth || 595, height: customHeight || 842 },
  };
  let dims = formats[format.toUpperCase()] || formats.A4;
  let w = dims.width;
  let h = dims.height;
  if (format.toUpperCase() === "CUSTOM" && customWidth && customHeight) {
    w = Number(customWidth) * 0.75;
    h = Number(customHeight) * 0.75;
  }
  const isLandscape = String(orientation).toLowerCase() === "landscape";
  if (isLandscape && w < h) {
    const temp = w;
    w = h;
    h = temp;
  } else if (!isLandscape && w > h && format.toUpperCase() !== "CUSTOM") {
    const temp = w;
    w = h;
    h = temp;
  }
  return {
    width: w,
    height: h,
    margin: Number(margin),
    scale: Number(scale) || 1,
  };
}

const parseSize = (value) => {
  if (value === undefined || value === null) return null;
  return cssUnitToPoints(value);
};

// ─── Generic URL to Base64 fetcher with a strict timeout ────────────────────
function mimeFromExt(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/png";
  }
}

import QRCode from "qrcode";

// In-memory cache for static and fetched assets (prevents redundant disk reads and network requests)
const assetCache = new Map();
const pendingAssets = new Map();

async function urlToBase64(url, timeoutMs = 4000) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  if (assetCache.has(url)) {
    return assetCache.get(url);
  }
  if (pendingAssets.has(url)) return pendingAssets.get(url);
  const pending = loadAsset(url, timeoutMs);
  pendingAssets.set(url, pending);
  try {
    return await pending;
  } finally {
    pendingAssets.delete(url);
  }
}

async function loadAsset(url, timeoutMs) {
  if (!url.startsWith("http")) {
    try {
      const cleaned = url.split("?")[0].split("#")[0];
      const relative = cleaned.replace(/^[\\/]+/, "");
      const publicRoot = path.resolve(process.cwd(), "public");
      const filePath = path.resolve(publicRoot, relative);
      const isPublicAsset =
        filePath === publicRoot || filePath.startsWith(`${publicRoot}${path.sep}`);

      if (!isPublicAsset) {
        console.warn(`[Prefetch] Refusing local path outside public/: ${url}`);
        return "";
      }

      if (fs.existsSync(filePath)) {
        const buf = fs.readFileSync(filePath);
        const b64 = `data:${mimeFromExt(filePath)};base64,${buf.toString("base64")}`;
        assetCache.set(url, b64);
        return b64;
      }
      console.warn(`[Prefetch] Local file not found for ${url}`);
    } catch (e) {
      console.warn(`[Prefetch] Failed to read local file ${url}:`, e.message);
    }
    return "";
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const b64 = `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
    assetCache.set(url, b64);
    return b64;
  } catch (err) {
    console.warn(`[Prefetch] Failed or timed out fetching ${url}:`, err.message);
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  } finally {
    clearTimeout(id);
  }
}

async function prefetchPageAssets(page) {
  const promises = [];

  // 1. Prefetch background image
  if (page.backgroundImage && !page.backgroundImage.startsWith("data:")) {
    promises.push(
      urlToBase64(page.backgroundImage).then((b64) => {
        page.backgroundImage = b64;
      })
    );
  }

  // 2. Prefetch elements (local in-memory QR generation + images)
  for (const el of page.elements || []) {
    if (el.type === "qr" && el.qrUrl && !el.qrBase64) {
      promises.push(
        QRCode.toDataURL(el.qrUrl, {
          margin: 0,
          width: 300,
          errorCorrectionLevel: "M",
        })
          .then((b64) => {
            el.qrBase64 = b64;
          })
          .catch(async (err) => {
            console.warn("[QRCode] Local generation failed, trying fallback:", err.message);
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(el.qrUrl)}`;
            el.qrBase64 = await urlToBase64(qrApiUrl);
          })
      );
    } else if (el.type === "image" && el.src && !el.src.startsWith("data:")) {
      promises.push(
        urlToBase64(el.src).then((b64) => {
          el.src = b64;
        })
      );
    }
  }

  await Promise.all(promises);
}

async function prefetchAssets(pagesData) {
  await Promise.all(pagesData.map((page) => prefetchPageAssets(page)));
}

function resolveScript(script = []) {
  if (!script || script.length === 0) return {};
  const resolved = {};
  for (const rule of script) {
    let condBlock, cssBlock;
    if (Array.isArray(rule)) {
      [condBlock, cssBlock] = rule;
    } else {
      condBlock = rule.condition;
      cssBlock = rule.css;
    }
    const conditionData = condBlock?._doc || condBlock || {};
    const { compare1, condition, compare2 } = conditionData;
    let passes = false;
    if (!condition) {
      passes = true;
    } else {
      const a = Number((compare1 || "").length);
      const b = Number(compare2 || 0);
      switch (condition) {
        case ">":
          passes = a > b;
          break;
        case ">=":
          passes = a >= b;
          break;
        case "<":
          passes = a < b;
          break;
        case "<=":
          passes = a <= b;
          break;
        case "==":
          passes = a === b;
          break;
        case "!=":
          passes = a !== b;
          break;
        default:
          passes = false;
      }
    }
    if (passes) {
      const cssArray = Array.isArray(cssBlock) ? cssBlock : [cssBlock];
      for (const cssItem of cssArray) {
        if (!cssItem?.property) continue;
        if (Object.prototype.hasOwnProperty.call(resolved, cssItem.property)) {
          continue;
        }
        resolved[cssItem.property] = cssItem.value;
      }
      break;
    }
  }
  return resolved;
}

function toNum(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  return parseFloat(val) || 0;
}

function cssUnitToPoints(val) {
  if (typeof val === "number") return val * 0.75;
  if (!val) return 0;

  const parsed = parseFloat(val);
  if (isNaN(parsed)) return 0;

  const unit = String(val)
    .replace(/[\d.-]/g, "")
    .trim()
    .toLowerCase();

  switch (unit) {
    case "in":
      return parsed * 72;
    case "cm":
      return parsed * 28.3465;
    case "mm":
      return parsed * 2.83465;
    case "pt":
      return parsed;
    default:
      return parsed * 0.75;
  }
}

function getBorderWidth(styles = {}) {
  if (styles.borderWidth) return Math.max(0, cssUnitToPoints(styles.borderWidth));
  if (!styles.border) return 0;
  const widthToken = String(styles.border)
    .split(/\s+/)
    .find((token) => /^(?:\d*\.)?\d+(?:px|pt|cm|mm|in)?$/i.test(token));
  return widthToken ? Math.max(0, cssUnitToPoints(widthToken)) : 0;
}

function getPadding(styles = {}) {
  const raw = String(styles.padding || "0").trim().split(/\s+/);
  const values = raw.map(cssUnitToPoints);
  const [a = 0, b = a, c = a, d = b] = values;
  const sides =
    values.length === 1
      ? { top: a, right: a, bottom: a, left: a }
      : values.length === 2
        ? { top: a, right: b, bottom: a, left: b }
        : values.length === 3
          ? { top: a, right: b, bottom: c, left: b }
          : { top: a, right: b, bottom: c, left: d };

  if (styles.paddingTop) sides.top = cssUnitToPoints(styles.paddingTop);
  if (styles.paddingRight) sides.right = cssUnitToPoints(styles.paddingRight);
  if (styles.paddingBottom) sides.bottom = cssUnitToPoints(styles.paddingBottom);
  if (styles.paddingLeft) sides.left = cssUnitToPoints(styles.paddingLeft);
  return sides;
}

function parseBackgroundPosition(value = "center center") {
  const tokens = String(value).trim().toLowerCase().split(/\s+/);
  const horizontal = tokens.find((token) => ["left", "center", "right"].includes(token)) || "center";
  const vertical = tokens.find((token) => ["top", "center", "bottom"].includes(token)) || "center";
  return { align: horizontal, valign: vertical };
}

function cssToStyleMap(css = [], script = []) {
  const styles = {};
  for (const item of css || []) {
    if (!item?.property) continue;
    const property = item.property.startsWith("--") ? item.property : item.property.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    styles[property] = item.value;
  }
  for (const [propertyName, value] of Object.entries(resolveScript(script))) {
    const property = propertyName.startsWith("--") ? propertyName : propertyName.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    styles[property] = value;
  }
  return styles;
}

function drawMediaElement(doc, mediaUrl, styles, pageWidth, pageHeight, type) {
  if (!mediaUrl) return;

  const commaIndex = mediaUrl.indexOf(",");
  const encoded = commaIndex >= 0 ? mediaUrl.slice(commaIndex + 1) : mediaUrl;
  const imgBuffer = Buffer.from(encoded, "base64");
  const image = doc.openImage(imgBuffer);
  const ratio = image.width / image.height || 1;
  const borderWidth = getBorderWidth(styles);
  const padding = getPadding(styles);
  const horizontalInsets = borderWidth * 2 + padding.left + padding.right;
  const verticalInsets = borderWidth * 2 + padding.top + padding.bottom;

  const declaredWidth = styles.width ? cssUnitToPoints(styles.width) : null;
  const declaredHeight = styles.height ? cssUnitToPoints(styles.height) : null;
  let boxWidth;
  let boxHeight;

  if (declaredWidth && declaredHeight) {
    boxWidth = declaredWidth;
    boxHeight = declaredHeight;
  } else if (declaredWidth) {
    boxWidth = declaredWidth;
    boxHeight = Math.max(1, (declaredWidth - horizontalInsets) / ratio + verticalInsets);
  } else if (declaredHeight) {
    boxHeight = declaredHeight;
    boxWidth = Math.max(1, (declaredHeight - verticalInsets) * ratio + horizontalInsets);
  } else {
    boxWidth = image.width * 0.75 + horizontalInsets;
    boxHeight = image.height * 0.75 + verticalInsets;
  }

  const maxWidth = styles.maxWidth ? cssUnitToPoints(styles.maxWidth) : null;
  const maxHeight = styles.maxHeight ? cssUnitToPoints(styles.maxHeight) : null;
  const scale = Math.min(
    1,
    maxWidth ? maxWidth / boxWidth : 1,
    maxHeight ? maxHeight / boxHeight : 1,
  );
  boxWidth = Math.max(1, boxWidth * scale);
  boxHeight = Math.max(1, boxHeight * scale);

  const leftValue = styles.left !== undefined ? cssUnitToPoints(styles.left) : null;
  const rightValue = styles.right !== undefined ? cssUnitToPoints(styles.right) : null;
  const topValue = styles.top !== undefined ? cssUnitToPoints(styles.top) : null;
  const bottomValue = styles.bottom !== undefined ? cssUnitToPoints(styles.bottom) : null;
  const left = leftValue ?? (rightValue !== null ? pageWidth - rightValue - boxWidth : 0);
  const top = topValue ?? (bottomValue !== null ? pageHeight - bottomValue - boxHeight : 0);
  const radius = Math.max(
    0,
    Math.min(
      String(styles.borderRadius || "").trim().endsWith("%")
        ? (parseFloat(styles.borderRadius) / 100) * Math.min(boxWidth, boxHeight)
        : cssUnitToPoints(styles.borderRadius),
      Math.min(boxWidth, boxHeight) / 2,
    ),
  );

  const contentX = left + borderWidth + padding.left;
  const contentY = top + borderWidth + padding.top;
  const contentWidth = Math.max(1, boxWidth - horizontalInsets);
  const contentHeight = Math.max(1, boxHeight - verticalInsets);
  const innerRadius = Math.max(0, radius - borderWidth);
  const objectFit = String(styles.objectFit || (type === "qr" ? "fill" : "cover")).toLowerCase();

  doc.save();
  if (styles.opacity !== undefined) {
    doc.opacity(Math.max(0, Math.min(1, Number(styles.opacity))));
  }
  drawContainerBackground(doc, left, top, boxWidth, boxHeight, styles, radius);
  if (innerRadius > 0) {
    doc.roundedRect(contentX, contentY, contentWidth, contentHeight, innerRadius).clip();
  } else {
    doc.rect(contentX, contentY, contentWidth, contentHeight).clip();
  }

  if (objectFit === "contain" || objectFit === "scale-down") {
    doc.image(imgBuffer, contentX, contentY, {
      fit: [contentWidth, contentHeight],
      align: "center",
      valign: "center",
    });
  } else if (objectFit === "cover") {
    doc.image(imgBuffer, contentX, contentY, {
      cover: [contentWidth, contentHeight],
      align: "center",
      valign: "center",
    });
  } else {
    doc.image(imgBuffer, contentX, contentY, {
      width: contentWidth,
      height: contentHeight,
    });
  }
  doc.restore();
  drawContainerBorder(doc, left, top, boxWidth, boxHeight, styles, radius);
}

function decodeHtmlText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>\s*<div[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function drawContainerBorder(doc, x, y, width, height, styles, borderRadius) {
  let borderWidth = 0;
  let borderColor = null;

  if (styles.border) {
    const parts = styles.border.split(/\s+/);
    const widthPart = parts.find(
      (p) =>
        p.includes("px") ||
        p.includes("pt") ||
        p.includes("cm") ||
        p.includes("mm") ||
        p.includes("in") ||
        parseFloat(p) > 0,
    );
    if (widthPart) borderWidth = cssUnitToPoints(widthPart);

    const colorPart = parts.find(
      (p) =>
        p.startsWith("#") ||
        ["white", "black", "blue", "red", "green", "yellow"].includes(
          p.toLowerCase(),
        ),
    );
    if (colorPart) borderColor = colorPart;
  } else {
    if (styles.borderWidth) borderWidth = cssUnitToPoints(styles.borderWidth);
    if (styles.borderColor) borderColor = styles.borderColor;
  }

  if (borderWidth > 0 && borderColor) {
    doc.save();
    doc.lineWidth(borderWidth);
    doc.strokeColor(borderColor);
    const half = borderWidth / 2;
    if (borderRadius > 0) {
      doc
        .roundedRect(
          x + half,
          y + half,
          width - borderWidth,
          height - borderWidth,
          borderRadius,
        )
        .stroke();
    } else {
      doc
        .rect(x + half, y + half, width - borderWidth, height - borderWidth)
        .stroke();
    }
    doc.restore();
  }
}

function drawContainerBackground(
  doc,
  x,
  y,
  width,
  height,
  styles,
  borderRadius,
) {
  let fillSpec = null;

  if (styles.background && styles.background.includes("linear-gradient")) {
    const colors =
      styles.background.match(
        /(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba?\([^)]+\)|[a-zA-Z]+)/g,
      ) || [];
    const validColors = colors.filter(
      (c) =>
        c.startsWith("#") ||
        ["white", "black", "blue", "red", "green", "yellow"].includes(
          c.toLowerCase(),
        ),
    );

    if (validColors.length >= 2) {
      const grad = doc.linearGradient(x, y, x + width, y + height);
      validColors.forEach((col, idx) => {
        grad.stop(idx / (validColors.length - 1), col);
      });
      fillSpec = grad;
    }
  }

  if (!fillSpec) {
    if (styles.backgroundColor) {
      fillSpec = styles.backgroundColor;
    } else if (styles.background) {
      const matches = styles.background.match(/#[0-9a-fA-F]{6}/g);
      if (matches && matches.length > 0) {
        fillSpec = matches[0];
      } else if (styles.background.trim().startsWith("#")) {
        fillSpec = styles.background.trim();
      } else {
        fillSpec = styles.background;
      }
    }
  }

  if (fillSpec) {
    doc.save();
    if (borderRadius > 0) {
      doc.roundedRect(x, y, width, height, borderRadius).fill(fillSpec);
    } else {
      doc.rect(x, y, width, height).fill(fillSpec);
    }
    doc.restore();
  }
}

function unitToPoints(value, unit = "px") {
  const n = parseFloat(value) || 0;
  switch ((unit || "px").toLowerCase()) {
    case "in":
      return n * 72;
    case "cm":
      return n * 28.3465;
    case "mm":
      return n * 2.83465;
    default:
      return n * 0.75;
  }
}

const PAGE_FORMATS = {
  A4: { width: 794, height: 1123 },
  A3: { width: 1123, height: 1587 },
  A5: { width: 559, height: 794 },
  LETTER: { width: 816, height: 1056 },
  LEGAL: { width: 816, height: 1344 },
};

function resolvePagePoints(config = {}) {
  const format = String(config.format || "A4").toUpperCase();
  const orientation = String(config.orientation || "portrait").toLowerCase();
  let w, h;
  if (format === "CUSTOM") {
    w = unitToPoints(config.customWidth, config.widthUnit || "px");
    h = unitToPoints(config.customHeight, config.heightUnit || "px");
  } else {
    const base = PAGE_FORMATS[format] || PAGE_FORMATS.A4;
    w = base.width * 0.75;
    h = base.height * 0.75;
  }
  if (orientation === "landscape" && w < h) {
    const temp = w;
    w = h;
    h = temp;
  } else if (orientation === "portrait" && w > h && format !== "CUSTOM") {
    const temp = w;
    w = h;
    h = temp;
  }
  return { width: w, height: h };
}

async function renderPdfFromReact(pagesData, title = "") {
  return new Promise((resolve, reject) => {
    try {
      const firstPageConfig = pagesData[0]?.config || {};
      const { width: width1, height: height1 } =
        resolvePagePoints(firstPageConfig);

      const doc = new PDFDocument({
        size: [width1, height1],
        margin: 0,
        info: { Title: title },
      });

      // Only inspect/register font families that this document can use.
      const neededFamilies = new Set();
      for (const page of pagesData) {
        for (const element of page.elements || []) {
          if (["image", "qr"].includes(element.type)) continue;
          const styles = cssToStyleMap(element.css, element.script);
          const family = styles.fontFamily?.replace(/['"]/g, "").split(",")[0].trim() || "Helvetica";
          const base = family.replace(/\s+(Bold|Regular|Medium|SemiBold|Light|Thin|Black|ExtraBold)$/i, "").trim();
          for (const name of [family, base, `${base} Bold`, `${base} SemiBold`, `${base} Regular`]) neededFamilies.add(name);
        }
      }

      for (const font of FONT_FACES) {
        if (!neededFamilies.has(font.family)) continue;
        const fullPath = path.join(process.cwd(), "public", font.path);
        if (fs.existsSync(fullPath)) {
          const weight = String(font.weight).toLowerCase();
          const style = String(font.style || "normal").toLowerCase();
          const isItalic =
            style === "italic" || /italic|oblique/i.test(font.family);

          try {
            if (isItalic) {
              doc.registerFont(`${font.family}`, fullPath);
              doc.registerFont(`${font.family}-italic`, fullPath);
              doc.registerFont(`${font.family}-${weight}`, fullPath);
              doc.registerFont(`${font.family}-${weight}-italic`, fullPath);
            } else {
              doc.registerFont(`${font.family}-${weight}`, fullPath);

              if (weight === "bold" || weight === "700") {
                doc.registerFont(`${font.family}-bold`, fullPath);
                doc.registerFont(`${font.family}-700`, fullPath);
                doc.registerFont(`${font.family}-Bold`, fullPath);
              }
              if (weight === "normal" || weight === "400") {
                doc.registerFont(font.family, fullPath);
                doc.registerFont(`${font.family}-normal`, fullPath);
                doc.registerFont(`${font.family}-400`, fullPath);
                doc.registerFont(`${font.family}-regular`, fullPath);
                doc.registerFont(`${font.family}-Regular`, fullPath);
              }
              if (weight === "600" || weight === "semibold") {
                doc.registerFont(`${font.family}-semibold`, fullPath);
                doc.registerFont(`${font.family}-600`, fullPath);
              }
              if (weight === "800" || weight === "extrabold") {
                doc.registerFont(`${font.family}-extrabold`, fullPath);
                doc.registerFont(`${font.family}-800`, fullPath);
              }
              if (weight === "900" || weight === "black") {
                doc.registerFont(`${font.family}-black`, fullPath);
                doc.registerFont(`${font.family}-900`, fullPath);
              }
              const isBaseFamily =
                font.family === "Montserrat" ||
                font.family === "Source Sans 3" ||
                font.family === "Bahnschrift" ||
                font.family === "Georgia Pro" ||
                font.family === "Evolventa" ||
                font.family === "LocalGeorgiaPro" ||
                font.family === "Georgia";
              if (!isBaseFamily) {
                doc.registerFont(font.family, fullPath);
              }
            }
          } catch (e) {
            // ignore duplicate registration
          }
        }
      }

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      for (let pIdx = 0; pIdx < pagesData.length; pIdx++) {
        const pageData = pagesData[pIdx];
        const { width: w, height: h } = resolvePagePoints(
          pageData.config || {},
        );

        if (pIdx > 0) {
          doc.addPage({ size: [w, h], margin: 0 });
        }

        // 1. Background image
        if (pageData.backgroundImage) {
          try {
            const imgBuffer = Buffer.from(
              pageData.backgroundImage.split(",")[1],
              "base64",
            );
            const bgSize = String(pageData.bgSize || "cover").toLowerCase();
            const position = parseBackgroundPosition(pageData.bgPosition);
            if (bgSize === "contain") {
              doc.image(imgBuffer, 0, 0, {
                fit: [w, h],
                ...position,
              });
            } else if (bgSize === "cover") {
              doc.image(imgBuffer, 0, 0, {
                cover: [w, h],
                ...position,
              });
            } else {
              doc.image(imgBuffer, 0, 0, { width: w, height: h });
            }
          } catch (e) {
            console.warn(
              `[renderPdfFromReact] Failed to draw background image for page ${pIdx + 1}:`,
              e.message,
            );
          }
        }

        // 2. Elements
        const elements = [...(pageData.elements || [])].sort((a, b) => {
          const aStyles = cssToStyleMap(a.css, a.script);
          const bStyles = cssToStyleMap(b.css, b.script);
          return Number(aStyles.zIndex || 0) - Number(bStyles.zIndex || 0);
        });

        for (const el of elements) {
          const { type, text, src, qrBase64, css = [], script = [] } = el;
          const styles = cssToStyleMap(css, script);

          const borderRadius = cssUnitToPoints(styles.borderRadius);
          let fontSize = cssUnitToPoints(styles.fontSize) || 12 * 0.75;
          const color = styles.color || "#000000";

          if (type === "qr" || type === "image") {
            const mediaUrl = type === "qr" ? qrBase64 : src;
            try {
              drawMediaElement(doc, mediaUrl, styles, w, h, type);
            } catch (error) {
              console.error(`[renderPdfFromReact] Failed to draw ${type}:`, error);
            }
          } else {
            // Text element
            let displayText = decodeHtmlText(text);
            const textTransform = String(styles.textTransform || "").toLowerCase();
            if (textTransform === "uppercase") {
              displayText = displayText.toUpperCase();
            } else if (textTransform === "lowercase") {
              displayText = displayText.toLowerCase();
            } else if (textTransform === "capitalize") {
              displayText = displayText.replace(/\b\p{L}/gu, (char) => char.toUpperCase());
            }
            doc.fillColor(color);

            const rawFamily =
              styles.fontFamily?.replace(/['"]/g, "").split(",")[0].trim() ||
              "Helvetica";
            const rawWeight = String(styles.fontWeight || "normal").toLowerCase();
            const isBold =
              rawWeight === "bold" ||
              rawWeight === "700" ||
              rawWeight === "800" ||
              rawWeight === "900" ||
              /bold/i.test(rawFamily);
            const isSemiBold =
              rawWeight === "600" ||
              rawWeight === "semibold" ||
              /semibold/i.test(rawFamily);

            const baseFamily = rawFamily
              .replace(/\s+(Bold|Regular|Medium|SemiBold|Light|Thin|Black|ExtraBold)$/i, "")
              .trim();

            const candidateFontNames = [];
            const numericWeight = ({ normal: "400", bold: "700", semibold: "600" })[rawWeight] || rawWeight;
            if (styles.fontStyle === "italic") {
              candidateFontNames.push(`${rawFamily}-${numericWeight}-italic`, `${rawFamily}-italic`);
            }
            candidateFontNames.push(`${rawFamily}-${numericWeight}`);
            if (isBold) {
              candidateFontNames.push(
                `${rawFamily}-bold`,
                `${rawFamily}-700`,
                `${rawFamily}-Bold`,
                `${baseFamily}-bold`,
                `${baseFamily}-700`,
                `${baseFamily}-Bold`,
                `${baseFamily} Bold`,
                `${baseFamily} Bold-700`,
                `${baseFamily} Bold-bold`,
                `${baseFamily} Bold-normal`,
                rawFamily,
              );
            } else if (isSemiBold) {
              candidateFontNames.push(
                `${rawFamily}-semibold`,
                `${rawFamily}-600`,
                `${baseFamily}-semibold`,
                `${baseFamily}-600`,
                `${baseFamily} SemiBold`,
                rawFamily,
              );
            }
            candidateFontNames.push(
              rawFamily,
              `${rawFamily}-normal`,
              `${rawFamily}-400`,
              `${rawFamily}-regular`,
              baseFamily,
              `${baseFamily}-normal`,
              `${baseFamily}-400`,
              `${baseFamily}-regular`,
              `${baseFamily} Regular`,
            );

            let fontApplied = false;
            for (const fontName of candidateFontNames) {
              if (!fontName) continue;
              try {
                doc.font(fontName);
                fontApplied = true;
                break;
              } catch {}
            }

            if (!fontApplied) {
              try {
                doc.font(isBold ? "Helvetica-Bold" : "Helvetica");
              } catch {}
            }

            doc.fontSize(fontSize);

            let align = "left";
            if (styles.textAlign) {
              const a = styles.textAlign.toLowerCase();
              if (["left", "center", "right", "justify"].includes(a)) align = a;
            } else if (styles.justifyContent) {
              const j = styles.justifyContent.toLowerCase();
              if (j === "center") align = "center";
              else if (j === "flex-end" || j === "end") align = "right";
              else if (j === "flex-start" || j === "start") align = "left";
            }

            let textWidth = parseSize(styles?.width);
            let textHeightBox = parseSize(styles?.height);

            const rightVal = parseSize(styles?.right);
            const bottomVal = parseSize(styles?.bottom);

            let textLeft = parseSize(styles?.left);
            if (textLeft === null || textLeft === undefined) {
              if (rightVal !== null && rightVal !== undefined) {
                textLeft = w - rightVal - (textWidth || 0);
              } else {
                textLeft = 0;
              }
            }

            if (textWidth === null || textWidth === undefined) {
              const availableWidth = Math.max(1, w - textLeft - (rightVal || 0));
              const naturalWidth = Math.max(1, doc.widthOfString(displayText || " "));
              textWidth = Math.min(availableWidth, naturalWidth);
            }

            let textTop = parseSize(styles?.top);
            if (textTop === null || textTop === undefined) {
              if (bottomVal !== null && bottomVal !== undefined) {
                textTop = h - bottomVal - (textHeightBox || fontSize);
              } else {
                textTop = 0;
              }
            }

            if (textLeft < 0) textLeft = 0;
            if (textTop < 0) textTop = 0;
            if (textLeft + textWidth > w) {
              textWidth = Math.max(10, w - textLeft - 2);
            }

            const borderWidth = getBorderWidth(styles);
            const paddings = getPadding(styles);

            const hasBg = styles.backgroundColor || styles.background;
            const hasBorder = styles.border || styles.borderWidth || styles.borderColor;
            if (hasBg || hasBorder) {
              const bgHeight = textHeightBox > 0
                ? textHeightBox
                : fontSize + paddings.top + paddings.bottom + borderWidth * 2 + 4;
              drawContainerBackground(
                doc,
                textLeft,
                textTop,
                textWidth,
                bgHeight,
                styles,
                borderRadius,
              );
              drawContainerBorder(
                doc,
                textLeft,
                textTop,
                textWidth,
                bgHeight,
                styles,
                borderRadius,
              );
            }

            let fittedLines = null;
            const overflowsWidth = displayText.split("\n").some(line =>
              doc.widthOfString(line, { characterSpacing: cssUnitToPoints(styles.letterSpacing) || 0 }) >
              textWidth - paddings.left - paddings.right - borderWidth * 2);
            if (styles.width && textWidth > 0 && textHeightBox > 0 && shouldFitText(styles, overflowsWidth)) {
              const originalSize = fontSize;
              const rawLeading = String(styles.lineHeight || "1.5").trim();
              const normalRatio = doc.currentLineHeight(true) / fontSize;
              const fit = fitTextToBox({
                text: displayText,
                width: (textWidth - paddings.left - paddings.right - borderWidth * 2) / 0.75,
                height: (textHeightBox - paddings.top - paddings.bottom - borderWidth * 2) / 0.75,
                fontSize: originalSize / 0.75,
                minFontSize: styles["--min-font-size"] ? cssUnitToPoints(styles["--min-font-size"]) / 0.75 : undefined,
                lineHeight: size => rawLeading === "normal" ? normalRatio * size
                  : /^[\d.]+$/.test(rawLeading) ? Number(rawLeading) * size : cssUnitToPoints(rawLeading) / 0.75,
                measure: (value, size) => {
                  doc.fontSize(size * 0.75);
                  return doc.widthOfString(value, { characterSpacing: cssUnitToPoints(styles.letterSpacing) || 0 }) / 0.75;
                },
              });
              displayText = fit.text;
              fittedLines = fit.lines;
              fontSize = fit.fontSize * 0.75;
              doc.fontSize(fontSize);
            }

            const rawLineHeight = String(styles.lineHeight || "1.5").trim();
            const lineHeight = rawLineHeight === "normal"
              ? doc.currentLineHeight(true)
              : (/^[\d.]+$/.test(rawLineHeight)
                  ? Number(rawLineHeight) * fontSize
                  : cssUnitToPoints(rawLineHeight));
            const lineGap = lineHeight - doc.currentLineHeight(true);
            const halfLeading = (lineHeight - doc.currentLineHeight(false)) / 2;
            const characterSpacing = cssUnitToPoints(styles.letterSpacing) || 0;

            let yOffset = 0;
            if (textHeightBox > 0 && ["flex", "inline-flex"].includes(styles.display)) {
              const innerWidth = Math.max(
                1,
                textWidth - paddings.left - paddings.right - borderWidth * 2,
              );
              const actualTextHeight = fittedLines ? fittedLines.length * lineHeight : doc.heightOfString(displayText, {
                width: innerWidth,
                lineGap,
                characterSpacing,
              });
              const vAlign = String(
                styles.flexDirection === "column"
                  ? styles.justifyContent || "top"
                  : styles.alignItems || "top",
              ).toLowerCase();
              if (vAlign === "center" || vAlign === "middle") {
                const availableHeight = Math.max(
                  0,
                  textHeightBox - paddings.top - paddings.bottom - borderWidth * 2,
                );
                yOffset = (availableHeight - actualTextHeight) / 2;
              } else if (
                vAlign === "flex-end" ||
                vAlign === "end" ||
                vAlign === "bottom"
              ) {
                const availableHeight = Math.max(
                  0,
                  textHeightBox - paddings.top - paddings.bottom - borderWidth * 2,
                );
                yOffset = availableHeight - actualTextHeight;
              }
            }

            const effectiveLeft = textLeft + borderWidth + paddings.left;
            const effectiveTop = textTop + borderWidth + paddings.top + yOffset + halfLeading;
            const effectiveWidth = Math.max(
              1,
              textWidth - borderWidth * 2 - paddings.left - paddings.right,
            );

            if (displayText && displayText.trim().length > 0) {
              const textOptions = {
                width: effectiveWidth,
                align,
                lineGap,
                characterSpacing,
                height: Infinity,
              };
              doc.save();
              if (
                textHeightBox > 0 &&
                ["hidden", "clip"].includes(String(styles.overflow || "").toLowerCase())
              ) {
                doc.rect(
                  textLeft + borderWidth,
                  textTop + borderWidth,
                  Math.max(0, textWidth - borderWidth * 2),
                  Math.max(0, textHeightBox - borderWidth * 2),
                ).clip();
              }

              if (fittedLines) {
                const widths = fittedLines.map(line => doc.widthOfString(line, { characterSpacing }));
                const isFlex = ["flex", "inline-flex"].includes(styles.display);
                const horizontal = String(styles.flexDirection === "column"
                  ? styles.alignItems || "stretch" : styles.justifyContent || "flex-start").toLowerCase();
                const blockWidth = isFlex && !(styles.flexDirection === "column" && horizontal === "stretch")
                  ? Math.max(0, ...widths) : effectiveWidth;
                const blockOffset = !isFlex ? 0
                  : ["center", "space-around", "space-evenly"].includes(horizontal) ? (effectiveWidth - blockWidth) / 2
                  : ["end", "flex-end", "right"].includes(horizontal) ? effectiveWidth - blockWidth : 0;
                const lineAlign = styles.textAlign || "left";
                fittedLines.forEach((line, index) => {
                  const offset = lineAlign === "center" ? (blockWidth - widths[index]) / 2
                    : ["right", "end"].includes(lineAlign) ? blockWidth - widths[index] : 0;
                  doc.text(line, effectiveLeft + blockOffset + offset, effectiveTop + index * lineHeight,
                    { ...textOptions, width: undefined, align: "left", lineBreak: false });
                });
              } else {
                doc.text(displayText, effectiveLeft, effectiveTop, textOptions);
              }
              doc.restore();
            }
          }
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── ZIP builder ───────────────────────────────────────────────────────────
function createZipArchive(options = { zlib: { level: 4 } }) {
  if (archiverModule.ZipArchive) {
    return new archiverModule.ZipArchive(options);
  }
  const fn = archiverModule.default || archiverModule;
  if (typeof fn === "function") {
    return fn("zip", options);
  }
  if (typeof archiverModule === "function") {
    return archiverModule("zip", options);
  }
  throw new Error("Cannot instantiate archiver zip");
}

function buildZipBuffer(pdfFiles) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const archive = createZipArchive({ zlib: { level: 4 } });

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", (err) => reject(err));

    for (const file of pdfFiles) {
      archive.append(file.buffer, { name: file.name });
    }

    archive.finalize();
  });
}

// ─── Parallel limit helper ──────────────────────────────────────────────────
async function parallelLimit(tasks, limit) {
  const results = [];
  const executing = [];
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// ─── CLASS: SinglePdfGenerator (one student, multiple pages) ────────────────
export class SinglePdfGenerator {
  async generate(pagesData, title = "") {
    await prefetchAssets(pagesData);
    const result = await renderPdfFromReact(pagesData, title);
    return result;
  }
}

// ─── CLASS: BulkPdfGenerator (many students, one PDF each) ──────────────────
export class BulkPdfGenerator {
  constructor({ concurrency = 8 } = {}) {
    this.concurrency = concurrency;
  }

  async generate(students) {
    await Promise.all(
      students.map((student) => prefetchAssets(student.pagesData))
    );

    const tasks = students.map((student) => async () => {
      const safeName = student.name.replace(/[^a-z0-9._\- ]/gi, "_").trim();
      const pdfBuffer = await renderPdfFromReact(student.pagesData, safeName);
      return { name: `${safeName}.pdf`, buffer: pdfBuffer };
    });

    const pdfFiles = await parallelLimit(tasks, this.concurrency);
    return buildZipBuffer(pdfFiles);
  }
}

// ─── CLASS: MultiTemplateBulkGenerator (folders per student) ────────────────
export class MultiTemplateBulkGenerator {
  constructor({ concurrency = 8 } = {}) {
    this.concurrency = concurrency;
  }

  async generate(studentsData) {
    const tasks = [];
    for (const student of studentsData) {
      const studentFolder = student.name
        .replace(/[^a-z0-9._\- ]/gi, "_")
        .trim();
      for (const [templateName, pagesData] of Object.entries(student.pdfs)) {
        const safeName = templateName.replace(/[^a-z0-9._\- ]/gi, "_").trim();
        tasks.push(async () => {
          await prefetchAssets(pagesData);
          const pdfBuffer = await renderPdfFromReact(
            pagesData,
            `${student.name}_${templateName}`,
          );
          return {
            name: `${studentFolder}/${safeName}.pdf`,
            buffer: pdfBuffer,
          };
        });
      }
    }
    const pdfFiles = await parallelLimit(tasks, this.concurrency);
    return buildZipBuffer(pdfFiles);
  }
}
