import { NextResponse } from "next/server";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer()",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/check-fp",
  "/api/auth/check-rp",
  "/api/auth/check-code",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/verify-user",
  "/api/auth/logout",
  "/api/contact",
  "/api/verify-certificate",
  "/api/verify-certificate-via-link",
  "/api/courses/default",
];

const AUTH_PAGES = ["/login", "/forgot-password", "/reset-password"];
const PROTECTED_PAGES = ["/dashboard", "/admin", "/owner", "/send-email"];
const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

function buildCSP() {
  return CSP_DIRECTIVES.join("; ");
}

function isStripeWebhook(pathname) {
  return pathname === "/api/payments/webhook";
}

function isPublicApiRoute(pathname) {
  return PUBLIC_API_ROUTES.some((route) => {
    if (route.endsWith("/default")) {
      return pathname === route || pathname.startsWith(route + "/");
    }
    return pathname === route;
  });
}

function applySecurityHeaders(response) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", buildCSP());
  }
  return response;
}

function handleApiMiddleware(request, pathname) {
  const response = NextResponse.next();
  applySecurityHeaders(response);

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  if (isStripeWebhook(pathname)) return response;

  if (MUTATION_METHODS.includes(request.method) && !isPublicApiRoute(pathname)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");
    const source = origin || referer;

    if (source) {
      try {
        const url = new URL(source);
        const allowedHosts = [
          host,
          process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, ""),
        ].filter(Boolean);

        if (!allowedHosts.includes(url.host)) {
          return NextResponse.json(
            { success: false, error: "Request origin not allowed" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid request origin" },
          { status: 403 }
        );
      }
    }
  }

  return response;
}

async function handlePageMiddleware(request, pathname) {
  const response = NextResponse.next();
  applySecurityHeaders(response);

  const token = request.cookies.get("token")?.value;

  if (!token) {
    if (PROTECTED_PAGES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  try {
    const verifyUrl = new URL("/api/auth/verify-user", request.url);
    const cookieHeader = request.headers.get("cookie") || "";

    const verifyResponse = await fetch(verifyUrl, {
      headers: {
        Cookie: cookieHeader,
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "User-Agent": request.headers.get("user-agent") || "Next.js-Proxy",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      credentials: "include",
    });

    if (!verifyResponse.ok) {
      throw new Error(`Verification failed: ${verifyResponse.status}`);
    }

    const data = await verifyResponse.json();

    if (!data.user || !data.loggedIn) {
      const redirect = NextResponse.redirect(new URL("/login", request.url));
      redirect.cookies.delete("token");
      return redirect;
    }

    const user = data.user;

    if (!user.authenticatedEmail) {
      if (pathname !== "/send-email") {
        return NextResponse.redirect(new URL("/send-email", request.url));
      }
      return response;
    }

    if (user.authenticatedEmail && !user.authenticatedByOwner) {
      if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (AUTH_PAGES.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (user.role === "owner" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/owner", request.url));
    }

    if (user.role === "admin" && pathname.startsWith("/owner")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (
      (user.role === "organization" || user.role === "trainee") &&
      (pathname.startsWith("/admin") || pathname.startsWith("/owner"))
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      user.role === "user" &&
      (pathname.startsWith("/admin") || pathname.startsWith("/owner") || pathname.startsWith("/dashboard"))
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    redirect.cookies.delete("token");
    return redirect;
  }
}

export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return handleApiMiddleware(request, pathname);
  }

  return handlePageMiddleware(request, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|eot|css|js|map)$).*)",
  ],
};
