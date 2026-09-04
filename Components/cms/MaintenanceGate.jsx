"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSiteContent } from "@/context/SiteContentContext";
import { RefreshCw, Mail, Phone, Shield, ArrowRight } from "lucide-react";

// Pages that stay reachable while maintenance is on (so users can still log in).
const ALLOWED = new Set(["/login", "/forgot-password", "/reset-password"]);

export default function MaintenanceGate({ children }) {
  const { settings, refresh } = useSiteContent();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [rechecking, setRechecking] = useState(false);

  const m = settings?.maintenance || {};

  // Normal operation — pass-through
  if (!m.enabled) return children;

  // Login & auth pages stay reachable so owner/staff can sign in
  if (ALLOWED.has(pathname)) return children;

  // Owner always sees the live site
  if (user?.role === "owner") return children;

  // Don't flash maintenance while auth state is resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleManualRefresh = async () => {
    setRechecking(true);
    try {
      await refresh?.();
    } finally {
      setTimeout(() => setRechecking(false), 600);
    }
  };

  return (
    <MaintenanceScreen
      title={m.title}
      message={m.message}
      logo={settings?.logos?.topbar}
      brand={settings?.brand?.name || "Ababeel"}
      contact={settings?.contact}
      onRefresh={handleManualRefresh}
      rechecking={rechecking}
    />
  );
}

function MaintenanceScreen({ title, message, logo, brand, contact, onRefresh, rechecking }) {
  const effectiveLogo = logo || "/ababeel-logo-light.svg";
  return (
    <div
      style={{
        backgroundColor: "#060d18",
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      className="min-h-screen relative flex items-center justify-center bg-slate-950 text-white px-4 sm:px-6 py-12 overflow-hidden selection:bg-blue-600 selection:text-white"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative max-w-xl w-full text-center z-10" style={{ maxWidth: "36rem", width: "100%", margin: "0 auto", padding: "1rem" }}>
        {/* Brand Logo */}
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={effectiveLogo}
            alt={brand}
            className="h-14 sm:h-16 object-contain drop-shadow-md"
            style={{ maxHeight: "4rem", objectFit: "contain" }}
          />
        </div>

        {/* Glassmorphic Main Card */}
        <div
          style={{
            backgroundColor: "rgba(11, 21, 38, 0.85)",
            border: "1px solid rgba(34, 51, 74, 0.9)",
            borderRadius: "1.5rem",
            padding: "2.5rem 2rem",
            backdropFilter: "blur(20px)",
          }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-7 sm:p-10 shadow-2xl"
        >
          {/* Status Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.875rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#fcd34d",
              fontSize: "0.75rem",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "1.5rem",
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <span
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "9999px",
                backgroundColor: "#fbbf24",
              }}
              className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
            />
            Under Scheduled Maintenance
          </div>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "800",
              color: "#ffffff",
              lineHeight: 1.25,
            }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight"
          >
            {title || "We'll be back online soon"}
          </h1>

          <p
            style={{
              marginTop: "1rem",
              color: "#cbd5e1",
              fontSize: "1.05rem",
              lineHeight: 1.6,
            }}
            className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed whitespace-pre-line"
          >
            {message ||
              "Our website is currently undergoing scheduled improvements to serve you better. We apologize for any temporary inconvenience."}
          </p>

          {/* Action buttons: Refresh + Owner Login */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onRefresh}
              disabled={rechecking}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
                border: "none",
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${rechecking ? "animate-spin" : ""}`} />
              {rechecking ? "Checking status…" : "Check Status / Refresh"}
            </button>

            <Link
              href="/login"
              style={{
                backgroundColor: "#1e293b",
                color: "#e2e8f0",
                padding: "0.75rem 1.25rem",
                borderRadius: "0.75rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                border: "1px solid #334155",
                textDecoration: "none",
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm transition-all duration-200 hover:text-white active:scale-98"
            >
              <Shield className="w-4 h-4 text-slate-400" />
              Staff Login
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Direct Support Contact Strip */}
          {(contact?.infoEmail || contact?.supportEmail || contact?.phone || contact?.whatsapp) && (
            <div
              style={{ borderTop: "1px solid rgba(51, 65, 85, 0.8)", marginTop: "2rem", paddingTop: "1.5rem" }}
              className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400"
            >
              <span className="text-slate-500">Need urgent assistance?</span>
              {(contact.supportEmail || contact.infoEmail) && (
                <a
                  href={`mailto:${contact.supportEmail || contact.infoEmail}`}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  {contact.supportEmail || contact.infoEmail}
                </a>
              )}
              {(contact.phone || contact.whatsapp) && (
                <a
                  href={`tel:${contact.phone || contact.whatsapp}`}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-blue-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {contact.phone || contact.whatsapp}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer copyright stamp */}
        <p className="mt-6 text-xs text-slate-600" style={{ color: "#64748b", marginTop: "1.5rem", fontSize: "0.75rem" }}>
          © {new Date().getFullYear()} {brand}. All rights reserved.
        </p>
      </div>
    </div>
  );
}

