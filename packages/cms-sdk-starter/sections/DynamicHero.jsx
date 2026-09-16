import React from "react";
import { defineSection, CMSField, CMSImage, CMSLink, useCMSData } from "@/lib/cms/sdk";

export default defineSection({
  id: "starter-dynamic-hero",
  name: "Dynamic Hero",
  category: "Hero Sections",
  description: "Hero bound directly to single-record course or siteSettings data",

  props: {
    courseSlug: {
      type: "text",
      label: "Course Slug / ID",
      default: "{{route.params.slug}}",
      dynamic: true,
    },
    defaultTitle: {
      type: "text",
      label: "Fallback Title",
      default: "Comprehensive Workplace Safety Certification",
      dynamic: false,
    },
  },

  dataRequirements: {
    course: {
      type: "single",
      model: "Course",
      fields: ["title", "slug", "description", "coverImage", "price"],
    },
  },

  component: function DynamicHero({ defaultTitle }) {
    const course = useCMSData("course") || {};
    const title = course.title || defaultTitle;
    const description = course.description || "Course details and curriculum breakdown.";
    const image = course.coverImage || "/ababeel-logo.svg";
    const price = course.price ? `$${course.price}` : "Free";

    return (
      <section className="bg-slate-950 py-16 px-6 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded bg-sky-500/20 text-sky-400 font-mono text-xs font-semibold uppercase mb-4">
              Single Document Scope
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              <CMSField value={title} fallback={defaultTitle} />
            </h1>
            <p className="text-slate-300 text-base mb-6 leading-relaxed">
              <CMSField value={description} />
            </p>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-sky-400">{price}</div>
              <CMSLink
                href={`/enroll?course=${course.slug || ""}`}
                className="px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all"
              >
                Enroll Now
              </CMSLink>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center">
            <CMSImage source={image} alt={String(title)} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    );
  },
});
