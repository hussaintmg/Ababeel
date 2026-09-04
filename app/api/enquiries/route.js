import { NextResponse } from "next/server";
import Contact from "@/models/Contact";
import connectDB from "@/utils/db";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(request) {
    try {
        const { user: authUser, error: authError } = await requireAdmin(request);
        if (authError) return authError;

        const rl = await checkRateLimit(request, "read", { userId: authUser._id.toString() });
        if (!rl.allowed) {
            return rateLimitResponse(rl.retryAfter);
        }

        await connectDB();
        const contacts = await Contact.find({});
        return NextResponse.json({ data: contacts });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { user: authUser, error: authError } = await requireAdmin(request);
        if (authError) return authError;

        const rl = await checkRateLimit(request, "destructiveAdmin", { userId: authUser._id.toString() });
        if (!rl.allowed) {
            return rateLimitResponse(rl.retryAfter);
        }

        const body = await request.json().catch(() => ({}));
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No enquiry IDs provided" }, { status: 400 });
        }

        await connectDB();
        const result = await Contact.deleteMany({ _id: { $in: ids } });

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} enquiry(ies) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Error deleting enquiries:", error);
        return NextResponse.json({ error: "Failed to delete enquiries" }, { status: 500 });
    }
}

