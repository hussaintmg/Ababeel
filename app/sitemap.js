import connectDB from "@/utils/db";
import TrainingCourse from "@/models/TrainingCourse";
import AwardingBody from "@/models/AwardingBody";
import SiteContent from "@/models/SiteContent";
import Resource from "@/models/Resource";

/**
 * The site's sitemap.
 *
 * Everything here is derived: the static routes, the published courses and
 * awarding bodies, and any custom CMS page the owner has published. Nothing is
 * listed by hand, so a course published this morning is in the sitemap this
 * afternoon without anyone remembering to add it.
 *
 * A database failure must not take the sitemap down — an empty section is a
 * temporary gap a crawler will re-read, whereas a 500 teaches it to stop
 * asking. So every query falls back to an empty list.
 */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/courses", priority: 0.9, changeFrequency: "daily" },
  { path: "/schedule", priority: 0.9, changeFrequency: "daily" },
  { path: "/awarding-bodies", priority: 0.7, changeFrequency: "monthly" },
  { path: "/resources", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about-us", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about/team", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about/consultants", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about/accreditations", priority: 0.6, changeFrequency: "monthly" },
  { path: "/qualification", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact-us", priority: 0.5, changeFrequency: "yearly" },
  { path: "/verify-certificate", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms-of-services", priority: 0.2, changeFrequency: "yearly" },
];

// /registration is deliberately absent: it is a form, it needs a course in its
// query string to mean anything, and an indexed one collects stray submissions
// with no course attached. The page sets noindex to match.

function baseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://ababeel.co.uk";
  return raw.replace(/\/+$/, "");
}

export default async function sitemap() {
  const base = baseUrl();
  const now = new Date();

  const [courses, bodies, resources, customPages, hidden] = await Promise.all([
    safe(async () => {
      await connectDB();
      return TrainingCourse.find({ status: "published" })
        .select("slug updatedAt seo.noIndex")
        .lean();
    }),
    safe(async () => {
      await connectDB();
      return AwardingBody.find({ status: "published" }).select("slug updatedAt seo.noIndex").lean();
    }),
    safe(async () => {
      await connectDB();
      return Resource.find({ status: "published" }).select("slug updatedAt seo.noIndex").lean();
    }),
    safe(async () => {
      await connectDB();
      return SiteContent.find({ isCustom: true, enabled: true, publicHidden: { $ne: true } })
        .select("key route updatedAt")
        .lean();
    }),
    safe(async () => {
      await connectDB();
      const docs = await SiteContent.find({ publicHidden: true }).select("key route").lean();
      return docs.map((d) => normalise(d.route || `/${d.key}`));
    }),
  ]);

  const hiddenSet = new Set(hidden);

  const entries = [];

  for (const route of STATIC_ROUTES) {
    // A page the owner has taken off the site must not be advertised in the
    // sitemap; it answers 404.
    if (hiddenSet.has(normalise(route.path))) continue;
    entries.push({
      url: `${base}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  for (const course of courses) {
    if (!course.slug || course.seo?.noIndex) continue;
    entries.push({
      url: `${base}/courses/${course.slug}`,
      lastModified: course.updatedAt || now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const body of bodies) {
    if (!body.slug || body.seo?.noIndex) continue;
    entries.push({
      url: `${base}/awarding-bodies/${body.slug}`,
      lastModified: body.updatedAt || now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const resource of resources) {
    if (!resource.slug || resource.seo?.noIndex) continue;
    entries.push({
      url: `${base}/resources/${resource.slug}`,
      lastModified: resource.updatedAt || now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const page of customPages) {
    const path = normalise(page.route || `/${page.key}`);
    if (!path || path === "/" || hiddenSet.has(path)) continue;
    entries.push({
      url: `${base}${path}`,
      lastModified: page.updatedAt || now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}

async function safe(fn) {
  try {
    return (await fn()) || [];
  } catch (error) {
    console.error("sitemap section failed:", error?.message);
    return [];
  }
}

function normalise(path) {
  const p = String(path || "").split("?")[0].replace(/\/+$/, "");
  return p.startsWith("/") ? p : `/${p}`;
}
