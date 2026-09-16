import React from "react";
import { defineSection, CMSField, CMSLoop } from "@/lib/cms/sdk";

export default defineSection({
  id: "starter-nested-loops",
  name: "Nested Curriculum Loop",
  category: "Courses",
  description: "Demonstrates 3-level nested loops: Course -> Modules -> Lessons with distinct lexical aliases",

  props: {
    heading: {
      type: "text",
      label: "Heading",
      default: "Curriculum Syllabus & Lesson Breakdown",
      dynamic: true,
    },
    courses: {
      type: "collection",
      label: "Course Source",
      default: "courses",
      dynamic: true,
    },
  },

  component: function NestedLoopSection({ heading, courses = "courses" }) {
    return (
      <section className="py-16 px-6 bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            <CMSField value={heading} fallback="Detailed Syllabus" />
          </h2>

          {/* LEVEL 1: Course in Courses */}
          <CMSLoop source={courses} as="course">
            {(course, courseLoop) => (
              <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-sky-400">
                    Course {courseLoop.number}: <CMSField value={course.title} fallback="Untitled Course" />
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                    {course.slug || "course"}
                  </span>
                </div>

                {/* LEVEL 2: Module in course.modules */}
                <div className="space-y-4">
                  <CMSLoop
                    source={course.modules || []}
                    as="module"
                    empty={<p className="text-xs text-slate-500">No modules listed for this course.</p>}
                  >
                    {(module, moduleLoop) => (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                        <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-600/30 text-sky-300 text-[11px] flex items-center justify-center font-bold">
                            {moduleLoop.number}
                          </span>
                          <span><CMSField value={module.title} fallback={`Module ${moduleLoop.number}`} /></span>
                        </h4>

                        {/* LEVEL 3: Lesson in module.lessons */}
                        <ul className="pl-6 space-y-2 border-l border-slate-800 text-xs text-slate-400">
                          <CMSLoop
                            source={module.lessons || []}
                            as="lesson"
                            empty={<li className="italic text-slate-600">No lessons configured.</li>}
                          >
                            {(lesson, lessonLoop) => (
                              <li className="flex items-center justify-between py-1">
                                <span className="text-slate-300">
                                  {lessonLoop.number}. <CMSField value={lesson.title} fallback="Lesson" />
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  <CMSField value={lesson.duration} fallback="15 mins" />
                                </span>
                              </li>
                            )}
                          </CMSLoop>
                        </ul>
                      </div>
                    )}
                  </CMSLoop>
                </div>
              </div>
            )}
          </CMSLoop>
        </div>
      </section>
    );
  },
});
