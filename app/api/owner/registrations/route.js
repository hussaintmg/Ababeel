import connectDB from "@/utils/db";
import mongoose from "mongoose";
import Registration, { REGISTRATION_STATUSES } from "@/models/Registration";
import { requireOwner } from "@/lib/auth";
import { successResponse, safeErrorResponse } from "@/lib/errors";
import { plain } from "@/lib/training/queries";

/**
 * Owner registration list.
 *
 * Owner-only, always: registrations are personal data, and the model is also
 * blocked from CMS page bindings so no published page can read it either.
 */
export const dynamic = "force-dynamic";

const MAX_LIMIT = 200;

export async function GET(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    await connectDB();
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") || "").trim();
    const status = url.searchParams.get("status") || "";
    const course = url.searchParams.get("course") || "";
    const session = url.searchParams.get("reference") || "";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 25, 1), MAX_LIMIT);

    const query = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { reference: rx },
        { fullName: rx },
        { email: rx },
        { phone: rx },
        { company: rx },
        { courseNameSnapshot: rx },
      ];
    }
    if (status && REGISTRATION_STATUSES.includes(status)) query.status = status;
    if (course && mongoose.Types.ObjectId.isValid(course)) query.course = course;
    if (session && mongoose.Types.ObjectId.isValid(session)) query.session = session;

    // A date filter is inclusive of the whole "to" day, which is what an owner
    // filtering "up to the 30th" means.
    if (from || to) {
      query.createdAt = {};
      if (from && !Number.isNaN(Date.parse(from))) query.createdAt.$gte = new Date(from);
      if (to && !Number.isNaN(Date.parse(to))) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
      if (!Object.keys(query.createdAt).length) delete query.createdAt;
    }

    const [items, total, statusCounts] = await Promise.all([
      Registration.find(query)
        .select("reference fullName email phone company course session courseNameSnapshot sessionNameSnapshot status createdAt")
        .populate({ path: "course", select: "name slug" })
        .populate({ path: "session", select: "referenceName referenceCode startDate" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Registration.countDocuments(query),
      Registration.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    return successResponse({
      data: {
        items: plain(items),
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        counts: Object.fromEntries(statusCounts.map((r) => [r._id, r.count])),
        statuses: REGISTRATION_STATUSES,
      },
    });
  } catch (error) {
    console.error("owner registrations list error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function DELETE(request) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return safeErrorResponse(new Error("No registration IDs provided"), 400);
    }

    const validIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) {
      return safeErrorResponse(new Error("Invalid registration IDs"), 400);
    }

    await connectDB();
    const result = await Registration.deleteMany({ _id: { $in: validIds } });

    return successResponse({
      data: {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} registration(s) deleted successfully`,
      },
    });
  } catch (error) {
    console.error("Error deleting registrations in bulk:", error);
    return safeErrorResponse(error, 500);
  }
}

