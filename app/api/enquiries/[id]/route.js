import { NextResponse } from 'next/server';
import connectDB from '@/utils/db';
import Contact from '@/models/Contact';
import { requireAdmin } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { isValidObjectId } from '@/lib/validation';

export async function PATCH(request, { params }) {
  try {
    const { user: authUser, error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "write", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid enquiry ID' }, { status: 400 });
    }

    const body = await request.json();

    const contact = await Contact.findById(id);

    if (!contact) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    if (body.status) {
      contact.status = body.status;
    }

    if (body.notes) {
      contact.notes = body.notes;
    }

    if (body.assignedTo) {
      contact.assignedTo = body.assignedTo;
    }

    await contact.save();

    return NextResponse.json({
      success: true,
      message: 'Enquiry updated successfully',
      data: contact
    });

  } catch (error) {
    console.error('Error updating enquiry:', error);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user: authUser, error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const rl = await checkRateLimit(request, "destructiveAdmin", { userId: authUser._id.toString() });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter);
    }

    await connectDB();

    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid enquiry ID' }, { status: 400 });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    await contact.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Enquiry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting enquiry:', error);
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 });
  }
}
