import connectDB from "@/utils/db";
import { requireOwner } from "@/lib/auth";
import { successResponse, safeErrorResponse } from "@/lib/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { plain } from "@/lib/training/queries";
import TrainingCourse from "@/models/TrainingCourse";
import CourseReferenceSession from "@/models/CourseReferenceSession";
import Registration from "@/models/Registration";
import AwardingBody from "@/models/AwardingBody";
import Consultant from "@/models/Consultant";
import TeamMember from "@/models/TeamMember";
import Testimonial from "@/models/Testimonial";
import Resource from "@/models/Resource";
import SiteContent from "@/models/SiteContent";

/**
 * Global owner search.
 *
 * One request across every entity the dashboard manages, so the palette does
 * not fire eight of them and reassemble the answers in the browser.
 *
 * Owner-only, and deliberately so: this is the one endpoint that reads
 * registrations — real people's contact details — alongside everything else.
 * It reuses `requireOwner` rather than inventing a permission model.
 */
export const dynamic = "force-dynamic";

/** How much each group returns. Enough to be useful, few enough to scan. */
const PER_GROUP = 5;

/**
 * The groups, in the order the palette shows them.
 *
 * Courses first because that is what an owner is usually looking for;
 * registrations second because that is the other thing they arrive needing.
 */
const GROUPS = [
  {
    key: "courses",
    label: "Courses",
    Model: TrainingCourse,
    fields: ["name", "code", "shortDescription"],
    select: "name code slug status featuredImage",
    href: (d) => `/owner/training/courses/${d._id}`,
    title: (d) => d.name,
    meta: (d) => [d.code, d.status].filter(Boolean).join(" · "),
  },
  {
    key: "registrations",
    label: "Registrations",
    Model: Registration,
    fields: ["reference", "fullName", "email", "phone", "company", "courseNameSnapshot"],
    select: "reference fullName email status courseNameSnapshot createdAt",
    href: (d) => `/owner/registrations/${d._id}`,
    title: (d) => d.fullName || d.email || d.reference,
    meta: (d) => [d.reference, d.courseNameSnapshot, d.status].filter(Boolean).join(" · "),
  },
  {
    key: "sessions",
    label: "Course references",
    Model: CourseReferenceSession,
    fields: ["referenceName", "referenceCode", "location"],
    select: "referenceName referenceCode startDate status course",
    populate: { path: "course", select: "name" },
    href: (d) => `/owner/training/sessions/${d._id}`,
    title: (d) => d.referenceName || d.referenceCode || d.course?.name || "Session",
    meta: (d) => [d.course?.name, d.status].filter(Boolean).join(" · "),
  },
  {
    key: "awarding-bodies",
    label: "Awarding bodies",
    Model: AwardingBody,
    fields: ["name", "shortName"],
    select: "name slug status logo",
    href: (d) => `/owner/training/awarding-bodies/${d._id}`,
    title: (d) => d.name,
    meta: (d) => d.status,
  },
  {
    key: "consultants",
    label: "Consultants",
    Model: Consultant,
    fields: ["name", "position", "expertise"],
    select: "name position status profileImage",
    href: (d) => `/owner/training/consultants/${d._id}`,
    title: (d) => d.name,
    meta: (d) => [d.position, d.status].filter(Boolean).join(" · "),
  },
  {
    key: "team",
    label: "Team",
    Model: TeamMember,
    fields: ["name", "position"],
    select: "name position status profileImage",
    href: (d) => `/owner/training/team/${d._id}`,
    title: (d) => d.name,
    meta: (d) => [d.position, d.status].filter(Boolean).join(" · "),
  },
  {
    key: "testimonials",
    label: "Testimonials",
    Model: Testimonial,
    fields: ["name", "company", "reviewText"],
    select: "name company status profileImage",
    href: (d) => `/owner/training/testimonials/${d._id}`,
    title: (d) => d.name,
    meta: (d) => [d.company, d.status].filter(Boolean).join(" · "),
  },
  {
    key: "pages",
    label: "Pages",
    Model: SiteContent,
    fields: ["title", "key", "navLabel"],
    select: "key title enabled isCustom route",
    href: (d) => `/owner/cms/${d.key}`,
    title: (d) => d.title || d.key,
    meta: (d) =>
      [d.route || `/${d.key}`, d.enabled ? "enabled" : "built-in content"].join(" · "),
  },
  {
    key: "resources",
    label: "Resources",
    Model: Resource,
    fields: ["title", "shortDescription"],
    select: "title slug type status featuredImage",
    href: (d) => `/owner/training/resources/${d._id}`,
    title: (d) => d.title,
    meta: (d) => [d.type, d.status].filter(Boolean).join(" · "),
  },
];

export async function GET(request) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;

    const rl = await checkRateLimit(request, "publicSearch", { userId: user._id.toString() });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const term = (new URL(request.url).searchParams.get("q") || "").trim();
    // Two characters is the point where a search stops matching half the
    // database, and stops costing a query per keystroke for nothing.
    if (term.length < 2) return successResponse({ data: { groups: [], term } });

    await connectDB();
    const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const results = await Promise.all(
      GROUPS.map(async (group) => {
        try {
          let cursor = group.Model.find({ $or: group.fields.map((f) => ({ [f]: rx })) })
            .select(group.select)
            .limit(PER_GROUP);
          if (group.populate) cursor = cursor.populate(group.populate);
          const rows = await cursor.lean();

          return {
            key: group.key,
            label: group.label,
            items: plain(rows).map((row) => ({
              id: String(row._id),
              title: group.title(row) || "Untitled",
              meta: group.meta(row) || "",
              href: group.href(row),
            })),
          };
        } catch (err) {
          // One unreachable collection must not empty the whole palette.
          console.error(`global search (${group.key}) failed:`, err?.message);
          return { key: group.key, label: group.label, items: [] };
        }
      }),
    );

    return successResponse({
      data: { term, groups: results.filter((g) => g.items.length) },
    });
  } catch (error) {
    console.error("owner global search error:", error);
    return safeErrorResponse(error, 500);
  }
}
