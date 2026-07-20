import { NextResponse } from "next/server";

const SAFE_MESSAGES = {
  400: "Bad request",
  401: "Authentication required",
  403: "Insufficient permissions",
  404: "Resource not found",
  409: "Conflict",
  429: "Too many requests",
  500: "Internal server error",
};

export function sanitizeError(error, isDev) {
  if (isDev) {
    return {
      message: error.message || "Unknown error",
      type: error.name || "Error",
    };
  }

  const status = error.status || 500;
  return {
    message: SAFE_MESSAGES[status] || "Internal server error",
    type: "Error",
  };
}

export function safeErrorResponse(error, status = 500) {
  const isDev = process.env.NODE_ENV === "development";
  const safe = sanitizeError(error, isDev);

  const requestId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : "unknown";

  if (isDev) {
    console.error(`[${requestId}] Error:`, error.message);
  } else {
    console.error(`[${requestId}] Error ${status}:`, error.message || "unknown");
  }

  return NextResponse.json(
    {
      success: false,
      error: safe.message,
      requestId,
    },
    { status }
  );
}

export function successResponse(data, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}

export function forbiddenResponse(message) {
  return NextResponse.json(
    { success: false, error: message || "Insufficient permissions" },
    { status: 403 }
  );
}

export function unauthorizedResponse(message) {
  return NextResponse.json(
    { success: false, error: message || "Authentication required" },
    { status: 401 }
  );
}

export function notFoundResponse(message) {
  return NextResponse.json(
    { success: false, error: message || "Resource not found" },
    { status: 404 }
  );
}

export function badRequestResponse(message) {
  return NextResponse.json(
    { success: false, error: message || "Bad request" },
    { status: 400 }
  );
}

export function tooManyRequestsResponse(retryAfter) {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}

export function forbiddenOriginResponse() {
  return NextResponse.json(
    { success: false, error: "Request origin not allowed" },
    { status: 403 }
  );
}

export function maskSensitiveData(obj, sensitiveKeys = ["password", "token", "secret", "key"]) {
  if (!obj || typeof obj !== "object") return obj;

  const masked = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
      masked[key] = "[REDACTED]";
    } else if (typeof masked[key] === "object" && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key], sensitiveKeys);
    }
  }

  return masked;
}
