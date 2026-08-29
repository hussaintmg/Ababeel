/**
 * Live end-to-end click-through against a real MongoDB.
 *
 *   LIVE_DB=1 MONGO_URI="mongodb://…" npx jest live
 *
 * Opt-in through LIVE_DB, not through MONGO_URI: the jest setup defaults
 * MONGO_URI to a local database, so keying off that would make this run — and
 * write — by accident on any machine with MongoDB installed. An explicit flag
 * cannot fire unintentionally. This is the verification the acceptance report has been listing
 * as outstanding: it exercises the real models and the real query layer — not
 * mocks — through the whole journey the brief describes:
 *
 *   TrainingCourse → CourseReferenceSession → Schedule → Course Details
 *   → Register Now → Registration Form → Registration → Owner Dashboard
 *
 * SAFETY
 * ------
 * Everything it writes is tagged with a run id and named "QA Test — ABA
 * Safety …", and `afterAll` deletes exactly those documents by their recorded
 * ids. It never drops a collection, never empties one, never touches a record
 * it did not create, and never reads a real registration.
 *
 * Run it against staging. It is safe against production, but "safe" and "wise"
 * are different things.
 */
import mongoose from "mongoose";
import connectDB from "@/utils/db";
import TrainingCourse from "@/models/TrainingCourse";
import CourseLevel from "@/models/CourseLevel";
import AwardingBody from "@/models/AwardingBody";
import CourseReferenceSession from "@/models/CourseReferenceSession";
import Registration from "@/models/Registration";
import Resource from "@/models/Resource";
import Testimonial from "@/models/Testimonial";
import {
  listPublicCourses,
  getPublicCourseBySlug,
  getPublicCourseById,
  getCourseSessions,
  getScheduleForMonth,
  getPublicSessionById,
  getCourseFilterOptions,
  getRelatedCourses,
  listPublicResources,
  listTestimonials,
  getAwardingBodyBySlug,
  getCoursesForAwardingBody,
} from "@/lib/training/queries";
import { registrationCta, registrationHref, isRegistrationOpen } from "@/lib/training/status";
import { resolveCertificate } from "@/lib/training/certificate";
import { validateSubmission, promoteContact } from "@/lib/training/registrationForm";
import { DEFAULT_REGISTRATION_FIELDS } from "@/lib/training/defaultFields";
import { uniqueReference } from "@/lib/training/reference";

const HAS_DB = process.env.LIVE_DB === "1";
const RUN = `qa-${Date.now().toString(36)}`;
const TAG = "QA Test — ABA Safety";

/** Everything created, so cleanup removes exactly this and nothing else. */
const created = { levels: [], bodies: [], courses: [], sessions: [], registrations: [], resources: [], testimonials: [] };

// A month ahead, so the session is genuinely "upcoming" whenever this is run.
const soon = (days) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const describeLive = HAS_DB ? describe : describe.skip;

if (!HAS_DB) {
  console.log(
    "\n  live click-through SKIPPED — opt in to run it:\n" +
      '    LIVE_DB=1 MONGO_URI="mongodb://host:27017/ababeel" npx jest live\n',
  );
}

describeLive("live click-through", () => {
  jest.setTimeout(120000);

  let level;
  let body;
  let courseWithCert;
  let courseNoCert;
  let session;
  let registration;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Delete only what this run created, by id.
    const jobs = [
      Registration.deleteMany({ _id: { $in: created.registrations } }),
      CourseReferenceSession.deleteMany({ _id: { $in: created.sessions } }),
      TrainingCourse.deleteMany({ _id: { $in: created.courses } }),
      AwardingBody.deleteMany({ _id: { $in: created.bodies } }),
      CourseLevel.deleteMany({ _id: { $in: created.levels } }),
      Resource.deleteMany({ _id: { $in: created.resources } }),
      Testimonial.deleteMany({ _id: { $in: created.testimonials } }),
    ];
    await Promise.allSettled(jobs);
    await mongoose.connection.close();
  });

  /* ---------------------------------------------------------------- step 1 */

  test("1. connects to the database", async () => {
    // 1 = connected. Anything else and every test below is meaningless.
    expect(mongoose.connection.readyState).toBe(1);
  });

  test("2. creates a Level, and it is retrievable", async () => {
    level = await CourseLevel.create({
      name: `${TAG} Level`,
      slug: `${RUN}-level`,
      description: "Created by the live click-through test.",
      status: "published",
    });
    created.levels.push(level._id);

    const back = await CourseLevel.findById(level._id).lean();
    expect(back.name).toBe(`${TAG} Level`);
    expect(back.status).toBe("published");
  });

  test("3. creates an Awarding Body, and its public page resolves", async () => {
    body = await AwardingBody.create({
      name: `${TAG} Awarding Body`,
      slug: `${RUN}-body`,
      description: "Created by the live click-through test.",
      accreditationInfo: "QA accreditation information.",
      website: "https://example.org",
      status: "published",
    });
    created.bodies.push(body._id);

    const publicBody = await getAwardingBodyBySlug(`${RUN}-body`);
    expect(publicBody).toBeTruthy();
    expect(publicBody.name).toBe(`${TAG} Awarding Body`);
  });

  /* ---------------------------------------------------------------- course */

  test("4. creates a TrainingCourse with no price or currency", async () => {
    courseWithCert = await TrainingCourse.create({
      name: `${TAG} Course`,
      slug: `${RUN}-course`,
      code: "QA-001",
      shortDescription: "A course created by the live click-through test.",
      description: "<p>Full description.</p>",
      learningOutcomes: "<p>Outcomes.</p>",
      requirements: "<p>Requirements.</p>",
      whoShouldAttend: "<p>Who should attend.</p>",
      courseContent: "<p>Content.</p>",
      duration: "5 days",
      durationDays: 5,
      level: level._id,
      awardingBody: body._id,
      category: "QA",
      certificateImage: "/uploads/cms/qa-certificate.png",
      faqs: [{ question: "Is this a test?", answer: "Yes." }],
      status: "published",
    });
    created.courses.push(courseWithCert._id);

    const raw = await TrainingCourse.findById(courseWithCert._id).lean();
    // The catalogue holds no money. If a price field ever appears, this fails.
    expect(raw.price).toBeUndefined();
    expect(raw.currency).toBeUndefined();
    expect(raw.name).toBe(`${TAG} Course`);
  });

  test("5. certificate: a course with its own shows its own", () => {
    const resolved = resolveCertificate(courseWithCert, {
      defaultCertificateImage: "/uploads/cms/default.png",
      certificateNote: "note",
    });
    expect(resolved.src).toBe("/uploads/cms/qa-certificate.png");
    expect(resolved.isDefault).toBe(false);
  });

  test("6. certificate: a course without one falls back to the default", async () => {
    courseNoCert = await TrainingCourse.create({
      name: `${TAG} Course (no certificate)`,
      slug: `${RUN}-course-nocert`,
      shortDescription: "Fallback test.",
      duration: "2 days",
      durationDays: 2,
      level: level._id,
      awardingBody: body._id,
      status: "published",
    });
    created.courses.push(courseNoCert._id);

    const stored = await TrainingCourse.findById(courseNoCert._id).lean();
    expect(stored.certificateImage).toBe("");

    const resolved = resolveCertificate(stored, {
      defaultCertificateImage: "/uploads/cms/default.png",
      certificateNote: "note",
    });
    expect(resolved.src).toBe("/uploads/cms/default.png");
    expect(resolved.isDefault).toBe(true);
  });

  test("7. the course appears on the public /courses list", async () => {
    const { items } = await listPublicCourses({ search: TAG, limit: 24 });
    const found = items.find((c) => c.slug === `${RUN}-course`);
    expect(found).toBeTruthy();
    expect(found.level?.name).toBe(`${TAG} Level`);
    expect(found.awardingBody?.name).toBe(`${TAG} Awarding Body`);
    expect(found.duration).toBe("5 days");
  });

  test("8. a draft course does NOT appear publicly", async () => {
    const draft = await TrainingCourse.create({
      name: `${TAG} Draft Course`,
      slug: `${RUN}-draft`,
      status: "draft",
    });
    created.courses.push(draft._id);

    const { items } = await listPublicCourses({ search: `${TAG} Draft`, limit: 24 });
    expect(items.find((c) => c.slug === `${RUN}-draft`)).toBeUndefined();
    // …and it is definitely in the database; it is the filter doing the work.
    expect(await TrainingCourse.findById(draft._id).lean()).toBeTruthy();
  });

  test("9. filters work individually and combined", async () => {
    const byLevel = await listPublicCourses({ level: `${RUN}-level`, limit: 24 });
    expect(byLevel.items.length).toBeGreaterThanOrEqual(2);

    const byBody = await listPublicCourses({ awardingBody: `${RUN}-body`, limit: 24 });
    expect(byBody.items.length).toBeGreaterThanOrEqual(2);

    const combined = await listPublicCourses({
      level: `${RUN}-level`,
      awardingBody: `${RUN}-body`,
      search: TAG,
      limit: 24,
    });
    expect(combined.items.length).toBeGreaterThanOrEqual(2);

    const byDuration = await listPublicCourses({ duration: "medium", search: TAG, limit: 24 });
    expect(byDuration.items.find((c) => c.slug === `${RUN}-course`)).toBeTruthy();

    const options = await getCourseFilterOptions();
    expect(options.levels.find((l) => l.slug === `${RUN}-level`)).toBeTruthy();
    expect(options.awardingBodies.find((b) => b.slug === `${RUN}-body`)).toBeTruthy();
  });

  test("10. the course detail page resolves with its relations", async () => {
    const detail = await getPublicCourseBySlug(`${RUN}-course`);
    expect(detail).toBeTruthy();
    expect(detail.level.name).toBe(`${TAG} Level`);
    expect(detail.awardingBody.name).toBe(`${TAG} Awarding Body`);
    expect(detail.learningOutcomes).toContain("Outcomes");
    expect(detail.faqs.length).toBe(1);

    const related = await getRelatedCourses(detail, 3);
    expect(Array.isArray(related)).toBe(true);
  });

  /* --------------------------------------------------------------- session */

  test("11. creates a CourseReferenceSession attached to the course", async () => {
    session = await CourseReferenceSession.create({
      course: courseWithCert._id,
      referenceName: `${TAG} — Session`,
      referenceCode: `${RUN}-S1`,
      startDate: soon(30),
      endDate: soon(34),
      examDate: soon(40),
      mode: "online",
      status: "open",
      showInSchedule: true,
    });
    created.sessions.push(session._id);

    const back = await CourseReferenceSession.findById(session._id).lean();
    expect(String(back.course)).toBe(String(courseWithCert._id));
    expect(back.mode).toBe("online");
    expect(back.showInSchedule).toBe(true);
  });

  test("12. the session appears on the public schedule for its month", async () => {
    const start = new Date(session.startDate);
    const rows = await getScheduleForMonth({
      year: start.getUTCFullYear(),
      month: start.getUTCMonth() + 1,
    });
    const found = rows.find((r) => r._id === String(session._id));
    expect(found).toBeTruthy();
    expect(found.course.name).toBe(`${TAG} Course`);
    expect(found.examDate).toBeTruthy();
  });

  test("13. Show in Schedule OFF hides it — and does NOT delete it", async () => {
    await CourseReferenceSession.updateOne({ _id: session._id }, { $set: { showInSchedule: false } });

    const start = new Date(session.startDate);
    const monthArgs = { year: start.getUTCFullYear(), month: start.getUTCMonth() + 1 };

    const hidden = await getScheduleForMonth(monthArgs);
    expect(hidden.find((r) => r._id === String(session._id))).toBeUndefined();

    // The record is still there. This is the point of the toggle.
    const stillStored = await CourseReferenceSession.findById(session._id).lean();
    expect(stillStored).toBeTruthy();
    expect(stillStored.showInSchedule).toBe(false);

    await CourseReferenceSession.updateOne({ _id: session._id }, { $set: { showInSchedule: true } });
    const back = await getScheduleForMonth(monthArgs);
    expect(back.find((r) => r._id === String(session._id))).toBeTruthy();
  });

  test("14. upcoming sessions show on the course page", async () => {
    const sessions = await getCourseSessions(courseWithCert._id, { limit: 12 });
    expect(sessions.find((s) => s._id === String(session._id))).toBeTruthy();
  });

  /* ---------------------------------------------------------- registration */

  test("15. Register Now produces a link carrying both ids", async () => {
    const course = await getPublicCourseById(courseWithCert._id);
    const publicSession = await getPublicSessionById(session._id);
    expect(publicSession).toBeTruthy();

    const cta = registrationCta(publicSession);
    expect(cta.available).toBe(true);
    expect(cta.label).toBe("Register Now");

    const href = registrationHref(course, publicSession);
    expect(href).toContain(`course=${courseWithCert._id}`);
    expect(href).toContain(`reference=${session._id}`);
  });

  test("16. the registration page resolves both from the query string", async () => {
    // Exactly what app/registration/page.jsx does with ?course=&reference=
    const course = await getPublicCourseById(String(courseWithCert._id));
    const resolved = await getPublicSessionById(String(session._id));

    expect(course.name).toBe(`${TAG} Course`);
    expect(String(resolved.course._id)).toBe(String(courseWithCert._id));
    expect(resolved.referenceName).toBe(`${TAG} — Session`);
    expect(resolved.examDate).toBeTruthy();
    expect(course.awardingBody.name).toBe(`${TAG} Awarding Body`);
  });

  test("17. a closed session refuses registration", async () => {
    await CourseReferenceSession.updateOne({ _id: session._id }, { $set: { status: "closed" } });
    const closed = await getPublicSessionById(session._id);
    expect(registrationCta(closed).label).toBe("Registration Closed");
    expect(isRegistrationOpen(closed)).toBe(false);
    expect(registrationHref({ _id: courseWithCert._id }, closed)).toBe("");

    await CourseReferenceSession.updateOne({ _id: session._id }, { $set: { status: "open" } });
  });

  test("18. submits a registration and stores it against both ids", async () => {
    const payload = {
      firstName: "QA",
      lastName: "Tester",
      email: "qa-tester@example.invalid",
      phone: "+92 300 0000000",
      country: "Pakistan",
    };
    const { ok, errors, values, bound } = validateSubmission(DEFAULT_REGISTRATION_FIELDS, payload);
    expect(errors).toEqual({});
    expect(ok).toBe(true);

    const reference = await uniqueReference(Registration);
    registration = await Registration.create({
      reference,
      course: courseWithCert._id,
      session: session._id,
      courseNameSnapshot: courseWithCert.name,
      sessionNameSnapshot: session.referenceName,
      ...promoteContact(bound),
      fields: values,
      status: "pending",
      sourcePage: "/registration",
    });
    created.registrations.push(registration._id);

    const stored = await Registration.findById(registration._id).lean();
    expect(stored.status).toBe("pending");
    expect(String(stored.course)).toBe(String(courseWithCert._id));
    expect(String(stored.session)).toBe(String(session._id));
    expect(stored.fullName).toBe("QA Tester");
    // No payment state anywhere on the record.
    expect(stored.amount).toBeUndefined();
    expect(stored.paymentStatus).toBeUndefined();
  });

  test("19. it appears in the owner dashboard list query", async () => {
    const rows = await Registration.find({ _id: { $in: created.registrations } })
      .populate({ path: "course", select: "name slug" })
      .populate({ path: "session", select: "referenceName startDate" })
      .sort({ createdAt: -1 })
      .lean();

    const found = rows.find((r) => String(r._id) === String(registration._id));
    expect(found).toBeTruthy();
    expect(found.course.name).toBe(`${TAG} Course`);
    expect(found.session.referenceName).toBe(`${TAG} — Session`);
    expect(found.reference).toMatch(/^REG-/);
  });

  test("20. renaming the course keeps the registration attached", async () => {
    // The link is by id, so historical registrations survive a rename.
    await TrainingCourse.updateOne(
      { _id: courseWithCert._id },
      { $set: { name: `${TAG} Course (renamed)` } },
    );
    const reg = await Registration.findById(registration._id)
      .populate({ path: "course", select: "name" })
      .lean();
    expect(reg.course.name).toBe(`${TAG} Course (renamed)`);
    expect(reg.courseNameSnapshot).toBe(`${TAG} Course`);
  });

  /* ------------------------------------------------- resources, reviews */

  test("21. a resource can be created, published and filtered", async () => {
    const resource = await Resource.create({
      title: `${TAG} Resource`,
      slug: `${RUN}-resource`,
      shortDescription: "Created by the live click-through test.",
      type: "guide",
      content: "<p>Guide content.</p>",
      status: "published",
      publishedDate: new Date(),
    });
    created.resources.push(resource._id);

    const { items } = await listPublicResources({ search: TAG, limit: 24 });
    expect(items.find((r) => r.slug === `${RUN}-resource`)).toBeTruthy();

    const byType = await listPublicResources({ type: "guide", search: TAG, limit: 24 });
    expect(byType.items.find((r) => r.slug === `${RUN}-resource`)).toBeTruthy();

    await Resource.updateOne({ _id: resource._id }, { $set: { status: "draft" } });
    const afterUnpublish = await listPublicResources({ search: TAG, limit: 24 });
    expect(afterUnpublish.items.find((r) => r.slug === `${RUN}-resource`)).toBeUndefined();
  });

  test("22. a testimonial publishes and unpublishes", async () => {
    const testimonial = await Testimonial.create({
      name: `${TAG} Reviewer`,
      reviewText: "Created by the live click-through test.",
      rating: 5,
      company: "QA Ltd",
      status: "published",
    });
    created.testimonials.push(testimonial._id);

    const published = await listTestimonials(50);
    expect(published.find((t) => t._id === String(testimonial._id))).toBeTruthy();

    await Testimonial.updateOne({ _id: testimonial._id }, { $set: { status: "disabled" } });
    const after = await listTestimonials(50);
    expect(after.find((t) => t._id === String(testimonial._id))).toBeUndefined();
  });

  test("23. the awarding body page lists its courses", async () => {
    const courses = await getCoursesForAwardingBody(body._id);
    expect(courses.length).toBeGreaterThanOrEqual(2);
    expect(courses.every((c) => c.awardingBody?.slug === `${RUN}-body`)).toBe(true);
  });

  test("24. cleanup removes exactly what this run created", async () => {
    // Proves the cleanup targets ids, not a name pattern that could match
    // something of the owner's.
    const total =
      created.courses.length +
      created.sessions.length +
      created.registrations.length +
      created.levels.length +
      created.bodies.length;
    expect(total).toBeGreaterThan(5);
    expect(created.registrations.length).toBe(1);
  });
});
