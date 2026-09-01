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
import TrainingCourse from "@/models/TrainingCourse";
import CourseReferenceSession from "@/models/CourseReferenceSession";
import AwardingBody from "@/models/AwardingBody";
import CourseLevel from "@/models/CourseLevel";
import Testimonial from "@/models/Testimonial";
import TeamMember from "@/models/TeamMember";
import Consultant from "@/models/Consultant";
import Accreditation from "@/models/Accreditation";
import Resource from "@/models/Resource";
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

    const [tcItems, dcItems] = await Promise.all([
      TrainingCourse.find(query)
        .select(COURSE_CARD_FIELDS)
        .populate(LEVEL_POPULATE)
        .populate(BODY_POPULATE)
        .sort(sorts[sort] || sorts.recommended)
        .lean(),
      DefaultCourse.find(query)
        .select(COURSE_CARD_FIELDS)
        .populate(LEVEL_POPULATE)
        .populate(BODY_POPULATE)
        .sort(sorts[sort] || sorts.recommended)
        .lean(),
    ]);

    // Deduplicate combined results by slug or _id
    const combined = [];
    const seen = new Set();
    for (const c of [...tcItems, ...dcItems]) {
      const key = c.slug || String(c._id);
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(c);
      }
    }

    const total = combined.length;
    const startIndex = (safePage - 1) * safeLimit;
    const paginatedItems = combined.slice(startIndex, startIndex + safeLimit);

    return {
      items: plain(paginatedItems),
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
      TrainingCourse.distinct("category", { ...PUBLISHED, category: { $nin: ["", null] } }),
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
import DefaultCourse from "@/models/DefaultCourse";
import CourseReference from "@/models/CourseReference";

export async function getPublicCourseBySlug(slug) {
  if (!slug) return null;
  try {
    await connectDB();
    const cleanSlug = String(slug).toLowerCase();
    
    // Check TrainingCourse first
    let course = await TrainingCourse.findOne({ slug: cleanSlug, ...PUBLISHED })
      .populate({ path: "level", select: "name slug icon color description", options: { lean: true } })
      .populate({
        path: "awardingBody",
        select: "name slug logo coverImage description accreditationInfo website",
        options: { lean: true },
      })
      .lean();

    // Check DefaultCourse if not found
    if (!course) {
      course = await DefaultCourse.findOne({ slug: cleanSlug, ...PUBLISHED })
        .populate({ path: "level", select: "name slug icon color description", options: { lean: true } })
        .populate({
          path: "awardingBody",
          select: "name slug logo coverImage description accreditationInfo website",
          options: { lean: true },
        })
        .lean();
    }

    // Check by ID if slug is valid ObjectId
    if (!course && mongoose.Types.ObjectId.isValid(cleanSlug)) {
      course = await DefaultCourse.findOne({ _id: cleanSlug, ...PUBLISHED })
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
    let course = await TrainingCourse.findOne({ _id: id, ...PUBLISHED })
      .populate({ path: "level", select: "name slug icon color", options: { lean: true } })
      .populate({ path: "awardingBody", select: "name slug logo", options: { lean: true } })
      .lean();

    if (!course) {
      course = await DefaultCourse.findOne({ _id: id, ...PUBLISHED })
        .populate({ path: "level", select: "name slug icon color", options: { lean: true } })
        .populate({ path: "awardingBody", select: "name slug logo", options: { lean: true } })
        .lean();
    }

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
      const [tcRows, dcRows] = await Promise.all([
        TrainingCourse.find(query)
          .select(COURSE_CARD_FIELDS)
          .populate(LEVEL_POPULATE)
          .populate(BODY_POPULATE)
          .sort({ featured: -1, displayOrder: 1 })
          .limit(limit * 2)
          .lean(),
        DefaultCourse.find(query)
          .select(COURSE_CARD_FIELDS)
          .populate(LEVEL_POPULATE)
          .populate(BODY_POPULATE)
          .sort({ featured: -1, displayOrder: 1 })
          .limit(limit * 2)
          .lean(),
      ]);

      for (const row of [...tcRows, ...dcRows]) {
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
    const [tcRows, dcRows] = await Promise.all([
      TrainingCourse.find(PUBLISHED)
        .select(COURSE_CARD_FIELDS)
        .populate(LEVEL_POPULATE)
        .populate(BODY_POPULATE)
        .sort({ featured: -1, displayOrder: 1, createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 6, 1), 24))
        .lean(),
      DefaultCourse.find(PUBLISHED)
        .select(COURSE_CARD_FIELDS)
        .populate(LEVEL_POPULATE)
        .populate(BODY_POPULATE)
        .sort({ featured: -1, displayOrder: 1, createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 6, 1), 24))
        .lean(),
    ]);

    const combined = [];
    const seen = new Set();
    for (const r of [...tcRows, ...dcRows]) {
      const key = String(r._id);
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(r);
      }
    }
    return plain(combined.slice(0, limit));
  } catch (error) {
    console.error("getFeaturedCourses failed:", error?.message);
    return [];
  }
}

/* ----------------------------------------------------------------- sessions */

/**
 * Upcoming sessions for one course (reads CourseReferenceSession & CourseReference).
 */
export async function getCourseSessions(courseId, { includePast = false, limit = 12 } = {}) {
  if (!mongoose.Types.ObjectId.isValid(String(courseId || ""))) return [];
  try {
    await connectDB();
    const query = { course: courseId, ...PUBLIC_SESSION };
    const crQuery = {
      $or: [{ course: courseId }, { courseId: String(courseId) }],
      showInSchedule: { $ne: false },
      status: { $in: ["active", "open", "published", "scheduled"] },
    };

    if (!includePast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.$or = [{ startDate: { $gte: today } }, { startDate: null }];
      crQuery.startDate = { $gte: today };
    }

    const [sessionRows, refRows] = await Promise.all([
      CourseReferenceSession.find(query)
        .sort({ startDate: 1, displayOrder: 1 })
        .limit(Math.min(Math.max(Number(limit) || 12, 1), 60))
        .lean(),
      CourseReference.find(crQuery)
        .sort({ startDate: 1 })
        .limit(Math.min(Math.max(Number(limit) || 12, 1), 60))
        .lean(),
    ]);

    const formattedRefs = refRows.map((ref) => ({
      _id: ref._id.toString(),
      referenceName: ref.referenceName || ref.courseName || "Intake Session",
      referenceCode: ref.referenceCode || ref.referenceNumber,
      startDate: ref.startDate,
      endDate: ref.endDate,
      examDate: ref.examDate,
      registrationDeadline: ref.registrationDeadline,
      mode: ref.mode || "online",
      modeLabel: ref.modeLabel || "",
      location: ref.location || "Online",
      duration: ref.duration || "",
      seats: ref.seats || 20,
      status: ref.status === "active" ? "open" : ref.status,
      showInSchedule: true,
      course: ref.course || ref.courseId,
    }));

    const combined = [...sessionRows, ...formattedRefs].sort(
      (a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0)
    );

    return plain(combined.slice(0, limit));
  } catch (error) {
    console.error("getCourseSessions failed:", error?.message);
    return [];
  }
}

/**
 * The public schedule for one month.
 */
export async function getScheduleForMonth({ year, month, mode = "", awardingBody = "" } = {}) {
  try {
    await connectDB();
    const y = Number(year);
    const m = Number(month); // 1-12
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return [];

    const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const to = new Date(Date.UTC(y, m, 1, 0, 0, 0));

    const dateFilter = {
      $or: [
        { startDate: { $gte: from, $lt: to } },
        { endDate: { $gte: from, $lt: to } },
        { startDate: { $lt: from }, endDate: { $gte: to } },
      ],
    };

    const query = {
      ...SCHEDULED_SESSION,
      ...dateFilter,
    };
    if (mode) query.mode = mode;

    const crQuery = {
      showInSchedule: true,
      status: { $in: ["active", "open", "published", "scheduled"] },
      ...dateFilter,
    };
    if (mode) crQuery.mode = mode;

    const [rowsSessions, rowsRefs] = await Promise.all([
      CourseReferenceSession.find(query)
        .populate({
          path: "course",
          select: "name slug status duration featuredImage awardingBody level code",
          populate: [
            { path: "awardingBody", select: "name slug logo" },
            { path: "level", select: "name slug color" },
          ],
          options: { lean: true },
        })
        .sort({ startDate: 1, displayOrder: 1 })
        .lean(),
      CourseReference.find(crQuery)
        .populate({
          path: "course",
          select: "name slug status duration featuredImage awardingBody level code",
          populate: [
            { path: "awardingBody", select: "name slug logo" },
            { path: "level", select: "name slug color" },
          ],
          options: { lean: true },
        })
        .sort({ startDate: 1 })
        .lean(),
    ]);

    const formattedRefs = rowsRefs.map((r) => {
      let populatedCourse = r.course;
      if (!populatedCourse || typeof populatedCourse !== "object") {
        populatedCourse = {
          _id: r.courseId,
          name: r.courseName,
          slug: r.courseName ? r.courseName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "",
          status: "published",
        };
      }
      return {
        _id: r._id.toString(),
        referenceName: r.referenceName || r.courseName,
        referenceCode: r.referenceCode || r.referenceNumber,
        startDate: r.startDate,
        endDate: r.endDate,
        examDate: r.examDate,
        mode: r.mode || "online",
        modeLabel: r.modeLabel || "",
        location: r.location || "Online",
        duration: r.duration || "",
        status: r.status === "active" ? "open" : r.status,
        showInSchedule: true,
        course: populatedCourse,
      };
    });

    let combined = [...rowsSessions, ...formattedRefs].filter(
      (r) => r.course && (r.course.status === "published" || r.course.status === "active")
    );

    if (awardingBody) {
      combined = combined.filter((r) => String(r.course?.awardingBody?.slug || "") === awardingBody);
    }

    combined.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));

    return plain(combined);
  } catch (error) {
    console.error("getScheduleForMonth failed:", error?.message);
    return [];
  }
}

/**
 * The next scheduled sessions, across however many months it takes.
 *
 * One query over a date range rather than one per month: the "upcoming
 * sessions" strip looks ahead three months by default, and asking the database
 * three times — twelve, at the maximum setting — to build one short list is the
 * kind of loop that only shows up as a slow page under load.
 */
export async function getUpcomingSessions({ mode = "", months = 3, limit = 6 } = {}) {
  try {
    await connectDB();
    const span = Math.min(Math.max(Number(months) || 3, 1), 12);
    const take = Math.min(Math.max(Number(limit) || 6, 1), 24);

    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + span, 1));

    const query = {
      ...SCHEDULED_SESSION,
      startDate: { $gte: from, $lt: to },
    };
    if (mode) query.mode = mode;

    const rows = await CourseReferenceSession.find(query)
      .populate({
        path: "course",
        select: "name slug status duration featuredImage awardingBody level code",
        populate: [
          { path: "awardingBody", select: "name slug logo" },
          { path: "level", select: "name slug color" },
        ],
        options: { lean: true },
      })
      .sort({ startDate: 1, displayOrder: 1 })
      // Over-fetch a little, because sessions whose course was unpublished are
      // dropped below and would otherwise leave the strip short.
      .limit(take * 3)
      .lean();

    return plain(rows.filter((r) => r.course && r.course.status === "published").slice(0, take));
  } catch (error) {
    console.error("getUpcomingSessions failed:", error?.message);
    return [];
  }
}

/** Months (as `YYYY-MM`) that have at least one scheduled session. */
export async function getScheduleMonths() {
  try {
    await connectDB();
    const rows = await CourseReferenceSession.find({
      ...SCHEDULED_SESSION,
      startDate: { $ne: null },
    })
      .select("startDate")
      .lean();
    const set = new Set();
    for (const r of rows) {
      const d = new Date(r.startDate);
      set.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    }
    return [...set].sort();
  } catch (error) {
    console.error("getScheduleMonths failed:", error?.message);
    return [];
  }
}

/** One session by id, with its course — used by the registration page. */
export async function getPublicSessionById(id) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) return null;
  try {
    await connectDB();
    const session = await CourseReferenceSession.findOne({ _id: id, ...PUBLIC_SESSION })
      .populate({
        path: "course",
        select: "name slug status duration awardingBody",
        populate: { path: "awardingBody", select: "name slug logo" },
        options: { lean: true },
      })
      .lean();
    if (!session || session.course?.status !== "published") return null;
    return plain(session);
  } catch (error) {
    console.error("getPublicSessionById failed:", error?.message);
    return null;
  }
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
    const rows = await TrainingCourse.find({ ...PUBLISHED, awardingBody: bodyId })
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

export async function listTestimonials(limit = 24) {
  return listPublished(
    Testimonial,
    "name profileImage reviewText rating company position reviewDate sourceLogo sourceName verifiedLabel featured displayOrder",
    { featured: -1, displayOrder: 1, createdAt: -1 },
    limit,
  );
}

export async function listTeamMembers(limit = 60) {
  return listPublished(
    TeamMember,
    "name slug position profileImage bio qualifications certifications experience socialLinks leadership displayOrder",
    { leadership: -1, displayOrder: 1, name: 1 },
    limit,
  );
}

export async function listConsultants(limit = 60) {
  return listPublished(
    Consultant,
    "name slug position profileImage gallery bio qualifications certifications experience expertise socialLinks layout showCarousel textAlign animation featured displayOrder",
    { featured: -1, displayOrder: 1, name: 1 },
    limit,
  );
}

export async function getConsultantBySlug(slug) {
  if (!slug) return null;
  try {
    await connectDB();
    const doc = await Consultant.findOne({ slug: String(slug).toLowerCase(), ...PUBLISHED }).lean();
    return doc ? plain(doc) : null;
  } catch (error) {
    console.error("getConsultantBySlug failed:", error?.message);
    return null;
  }
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

const RESOURCE_CARD_FIELDS =
  "title slug shortDescription featuredImage type file fileLabel externalUrl publishedDate featured displayOrder";

/** Paginated public resource library, filtered by type and free-text search. */
export async function listPublicResources({ search = "", type = "", page = 1, limit = 12 } = {}) {
  try {
    await connectDB();
    const query = { ...PUBLISHED };
    if (type) query.type = type;
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [{ title: rx }, { shortDescription: rx }];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 48);
    const safePage = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
      Resource.find(query)
        .select(RESOURCE_CARD_FIELDS)
        .sort({ featured: -1, displayOrder: 1, publishedDate: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Resource.countDocuments(query),
    ]);

    return {
      items: plain(items),
      total,
      page: safePage,
      pages: Math.max(Math.ceil(total / safeLimit), 1),
    };
  } catch (error) {
    console.error("listPublicResources failed:", error?.message);
    return EMPTY_LIST;
  }
}

/**
 * The types that actually have something published behind them.
 *
 * A filter chip that always returns nothing is worse than no chip: it reads as
 * a broken filter rather than an empty category.
 */
export async function getResourceTypes() {
  try {
    await connectDB();
    const rows = await Resource.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return rows.filter((r) => r._id).map((r) => ({ value: r._id, count: r.count }));
  } catch (error) {
    console.error("getResourceTypes failed:", error?.message);
    return [];
  }
}

export async function getResourceBySlug(slug) {
  if (!slug) return null;
  try {
    await connectDB();
    const doc = await Resource.findOne({ slug: String(slug).toLowerCase(), ...PUBLISHED }).lean();
    return doc ? plain(doc) : null;
  } catch (error) {
    console.error("getResourceBySlug failed:", error?.message);
    return null;
  }
}

/** Other resources to show beneath one: same type first, then anything else. */
export async function getRelatedResources(resource, limit = 3) {
  if (!resource) return [];
  try {
    await connectDB();
    const base = { ...PUBLISHED, _id: { $ne: resource._id } };
    const seen = new Set();
    const out = [];
    for (const query of [{ ...base, type: resource.type }, base]) {
      if (out.length >= limit) break;
      const rows = await Resource.find(query)
        .select(RESOURCE_CARD_FIELDS)
        .sort({ featured: -1, publishedDate: -1 })
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
    console.error("getRelatedResources failed:", error?.message);
    return [];
  }
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
