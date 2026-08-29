/**
 * What each training resource's owner screen looks like.
 *
 * The server has its own field whitelist in `lib/training/resources.js` — that
 * one is the security boundary and this one is the user interface. They are
 * deliberately separate files: a field can be shown in a different order, split
 * across tabs or given help text without touching what the API accepts, and a
 * field added here that the server does not allow is simply dropped rather than
 * becoming a hole.
 *
 * Client-safe: no model imports, so the editor can import it directly.
 */

const STATUS_PUBLISH = [
  { value: "draft", label: "Draft — not on the public site" },
  { value: "published", label: "Published — live" },
  { value: "disabled", label: "Disabled — taken down" },
];

const STATUS_COURSE = [
  { value: "draft", label: "Draft — not on the public site" },
  { value: "published", label: "Published — live" },
  { value: "archived", label: "Archived — kept for its registrations" },
];

const STATUS_SESSION = [
  { value: "draft", label: "Draft — not on the public site" },
  { value: "open", label: "Open — accepting registrations" },
  { value: "closed", label: "Closed — listed, registration closed" },
  { value: "cancelled", label: "Cancelled — shown as cancelled" },
  { value: "completed", label: "Completed — historical" },
];

/** The SEO group every public entity shares. */
const SEO_SECTION = {
  title: "Search & sharing",
  description: "Leave blank to fall back to the name and description above.",
  fields: [
    { key: "seo.title", type: "text", label: "SEO title" },
    { key: "seo.description", type: "textarea", label: "Meta description" },
    { key: "seo.ogImage", type: "image", label: "Share image" },
    { key: "seo.keywords", type: "text", label: "Keywords" },
    { key: "seo.noIndex", type: "boolean", label: "Hide from search engines" },
  ],
};

const GALLERY_FIELD = {
  key: "gallery",
  type: "list",
  label: "Gallery",
  itemLabel: "image",
  itemFields: [
    { key: "url", type: "image", label: "Image" },
    { key: "alt", type: "text", label: "Alt text" },
    { key: "caption", type: "text", label: "Caption" },
  ],
};

const SOCIAL_FIELD = {
  key: "socialLinks",
  type: "list",
  label: "Social links",
  itemLabel: "link",
  itemFields: [
    { key: "platform", type: "text", label: "Platform", placeholder: "LinkedIn" },
    { key: "url", type: "text", label: "URL" },
  ],
};

export const SPECS = {
  courses: {
    label: "Courses",
    singular: "Course",
    icon: "BookOpen",
    statusOptions: STATUS_COURSE,
    reorderable: true,
    columns: [
      { key: "name", label: "Course", primary: true, image: "featuredImage" },
      { key: "code", label: "Code" },
      { key: "level.name", label: "Level" },
      { key: "awardingBody.name", label: "Awarding body" },
      { key: "status", label: "Status", type: "status" },
    ],
    sections: [
      {
        title: "Basics",
        fields: [
          { key: "name", type: "text", label: "Course name", required: true },
          { key: "code", type: "text", label: "Course code", placeholder: "ASP" },
          {
            key: "slug",
            type: "text",
            label: "URL slug",
            help: "Leave blank to generate from the name. Changing it breaks existing links.",
          },
          {
            key: "shortDescription",
            type: "textarea",
            label: "Short description",
            help: "One or two sentences. Used on cards and in search results.",
          },
          { key: "description", type: "richtext", label: "Full description" },
        ],
      },
      {
        title: "Classification",
        fields: [
          { key: "level", type: "ref", label: "Level", resource: "levels" },
          { key: "awardingBody", type: "ref", label: "Awarding body", resource: "awarding-bodies" },
          { key: "category", type: "text", label: "Category", placeholder: "Occupational safety" },
          { key: "duration", type: "text", label: "Duration", placeholder: "5 days" },
          {
            key: "durationDays",
            type: "number",
            label: "Duration in days",
            help: "Used by the duration filter and sorting. Leave at 0 if it does not apply.",
          },
        ],
      },
      {
        title: "Images",
        fields: [
          { key: "featuredImage", type: "image", label: "Featured image" },
          GALLERY_FIELD,
        ],
      },
      {
        title: "Course detail",
        description: "Each of these becomes a section on the public course page. Leave any blank to omit it.",
        fields: [
          { key: "learningOutcomes", type: "richtext", label: "Learning outcomes" },
          { key: "courseContent", type: "richtext", label: "Course content" },
          { key: "whoShouldAttend", type: "richtext", label: "Who should attend" },
          { key: "requirements", type: "richtext", label: "Entry requirements" },
        ],
      },
      {
        title: "Certification",
        fields: [
          {
            key: "certificateImage",
            type: "image",
            label: "Certificate image",
            help: "Optional. When empty, the default certificate from Website CMS → Global settings is shown instead.",
          },
          { key: "certificationInfo", type: "textarea", label: "Certification notes" },
        ],
      },
      {
        title: "FAQs",
        fields: [
          {
            key: "faqs",
            type: "list",
            label: "Questions",
            itemLabel: "question",
            itemFields: [
              { key: "question", type: "text", label: "Question" },
              { key: "answer", type: "textarea", label: "Answer" },
            ],
          },
        ],
      },
      {
        title: "Publishing",
        fields: [
          { key: "status", type: "select", label: "Status", options: STATUS_COURSE },
          { key: "featured", type: "boolean", label: "Feature this course" },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
      SEO_SECTION,
    ],
  },

  sessions: {
    label: "Course References",
    singular: "Course Reference",
    icon: "CalendarDays",
    statusOptions: STATUS_SESSION,
    columns: [
      { key: "referenceName", label: "Reference", primary: true },
      { key: "course.name", label: "Course" },
      { key: "startDate", label: "Starts", type: "date" },
      { key: "mode", label: "Mode" },
      { key: "showInSchedule", label: "On schedule", type: "boolean" },
      { key: "status", label: "Status", type: "status" },
    ],
    sections: [
      {
        title: "Session",
        fields: [
          { key: "course", type: "ref", label: "Course", resource: "courses", required: true },
          {
            key: "referenceName",
            type: "text",
            label: "Reference name",
            placeholder: "ASP — September 2026",
          },
          { key: "referenceCode", type: "text", label: "Reference code", placeholder: "ASP-2026-09" },
        ],
      },
      {
        title: "Dates",
        fields: [
          { key: "startDate", type: "date", label: "Start date" },
          { key: "endDate", type: "date", label: "End date" },
          { key: "examDate", type: "date", label: "Exam date" },
          {
            key: "registrationDeadline",
            type: "date",
            label: "Registration deadline",
            help: "After this date the register button closes on its own.",
          },
        ],
      },
      {
        title: "Delivery",
        fields: [
          {
            key: "mode",
            type: "select",
            label: "Mode",
            options: [
              { value: "online", label: "Online" },
              { value: "physical", label: "In person" },
              { value: "hybrid", label: "Hybrid" },
              { value: "other", label: "Other" },
            ],
          },
          {
            key: "modeLabel",
            type: "text",
            label: "Custom mode label",
            help: 'Shown instead of the mode above. Required if the mode is "Other".',
          },
          { key: "location", type: "text", label: "Location" },
          {
            key: "duration",
            type: "text",
            label: "Duration",
            help: "Overrides the course duration for this session only.",
          },
          { key: "seats", type: "number", label: "Seats" },
          { key: "notes", type: "textarea", label: "Internal notes" },
        ],
      },
      {
        title: "Visibility",
        fields: [
          { key: "status", type: "select", label: "Status", options: STATUS_SESSION },
          {
            key: "showInSchedule",
            type: "boolean",
            label: "Show in the public schedule",
          },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
    ],
  },

  levels: {
    label: "Levels",
    singular: "Level",
    icon: "Layers",
    statusOptions: STATUS_PUBLISH,
    reorderable: true,
    columns: [
      { key: "name", label: "Level", primary: true },
      { key: "description", label: "Description" },
      { key: "status", label: "Status", type: "status" },
    ],
    sections: [
      {
        title: "Level",
        fields: [
          { key: "name", type: "text", label: "Name", required: true },
          { key: "description", type: "textarea", label: "Description" },
          { key: "icon", type: "text", label: "Icon", placeholder: "🎯", help: "A single emoji." },
          { key: "color", type: "color", label: "Badge colour" },
          { key: "image", type: "image", label: "Image" },
          { key: "status", type: "select", label: "Status", options: STATUS_PUBLISH },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
    ],
  },

  "awarding-bodies": {
    label: "Awarding Bodies",
    singular: "Awarding Body",
    icon: "Award",
    statusOptions: STATUS_PUBLISH,
    reorderable: true,
    columns: [
      { key: "name", label: "Awarding body", primary: true, image: "logo" },
      { key: "website", label: "Website" },
      { key: "status", label: "Status", type: "status" },
    ],
    sections: [
      {
        title: "Body",
        fields: [
          { key: "name", type: "text", label: "Name", required: true },
          { key: "shortName", type: "text", label: "Short name" },
          { key: "slug", type: "text", label: "URL slug", help: "Leave blank to generate from the name." },
          { key: "description", type: "richtext", label: "Description" },
          { key: "accreditationInfo", type: "richtext", label: "Accreditation information" },
          { key: "website", type: "text", label: "Website" },
        ],
      },
      {
        title: "Images",
        fields: [
          { key: "logo", type: "image", label: "Logo" },
          { key: "coverImage", type: "image", label: "Cover image" },
        ],
      },
      {
        title: "Publishing",
        fields: [
          { key: "status", type: "select", label: "Status", options: STATUS_PUBLISH },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
      SEO_SECTION,
    ],
  },

  accreditations: {
    label: "Accreditations",
    singular: "Accreditation",
    icon: "ShieldCheck",
    statusOptions: STATUS_PUBLISH,
    reorderable: true,
    columns: [
      { key: "name", label: "Accreditation", primary: true, image: "logo" },
      { key: "referenceNumber", label: "Reference" },
      { key: "showInTrustStrip", label: "Trust strip", type: "boolean" },
      { key: "status", label: "Status", type: "status" },
    ],
    sections: [
      {
        title: "Accreditation",
        fields: [
          { key: "name", type: "text", label: "Name", required: true },
          { key: "description", type: "textarea", label: "Description" },
          { key: "details", type: "richtext", label: "Details" },
          { key: "referenceNumber", type: "text", label: "Reference / membership number" },
          { key: "website", type: "text", label: "Website" },
        ],
      },
      {
        title: "Images",
        fields: [
          { key: "logo", type: "image", label: "Logo" },
          { key: "image", type: "image", label: "Certificate or photo" },
        ],
      },
      {
        title: "Publishing",
        fields: [
          {
            key: "showInTrustStrip",
            type: "boolean",
            label: "Show in the home page trust strip",
          },
          { key: "status", type: "select", label: "Status", options: STATUS_PUBLISH },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
    ],
  },

  testimonials: {
    label: "Testimonials",
    singular: "Testimonial",
    icon: "MessageSquareQuote",
    statusOptions: STATUS_PUBLISH,
    reorderable: true,
    columns: [
      { key: "name", label: "Reviewer", primary: true, image: "profileImage" },
      { key: "company", label: "Company" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status", type: "status" },
    ],
    sections: [
      {
        title: "Review",
        fields: [
          { key: "name", type: "text", label: "Reviewer name", required: true },
          { key: "reviewText", type: "textarea", label: "Review" },
          {
            key: "rating",
            type: "number",
            label: "Rating out of 5",
            min: 0,
            max: 5,
          },
          { key: "reviewDate", type: "date", label: "Review date" },
        ],
      },
      {
        title: "Reviewer",
        fields: [
          { key: "profileImage", type: "image", label: "Profile photo" },
          { key: "position", type: "text", label: "Position" },
          { key: "company", type: "text", label: "Company" },
        ],
      },
      {
        title: "Source",
        description:
          "These are presentational only — the site does not connect to any reviews service. Say where the review came from, and only claim a verification you can evidence.",
        fields: [
          { key: "sourceName", type: "text", label: "Source name", placeholder: "Google" },
          { key: "sourceLogo", type: "image", label: "Source logo" },
          { key: "sourceUrl", type: "text", label: "Link to the original" },
          {
            key: "verifiedLabel",
            type: "text",
            label: "Verification label",
            placeholder: "Verified review",
          },
        ],
      },
      {
        title: "Publishing",
        fields: [
          { key: "status", type: "select", label: "Status", options: STATUS_PUBLISH },
          { key: "featured", type: "boolean", label: "Feature this review" },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
    ],
  },

  team: {
    label: "Team",
    singular: "Team Member",
    icon: "Users",
    statusOptions: STATUS_PUBLISH,
    reorderable: true,
    columns: [
      { key: "name", label: "Name", primary: true, image: "profileImage" },
      { key: "position", label: "Position" },
      { key: "leadership", label: "Leadership", type: "boolean" },
      { key: "status", label: "Status", type: "status" },
    ],
    sections: [
      {
        title: "Person",
        fields: [
          { key: "name", type: "text", label: "Name", required: true },
          { key: "position", type: "text", label: "Position" },
          { key: "profileImage", type: "image", label: "Photo" },
          { key: "bio", type: "richtext", label: "Biography" },
          { key: "email", type: "text", label: "Email" },
        ],
      },
      {
        title: "Credentials",
        fields: [
          { key: "qualifications", type: "textarea", label: "Qualifications", help: "One per line." },
          { key: "certifications", type: "textarea", label: "Certifications", help: "One per line." },
          { key: "experience", type: "textarea", label: "Experience" },
          SOCIAL_FIELD,
        ],
      },
      {
        title: "Publishing",
        fields: [
          { key: "leadership", type: "boolean", label: "Leadership — shown first, larger" },
          { key: "status", type: "select", label: "Status", options: STATUS_PUBLISH },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
      SEO_SECTION,
    ],
  },

  consultants: {
    label: "Consultants",
    singular: "Consultant",
    icon: "UserCog",
    statusOptions: STATUS_PUBLISH,
    reorderable: true,
    columns: [
      { key: "name", label: "Name", primary: true, image: "profileImage" },
      { key: "position", label: "Position" },
      { key: "layout", label: "Layout" },
      { key: "status", label: "Status", type: "status" },
    ],
    sections: [
      {
        title: "Person",
        fields: [
          { key: "name", type: "text", label: "Name", required: true },
          { key: "position", type: "text", label: "Position" },
          { key: "profileImage", type: "image", label: "Photo" },
          { key: "bio", type: "richtext", label: "Biography" },
        ],
      },
      {
        title: "Credentials",
        fields: [
          { key: "expertise", type: "textarea", label: "Areas of expertise", help: "One per line." },
          { key: "qualifications", type: "textarea", label: "Qualifications", help: "One per line." },
          { key: "certifications", type: "textarea", label: "Certifications", help: "One per line." },
          { key: "experience", type: "textarea", label: "Experience" },
          SOCIAL_FIELD,
        ],
      },
      {
        title: "Presentation",
        fields: [
          {
            key: "layout",
            type: "select",
            label: "Layout",
            options: [
              { value: "image-left", label: "Image left, content right" },
              { value: "image-right", label: "Content left, image right" },
              { value: "carousel-left", label: "Image carousel left, content right" },
              { value: "content-carousel-content", label: "Content, carousel, content" },
              { value: "featured", label: "Large featured profile" },
            ],
          },
          { key: "showCarousel", type: "boolean", label: "Show the gallery as a carousel" },
          {
            key: "textAlign",
            type: "select",
            label: "Text alignment",
            options: [
              { value: "left", label: "Left" },
              { value: "center", label: "Centred" },
            ],
          },
          {
            key: "animation",
            type: "select",
            label: "Entrance animation",
            options: [
              { value: "", label: "None" },
              { value: "fade", label: "Fade" },
              { value: "fade-up", label: "Fade up" },
              { value: "fade-left", label: "Slide from the right" },
              { value: "fade-right", label: "Slide from the left" },
              { value: "zoom-in", label: "Scale" },
            ],
          },
          GALLERY_FIELD,
        ],
      },
      {
        title: "Publishing",
        fields: [
          { key: "featured", type: "boolean", label: "Feature this consultant" },
          { key: "status", type: "select", label: "Status", options: STATUS_PUBLISH },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
      SEO_SECTION,
    ],
  },

  "registration-fields": {
    label: "Registration Form",
    singular: "Field",
    icon: "ClipboardList",
    reorderable: true,
    columns: [
      { key: "label", label: "Field", primary: true },
      { key: "key", label: "Key" },
      { key: "type", label: "Type" },
      { key: "required", label: "Required", type: "boolean" },
      { key: "enabled", label: "Enabled", type: "boolean" },
    ],
    sections: [
      {
        title: "Field",
        fields: [
          { key: "label", type: "text", label: "Label", required: true },
          {
            key: "key",
            type: "text",
            label: "Key",
            required: true,
            lockOnEdit: true,
            help: "The name submissions are stored under. Fixed once the field exists, so past registrations keep their answers.",
          },
          {
            key: "type",
            type: "select",
            label: "Type",
            options: [
              { value: "text", label: "Text" },
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
              { value: "number", label: "Number" },
              { value: "select", label: "Dropdown" },
              { value: "radio", label: "Radio buttons" },
              { value: "checkbox", label: "Checkbox" },
              { value: "date", label: "Date" },
              { value: "textarea", label: "Long text" },
              { value: "file", label: "File upload" },
              { value: "country", label: "Country" },
            ],
          },
          { key: "placeholder", type: "text", label: "Placeholder" },
          { key: "helpText", type: "text", label: "Help text" },
        ],
      },
      {
        title: "Options",
        description: "For dropdown and radio fields only.",
        fields: [
          {
            key: "options",
            type: "list",
            label: "Choices",
            itemLabel: "choice",
            itemFields: [
              { key: "label", type: "text", label: "Label" },
              { key: "value", type: "text", label: "Stored value" },
            ],
          },
        ],
      },
      {
        title: "Rules",
        fields: [
          { key: "required", type: "boolean", label: "Required" },
          { key: "enabled", type: "boolean", label: "Show on the form" },
          {
            key: "width",
            type: "select",
            label: "Width",
            options: [
              { value: "full", label: "Full width" },
              { value: "half", label: "Half width" },
            ],
          },
          { key: "minLength", type: "number", label: "Minimum length" },
          { key: "maxLength", type: "number", label: "Maximum length" },
          {
            key: "pattern",
            type: "text",
            label: "Pattern",
            help: "A regular expression the answer must match. Leave blank for none.",
          },
          { key: "patternMessage", type: "text", label: "Message when the pattern fails" },
          {
            key: "bindTo",
            type: "select",
            label: "Save to",
            help: "Copies this answer onto the registration itself, so it appears in the list and in search.",
            options: [
              { value: "", label: "Answers only" },
              { value: "firstName", label: "First name" },
              { value: "lastName", label: "Last name" },
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
              { value: "company", label: "Company" },
              { value: "country", label: "Country" },
            ],
          },
          { key: "displayOrder", type: "number", label: "Display order" },
        ],
      },
    ],
  },
};

export const SPEC_KEYS = Object.keys(SPECS);

export function getSpec(key) {
  return Object.prototype.hasOwnProperty.call(SPECS, key) ? SPECS[key] : null;
}

/** Read a dotted path out of a document, for table columns like "level.name". */
export function readPath(doc, path) {
  return String(path || "")
    .split(".")
    .reduce((acc, part) => (acc == null ? acc : acc[part]), doc);
}

/** Write a dotted path into a form draft, creating the objects on the way. */
export function writePath(draft, path, value) {
  const parts = String(path || "").split(".");
  const next = { ...draft };
  let cursor = next;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    cursor[part] = { ...(cursor[part] || {}) };
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
  return next;
}
