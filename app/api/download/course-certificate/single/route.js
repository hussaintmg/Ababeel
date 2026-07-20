import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Template from "@/models/Template";
import Candidate from "@/models/Candidate";
import CourseReference from "@/models/CourseReference";
import Course from "@/models/Course";
import DefaultCourse from "@/models/DefaultCourse";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { SinglePdfGenerator } from "@/utils/pdfGenerator";

// ─── Placeholder resolver ─────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

function resolvePlaceholders(text, dataMap) {
  if (!text) return "";

  return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const parts = path.trim().split(".");
    const namespace = parts[0];
    const fieldPath = parts.slice(1);

    const obj = dataMap[namespace];
    if (!obj) return `{{${path}}}`;

    let value = obj;
    for (const key of fieldPath) {
      if (value == null) return `{{${path}}}`;
      value = value[key];
    }

    if (value == null) return `{{${path}}}`;

    const lastKey = fieldPath[fieldPath.length - 1] || "";
    const isDateKey = /date|dob|expiry|created|updated/i.test(lastKey);
    if (isDateKey && typeof value !== "number") return formatDate(value);

    return String(value);
  });
}

function maybeFormatLines(text, enable, maxWords = 3) {
  if (!enable || !text) return text;
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  const split = Math.ceil(words.length * 0.6);
  return `<div class="first-line">${words.slice(0, split).join(" ")}</div><div class="second-line">${words.slice(split).join(" ")}</div>`;
}

// ─── QR URL builder ───────────────────────────────────────────────────────────

function buildQrUrl(candidate) {
  const first = candidate.firstName.replaceAll(" ", "-");
  const last = candidate.lastName.replaceAll(" ", "-");
  return `https://www.safetechq.co.uk/verify-certificate/${first}/${last}/${candidate.traineeId}/${candidate._id}`;
}

// ─── Transform DB page elements with resolved data ────────────────────────────

/**
 * Takes raw DB page elements and resolves all placeholders.
 * QR elements get a `qrUrl` field; the actual base64 fetch happens inside
 * SinglePdfGenerator via prefetchQrCodes() before Puppeteer opens.
 *
 * @param {object[]} elements
 * @param {object}   dataMap
 * @returns {object[]}
 */
function transformElements(elements, dataMap) {
  return elements.map((element) => {
    const {
      type,
      text,
      imageUrl,
      css = [],
      script = [],
      enableTextFormatting,
      maxWordsPerLine,
    } = element;

    const resolvedScript = (script || []).map(rule => {
      let condBlock, cssBlock;
      if (Array.isArray(rule)) {
        [condBlock, cssBlock] = rule;
      } else {
        condBlock = rule.condition;
        cssBlock = rule.css;
      }
      
      const resolvedCond = condBlock ? {
        ...condBlock,
        compare1: resolvePlaceholders(condBlock.compare1 || "", dataMap),
        compare2: resolvePlaceholders(condBlock.compare2 || "", dataMap),
      } : {};
      
      return {
        condition: resolvedCond,
        css: cssBlock,
      };
    });

    if (type === "image") {
      const src = imageUrl?.includes("{{")
        ? resolvePlaceholders(imageUrl, dataMap)
        : imageUrl;

      return { type: "image", src, css, script: resolvedScript };
    }

    if (type === "qr") {
      // Build the full verification URL; base64 conversion happens in prefetchQrCodes()
      const qrUrl = buildQrUrl(dataMap.Candidate || {});
      return { type: "qr", qrUrl, css, script: resolvedScript };
    }

    // text element
    const resolved = resolvePlaceholders(text || "", dataMap);
    const formatted = maybeFormatLines(
      resolved,
      enableTextFormatting,
      maxWordsPerLine,
    );
    return { type: "text", text: formatted, css, script: resolvedScript };
  });
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    await connectDB();

    // Auth check
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ user: null, loggedIn: false });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({
        user: null,
        loggedIn: false,
        error: "Invalid token",
      });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return NextResponse.json({
        user: null,
        loggedIn: false,
        error: "User not found",
      });

    const { candidateId } = await request.json();
    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "Candidate ID is required" },
        { status: 400 },
      );
    }

    // Fetch candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 },
      );
    }

    // Fetch course reference
    const courseReference = await CourseReference.findById(candidate.courseId);
    if (!courseReference) {
      return NextResponse.json(
        { success: false, error: "Course reference not found" },
        { status: 404 },
      );
    }

    // Fetch course (try user Course first, fallback to DefaultCourse)
    let course = await Course.findById(courseReference.courseId).catch(
      () => null,
    );
    if (!course) {
      course = await DefaultCourse.findOne({
        name: courseReference.courseName,
      }).catch(() => null);
    }

    // Fetch active template
    const template = await Template.findOne({
      type: "Course Certificate",
      isActive: true,
    });

    if (!template || !template.designData?.pages?.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No active Course Certificate template found",
        },
        { status: 404 },
      );
    }

    // Build the data map for placeholder resolution
    const dataMap = {
      Candidate: {
        ...candidate.toObject(),
        fullName: `${candidate.firstName} ${candidate.lastName}`,
      },
      CourseReference: {
        ...courseReference.toObject(),
        startDate: courseReference.startDate,
        endDate: courseReference.endDate,
        expiryDate: courseReference.expiryDate,
      },
      Course: course ? course.toObject() : {},
      User: user,
    };

    // Transform each DB page into a pagesData entry for SinglePdfGenerator.
    // QR elements carry `qrUrl`; SinglePdfGenerator.generate() calls
    // prefetchQrCodes() which converts each qrUrl → qrBase64 before Puppeteer renders.
    const pagesData = template.designData.pages.map((page) => {
      const resolvedElements = transformElements(page.elements || [], dataMap);

      return {
        config: page.config,
        backgroundImage: page.backgroundImage,
        elements: resolvedElements,
        // html is intentionally omitted here so generate() re-builds it
        // AFTER injecting qrBase64 into the elements
      };
    });

    const title = `${candidate.firstName} ${candidate.lastName} - ${courseReference.courseName} Certificate`;

    // Generate PDF
    const generator = new SinglePdfGenerator();
    const pdfBuffer = await generator.generate(pagesData, title);

    // Stream PDF back to client
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${candidate.traineeId}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
