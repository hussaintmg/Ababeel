"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
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
      toast.success(!on ? "Maintenance mode ON — site hidden from visitors" : "Maintenance mode OFF — site is live");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Could not update maintenance mode");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`w-full text-white ${on ? "bg-amber-600" : "bg-slate-800"}`}
      role="region"
      aria-label="Maintenance control"
    >
      <div className="max-w-full mx-auto px-4 h-9 flex items-center justify-between gap-3">
        {/* Left: status */}
        <div className="flex items-center gap-2 min-w-0">
          {on ? <AlertTriangle size={15} className="shrink-0" /> : <CheckCircle2 size={15} className="shrink-0 text-emerald-300" />}
          <span className="text-xs sm:text-sm font-medium truncate">
            {on ? "Website is under maintenance — only you can see it" : "Website is live"}
          </span>
        </div>

        {/* Right: capsule toggle */}
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={on}
          title={on ? "Turn maintenance OFF" : "Turn maintenance ON"}
          className="flex items-center gap-2 shrink-0 disabled:opacity-60"
        >
          <span className="hidden sm:inline text-[11px] uppercase tracking-wide opacity-90">
            {on ? "Maintenance" : "Live"}
          </span>
          <span
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-white/90" : "bg-white/30"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${on ? "translate-x-4 bg-amber-600" : "translate-x-0.5 bg-white"}`}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
