import { Worker } from "worker_threads";
import archiver from "archiver";
import path from "path";
import fs from "fs";
import { FONT_FACES } from "@/constants/fontFaces";
import PDFDocument from "pdfkit";

// ─── Helper: resolve page dimensions to PDF points ─────────────────────────
export function resolvePageDimensions(config = {}) {
  const {
    format = "A4",
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
  if (format.toUpperCase() === "CUSTOM" && customWidth && customHeight) {
    dims = {
      width: Number(customWidth) * 0.75,
      height: Number(customHeight) * 0.75,
    }; // px to points approx
  }
  return {
    width: dims.width,
    height: dims.height,
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

async function urlToBase64(url, timeoutMs = 4000) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  if (!url.startsWith("http")) {
    // Root-relative web path (e.g. "/uploads/...") maps to the /public directory,
    // not the filesystem root. Try /public first, then cwd, then the raw path.
    try {
      const cleaned = url.split("?")[0].split("#")[0];
      const relative = cleaned.replace(/^[\\/]+/, "");
      const candidatePaths = [
        path.join(process.cwd(), "public", relative),
        path.join(process.cwd(), relative),
        cleaned,
      ];
      for (const filePath of candidatePaths) {
        if (fs.existsSync(filePath)) {
          const buf = fs.readFileSync(filePath);
          return `data:${mimeFromExt(filePath)};base64,${buf.toString("base64")}`;
        }
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
    console.log(`[Prefetch] Fetching remote image: ${url}`);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const b64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${b64}`;
  } catch (err) {
    clearTimeout(id);
    console.warn(
      `[Prefetch] Failed or timed out fetching ${url}:`,
      err.message,
    );
    // Return a 1x1 transparent PNG fallback to prevent the layout engine from failing/hanging
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  }
}

async function prefetchAssets(pagesData) {
  console.log("[Prefetch] Starting comprehensive assets prefetch...");
  const start = Date.now();
  for (const page of pagesData) {
    // 1. Prefetch background image
    if (page.backgroundImage) {
      page.backgroundImage = await urlToBase64(page.backgroundImage);
    }

    // 2. Prefetch elements (QR and other images)
    for (const el of page.elements || []) {
      if (el.type === "qr" && el.qrUrl) {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(el.qrUrl)}`;
        el.qrBase64 = await urlToBase64(qrApiUrl);
      } else if (el.type === "image" && el.src) {
        el.src = await urlToBase64(el.src);
      }
    }
  }
  console.log(
    `[Prefetch] Asset prefetch completed successfully in ${Date.now() - start}ms`,
  );
}

// ─── Render PDF via isolated worker thread ────────────────────────────────
// pdf().toBuffer() hangs in Next.js because Turbopack's React reconciler
// conflicts with @react-pdf/renderer's own reconciler.
// Running it in a worker thread gives it a clean, isolated JS environment.
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
    const { compare1, condition, compare2 } = condBlock?._doc || {};
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
    // Extract hex colors or common standard names from the gradient string
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
      // Create a top-left to bottom-right linear gradient
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
        fillSpec = styles.background; // direct hex or standard name fallback
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
  if (format === "CUSTOM") {
    const w = unitToPoints(config.customWidth, config.widthUnit || "px");
    const h = unitToPoints(config.customHeight, config.heightUnit || "px");
    return { width: w, height: h };
  } else {
    const base = PAGE_FORMATS[format] || PAGE_FORMATS.A4;
    return {
      width: base.width * 0.75,
      height: base.height * 0.75,
    };
  }
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

      // Register all custom fonts
      for (const font of FONT_FACES) {
        const fullPath = path.join(process.cwd(), "public", font.path);
        if (fs.existsSync(fullPath)) {
          const weight = String(font.weight).toLowerCase();
          doc.registerFont(`${font.family}-${weight}`, fullPath);
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

    const bg = doc.openImage(imgBuffer);

    const imgWidth = bg.width;
    const imgHeight = bg.height;

    const imgRatio =
      imgWidth / imgHeight;

    const pageRatio =
      w / h;

    let drawWidth;
    let drawHeight;
    let drawX;
    let drawY;

    if (imgRatio > pageRatio) {
      drawHeight = h;
      drawWidth =
        h * imgRatio;

      drawX =
        (w - drawWidth) / 2;

      drawY = 0;
    } else {
      // image taller
      drawWidth = w;
      drawHeight =
        w / imgRatio;

      drawX = 0;

      drawY =
        (h - drawHeight) / 2;
    }

    console.log({
      drawWidth,
      drawHeight,
      drawX,
      drawY,
    });

    doc.image(
      imgBuffer,
      drawX,
      drawY,
      {
        width: drawWidth,
        height: drawHeight,
      },
    );
  } catch (e) {
    console.warn(
      `[renderPdfFromReact] Failed to draw background image for page ${pIdx + 1}:`,
      e.message,
    );
  }
}

        // 2. Elements
        const elements = pageData.elements || [];
        for (const el of elements) {
          const { type, text, src, qrBase64, css = [], script = [] } = el;

          const styles = {};

          // Apply standard css
          css.forEach((c) => {
            styles[c.property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] =
              c.value;
          });

          // Evaluate and override with dynamic script styles
          const scriptProps = resolveScript(script);
          Object.entries(scriptProps).forEach(([prop, val]) => {
            styles[prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = val;
          });

          const elWidth = cssUnitToPoints(styles.width);
          let elHeight = cssUnitToPoints(styles.height);
          if (elHeight === 0) {
            if (styles.maxHeight) {
              elHeight = cssUnitToPoints(styles.maxHeight);
            } else {
              elHeight = elWidth; // fallback to square shape
            }
          }
          const elLeft = cssUnitToPoints(styles.left);
          const elTop = cssUnitToPoints(styles.top);
          const borderRadius = cssUnitToPoints(styles.borderRadius);
          const padding = cssUnitToPoints(styles.padding);
          const fontSize = cssUnitToPoints(styles.fontSize) || 12 * 0.75;
          const color = styles.color || "#000000";

          if (type === "qr" || type === "image") {
            const mediaUrl = type === "qr" ? qrBase64 : src;

            if (mediaUrl) {
              try {
                console.log("=================================");
                console.log(`[PDF IMAGE START] : ${type}`);
                console.log("styles:", styles);

                const parseSize = (value) => {
                  if (value === undefined || value === null || value === "") {
                    return null;
                  }

                  return cssUnitToPoints(value);
                };

                const imgBuffer = Buffer.from(mediaUrl.split(",")[1], "base64");

                const img = doc.openImage(imgBuffer);

                const originalWidth = img.width;
                const originalHeight = img.height;

                const aspectRatio = originalWidth / originalHeight;

                console.log("original:", originalWidth, originalHeight);

                // =========================
                // PAGE SIZE
                // =========================

                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;

                console.log("pageWidth:", pageWidth);
                console.log("pageHeight:", pageHeight);

                // =========================
                // STYLES
                // =========================

                const paddingValue = parseSize(styles?.padding) || padding || 0;

                const width = parseSize(styles?.width) || elWidth || null;

                const height = parseSize(styles?.height) || elHeight || null;

                const maxWidth = parseSize(styles?.maxWidth);

                const maxHeight = parseSize(styles?.maxHeight);

                console.log({
                  width,
                  height,
                  maxWidth,
                  maxHeight,
                });

                // =========================
                // FINAL SIZE
                // =========================

                let finalWidth = originalWidth;
                let finalHeight = originalHeight;

                // width + height
                if (width && height) {
                  finalWidth = width;
                  finalHeight = height;
                }

                // only width
                else if (width) {
                  finalWidth = width;
                  finalHeight = finalWidth / aspectRatio;
                }

                // only height
                else if (height) {
                  finalHeight = height;
                  finalWidth = finalHeight * aspectRatio;
                }

                // maxWidth
                if (maxWidth && finalWidth > maxWidth) {
                  finalWidth = maxWidth;
                  finalHeight = finalWidth / aspectRatio;
                }

                // maxHeight
                if (maxHeight && finalHeight > maxHeight) {
                  finalHeight = maxHeight;
                  finalWidth = finalHeight * aspectRatio;
                }

                finalWidth = Math.max(1, finalWidth);
                finalHeight = Math.max(1, finalHeight);

                console.log({
                  finalWidth,
                  finalHeight,
                });

                // =========================
                // CONTAINER SIZE
                // =========================

                const containerWidth = finalWidth + paddingValue * 2;

                const containerHeight = finalHeight + paddingValue * 2;

                // =========================
                // POSITION
                // =========================

                let containerLeft = parseSize(styles?.left);

                if (containerLeft === null || containerLeft === undefined) {
                  containerLeft = elLeft || 0;
                }

                let containerTop = parseSize(styles?.top);

                if (containerTop === null || containerTop === undefined) {
                  containerTop = elTop || 0;
                }

                if (styles?.right !== undefined) {
                  const right = parseSize(styles.right) || 0;

                  containerLeft = pageWidth - right - containerWidth;
                }

                if (styles?.bottom !== undefined) {
                  const bottom = parseSize(styles.bottom) || 0;

                  containerTop = pageHeight - bottom - containerHeight;
                }

                console.log({
                  containerLeft,
                  containerTop,
                });

                // =========================
                // DRAW BACKGROUND
                // =========================

                drawContainerBackground(
                  doc,
                  containerLeft,
                  containerTop,
                  containerWidth,
                  containerHeight,
                  styles,
                  borderRadius,
                );

                // =========================
                // IMAGE POSITION
                // =========================

                const imageLeft = containerLeft + paddingValue;

                const imageTop = containerTop + paddingValue;

                console.log({
                  imageLeft,
                  imageTop,
                });

                // =========================
                // CLIP
                // =========================

                doc.save();

                const r = Math.max(0, Number(borderRadius || 0) - 3);

                if (r > 0) {
                  doc
                    .roundedRect(
                      imageLeft,
                      imageTop,
                      finalWidth,
                      finalHeight,
                      r,
                    )
                    .clip();
                }

                // =========================
                // DRAW IMAGE
                // =========================

                console.log("[DRAWING IMAGE NOW]");

                doc.image(imgBuffer, imageLeft, imageTop, {
                  width: finalWidth,
                  height: finalHeight,
                });

                doc.restore();

                // =========================
                // BORDER
                // =========================

                drawContainerBorder(
                  doc,
                  containerLeft,
                  containerTop,
                  containerWidth,
                  containerHeight,
                  styles,
                  borderRadius,
                );

                console.log("[IMAGE SUCCESS]");
                console.log("=================================");
              } catch (e) {
                console.error(
                  `[renderPdfFromReact] Failed to draw ${type}:`,
                  e,
                );
              }
            }
          } else {
            // Text element
            let displayText = text || "";
            if (
              displayText.includes('<div class="first-line">') ||
              displayText.includes('<div class="second-line">') ||
              displayText.includes("second-line")
            ) {
              const matches = displayText.match(/<div[^>]*>([\s\S]*?)<\/div>/g);
              if (matches && matches.length > 0) {
                displayText = matches
                  .map((m) => m.replace(/<[^>]*>/g, ""))
                  .join("\n");
              } else {
                displayText = displayText.replace(/<[^>]*>/g, "");
              }
            } else {
              displayText = displayText
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<[^>]*>/g, "");
            }
            doc.fillColor(color);

            const family =
              styles.fontFamily?.replace(/['"]/g, "").split(",")[0].trim() ||
              "Helvetica";
            let weight = String(styles.fontWeight || "normal").toLowerCase();
            if (weight === "bold") weight = "bold";

            const fontKey = `${family}-${weight}`;
            try {
              doc.font(fontKey);
            } catch {
              doc.font(weight === "bold" ? "Helvetica-Bold" : "Helvetica");
            }

            doc.fontSize(fontSize);

            // Vertical alignment based on alignItems / verticalAlign CSS properties
            let yOffset = 0;
            const textHeight = doc.heightOfString(displayText, {
              width: elWidth || w,
            });

            const vAlign = String(
              styles.alignItems || styles.verticalAlign || "center",
            ).toLowerCase();
            if (vAlign === "center" || vAlign === "middle") {
              yOffset = elHeight > textHeight ? (elHeight - textHeight) / 2 : 0;
            } else if (
              vAlign === "flex-end" ||
              vAlign === "end" ||
              vAlign === "bottom"
            ) {
              yOffset = elHeight > textHeight ? elHeight - textHeight : 0;
            } else {
              // flex-start / start / normal / top -> top align
              yOffset = 0;
            }

            // Horizontal alignment based on textAlign and justifyContent
            let align = "left";
            if (styles.textAlign) {
              align = styles.textAlign;
            } else if (styles.justifyContent) {
              const jContent = String(styles.justifyContent).toLowerCase();
              if (jContent === "center") {
                align = "center";
              } else if (
                jContent === "flex-end" ||
                jContent === "end" ||
                jContent === "right"
              ) {
                align = "right";
              } else {
                align = "left";
              }
            }

            const textLeft = parseSize(styles?.left) || elLeft || 0;

            const textTop = parseSize(styles?.top) || elTop || 0;

            const textWidth = parseSize(styles?.width) || elWidth || w;

            const textHeightBox = parseSize(styles?.height) || elHeight || 0;

            doc.text(displayText, textLeft, textTop + yOffset, {
              width: textWidth,
              height: textHeightBox,
              align,
            });
          }
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── ZIP builder (unchanged) ───────────────────────────────────────────────
function buildZipBuffer(files) {
  return new Promise((resolve, reject) => {
    const validFiles = files.filter(
      (f) => f && f.buffer && Buffer.isBuffer(f.buffer),
    );
    if (!validFiles.length) reject(new Error("No valid files"));
    const chunks = [];
    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("data", (c) => chunks.push(c));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
    validFiles.forEach((f) => archive.append(f.buffer, { name: f.name }));
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
  constructor({ concurrency = 4 } = {}) {
    this.concurrency = concurrency;
  }

  async generate(students) {
    // Prefetch all assets for all students
    for (const student of students) {
      await prefetchAssets(student.pagesData);
    }
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
  constructor({ concurrency = 3 } = {}) {
    this.concurrency = concurrency;
  }

  async generate(studentsData) {
    // studentsData: [{ name: "John", pdfs: { "Certificate": pagesData, "ID": pagesData } }]
    for (const student of studentsData) {
      for (const pagesData of Object.values(student.pdfs)) {
        await prefetchAssets(pagesData);
      }
    }
    const tasks = [];
    for (const student of studentsData) {
      const studentFolder = student.name
        .replace(/[^a-z0-9._\- ]/gi, "_")
        .trim();
      for (const [templateName, pagesData] of Object.entries(student.pdfs)) {
        const safeName = templateName.replace(/[^a-z0-9._\- ]/gi, "_").trim();
        tasks.push(async () => {
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
