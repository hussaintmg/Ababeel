"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSiteContent } from "@/context/SiteContentContext";

// Pages that stay reachable while maintenance is on (so users can still log in).
const ALLOWED = new Set(["/login"]);

/**
 * When maintenance mode is enabled, everyone except the owner sees the
 * maintenance screen on every page (except the allowed auth pages). The owner
 * always sees the real site. When maintenance is off this is a pass-through.
 */
export default function MaintenanceGate({ children }) {
  const { settings } = useSiteContent();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const m = settings?.maintenance || {};
  if (!m.enabled) return children; // normal operation — zero overhead
  if (ALLOWED.has(pathname)) return children; // login stays reachable

  const isOwner = user?.role === "owner";
  if (isOwner) return children; // owner sees everything, live

  // Don't flash the maintenance screen before we know who the visitor is.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <MaintenanceScreen title={m.title} message={m.message} logo={settings?.logos?.topbar} brand={settings?.brand?.name} />;
}

function MaintenanceScreen({ title, message, logo, brand }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6">
      <div className="max-w-lg w-full text-center">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={brand || "Logo"} className="h-14 mx-auto mb-8 object-contain" />
        ) : null}

        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold">{title || "We'll be back soon"}</h1>
        <p className="mt-4 text-slate-300 leading-relaxed whitespace-pre-line">
          {message || "Our website is currently under maintenance. Please check back shortly."}
        </p>

        <Link
          href="/login"
          className="inline-block mt-8 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold shadow-lg hover:scale-[1.03] active:scale-95 transition-transform"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
