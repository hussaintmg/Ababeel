/**
 * Starter Package Template Manifest
 * Registers all starter sections with their metadata, categories, and props.
 */

export const STARTER_MANIFEST = {
  id: "cms-starter-templates-pack",
  name: "Official CMS Template SDK Starter Pack",
  version: "2.0.0",
  sdkVersion: "2.0.0",
  description: "Collection of 7 ready-to-use CMS sections demonstrating dynamic data, loops, and conditions",
  sections: [
    {
      id: "starter-simple-hero",
      name: "Simple Hero",
      category: "Hero Sections",
      file: "./sections/SimpleHero.jsx",
    },
    {
      id: "starter-dynamic-hero",
      name: "Dynamic Hero",
      category: "Hero Sections",
      file: "./sections/DynamicHero.jsx",
    },
    {
      id: "starter-course-grid",
      name: "Course Grid",
      category: "Courses",
      file: "./sections/CourseGrid.jsx",
    },
    {
      id: "starter-testimonials-loop",
      name: "Testimonials Loop",
      category: "Testimonials",
      file: "./sections/TestimonialsLoop.jsx",
    },
    {
      id: "starter-nested-loops",
      name: "Nested Curriculum Loop",
      category: "Courses",
      file: "./sections/NestedLoopSection.jsx",
    },
    {
      id: "starter-conditional-cta",
      name: "Conditional CTA Banner",
      category: "CTA",
      file: "./sections/ConditionalCta.jsx",
    },
    {
      id: "starter-dynamic-profile-card",
      name: "Dynamic Profile Card",
      category: "Team & Profiles",
      file: "./sections/DynamicProfileCard.jsx",
    },
  ],
};

export default STARTER_MANIFEST;
