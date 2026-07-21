"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSiteContent } from "@/context/SiteContentContext";

/**
 * A slim strip shown ONLY to the owner, at the top of the header. It reports
 * whether the site is live or under maintenance and lets the owner flip it with
 * a capsule toggle (right side). Toggling writes to the CMS and refreshes the
 * live settings so the maintenance gate updates immediately.
 */
export default function MaintenanceBar() {
  const { user } = useAuth();
  const { settings, refresh } = useSiteContent();
  const [busy, setBusy] = useState(false);

  const on = !!settings?.maintenance?.enabled;
  if (user?.role !== "owner" || !on) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      await axios.put("/api/owner/maintenance", { enabled: !on }, { withCredentials: true });
      await refresh?.();
      toast.success("Maintenance mode OFF — site is live");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not update maintenance mode");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[1000] group flex items-stretch drop-shadow-xl"
      role="region"
      aria-label="Maintenance control"
    >
      <div className="pointer-events-none flex items-center gap-3 rounded-l-xl bg-amber-600 px-4 text-white opacity-0 translate-x-3 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-x-0">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            Website is under maintenance — only you can see it
          </span>
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-label="Turn maintenance mode off"
          className="flex items-center gap-2 shrink-0 rounded-full bg-white/15 px-2.5 py-1.5 hover:bg-white/25 disabled:opacity-60"
        >
          <span className="text-[11px] uppercase tracking-wide">Turn off</span>
          <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-white/90">
            <span className="inline-block h-4 w-4 translate-x-4 rounded-full bg-amber-600" />
          </span>
        </button>
      </div>

      <button
        type="button"
        aria-label="Show maintenance controls"
        title="Maintenance controls"
        className="flex w-10 items-center justify-center rounded-xl bg-amber-600 text-white transition-colors hover:bg-amber-700 group-hover:rounded-l-none group-focus-within:rounded-l-none"
      >
        <ChevronLeft size={19} className="transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
    </div>
  );
}
