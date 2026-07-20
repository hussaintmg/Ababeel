import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Notification from "@/models/Notification";
import connectDB from "@/utils/db";

// GET - Fetch user notifications
export async function GET(req) {
  try {
    await connectDB();

    // Get token from cookies
    const cookie = req.cookies.get("token");

    if (!cookie) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 }
      );
    }

    const token = cookie.value;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 }
      );
    }
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Fetch unseen notifications
    const notifications = await Notification.find({
      userId,
      isSeen: false,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark notification as seen
export async function PUT(request) {
  try {
    await connectDB();

    // Get token from cookies
    const cookie = request.cookies.get("token");

    if (!cookie) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 }
      );
    }

    const token = cookie.value;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 }
      );
    }
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { message: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Update notification
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId,
      },
      { isSeen: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as seen",
      notification,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark all notifications as seen
export async function PATCH(request) {
  try {
    await connectDB();

    // Get token from cookies
    const cookie = request.cookies.get("token");

    if (!cookie) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 }
      );
    }

    const token = cookie.value;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return NextResponse.json(
        {
          user: null,
          loggedIn: false,
        },
        { status: 200 }
      );
    }
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Mark all user notifications as seen
    await Notification.updateMany({ userId, isSeen: false }, { isSeen: true });

    return NextResponse.json({
      success: true,
      message: "All notifications marked as seen",
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
