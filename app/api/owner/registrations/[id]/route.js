import connectDB from "@/utils/db";
import mongoose from "mongoose";
import Registration, { REGISTRATION_STATUSES } from "@/models/Registration";
import { requireOwner } from "@/lib/auth";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  safeErrorResponse,
} from "@/lib/errors";
import { plain } from "@/lib/training/queries";

/**
 * One registration: read it, change its status, add an internal note, delete it.
 *
 * The submitted answers are never editable. What the registrant sent is the
 * record; an owner's own commentary belongs in `internalNotes`, which is
 * appended to rather than overwritten so the history stays intact.
 */
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return notFoundResponse("Not found");

    await connectDB();
    const doc = await Registration.findById(id)
      .populate({ path: "course", select: "name slug code duration" })
      .populate({
        path: "session",
        select: "referenceName referenceCode startDate endDate examDate mode modeLabel location status",
      })
      .lean();
    if (!doc) return notFoundResponse("Not found");

    return successResponse({ data: plain(doc), statuses: REGISTRATION_STATUSES });
  } catch (error) {
    console.error("owner registration read error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, error } = await requireOwner(request);
    if (error) return error;
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return notFoundResponse("Not found");

    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body");
    }

    const update = {};
    const push = {};

    if (body?.status !== undefined) {
      if (!REGISTRATION_STATUSES.includes(body.status)) {
        return badRequestResponse("Unknown status");
      }
      update.status = body.status;
      update.handledBy = user._id;
    }

    if (typeof body?.note === "string" && body.note.trim()) {
      push.internalNotes = {
        body: body.note.trim().slice(0, 4000),
        authorEmail: user.email || "",
        createdAt: new Date(),
      };
    }

    if (!Object.keys(update).length && !Object.keys(push).length) {
      return badRequestResponse("Nothing to update");
    }

    await connectDB();
    const ops = {};
    if (Object.keys(update).length) ops.$set = update;
    if (Object.keys(push).length) ops.$push = push;

    const doc = await Registration.findByIdAndUpdate(id, ops, { new: true })
      .populate({ path: "course", select: "name slug" })
      .populate({ path: "session", select: "referenceName startDate" })
      .lean();
    if (!doc) return notFoundResponse("Not found");

    return successResponse({ data: plain(doc) });
  } catch (error) {
    console.error("owner registration update error:", error);
    return safeErrorResponse(error, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = await requireOwner(request);
    if (error) return error;
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return notFoundResponse("Not found");

    await connectDB();
    const doc = await Registration.findByIdAndDelete(id).lean();
    if (!doc) return notFoundResponse("Not found");
    return successResponse({ data: { deleted: true, id: String(id) } });
  } catch (error) {
    console.error("owner registration delete error:", error);
    return safeErrorResponse(error, 500);
  }
}
