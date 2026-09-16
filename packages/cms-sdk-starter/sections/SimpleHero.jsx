import React from "react";
import { defineSection, CMSField, CMSLink } from "@/lib/cms/sdk";

export default defineSection({
  id: "starter-simple-hero",
  name: "Simple Hero",
  category: "Hero Sections",
  description: "Clean editable hero section with headline, description and CTA button",

  props: {
    badgeText: {
      type: "text",
      label: "Eyebrow Badge",
      default: "Industry Accreditation",
      dynamic: true,
    },
    heading: {
      type: "text",
      label: "Main Heading",
      default: "Professional Standards for High-Risk Environments",
      dynamic: true,
    },
    subheading: {
      type: "textarea",
      label: "Subheading",
      default: "Certified qualifications, continuous development, and verified compliance.",
      dynamic: true,
    },
    ctaText: {
      type: "text",
      label: "Button Label",
      default: "Get Started Today",
      dynamic: false,
    },
    ctaUrl: {
      type: "text",
      label: "Button URL",
      default: "/courses",
      dynamic: false,
    },
  },

  component: function SimpleHero({ badgeText, heading, subheading, ctaText, ctaUrl }) {
    return (
      <section className="relative overflow-hidden bg-slate-900 py-20 px-6 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-3.5 py-1 mb-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider border border-blue-400/30">
            <CMSField value={badgeText} fallback="Welcome" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            <CMSField value={heading} fallback="Headline Goes Here" />
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            <CMSField value={subheading} fallback="Subheading description..." />
          </p>

          <CMSLink
            href={ctaUrl}
            className="inline-flex items-center px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/30"
          >
            <CMSField value={ctaText} fallback="Learn More" />
          </CMSLink>
        </div>
      </section>
    );
  },
});
