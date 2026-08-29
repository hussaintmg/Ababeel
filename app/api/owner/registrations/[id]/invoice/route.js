import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import { requireOwner } from "@/lib/auth";
import { safeErrorResponse } from "@/lib/errors";
import Registration from "@/models/Registration";
import Template from "@/models/Template";
import { getPaymentInfo } from "@/lib/training/settings";
import { SinglePdfGenerator } from "@/utils/pdfGenerator";
import "@/models/TrainingCourse";
import "@/models/CourseReferenceSession";

/**
 * Renders an invoice PDF for one registration, using the active
 * "Registration Invoice" template from the PDF template designer.
 *
 * The amount, currency, invoice number, dates and notes are typed by the
 * owner at generation time and exist only in the produced PDF — the
 * Registration model deliberately stores no payment field, and nothing here
 * touches the payment provider. This is a document generator, not a checkout.
 *
 * Owner-only: an invoice reads a real person's contact details.
 */
export const dynamic = "force-dynamic";

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
  return String(text).replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const parts = path.trim().split(".");
    const obj = dataMap[parts[0]];
    if (!obj) return `{{${path}}}`;
    let value = obj;
    for (const key of parts.slice(1)) {
      if (value == null) return `{{${path}}}`;
      value = value[key];
    }
    if (value == null) return `{{${path}}}`;
    const lastKey = parts[parts.length - 1] || "";
    if (/date|createdat/i.test(lastKey) && typeof value !== "number") return formatDate(value);
    return String(value);
  });
}

function transformElements(elements, dataMap) {
  return (elements || []).map((element) => {
    const { type, text, imageUrl, css = [], script = [] } = element;

    const resolvedScript = (script || []).map((rule) => {
      const condBlock = Array.isArray(rule) ? rule[0] : rule.condition;
      const cssBlock = Array.isArray(rule) ? rule[1] : rule.css;
      return {
        condition: condBlock
          ? {
              ...condBlock,
              compare1: resolvePlaceholders(condBlock.compare1 || "", dataMap),
              compare2: resolvePlaceholders(condBlock.compare2 || "", dataMap),
            }
          : {},
        css: cssBlock,
      };
    });

    if (type === "image") {
      const src = imageUrl?.includes("{{") ? resolvePlaceholders(imageUrl, dataMap) : imageUrl;
      return { type: "image", src, css, script: resolvedScript };
    }
    // An invoice has no verification QR; any stray QR element renders as text.
    return { type: "text", text: resolvePlaceholders(text || "", dataMap), css, script: resolvedScript };
  });
}

/** Only what the query string may set, each length-capped. */
function invoiceFrom(searchParams) {
  const pick = (key, max) => String(searchParams.get(key) || "").slice(0, max).trim();
  return {
    number: pick("number", 60),
    date: pick("date", 30) || formatDate(new Date()),
    dueDate: pick("dueDate", 30),
    amount: pick("amount", 30),
    currency: pick("currency", 10),
    notes: pick("notes", 500),
  };
}

export async function GET(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    await connectDB();
    const { id } = await params;

    const registration = await Registration.findById(id)
      .populate("course", "name code")
      .populate("session", "referenceName referenceCode startDate endDate");
    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    const template = await Template.findOne({ type: "Registration Invoice", isActive: true });
    if (!template || !template.designData?.pages?.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No active Registration Invoice template. Create one under PDF Templates → Registration Invoice first.",
        },
        { status: 404 },
      );
    }

    const reg = registration.toObject();
    const dataMap = {
      Registration: {
        ...reg,
        fullName: reg.fullName || `${reg.firstName || ""} ${reg.lastName || ""}`.trim(),
        createdAt: reg.createdAt,
      },
      Course: registration.course?.toObject?.() || {},
      Session: registration.session?.toObject?.() || {},
      Invoice: invoiceFrom(new URL(request.url).searchParams),
      Payment: await getPaymentInfo(),
    };

    const pagesData = template.designData.pages.map((page) => ({
      config: page.config,
      backgroundImage: page.backgroundImage,
      elements: transformElements(page.elements || [], dataMap),
    }));

    const generator = new SinglePdfGenerator();
    const pdfBuffer = await generator.generate(pagesData, `Invoice ${reg.reference}`);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${reg.reference}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("registration invoice error:", error);
    return safeErrorResponse(error, 500);
  }
}
