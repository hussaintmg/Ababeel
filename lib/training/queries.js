import { readPublicSessions } from "./publicSessions";
/**
 * Public read layer for the training platform.
 *
 * Everything the public site reads about courses, sessions, awarding bodies and
 * people goes through here, and every function applies the publication rules
 * itself. A page component cannot accidentally render a draft course, because
 * it never gets to write the query.
 *
 * Results are plain objects (`.lean()`) with ids stringified, so they cross the
 * server/client boundary without a serialisation warning.
 *
 * Server-only.
 */
import connectDB from "@/utils/db";
import mongoose from "mongoose";
import Course from "@/models/Course";
import CourseReference from "@/models/CourseReference";
import AwardingBody from "@/models/AwardingBody";
import CourseLevel from "@/models/CourseLevel";
import Accreditation from "@/models/Accreditation";
import { PUBLISHED, SCHEDULED_SESSION, PUBLIC_SESSION } from "@/lib/training/status";

/** Recursively turn ObjectIds and Dates into strings for the client. */
export function plain(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(plain);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === "object") {
    // Buffers and other exotic values would be mangled by a blind walk.
    if (Buffer.isBuffer(value)) return value.toString("base64");
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = plain(v);
    return out;
  }
  return value;
}

const COURSE_CARD_FIELDS =
  "name code slug shortDescription featuredImage duration durationDays level awardingBody category featured displayOrder status";

const LEVEL_POPULATE = { path: "level", select: "name slug icon color status", options: { lean: true } };
const BODY_POPULATE = { path: "awardingBody", select: "name slug logo status", options: { lean: true } };

/** A safe empty result, so a database outage degrades instead of 500s. */
const EMPTY_LIST = { items: [], total: 0, page: 1, pages: 1 };

/* ------------------------------------------------------------------ courses */

/**
 * Paginated public course list with search and filters.
 *
 * `search` is matched with an escaped regex rather than `$text` so a partial
 * word ("safe") matches "Safety" — a text index only matches whole terms, which
 * reads as broken in a live-filtering UI.
 */
export async function listPublicCourses({
  search = "",
  level = "",
  awardingBody = "",
  category = "",
  duration = "",
  sort = "recommended",
  page = 1,
  limit = 12,
} = {}) {
  try {
    await connectDB();
    const query = { ...PUBLISHED };

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: rx }, { shortDescription: rx }, { code: rx }, { category: rx }];
    }
    if (level) {
      const id = await resolveId(CourseLevel, level);
      query.level = id || null;
    }
    if (awardingBody) {
      const id = await resolveId(AwardingBody, awardingBody);
      query.awardingBody = id || null;
    }
    if (category) query.category = category;

    // Duration buckets, in days, matching the filter chips on /courses.
    if (duration === "short") query.durationDays = { $gt: 0, $lte: 2 };
    else if (duration === "medium") query.durationDays = { $gte: 3, $lte: 5 };
    else if (duration === "long") query.durationDays = { $gte: 6 };

    const sorts = {
      recommended: { featured: -1, displayOrder: 1, name: 1 },
      newest: { createdAt: -1 },
      name: { name: 1 },
      "name-desc": { name: -1 },
      duration: { durationDays: 1, name: 1 },
    };

    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 48);
    const safePage = Math.max(Number(page) || 1, 1);

    const total = await Course.countDocuments(query);
    const startIndex = (safePage - 1) * safeLimit;
    const items = await Course.find(query)
      .select(COURSE_CARD_FIELDS)
      .populate(LEVEL_POPULATE)
      .populate(BODY_POPULATE)
      .sort(sorts[sort] || sorts.recommended)
      .skip(startIndex)
      .limit(safeLimit)
      .lean();

    return {
      items: plain(items),
      total,
      page: safePage,
      pages: Math.max(Math.ceil(total / safeLimit), 1),
    };
  } catch (error) {
    console.error("listPublicCourses failed:", error?.message);
    return EMPTY_LIST;
  }
}

/** Everything the /courses filter sidebar needs, in one round trip. */
export async function getCourseFilterOptions() {
  try {
    await connectDB();
    const [levels, bodies, categories] = await Promise.all([
      CourseLevel.find(PUBLISHED).select("name slug icon color displayOrder").sort({ displayOrder: 1, name: 1 }).lean(),
      AwardingBody.find(PUBLISHED).select("name slug logo displayOrder").sort({ displayOrder: 1, name: 1 }).lean(),
      Course.distinct("category", { ...PUBLISHED, category: { $nin: ["", null] } }),
    ]);
    return {
      levels: plain(levels),
      awardingBodies: plain(bodies),
      categories: (categories || []).filter(Boolean).sort(),
    };
  } catch (error) {
    console.error("getCourseFilterOptions failed:", error?.message);
    return { levels: [], awardingBodies: [], categories: [] };
  }
}

/** A single published course by slug, fully populated. Null when not public. */
export async function getPublicCourseBySlug(slug) {
  if (!slug) return null;
  try {
    await connectDB();
    const cleanSlug = String(slug).toLowerCase();
    
    let course = await Course.findOne({ slug: cleanSlug, ...PUBLISHED })
      .populate({ path: "level", select: "name slug icon color description", options: { lean: true } })
      .populate({
        path: "awardingBody",
        select: "name slug logo coverImage description accreditationInfo website",
        options: { lean: true },
      })
      .lean();

    // Check by ID if slug is valid ObjectId
    if (!course && mongoose.Types.ObjectId.isValid(cleanSlug)) {
      course = await Course.findOne({ _id: cleanSlug, ...PUBLISHED })
        .populate({ path: "level", select: "name slug icon color description", options: { lean: true } })
        .populate({
          path: "awardingBody",
          select: "name slug logo coverImage description accreditationInfo website",
          options: { lean: true },
        })
        .lean();
    }

    return course ? plain(course) : null;
  } catch (error) {
    console.error("getPublicCourseBySlug failed:", error?.message);
    return null;
  }
}

/** A published course by id — used by the registration page's query string. */
export async function getPublicCourseById(id) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) return null;
  try {
    await connectDB();
    const course = await Course.findOne({ _id: id, ...PUBLISHED })
      .populate({ path: "level", select: "name slug icon color", options: { lean: true } })
      .populate({ path: "awardingBody", select: "name slug logo", options: { lean: true } })
      .lean();

    return course ? plain(course) : null;
  } catch (error) {
    console.error("getPublicCourseById failed:", error?.message);
    return null;
  }
}

/**
 * Courses to show alongside another one: same awarding body first, then the
 * same level, then anything published — so the section is never empty on a
 * small catalogue.
 */
export async function getRelatedCourses(course, limit = 3) {
  if (!course) return [];
  try {
    await connectDB();
    const exclude = { _id: { $ne: course._id } };
    const base = { ...PUBLISHED, ...exclude };
    const seen = new Set();
    const out = [];

    const tiers = [];
    if (course.awardingBody) {
      tiers.push({ ...base, awardingBody: idOf(course.awardingBody) });
    }
    if (course.level) tiers.push({ ...base, level: idOf(course.level) });
    tiers.push(base);

    for (const query of tiers) {
      if (out.length >= limit) break;
      const rows = await Course.find(query)
        .select(COURSE_CARD_FIELDS)
        .populate(LEVEL_POPULATE)
        .populate(BODY_POPULATE)
        .sort({ featured: -1, displayOrder: 1 })
        .limit(limit * 2)
        .lean();

      for (const row of rows) {
        const key = String(row._id);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
        if (out.length >= limit) break;
      }
    }
    return plain(out);
  } catch (error) {
    console.error("getRelatedCourses failed:", error?.message);
    return [];
  }
}

/** Featured courses for the home page. Falls back to the newest published. */
export async function getFeaturedCourses(limit = 6) {
  try {
    await connectDB();
    const rows = await Course.find(PUBLISHED)
      .select(COURSE_CARD_FIELDS)
      .populate(LEVEL_POPULATE)
      .populate(BODY_POPULATE)
      .sort({ featured: -1, displayOrder: 1, createdAt: -1 })
      .limit(Math.min(Math.max(Number(limit) || 6, 1), 24))
      .lean();

    return plain(rows.slice(0, limit));
  } catch (error) {
    console.error("getFeaturedCourses failed:", error?.message);
    return [];
  }
}

/* ----------------------------------------------------------------- sessions */

/**
 * Upcoming sessions for one course (reads CourseReferenceSession & CourseReference).
 */
export async function getCourseSessions(courseId, {includePast=false,limit=12}={}) {
 if(!mongoose.isValidObjectId(String(courseId||''))) return [];
 const today=new Date(); today.setUTCHours(0,0,0,0);
 return readPublicSessions({courseId,from:includePast?null:today,limit:Math.min(60,Math.max(1,Number(limit)||12))});
}
export async function getScheduleForMonth({year,month,mode='',awardingBody=''}={}) {
 const y=Number(year),m=Number(month);
 if(!Number.isInteger(y)||!Number.isInteger(m)||m<1||m>12) return [];
 const rows=await readPublicSessions({from:new Date(Date.UTC(y,m-1,1)),to:new Date(Date.UTC(y,m,1)),overlap:true,mode});
 return awardingBody?rows.filter(row=>row.course?.awardingBody?.slug===awardingBody):rows;
}
export async function getUpcomingSessions({mode='',months=3,limit=6,courseId=''}={}) {
 const now=new Date();
 const from=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
 const span=Math.min(12,Math.max(1,Number(months)||3));
 const to=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+span,now.getUTCDate()));
 return readPublicSessions({from,to,mode,limit:Math.min(200,Math.max(1,Number(limit)||6)),courseId});
}
export async function getScheduleMonths() {
 const rows=await readPublicSessions();
 return [...new Set(rows.filter(row=>row.startDate).map(row=>String(row.startDate).slice(0,7)))].sort();
}
export async function getPublicSessionById(id) {
 if(!mongoose.isValidObjectId(String(id||''))) return null;
 return (await readPublicSessions({id}))[0]||null;
}

/* ------------------------------------------------------- bodies and people */

export async function listAwardingBodies() {
  return listPublished(AwardingBody, "name slug shortName logo coverImage description website displayOrder");
}

export async function getAwardingBodyBySlug(slug) {
  if (!slug) return null;
  try {
    await connectDB();
    const doc = await AwardingBody.findOne({ slug: String(slug).toLowerCase(), ...PUBLISHED }).lean();
    return doc ? plain(doc) : null;
  } catch (error) {
    console.error("getAwardingBodyBySlug failed:", error?.message);
    return null;
  }
}

/** Published courses awarded by one body. */
export async function getCoursesForAwardingBody(bodyId, limit = 48) {
  if (!mongoose.Types.ObjectId.isValid(String(bodyId || ""))) return [];
  try {
    await connectDB();
    const rows = await Course.find({ ...PUBLISHED, awardingBody: bodyId })
      .select(COURSE_CARD_FIELDS)
      .populate(LEVEL_POPULATE)
      .populate(BODY_POPULATE)
      .sort({ featured: -1, displayOrder: 1, name: 1 })
      .limit(limit)
      .lean();
    return plain(rows);
  } catch (error) {
    console.error("getCoursesForAwardingBody failed:", error?.message);
    return [];
  }
}

export async function listTestimonials() {
  return [];
}

export async function listTeamMembers() {
  return [];
}

export async function listConsultants() {
  return [];
}

export async function getConsultantBySlug() {
  return null;
}

export async function listAccreditations({ trustStripOnly = false, limit = 60 } = {}) {
  try {
    await connectDB();
    const query = { ...PUBLISHED };
    if (trustStripOnly) query.showInTrustStrip = true;
    const rows = await Accreditation.find(query)
      .select("name slug logo image description details referenceNumber website displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .limit(limit)
      .lean();
    return plain(rows);
  } catch (error) {
    console.error("listAccreditations failed:", error?.message);
    return [];
  }
}

export async function listLevels() {
  return listPublished(CourseLevel, "name slug description icon image color displayOrder");
}

/* --------------------------------------------------------------- resources */

export async function listPublicResources() {
  return EMPTY_LIST;
}

export async function getResourceTypes() {
  return [];
}

export async function getResourceBySlug() {
  return null;
}

export async function getRelatedResources() {
  return [];
}

/* ------------------------------------------------------------------ helpers */

async function listPublished(Model, select, sort = { displayOrder: 1, name: 1 }, limit = 100) {
  try {
    await connectDB();
    const rows = await Model.find(PUBLISHED).select(select).sort(sort).limit(limit).lean();
    return plain(rows);
  } catch (error) {
    console.error(`listPublished(${Model?.modelName}) failed:`, error?.message);
    return [];
  }
}

/** Accept either an id or a slug in a filter value. */
async function resolveId(Model, value) {
  const v = String(value || "");
  if (mongoose.Types.ObjectId.isValid(v)) return v;
  const doc = await Model.findOne({ slug: v.toLowerCase() }).select("_id").lean();
  return doc?._id || null;
}

function idOf(refOrDoc) {
  if (!refOrDoc) return null;
  return refOrDoc._id ? refOrDoc._id : refOrDoc;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
