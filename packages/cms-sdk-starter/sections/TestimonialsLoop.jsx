import React from "react";
import { defineSection, CMSField, CMSImage, CMSLoop } from "@/lib/cms/sdk";

export default defineSection({
  id: "starter-testimonials-loop",
  name: "Testimonials Loop",
  category: "Testimonials",
  description: "Looping customer and learner reviews using alias 'testimonial'",

  props: {
    heading: {
      type: "text",
      label: "Heading",
      default: "Trusted by Safety Leaders Worldwide",
      dynamic: true,
    },
    testimonials: {
      type: "collection",
      label: "Testimonials Collection",
      default: "testimonials",
      dynamic: true,
    },
  },

  dataRequirements: {
    testimonials: {
      type: "array",
      model: "Testimonial",
      fields: ["author", "role", "company", "quote", "avatar"],
    },
  },

  component: function TestimonialsLoop({ heading, testimonials = "testimonials" }) {
    return (
      <section className="py-20 px-6 bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <CMSField value={heading} fallback="What Our Learners Say" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CMSLoop
              source={testimonials}
              as="testimonial"
              empty={
                <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                  No testimonials available yet.
                </div>
              }
            >
              {(testimonial) => (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-sm">
                  <p className="text-slate-300 text-sm italic mb-6 leading-relaxed">
                    &ldquo;<CMSField value={testimonial.quote} fallback="Outstanding experience." />&rdquo;
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0">
                      <CMSImage
                        source={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-white">
                        <CMSField value={testimonial.author} fallback="Learner" />
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        <CMSField value={testimonial.role} fallback="Professional" />
                        {testimonial.company ? ` • ${testimonial.company}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CMSLoop>
          </div>
        </div>
      </section>
    );
  },
});
