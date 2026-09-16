import React from "react";
import { defineSection, CMSField, CMSLink, CMSIf } from "@/lib/cms/sdk";

export default defineSection({
  id: "starter-conditional-cta",
  name: "Conditional CTA Banner",
  category: "CTA",
  description: "Promotional banner using CMSIf conditions for discounts and special member badges",

  props: {
    title: {
      type: "text",
      label: "Main Title",
      default: "Limited Enrollment Period Open",
      dynamic: true,
    },
    hasDiscount: {
      type: "boolean",
      label: "Enable Special Discount Badge",
      default: true,
      dynamic: true,
    },
    discountPercent: {
      type: "number",
      label: "Discount Percentage",
      default: 20,
      dynamic: false,
    },
    buttonText: {
      type: "text",
      label: "Button Label",
      default: "Secure Your Seat",
      dynamic: false,
    },
    buttonUrl: {
      type: "text",
      label: "Button Link",
      default: "/register",
      dynamic: false,
    },
  },

  component: function ConditionalCta({ title, hasDiscount = true, discountPercent = 20, buttonText, buttonUrl }) {
    return (
      <section className="py-16 px-6 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white text-center border-y border-slate-800">
        <div className="max-w-4xl mx-auto">
          {/* Conditional Discount Badge */}
          <CMSIf condition={hasDiscount}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold mb-6 uppercase tracking-wider">
              <span>Save {discountPercent}% Today</span>
            </div>
          </CMSIf>

          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            <CMSField value={title} fallback="Take Action Today" />
          </h2>

          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8">
            Complete your qualification online with verified assessor feedback and rapid certification turnaround.
          </p>

          <CMSLink
            href={buttonUrl}
            className="inline-flex items-center px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-blue-600/30"
          >
            <CMSField value={buttonText} fallback="Enroll Now" />
          </CMSLink>
        </div>
      </section>
    );
  },
});
