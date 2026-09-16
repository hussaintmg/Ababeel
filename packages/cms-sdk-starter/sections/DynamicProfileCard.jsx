import React from "react";
import { defineSection, CMSField, CMSImage, CMSLink, useCMSContext } from "@/lib/cms/sdk";

export default defineSection({
  id: "starter-dynamic-profile-card",
  name: "Dynamic Profile Card",
  category: "Team & Profiles",
  description: "Instructor and member profile card bound to sanitized public user/instructor data",

  props: {
    badge: {
      type: "text",
      label: "Role Badge",
      default: "Senior Lead Instructor",
      dynamic: true,
    },
    defaultName: {
      type: "text",
      label: "Fallback Name",
      default: "Dr. Alexander Wright, CMIOSH",
      dynamic: false,
    },
  },

  component: function DynamicProfileCard({ badge, defaultName }) {
    const { user } = useCMSContext();
    const name = user ? `${user.firstName} ${user.lastName}`.trim() : defaultName;
    const avatar = user?.avatar || "/ababeel-logo.svg";
    const bio = user?.publicBio || "Specialist advisor and lead tutor for accredited occupational safety and health programmes.";

    return (
      <section className="py-16 px-6 bg-slate-900 text-white">
        <div className="max-w-md mx-auto rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-xl text-center">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-sky-500/50 bg-slate-800 mb-6 shadow-md">
            <CMSImage source={avatar} alt={String(name)} className="w-full h-full object-cover" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold mb-3 border border-sky-400/20">
            <CMSField value={badge} fallback="Instructor" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            <CMSField value={name} fallback={defaultName} />
          </h3>

          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            <CMSField value={bio} />
          </p>

          <CMSLink
            href={`/instructors/${user?.username || "profile"}`}
            className="inline-flex items-center px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold transition-colors"
          >
            View Instructor Profile
          </CMSLink>
        </div>
      </section>
    );
  },
});
