import React from "react";
import { defineSection, CMSField, CMSImage, CMSLink, CMSLoop } from "@/lib/cms/sdk";

export default defineSection({
  id: "starter-course-grid",
  name: "Course Grid",
  category: "Courses",
  description: "Responsive grid displaying multiple courses repeated using CMSLoop with custom alias 'course'",

  props: {
    heading: {
      type: "text",
      label: "Section Heading",
      default: "Explore Accredited Qualifications",
      dynamic: true,
    },
    courses: {
      type: "collection",
      label: "Course Collection",
      default: "courses",
      dynamic: true,
    },
  },

  dataRequirements: {
    courses: {
      type: "array",
      model: "Course",
      fields: ["title", "slug", "description", "price", "coverImage"],
    },
  },

  component: function CourseGrid({ heading, courses = "courses" }) {
    return (
      <section className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              <CMSField value={heading} fallback="Our Courses" />
            </h2>
            <p className="text-slate-400 text-sm">
              Discover industry-approved qualifications to advance your career.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CMSLoop
              source={courses}
              as="course"
              empty={
                <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                  No courses found in this category.
                </div>
              }
            >
              {(course, loop) => (
                <article className="rounded-2xl border border-slate-800 bg-slate-850 overflow-hidden hover:border-slate-700 transition-all flex flex-col shadow-lg">
                  <div className="aspect-video w-full overflow-hidden bg-slate-800 relative">
                    <CMSImage
                      source={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900/80 text-white backdrop-blur">
                      #{loop.number}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2 line-clamp-1">
                      <CMSField value={course.title} fallback="Untitled Course" />
                    </h3>

                    <p className="text-slate-400 text-sm mb-6 line-clamp-2 flex-1">
                      <CMSField value={course.description} fallback="No description provided." />
                    </p>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-lg font-bold text-sky-400">
                        <CMSField value={course.price} format="currency" fallback="Free" />
                      </div>

                      <CMSLink
                        href={`/courses/${course.slug}`}
                        className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors"
                      >
                        View Course
                      </CMSLink>
                    </div>
                  </div>
                </article>
              )}
            </CMSLoop>
          </div>
        </div>
      </section>
    );
  },
});
