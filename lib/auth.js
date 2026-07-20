import jwt from "jsonwebtoken";
import connectDB from "@/utils/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set");
}

function createErrorResponse(message, status) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function getAuthToken(request) {
  const token = request.cookies.get("token")?.value;
  return token || null;
}

export function verifyAuthToken(token) {
  if (!JWT_SECRET) {
    throw new Error("Server configuration error");
  }
  if (!token) {
    throw new Error("No token provided");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    throw new Error("Invalid token");
  }
}

export async function getAuthenticatedUser(request) {
  const token = getAuthToken(request);
  if (!token) {
    return { user: null, error: createErrorResponse("Authentication required", 401) };
  }

  let decoded;
  try {
    decoded = verifyAuthToken(token);
  } catch (err) {
    return { user: null, error: createErrorResponse("Invalid or expired token", 401) };
  }

  await connectDB();
  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    return { user: null, error: createErrorResponse("User not found", 401) };
  }

  return { user, error: null };
}

export async function requireAuth(request) {
  return await getAuthenticatedUser(request);
}

export async function requireRole(request, ...roles) {
  const { user, error } = await getAuthenticatedUser(request);
  if (error) return { user: null, error };

  if (!roles.includes(user.role)) {
    return { user: null, error: createErrorResponse("Insufficient permissions", 403) };
  }

  return { user, error: null };
}

export async function requireAdmin(request) {
  return await requireRole(request, "admin", "owner");
}

export async function requireOwner(request) {
  return await requireRole(request, "owner");
}

export async function requireAdminOrOwner(request) {
  return await requireRole(request, "admin", "owner");
}

export async function requireOwnership(request, resourceUserId) {
  const { user, error } = await getAuthenticatedUser(request);
  if (error) return { user: null, error };

  if (user.role === "admin" || user.role === "owner") {
    return { user, error: null };
  }

  if (user._id.toString() !== resourceUserId.toString()) {
    return { user: null, error: createErrorResponse("Access denied: not the resource owner", 403) };
  }

  return { user, error: null };
}

export async function requireOrganizationAccess(request, resourceUserId) {
  const { user, error } = await getAuthenticatedUser(request);
  if (error) return { user: null, error };

  if (["admin", "owner"].includes(user.role)) {
    return { user, error: null };
  }

  if (user._id.toString() !== resourceUserId.toString()) {
    return { user: null, error: createErrorResponse("Access denied", 403) };
  }

  return { user, error: null };
}

export function getCookieConfig(remember) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: "token",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 7 : 60 * 60,
  };
}

export function setAuthCookie(response, token, remember) {
  const config = getCookieConfig(remember);
  response.cookies.set({
    name: config.name,
    value: token,
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    path: config.path,
    maxAge: config.maxAge,
  });
  return response;
}

export function clearAuthCookie(response) {
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
