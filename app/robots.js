/**
 * robots.txt.
 *
 * The owner areas and the API are disallowed — not as a security measure (they
 * are behind authentication, which is the actual control) but because a crawler
 * hammering /api/owner earns nothing and costs the database. /registration is
 * excluded for the reason given in sitemap.js.
 */
export const dynamic = "force-dynamic";

function baseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://ababeel.co.uk";
  return raw.replace(/\/+$/, "");
}

export default function robots() {
  const base = baseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/owner/",
          "/admin/",
          "/dashboard/",
          "/profile",
          "/registration",
          "/login",
          "/sign-up",
          "/reset-password",
          "/forgot-password",
          "/verify-email",
          "/activate-account",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
