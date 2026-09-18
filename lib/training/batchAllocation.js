import connectDB from "@/utils/db";
import Registration from "@/models/Registration";
import CourseReference from "@/models/CourseReference";
import Candidate from "@/models/Candidate";
import Course from "@/models/Course";
import { isRegistrationOpen } from "@/lib/training/status";
import { REGISTERABLE_SESSION_STATUSES } from "@/lib/training/constants";

/**
 * Generates a unique trainee ID.
 */
function generateTraineeId() {
  return `TRN-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Generates a unique certificate number.
 */
function generateCertificateNumber() {
  return `CERT-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Enrolls a student into a target CourseReference session.
 * Prevents duplicate enrollment under concurrent operations.
 *
 * @param {Object} reg Registration Mongoose document or plain object
 * @param {Object|string} session CourseReference Mongoose document or ID string
 * @returns {Promise<{ success: boolean, candidate?: Object, session?: Object, duplicate?: boolean, reason?: string }>}
 */
export async function enrollStudentIntoSession(reg, session) {
  if (!reg || !session) return { success: false, reason: "missing_arguments" };

  let targetSession = session;
  if (typeof session === "string" || (session && session._bsontype)) {
    targetSession = await CourseReference.findById(session);
  }
  if (!targetSession) return { success: false, reason: "session_not_found" };

  if (reg.enrolledCandidate) {
    return {
      success: true,
      duplicate: true,
      candidate: { _id: reg.enrolledCandidate },
      session: targetSession,
    };
  }

  // Check capacity (support both seats and maxCapacity)
  const maxSeats = targetSession.seats ?? targetSession.maxCapacity ?? 20;
  const currentCount =
    targetSession.candidatesCount ??
    targetSession.candidateCount ??
    (targetSession.candidates || []).length ??
    0;

  if (currentCount >= maxSeats) {
    return { success: false, reason: "capacity_reached" };
  }

  // Check if candidate already exists in this session
  const sessionTargetId = targetSession._id;
  let candidate = await Candidate.findOne({
    email: reg.email,
    courseId: sessionTargetId,
  });

  if (candidate) {
    return {
      success: true,
      duplicate: true,
      candidate,
      session: targetSession,
    };
  }

  candidate = await Candidate.create({
    traineeId: generateTraineeId(),
    userId: targetSession.userId || "000000000000000000000000",
    courseId: sessionTargetId,
    firstName: reg.firstName || (reg.fullName?.split(" ")[0] || "Candidate"),
    lastName: reg.lastName || (reg.fullName?.split(" ").slice(1).join(" ") || "Student"),
    dateOfBirth: new Date("1995-01-01"),
    country: reg.country || "United Kingdom",
    email: reg.email,
    assessmentMarks1: 0,
    assessmentMarks2: 0,
    certificateNumber: generateCertificateNumber(),
    status: "active",
    paymentStatus: reg.paymentStatus === "paid" ? "paid" : "unpaid",
  });

  const nextCount = currentCount + 1;
  targetSession.candidatesCount = nextCount;
  targetSession.candidateCount = nextCount;
  if (Array.isArray(targetSession.candidates)) {
    targetSession.candidates.push(candidate._id);
  }

  if (targetSession.save && typeof targetSession.save === "function") {
    await targetSession.save();
  } else {
    await CourseReference.findByIdAndUpdate(sessionTargetId, {
      $addToSet: { candidates: candidate._id },
      $inc: { candidatesCount: 1, candidateCount: 1 },
    });
  }

  const snapshotName =
    targetSession.referenceName ||
    targetSession.referenceCode ||
    targetSession.courseName ||
    targetSession.name ||
    "";

  reg.enrolledCandidate = candidate._id;
  reg.session = sessionTargetId;
  reg.sessionNameSnapshot = snapshotName;
  reg.batchAllocationStatus = "allocated";

  if (reg.save && typeof reg.save === "function") {
    await reg.save();
  } else {
    await Registration.findByIdAndUpdate(reg._id, {
      enrolledCandidate: candidate._id,
      session: sessionTargetId,
      sessionNameSnapshot: snapshotName,
      batchAllocationStatus: "allocated",
    });
  }

  return {
    success: true,
    duplicate: false,
    candidate,
    session: targetSession,
  };
}

/**
 * Allocate a registration to an eligible session.
 * If fixed session is provided and eligible, allocates to it.
 * If flexible / next intake, allocates to the earliest upcoming eligible session.
 * If no eligible session exists or session is full, queues registration under "awaiting_batch".
 */
export async function allocateRegistration(registrationId) {
  await connectDB();
  const reg = await Registration.findById(registrationId);
  if (!reg) return { success: false, allocated: false, error: "Registration not found" };

  if (reg.enrolledCandidate) {
    return { success: true, allocated: true, status: "already_allocated", candidateId: reg.enrolledCandidate };
  }

  const now = new Date();

  // 1. If registration already has an assigned session
  if (reg.session) {
    const session = await CourseReference.findById(reg.session);
    if (session && isRegistrationOpen(session, now)) {
      const enrollRes = await enrollStudentIntoSession(reg, session);
      if (enrollRes.success) {
        return { success: true, allocated: true, status: "allocated", session, candidate: enrollRes.candidate };
      }
    }
  }

  // 2. Find earliest upcoming eligible session for this course
  const courseId = reg.course;
  const sessions = await CourseReference.find({
    $or: [{ course: courseId }, { courseId: String(courseId) }],
    showInSchedule: { $ne: false },
    status: { $in: REGISTERABLE_SESSION_STATUSES },
    startDate: { $gte: now },
  })
    .sort({ startDate: 1 })
    .lean();

  for (const s of sessions) {
    if (!isRegistrationOpen(s, now)) continue;
    const maxSeats = s.seats ?? s.maxCapacity ?? 20;
    const count = s.candidatesCount ?? s.candidateCount ?? (s.candidates || []).length ?? 0;
    if (count < maxSeats) {
      // Allocate to this upcoming session
      const targetSession = await CourseReference.findById(s._id);
      const enrollRes = await enrollStudentIntoSession(reg, targetSession);
      if (enrollRes.success) {
        return { success: true, allocated: true, status: "allocated", session: targetSession, candidate: enrollRes.candidate };
      }
    }
  }

  // 3. No eligible session available right now: place in waiting queue
  reg.batchAllocationStatus = "awaiting_batch";
  reg.isFutureBatch = true;
  if (reg.save && typeof reg.save === "function") {
    await reg.save();
  } else {
    await Registration.findByIdAndUpdate(reg._id, {
      batchAllocationStatus: "awaiting_batch",
      isFutureBatch: true,
    });
  }

  return { success: true, allocated: false, status: "awaiting_batch" };
}

/**
 * Processes waiting registrations in queue order when a session becomes available
 * or when a new CourseReference is created.
 */
export async function processWaitingQueueForCourse(courseId) {
  if (!courseId) return { processed: 0, allocatedCount: 0, remainingWaiting: 0 };
  await connectDB();

  // Find all waiting registrations for this course, ordered oldest first
  const waitingList = await Registration.find({
    course: courseId,
    status: { $in: ["confirmed", "pending"] },
    batchAllocationStatus: "awaiting_batch",
    enrolledCandidate: null,
  })
    .sort({ createdAt: 1 })
    .lean();

  let allocatedCount = 0;
  for (const reg of waitingList) {
    const res = await allocateRegistration(reg._id);
    if (res.allocated) {
      allocatedCount++;
    }
  }

  const remainingWaiting = waitingList.length - allocatedCount;
  return { processed: waitingList.length, allocatedCount, remainingWaiting };
}
