const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_BASE_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

export function verifyOrigin(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (request.headers.get("stripe-signature")) {
    return { valid: true };
  }

  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return { valid: true };
  }

  const source = origin || referer;
  if (!source) {
    return { valid: false, reason: "No origin or referer header" };
  }

  try {
    const url = new URL(source);
    const sourceOrigin = `${url.protocol}//${url.host}`;

    if (ALLOWED_ORIGINS.includes(sourceOrigin)) {
      return { valid: true };
    }

    if (host && url.host === host) {
      return { valid: true };
    }

    return { valid: false, reason: `Origin mismatch: ${sourceOrigin}` };
  } catch {
    return { valid: false, reason: "Invalid origin format" };
  }
}

export function csrfProtection(request) {
  const result = verifyOrigin(request);
  if (!result.valid) {
    return {
      blocked: true,
      response: new Response(
        JSON.stringify({ success: false, error: "Request origin not allowed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  return { blocked: false };
}
