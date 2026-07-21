// Client-safe block schema definitions. Used by the page-builder editor to
// render forms and by "add block" to create sensible defaults. The renderer
// (BlockRenderer.jsx) reads the same prop shapes.

let _uid = 0;
export function newId() {
  _uid += 1;
  return `b_${Date.now().toString(36)}_${_uid}`;
}

export const BLOCK_TYPES = {
  hero: {
    label: "Hero",
    icon: "Sparkles",
    description: "Big banner with title, subtitle and buttons",
    defaults: {
      eyebrow: "",
      title: "Your headline here",
      subtitle: "A supporting sentence that explains the value.",
      align: "center",
      bgType: "solid",
      bgColor: "#0f172a",
      gradFrom: "#2563eb",
      gradTo: "#0f172a",
      gradAngle: "135",
      textColor: "#ffffff",
      image: "",
      overlay: "55",
      minHeight: "",
      rounded: false,
      primaryCta: { label: "Get Started", href: "/contact-us" },
      secondaryCta: { label: "", href: "" },
    },
    fields: [
      { key: "eyebrow", type: "text", label: "Eyebrow (small label)" },
      { key: "title", type: "text", label: "Title" },
      { key: "subtitle", type: "textarea", label: "Subtitle" },
      { key: "align", type: "select", label: "Alignment", options: ["left", "center"] },
      { key: "bgType", type: "select", label: "Background type", options: ["solid", "gradient"] },
      { key: "bgColor", type: "color", label: "Background color (solid)" },
      { key: "gradFrom", type: "color", label: "Gradient from" },
      { key: "gradTo", type: "color", label: "Gradient to" },
      { key: "gradAngle", type: "text", label: "Gradient angle (deg)" },
      { key: "textColor", type: "color", label: "Text color" },
      { key: "image", type: "image", label: "Background image (optional)" },
      { key: "overlay", type: "text", label: "Image dark overlay (0–100)" },
      { key: "minHeight", type: "text", label: "Min height in px (e.g. 600)" },
      { key: "rounded", type: "boolean", label: "Rounded corners" },
      { key: "primaryCta", type: "link", label: "Primary button" },
      { key: "secondaryCta", type: "link", label: "Secondary button" },
    ],
  },

  heading: {
    label: "Heading",
    icon: "Heading",
    description: "A section heading with optional subtitle",
    defaults: { text: "Section title", subtitle: "", level: "2", align: "center" },
    fields: [
      { key: "text", type: "text", label: "Heading text" },
      { key: "subtitle", type: "textarea", label: "Subtitle (optional)" },
      { key: "level", type: "select", label: "Size", options: ["1", "2", "3"] },
      { key: "align", type: "select", label: "Alignment", options: ["left", "center", "right"] },
    ],
  },

  richText: {
    label: "Rich Text",
    icon: "Type",
    description: "Free HTML content (paragraphs, lists, links...)",
    defaults: {
      html: "<p>Write your content here. You can use <strong>bold</strong>, <em>italic</em>, lists and links.</p>",
      maxWidth: "prose",
      align: "left",
    },
    fields: [
      { key: "html", type: "richtext", label: "Content (HTML)" },
      { key: "maxWidth", type: "select", label: "Width", options: ["prose", "full"] },
      { key: "align", type: "select", label: "Text align", options: ["left", "center", "right"] },
    ],
  },

  image: {
    label: "Image",
    icon: "Image",
    description: "A single image with optional caption",
    defaults: { src: "", alt: "", caption: "", rounded: true, maxWidth: "800" },
    fields: [
      { key: "src", type: "image", label: "Image" },
      { key: "alt", type: "text", label: "Alt text" },
      { key: "caption", type: "text", label: "Caption (optional)" },
      { key: "rounded", type: "boolean", label: "Rounded corners" },
      { key: "maxWidth", type: "text", label: "Max width in px (or 'full')" },
    ],
  },

  cardGrid: {
    label: "Card Grid",
    icon: "LayoutGrid",
    description: "A responsive grid of feature/service cards",
    defaults: {
      title: "What we offer",
      subtitle: "",
      columns: "3",
      items: [
        { icon: "🎯", title: "Feature one", text: "Short description of this feature.", image: "", href: "" },
        { icon: "⚡", title: "Feature two", text: "Short description of this feature.", image: "", href: "" },
        { icon: "🛡️", title: "Feature three", text: "Short description of this feature.", image: "", href: "" },
      ],
    },
    fields: [
      { key: "title", type: "text", label: "Section title" },
      { key: "subtitle", type: "textarea", label: "Section subtitle" },
      { key: "columns", type: "select", label: "Columns", options: ["2", "3", "4"] },
      {
        key: "items",
        type: "list",
        label: "Cards",
        itemLabel: "Card",
        itemFields: [
          { key: "icon", type: "text", label: "Icon / emoji" },
          { key: "image", type: "image", label: "Image (optional, replaces icon)" },
          { key: "title", type: "text", label: "Title" },
          { key: "text", type: "textarea", label: "Text" },
          { key: "href", type: "text", label: "Link (optional)" },
        ],
      },
    ],
  },

  stats: {
    label: "Stats / Numbers",
    icon: "BarChart3",
    description: "A row of highlighted numbers",
    defaults: {
      title: "",
      bgColor: "#f1f5f9",
      items: [
        { value: "500+", label: "Certified professionals" },
        { value: "25", label: "Countries" },
        { value: "98%", label: "Pass rate" },
        { value: "10+", label: "Years experience" },
      ],
    },
    fields: [
      { key: "title", type: "text", label: "Title (optional)" },
      { key: "bgColor", type: "color", label: "Background color" },
      {
        key: "items",
        type: "list",
        label: "Numbers",
        itemLabel: "Stat",
        itemFields: [
          { key: "value", type: "text", label: "Value" },
          { key: "label", type: "text", label: "Label" },
        ],
      },
    ],
  },

  faq: {
    label: "FAQ Accordion",
    icon: "HelpCircle",
    description: "Expandable question/answer list",
    defaults: {
      title: "Frequently Asked Questions",
      items: [
        { q: "How do I get started?", a: "Reach out via the contact page and our team will guide you." },
        { q: "Are your certifications recognized?", a: "Yes, our qualifications align with international standards." },
      ],
    },
    fields: [
      { key: "title", type: "text", label: "Title" },
      {
        key: "items",
        type: "list",
        label: "Questions",
        itemLabel: "Q&A",
        itemFields: [
          { key: "q", type: "text", label: "Question" },
          { key: "a", type: "textarea", label: "Answer" },
        ],
      },
    ],
  },

  columns: {
    label: "Columns",
    icon: "Columns3",
    description: "Two or more rich-text columns",
    defaults: {
      columns: [
        { html: "<h3>Column one</h3><p>Content...</p>" },
        { html: "<h3>Column two</h3><p>Content...</p>" },
      ],
    },
    fields: [
      {
        key: "columns",
        type: "list",
        label: "Columns",
        itemLabel: "Column",
        itemFields: [{ key: "html", type: "richtext", label: "Content (HTML)" }],
      },
    ],
  },

  cta: {
    label: "Call To Action",
    icon: "MousePointerClick",
    description: "A prompt with a button",
    defaults: {
      title: "Ready to get certified?",
      text: "Join hundreds of professionals advancing their careers.",
      button: { label: "Contact Us", href: "/contact-us" },
      bgColor: "#2563eb",
      textColor: "#ffffff",
    },
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "text", type: "textarea", label: "Text" },
      { key: "button", type: "link", label: "Button" },
      { key: "bgColor", type: "color", label: "Background color" },
      { key: "textColor", type: "color", label: "Text color" },
    ],
  },

  banner: {
    label: "Banner Strip",
    icon: "Megaphone",
    description: "A thin full-width announcement strip",
    defaults: { text: "🎉 New qualifications now available!", href: "", bgColor: "#111827", textColor: "#ffffff" },
    fields: [
      { key: "text", type: "text", label: "Text" },
      { key: "href", type: "text", label: "Link (optional)" },
      { key: "bgColor", type: "color", label: "Background color" },
      { key: "textColor", type: "color", label: "Text color" },
    ],
  },

  spacer: {
    label: "Spacer",
    icon: "MoveVertical",
    description: "Vertical empty space",
    defaults: { size: "48" },
    fields: [{ key: "size", type: "text", label: "Height in px" }],
  },

  carousel: {
    label: "Image Slider",
    icon: "GalleryHorizontal",
    description: "Auto-playing image carousel / sliding box",
    defaults: {
      height: "440",
      variant: "fade",
      contentAlign: "bottom",
      overlay: "",
      kenBurns: false,
      fullWidth: false,
      autoplay: true,
      interval: "4",
      showArrows: true,
      showDots: true,
      rounded: true,
      slides: [
        { image: "", title: "Slide one", caption: "Add a short caption here", href: "", ctaLabel: "" },
        { image: "", title: "Slide two", caption: "Add a short caption here", href: "", ctaLabel: "" },
        { image: "", title: "Slide three", caption: "Add a short caption here", href: "", ctaLabel: "" },
      ],
    },
    fields: [
      { key: "height", type: "text", label: "Height (px)" },
      { key: "variant", type: "select", label: "Transition style", options: ["fade", "slide", "slide-up", "zoom"] },
      { key: "contentAlign", type: "select", label: "Caption position", options: [{ value: "bottom", label: "bottom" }, { value: "center", label: "center" }, { value: "left", label: "left" }] },
      { key: "overlay", type: "text", label: "Dark overlay (0–100, blank = gradient)" },
      { key: "kenBurns", type: "boolean", label: "Ken Burns zoom effect" },
      { key: "fullWidth", type: "boolean", label: "Full-bleed (edge to edge)" },
      { key: "autoplay", type: "boolean", label: "Auto-play" },
      { key: "interval", type: "text", label: "Auto-play seconds" },
      { key: "showArrows", type: "boolean", label: "Show arrows" },
      { key: "showDots", type: "boolean", label: "Show dots" },
      { key: "rounded", type: "boolean", label: "Rounded corners" },
      {
        key: "slides",
        type: "list",
        label: "Slides",
        itemLabel: "Slide",
        itemFields: [
          { key: "image", type: "image", label: "Image" },
          { key: "title", type: "text", label: "Title" },
          { key: "caption", type: "textarea", label: "Caption" },
          { key: "href", type: "text", label: "Link (optional)" },
          { key: "ctaLabel", type: "text", label: "Button label (optional)" },
        ],
      },
    ],
  },

  gallery: {
    label: "Gallery",
    icon: "Images",
    description: "Responsive image grid",
    defaults: {
      columns: "3",
      gap: "12",
      rounded: true,
      images: [
        { src: "", alt: "" },
        { src: "", alt: "" },
        { src: "", alt: "" },
      ],
    },
    fields: [
      { key: "columns", type: "select", label: "Columns", options: ["2", "3", "4"] },
      { key: "gap", type: "text", label: "Gap (px)" },
      { key: "rounded", type: "boolean", label: "Rounded corners" },
      {
        key: "images",
        type: "list",
        label: "Images",
        itemLabel: "Image",
        itemFields: [
          { key: "src", type: "image", label: "Image" },
          { key: "alt", type: "text", label: "Alt text" },
        ],
      },
    ],
  },

  testimonials: {
    label: "Testimonials",
    icon: "Quote",
    description: "Customer quotes slider",
    defaults: {
      title: "What people say",
      layout: "slider",
      items: [
        { quote: "Excellent training and outstanding support throughout.", name: "Jane Doe", role: "Safety Officer", avatar: "", rating: "5" },
        { quote: "A highly recognized certification that opened new doors.", name: "John Smith", role: "Site Manager", avatar: "", rating: "5" },
      ],
    },
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "layout", type: "select", label: "Layout", options: [{ value: "slider", label: "slider" }, { value: "grid", label: "grid (all cards)" }] },
      {
        key: "items",
        type: "list",
        label: "Testimonials",
        itemLabel: "Quote",
        itemFields: [
          { key: "quote", type: "textarea", label: "Quote" },
          { key: "name", type: "text", label: "Name" },
          { key: "role", type: "text", label: "Role" },
          { key: "avatar", type: "image", label: "Avatar" },
          { key: "rating", type: "select", label: "Rating", options: ["5", "4", "3", "2", "1"] },
        ],
      },
    ],
  },

  pricing: {
    label: "Pricing",
    icon: "BadgeDollarSign",
    description: "Pricing / plan cards",
    defaults: {
      title: "Choose your plan",
      subtitle: "",
      tiers: [
        { name: "Basic", price: "£99", period: "/course", features: "Course access\nDigital certificate\nEmail support", cta: { label: "Get Started", href: "/contact-us" }, highlighted: false },
        { name: "Professional", price: "£199", period: "/course", features: "Everything in Basic\nPriority assessment\nPrinted certificate\n1:1 mentoring", cta: { label: "Get Started", href: "/contact-us" }, highlighted: true },
        { name: "Enterprise", price: "Custom", period: "", features: "Team onboarding\nBulk pricing\nDedicated manager", cta: { label: "Contact Sales", href: "/contact-us" }, highlighted: false },
      ],
    },
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "subtitle", type: "textarea", label: "Subtitle" },
      {
        key: "tiers",
        type: "list",
        label: "Plans",
        itemLabel: "Plan",
        itemFields: [
          { key: "name", type: "text", label: "Name" },
          { key: "price", type: "text", label: "Price" },
          { key: "period", type: "text", label: "Period" },
          { key: "features", type: "textarea", label: "Features (one per line)" },
          { key: "cta", type: "link", label: "Button" },
          { key: "highlighted", type: "boolean", label: "Highlight this plan" },
        ],
      },
    ],
  },

  logos: {
    label: "Logo Cloud",
    icon: "Building2",
    description: "Row of partner / client logos",
    defaults: {
      title: "Trusted by leading organizations",
      items: [{ image: "", alt: "" }, { image: "", alt: "" }, { image: "", alt: "" }, { image: "", alt: "" }],
    },
    fields: [
      { key: "title", type: "text", label: "Title" },
      {
        key: "items",
        type: "list",
        label: "Logos",
        itemLabel: "Logo",
        itemFields: [
          { key: "image", type: "image", label: "Logo image" },
          { key: "alt", type: "text", label: "Alt text" },
        ],
      },
    ],
  },

  team: {
    label: "Team",
    icon: "UsersRound",
    description: "Team member cards",
    defaults: {
      title: "Meet the team",
      columns: "3",
      members: [
        { photo: "", name: "Full Name", role: "Role / Title", bio: "" },
        { photo: "", name: "Full Name", role: "Role / Title", bio: "" },
        { photo: "", name: "Full Name", role: "Role / Title", bio: "" },
      ],
    },
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "columns", type: "select", label: "Columns", options: ["2", "3", "4"] },
      {
        key: "members",
        type: "list",
        label: "Members",
        itemLabel: "Member",
        itemFields: [
          { key: "photo", type: "image", label: "Photo" },
          { key: "name", type: "text", label: "Name" },
          { key: "role", type: "text", label: "Role" },
          { key: "bio", type: "textarea", label: "Short bio" },
        ],
      },
    ],
  },

  video: {
    label: "Video Embed",
    icon: "Video",
    description: "Embed a YouTube / Vimeo video",
    defaults: { url: "", title: "", maxWidth: "900" },
    fields: [
      { key: "url", type: "text", label: "YouTube / Vimeo URL" },
      { key: "title", type: "text", label: "Caption (optional)" },
      { key: "maxWidth", type: "text", label: "Max width (px)" },
    ],
  },

  customCode: {
    label: "Custom HTML + Tailwind",
    icon: "Code2",
    description: "Write raw HTML using Tailwind utility classes",
    defaults: {
      html:
        '<div class="max-w-4xl mx-auto px-6 py-14 text-center">\n  <span class="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-700">Custom Section</span>\n  <h2 class="text-3xl md:text-4xl font-bold text-gray-900">Build anything with Tailwind</h2>\n  <p class="mt-4 text-gray-600 max-w-2xl mx-auto">Edit this HTML directly and use any Tailwind utility class — grids, flex, colors, spacing, shadows, hover states and responsive prefixes all work.</p>\n  <div class="mt-8 flex flex-wrap gap-4 justify-center">\n    <a href="/contact-us" class="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition">Primary Button</a>\n    <a href="#" class="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition">Secondary</a>\n  </div>\n</div>',
      tailwind: true,
    },
    fields: [
      { key: "html", type: "code", label: "HTML (Tailwind classes supported)" },
      { key: "tailwind", type: "boolean", label: "Enable Tailwind runtime for this block" },
    ],
  },
};

export const BLOCK_TYPE_LIST = Object.entries(BLOCK_TYPES).map(([type, def]) => ({
  type,
  ...def,
}));

// Default visual-style bag applied to every block (edited in the Design tab).
export function defaultStyle() {
  return {
    // Background
    bgType: "solid", // "solid" | "gradient"
    bgColor: "",
    gradFrom: "",
    gradTo: "",
    gradAngle: "135",
    bgImage: "",
    bgOverlay: "", // dark overlay % over the bg image (0-100)
    textColor: "",
    // Spacing (paddingY/X are the simple controls; the four sides override them)
    paddingY: "",
    paddingX: "",
    paddingTop: "",
    paddingRight: "",
    paddingBottom: "",
    paddingLeft: "",
    marginTop: "",
    marginBottom: "",
    // Box
    maxWidth: "",
    minHeight: "",
    radius: "",
    shadow: "none",
    borderWidth: "",
    borderColor: "",
    align: "",
    // Motion
    animation: "none", // none | fade | fade-up | fade-down | fade-left | fade-right | zoom-in | zoom-out
    animDuration: "",
    animDelay: "",
    hover: "none", // none | lift | glow | zoom
    // Advanced
    className: "",
    anchorId: "",
  };
}

export function createBlock(type) {
  const def = BLOCK_TYPES[type];
  if (!def) return null;
  return {
    id: newId(),
    type,
    props: structuredClone(def.defaults),
    _style: defaultStyle(),
  };
}
