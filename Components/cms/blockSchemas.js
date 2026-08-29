// Client-safe block schema definitions. Used by the page-builder editor to
// render forms and by "add block" to create sensible defaults. The renderer
// (BlockRenderer.jsx) reads the same prop shapes.

import {
  EASES,
  SCENE_ANIMATIONS,
  SCENE_POSITIONS,
  OVERLAY_KINDS,
  VISIBILITY,
} from "./scrollVideo/engine";

/**
 * Option lists shared with the Scroll Video engine.
 *
 * The renderer already knows every animation, ease and position it can honour.
 * Re-typing them here is how an editor ends up offering a choice the renderer
 * silently ignores, so the lists are imported rather than copied. engine.js is
 * plain maths with no React and no DOM, which is why it is safe to pull into a
 * file the server also reads.
 */
export const EASE_OPTIONS = EASES;
export const SCENE_ANIMATION_OPTIONS = SCENE_ANIMATIONS;
export const SCENE_POSITION_OPTIONS = SCENE_POSITIONS;
export const OVERLAY_KIND_OPTIONS = OVERLAY_KINDS;
export const VISIBILITY_OPTIONS = VISIBILITY;

import { TRAINING_BLOCK_TYPES } from "@/Components/cms/trainingBlockSchemas";

let _uid = 0;
export function newId() {
  _uid += 1;
  return `b_${Date.now().toString(36)}_${_uid}`;
}

/**
 * Appearance fields every repeating item gets.
 *
 * A card grid, a tile row and a stats band are all "several of the same thing",
 * and until now the only way to make one of them stand out was to give the
 * whole block a colour. These sit at the end of each item's fields, empty by
 * default, and each renderer falls back to the block's own setting when they
 * are — so an untouched item looks exactly as it did.
 */
export const ITEM_STYLE_FIELDS = [
  { key: "accent", type: "color", label: "Accent (this item only)" },
  { key: "bgColor", type: "color", label: "Background (this item only)" },
  { key: "textColor", type: "color", label: "Text colour (this item only)" },
];

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
      accent: "",
      badges: "",
      primaryCta: { label: "Get Started", href: "/contact-us" },
      secondaryCta: { label: "", href: "" },
    },
    fields: [
      { key: "eyebrow", type: "text", label: "Eyebrow (small label)" },
      { key: "title", type: "text", label: "Title" },
      { key: "subtitle", type: "textarea", label: "Subtitle" },
      { key: "align", type: "select", label: "Alignment", options: ["left", "center"] },
      { key: "accent", type: "color", label: "Accent colour (buttons, eyebrow)" },
      { key: "badges", type: "textarea", label: "Claims under the buttons", help: "One per line, or separated by |." },
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
      eyebrow: "",
      title: "What we offer",
      subtitle: "",
      columns: "3",
      accent: "",
      variant: "plain",
      items: [
        { icon: "🎯", title: "Feature one", text: "Short description of this feature.", image: "", href: "" },
        { icon: "⚡", title: "Feature two", text: "Short description of this feature.", image: "", href: "" },
        { icon: "🛡️", title: "Feature three", text: "Short description of this feature.", image: "", href: "" },
      ],
    },
    fields: [
      { key: "eyebrow", type: "text", label: "Eyebrow (small label)" },
      { key: "title", type: "text", label: "Section title" },
      { key: "subtitle", type: "textarea", label: "Section subtitle" },
      { key: "columns", type: "select", label: "Columns", options: ["2", "3", "4"] },
      { key: "accent", type: "color", label: "Accent colour" },
      {
        key: "variant",
        type: "select",
        label: "Card style",
        options: [
          { value: "plain", label: "Icon or image" },
          { value: "numbered", label: "Numbered (01, 02, 03…)" },
        ],
      },
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
          { key: "linkLabel", type: "text", label: "Link text (shown when a link is set)" },
          ...ITEM_STYLE_FIELDS,
        ],
      },
    ],
  },

  split: {
    label: "Image + Text",
    icon: "Columns2",
    description: "A picture beside a claim, a checklist and a button",
    defaults: {
      eyebrow: "",
      title: "A heading for this section",
      text: "<p>A paragraph explaining what this section is about.</p>",
      bullets: [{ text: "First point" }, { text: "Second point" }, { text: "Third point" }],
      image: "",
      imageAlt: "",
      imageSide: "left",
      accent: "",
      bgColor: "",
      badgeValue: "",
      badgeLabel: "",
      cta: { label: "", href: "" },
    },
    fields: [
      { key: "eyebrow", type: "text", label: "Eyebrow (small label)" },
      { key: "title", type: "text", label: "Title" },
      { key: "text", type: "richtext", label: "Text" },
      {
        key: "bullets",
        type: "list",
        label: "Checklist",
        itemLabel: "Point",
        itemFields: [
          { key: "text", type: "text", label: "Point" },
          { key: "icon", type: "text", label: "Icon / emoji (replaces the tick)" },
          { key: "accent", type: "color", label: "Tick colour (this point only)" },
          { key: "textColor", type: "color", label: "Text colour (this point only)" },
        ],
      },
      { key: "image", type: "image", label: "Image" },
      { key: "imageAlt", type: "text", label: "Image description (for screen readers)" },
      { key: "imageSide", type: "select", label: "Image side", options: ["left", "right"] },
      { key: "badgeValue", type: "text", label: "Badge number (optional)" },
      { key: "badgeLabel", type: "text", label: "Badge label" },
      { key: "cta", type: "link", label: "Button" },
      { key: "accent", type: "color", label: "Accent colour" },
      { key: "bgColor", type: "color", label: "Background colour" },
    ],
  },

  imageTiles: {
    label: "Image Tiles",
    icon: "Images",
    description: "Photo tiles with a caption over each picture",
    defaults: {
      eyebrow: "",
      title: "",
      subtitle: "",
      columns: "3",
      accent: "",
      bgColor: "",
      items: [
        { image: "", title: "First", text: "", href: "" },
        { image: "", title: "Second", text: "", href: "" },
        { image: "", title: "Third", text: "", href: "" },
      ],
    },
    fields: [
      { key: "eyebrow", type: "text", label: "Eyebrow (small label)" },
      { key: "title", type: "text", label: "Section title" },
      { key: "subtitle", type: "textarea", label: "Section subtitle" },
      { key: "columns", type: "select", label: "Columns", options: ["2", "3", "4"] },
      { key: "accent", type: "color", label: "Accent colour" },
      { key: "bgColor", type: "color", label: "Background colour" },
      {
        key: "items",
        type: "list",
        label: "Tiles",
        itemLabel: "Tile",
        itemFields: [
          { key: "image", type: "image", label: "Image" },
          { key: "title", type: "text", label: "Title" },
          { key: "text", type: "textarea", label: "Text" },
          { key: "href", type: "text", label: "Link (optional)" },
          ...ITEM_STYLE_FIELDS,
        ],
      },
    ],
  },

  beforeAfter: {
    label: "Before / After Slider",
    icon: "SlidersHorizontal",
    description: "Two photos with a handle that wipes between them",
    defaults: {
      eyebrow: "",
      title: "",
      subtitle: "",
      beforeImage: "",
      afterImage: "",
      beforeLabel: "Before",
      afterLabel: "After",
      startAt: "50",
      height: "520",
      accent: "",
      bgColor: "",
      beforeChipBg: "",
      beforeChipText: "",
      afterChipBg: "",
      afterChipText: "",
      handleColor: "",
      dividerColor: "",
      dividerWidth: "2",
      radius: "16",
      showHint: true,
    },
    fields: [
      { key: "eyebrow", type: "text", label: "Eyebrow (small label)" },
      { key: "title", type: "text", label: "Section title" },
      { key: "subtitle", type: "textarea", label: "Section subtitle" },
      { key: "beforeImage", type: "image", label: "Before image" },
      { key: "afterImage", type: "image", label: "After image" },
      { key: "beforeLabel", type: "text", label: "Before label" },
      { key: "afterLabel", type: "text", label: "After label" },
      {
        key: "startAt",
        type: "text",
        label: "Handle starts at (%)",
        help: "0 shows the after image, 100 shows the before image.",
      },
      { key: "height", type: "text", label: "Height (px)" },
      { key: "radius", type: "text", label: "Corner radius (px)" },
      { key: "accent", type: "color", label: "Accent colour" },
      { key: "beforeChipBg", type: "color", label: "Before label — background" },
      { key: "beforeChipText", type: "color", label: "Before label — text" },
      { key: "afterChipBg", type: "color", label: "After label — background" },
      { key: "afterChipText", type: "color", label: "After label — text" },
      { key: "handleColor", type: "color", label: "Handle colour" },
      { key: "dividerColor", type: "color", label: "Divider line colour" },
      { key: "dividerWidth", type: "text", label: "Divider line width (px)" },
      { key: "showHint", type: "boolean", label: "Show the \"drag the handle\" hint" },
      { key: "bgColor", type: "color", label: "Background colour" },
    ],
  },

  card: {
    label: "Card",
    icon: "Bookmark",
    description: "One card — put it inside a Repeat to render one per record",
    defaults: {
      variant: "elevated",
      image: "",
      icon: "",
      badge: "",
      eyebrow: "",
      title: "Card title",
      text: "A short description of this item.",
      meta: [],
      price: "",
      priceNote: "",
      href: "",
      linkLabel: "Learn more",
      buttonStyle: "link",
      accent: "",
    },
    fields: [
      {
        key: "variant",
        type: "select",
        label: "Style",
        options: [
          { value: "elevated", label: "Elevated (white, soft shadow)" },
          { value: "outline", label: "Outlined" },
          { value: "glass", label: "Glass (over a photo or gradient)" },
          { value: "dark", label: "Dark" },
          { value: "overlay", label: "Photo with the text over it" },
        ],
      },
      { key: "image", type: "image", label: "Image" },
      { key: "icon", type: "text", label: "Icon / emoji (used when there is no image)" },
      { key: "badge", type: "text", label: "Badge (optional)" },
      { key: "eyebrow", type: "text", label: "Eyebrow (small label)" },
      { key: "title", type: "text", label: "Title" },
      { key: "text", type: "textarea", label: "Text" },
      {
        key: "meta",
        type: "list",
        label: "Detail rows",
        itemLabel: "Row",
        itemFields: [
          { key: "label", type: "text", label: "Label" },
          { key: "value", type: "text", label: "Value" },
          { key: "accent", type: "color", label: "Value colour (this row only)" },
          { key: "textColor", type: "color", label: "Label colour (this row only)" },
          { key: "bgColor", type: "color", label: "Row background (this row only)" },
        ],
      },
      { key: "price", type: "text", label: "Price (optional)" },
      { key: "priceNote", type: "text", label: "Price note, e.g. per person" },
      { key: "href", type: "text", label: "Link" },
      { key: "linkLabel", type: "text", label: "Link text" },
      {
        key: "buttonStyle",
        type: "select",
        label: "Link style",
        options: [
          { value: "link", label: "Text link" },
          { value: "solid", label: "Full-width button" },
        ],
      },
      { key: "accent", type: "color", label: "Accent colour" },
    ],
  },

  stats: {
    label: "Stats / Numbers",
    icon: "BarChart3",
    description: "A row of highlighted numbers",
    defaults: {
      title: "",
      subtitle: "",
      accent: "",
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
      { key: "subtitle", type: "textarea", label: "Subtitle (optional)" },
      { key: "accent", type: "color", label: "Number colour" },
      { key: "bgColor", type: "color", label: "Background color" },
      {
        key: "items",
        type: "list",
        label: "Numbers",
        itemLabel: "Stat",
        itemFields: [
          { key: "value", type: "text", label: "Value" },
          { key: "suffix", type: "text", label: "Suffix (+, %, …)" },
          { key: "label", type: "text", label: "Label" },
          ...ITEM_STYLE_FIELDS,
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
      subtitle: "",
      columns: "1",
      accent: "",
      items: [
        { q: "How do I get started?", a: "Reach out via the contact page and our team will guide you." },
        { q: "Are your certifications recognized?", a: "Yes, our qualifications align with international standards." },
      ],
    },
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "subtitle", type: "textarea", label: "Subtitle (optional)" },
      { key: "columns", type: "select", label: "Columns", options: ["1", "2"] },
      { key: "accent", type: "color", label: "Accent colour" },
      {
        key: "items",
        type: "list",
        label: "Questions",
        itemLabel: "Q&A",
        itemFields: [
          { key: "q", type: "text", label: "Question" },
          { key: "a", type: "textarea", label: "Answer" },
          ...ITEM_STYLE_FIELDS,
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
      secondaryButton: { label: "", href: "" },
      bgColor: "#2563eb",
      textColor: "#ffffff",
    },
    fields: [
      { key: "title", type: "text", label: "Title" },
      { key: "text", type: "textarea", label: "Text" },
      { key: "button", type: "link", label: "Button" },
      { key: "secondaryButton", type: "link", label: "Second button (optional)" },
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
          ...ITEM_STYLE_FIELDS,
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
          ...ITEM_STYLE_FIELDS,
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
          ...ITEM_STYLE_FIELDS,
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
          ...ITEM_STYLE_FIELDS,
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
          ...ITEM_STYLE_FIELDS,
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
          ...ITEM_STYLE_FIELDS,
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

  repeater: {
    label: "Repeat (Collection)",
    icon: "Repeat",
    dynamic: true,
    description: "Render the blocks inside once for every record in a collection",
    defaults: {
      source: "",
      item: "item",
      layout: "grid",
      columns: "3",
      gap: "20",
      limit: "",
      offset: "",
      emptyText: "Nothing to show yet.",
      showEmpty: true,
    },
    fields: [
      { key: "source", type: "collection", label: "Collection", help: "An Array variable, e.g. courses" },
      { key: "item", type: "text", label: "Item variable name", placeholder: "course" },
      { key: "layout", type: "select", label: "Layout", options: ["grid", "list"] },
      { key: "columns", type: "select", label: "Columns", options: ["1", "2", "3", "4"] },
      { key: "gap", type: "text", label: "Gap (px)" },
      { key: "limit", type: "text", label: "Max items (blank = all)" },
      { key: "offset", type: "text", label: "Skip first N items" },
      { key: "emptyText", type: "text", label: "Empty state text" },
      { key: "showEmpty", type: "boolean", label: "Show the empty state when there are no records" },
    ],
  },

  scrollVideo: {
    label: "Scroll Video",
    icon: "Film",
    badge: "🔥",
    description: "Pinned section whose video frames, scenes and overlays advance as the visitor scrolls",
    defaults: {
      /* ---- sources ---- */
      src: "",
      mobileSrc: "",
      webmSrc: "",
      poster: "",
      // "frames" draws a pre-extracted image sequence, which scrubs instantly
      // because no decoding happens while scrolling; "video" seeks an HTML5
      // video, which depends on the file being seekable at all and is the
      // source of most of this section's failures. A new block starts on
      // frames, and the editor leads with the animation picker.
      renderMode: "frames",
      // A saved Scroll Animation (Owner → Scroll Animations). Its ordered frame
      // URLs are copied in on save, so the public page needs no extra lookup.
      animationId: "",
      frames: [],
      framesId: "",
      frameCount: "",
      frameExt: "webp",
      frameWidth: "1280",
      preload: "auto",
      playbackRate: "1",
      clipStart: "",
      clipEnd: "",

      /* ---- scroll ---- */
      scrollEnabled: true,
      direction: "vertical",
      // Screens of scrolling past the pinned stage. Empty means "work it out
      // from the frame count" — see engine.trackHeightCss.
      scrollDuration: "",
      height: "",
      pxPerFrame: "12",
      scrollStart: "top top",
      scrollEnd: "bottom bottom",
      smoothing: "0.18",
      sticky: true,
      snap: false,
      snapDuration: "400",
      playbackEase: "linear",
      offset: "0",
      mode: "scrub",
      startOffset: "0",
      endOffset: "100",
      speed: "1",
      loops: "1",
      reverse: false,
      reducedMotion: "scrub",

      /* ---- content ---- */
      title: "",
      subtitle: "",
      textColor: "#ffffff",
      textAlign: "center",
      fadeText: false,
      accent: "#f26722",
      scenes: [],
      overlays: [],

      /* ---- design ---- */
      stageHeight: "100vh",
      minHeight: "",
      fullWidth: true,
      maxWidth: "",
      radius: "",
      bgColor: "#000000",
      fit: "cover",
      objectPosition: "center",
      brightness: "100",
      contrast: "100",
      saturate: "100",
      videoBlur: "0",
      videoOpacity: "100",
      overlayType: "solid",
      overlay: "20",
      overlayColor: "",
      overlayFrom: "rgba(0,0,0,0)",
      overlayTo: "rgba(0,0,0,0.7)",
      overlayAngle: "180",
      showProgress: false,

      /* ---- mobile ---- */
      mobileMode: "same",
      mobileStageHeight: "100svh",
      mobileScrollDuration: "",
    },
    fields: [
      /* ---- Source ---- */
      { group: "Use a video instead (advanced)", key: "src", type: "video", label: "Video" },
      { group: "Use a video instead (advanced)", key: "webmSrc", type: "video", label: "WebM version (optional)", help: "Offered first where the browser supports it — smaller file, same picture." },
      { group: "Scroll animation", key: "poster", type: "image", label: "Poster frame", help: "Shown while the video loads and to visitors with reduced motion. Set one — it is what stops the section ever being a black rectangle." },
      {
        group: "Video source",
        key: "renderMode",
        type: "select",
        label: "Playback source",
        help: "Frames are the reliable option: they scrub instantly because nothing is decoded while you scroll. A video has to be seekable, which many exports are not.",
        options: [
          { value: "frames", label: "Frame sequence (recommended)" },
          { value: "video", label: "Video file (advanced)" },
        ],
      },
      { group: "Scroll animation", key: "animationId", type: "animation", label: "Scroll animation" },
      { group: "Use a video instead (advanced)", key: "preload", type: "select", label: "Preload", options: ["auto", "metadata", "none"] },
      { group: "Use a video instead (advanced)", key: "playbackRate", type: "text", label: "Playback speed (0.25–4)" },
      { group: "Use a video instead (advanced)", key: "clipStart", type: "text", label: "Start time (seconds)", placeholder: "0", help: "Play only part of the file. Leave both empty to use all of it." },
      { group: "Use a video instead (advanced)", key: "clipEnd", type: "text", label: "End time (seconds)", placeholder: "whole clip" },

      /* ---- Scroll ---- */
      { group: "Scroll behaviour", key: "scrollEnabled", type: "boolean", label: "Drive this section with the scroll" },
      {
        group: "Scroll behaviour",
        key: "direction",
        type: "select",
        label: "Direction",
        options: [
          { value: "vertical", label: "Vertical — scenes stack and fade" },
          { value: "horizontal", label: "Horizontal — scenes slide across" },
        ],
        help: "Horizontal still scrolls the page downward; the scenes travel sideways as it does.",
      },
      {
        group: "Scroll behaviour",
        key: "scrollDuration",
        type: "text",
        label: "Scroll distance (screens)",
        placeholder: "auto",
        help: "2 means two screens of scrolling past the pinned stage. Leave empty and a frame sequence works out its own length.",
      },
      { group: "Scroll behaviour", key: "pxPerFrame", type: "text", label: "Scroll per frame (px)", help: "Only used when the scroll distance is left on auto, and only when it asks for more than the two-and-a-half screen minimum." },
      { group: "Scroll behaviour", key: "height", type: "text", label: "Exact track height (advanced)", placeholder: "e.g. 400vh", help: "Overrides the two settings above. Leave empty unless you need an exact CSS value." },
      {
        group: "Scroll behaviour",
        key: "scrollStart",
        type: "select",
        label: "Start when",
        options: [
          { value: "top top", label: "Section top reaches the top of the screen" },
          { value: "top center", label: "Section top reaches the middle of the screen" },
          { value: "top bottom", label: "Section top enters the screen" },
          { value: "center center", label: "Section centre reaches the middle of the screen" },
        ],
      },
      {
        group: "Scroll behaviour",
        key: "scrollEnd",
        type: "select",
        label: "Finish when",
        options: [
          { value: "bottom bottom", label: "Section bottom reaches the bottom of the screen" },
          { value: "bottom center", label: "Section bottom reaches the middle of the screen" },
          { value: "bottom top", label: "Section bottom leaves the top of the screen" },
        ],
      },
      { group: "Scroll behaviour", key: "smoothing", type: "text", label: "Scrub smoothness (0.02–1)", help: "How quickly the picture catches up with the scroll. Lower is smoother and lazier; 0.18 is a good default." },
      { group: "Scroll behaviour", key: "sticky", type: "boolean", label: "Pin the stage while scrolling", help: "The pin is what stops the page reaching the next section before the animation has played out. Turning it off makes this an ordinary section that scrolls straight past." },
      { group: "Scroll behaviour", key: "snap", type: "boolean", label: "Settle on the nearest scene when scrolling stops" },
      { group: "Scroll behaviour", key: "snapDuration", type: "text", label: "Settle duration (ms)" },
      { group: "Scroll behaviour", key: "offset", type: "text", label: "Delay before it starts (% of the track)", help: "Scrolling the first few percent does nothing; the animation then plays through the rest." },
      { group: "Scroll behaviour", key: "playbackEase", type: "select", label: "Easing", options: EASE_OPTIONS },
      {
        group: "Scroll behaviour",
        key: "mode",
        type: "select",
        label: "Playback mode",
        options: [
          { value: "scrub", label: "Frame scrubbing" },
          { value: "reverse", label: "Reverse playback" },
          { value: "pingpong", label: "Ping pong" },
          { value: "loop", label: "Loop while scrolling" },
        ],
      },
      { group: "Scroll behaviour", key: "startOffset", type: "text", label: "Start offset (%)" },
      { group: "Scroll behaviour", key: "endOffset", type: "text", label: "End offset (%)" },
      { group: "Scroll behaviour", key: "speed", type: "text", label: "Scroll speed (1 = 1:1)" },
      { group: "Scroll behaviour", key: "loops", type: "text", label: "Loops (loop mode only)" },
      { group: "Scroll behaviour", key: "reverse", type: "boolean", label: "Reverse" },
      {
        group: "Scroll behaviour",
        key: "reducedMotion",
        type: "select",
        label: "If the visitor has reduced motion switched on",
        help:
          "Windows and macOS both offer this, and it is commonly on. A single still frame is what the section used to fall back to — it looks broken, because the picture never changes.",
        options: [
          { value: "scrub", label: "Follow the scroll, without the hold (recommended)" },
          { value: "still", label: "Show a single still frame" },
          { value: "full", label: "Play exactly as normal" },
        ],
      },

      /* ---- Scenes ---- */
      {
        group: "Scenes",
        key: "scenes",
        type: "list",
        label: "Scenes",
        itemLabel: "scene",
        help: "Each scene owns a slice of the scroll and fades in and out inside it, so one section can tell several beats of a story. Leave this empty for a single caption and use the Overlay text below instead.",
        itemDefaults: {
          startFrame: "",
          endFrame: "",
          start: "0",
          end: "100",
          animation: "fade-up",
          exitAnimation: "same",
          ease: "power2.out",
          distance: "40",
          position: "center",
          align: "center",
          headingLevel: "h2",
          visibility: "both",
          textColor: "#ffffff",
        },
        itemFields: [
          { key: "startFrame", type: "text", label: "From frame", help: "Frame numbers, the way your export names them. Leave both empty to use the percentages instead." },
          { key: "endFrame", type: "text", label: "To frame" },
          { key: "start", type: "text", label: "Starts at (% of this section)" },
          { key: "end", type: "text", label: "Ends at (%)" },
          { key: "eyebrow", type: "text", label: "Eyebrow" },
          { key: "heading", type: "text", label: "Heading" },
          { key: "headingLevel", type: "select", label: "Heading level", options: ["h2", "h3", "h4", "h1"] },
          { key: "text", type: "textarea", label: "Description" },
          { key: "image", type: "image", label: "Image" },
          { key: "imageAlt", type: "text", label: "Image description (for screen readers)" },
          { key: "ctaLabel", type: "text", label: "Button label" },
          { key: "ctaHref", type: "text", label: "Button link" },
          { key: "animation", type: "select", label: "Entry animation", options: SCENE_ANIMATION_OPTIONS },
          { key: "exitAnimation", type: "select", label: "Exit animation", options: [{ value: "same", label: "Leave the way it arrived" }, ...SCENE_ANIMATION_OPTIONS] },
          { key: "ease", type: "select", label: "Easing", options: EASE_OPTIONS },
          { key: "distance", type: "text", label: "Travel distance (px)" },
          { key: "position", type: "select", label: "Position on the stage", options: SCENE_POSITION_OPTIONS },
          { key: "align", type: "select", label: "Text alignment", options: ["left", "center", "right"] },
          { key: "visibility", type: "select", label: "Show on", options: VISIBILITY_OPTIONS },
          { key: "textColor", type: "color", label: "Text colour" },
          { key: "accent", type: "color", label: "Accent colour" },
        ],
      },

      /* ---- Overlays ---- */
      {
        group: "Overlay layers",
        key: "overlays",
        type: "list",
        label: "Overlay layers",
        itemLabel: "layer",
        help: "Always on the stage — a logo, a watermark, a standing headline. Each has its own scroll window and its own from → to values.",
        itemDefaults: {
          kind: "text",
          start: "0",
          end: "100",
          ease: "power2.out",
          position: "center",
          align: "center",
          zIndex: "2",
          padding: "24",
          fromOpacity: "0",
          toOpacity: "1",
        },
        itemFields: [
          { key: "kind", type: "select", label: "Kind", options: OVERLAY_KIND_OPTIONS },
          { key: "text", type: "textarea", label: "Text" },
          { key: "image", type: "image", label: "Image" },
          { key: "alt", type: "text", label: "Image description" },
          { key: "ctaLabel", type: "text", label: "Button label" },
          { key: "ctaHref", type: "text", label: "Button link" },
          { key: "html", type: "code", label: "Custom HTML" },
          { key: "start", type: "text", label: "Animate from (% of this section)" },
          { key: "end", type: "text", label: "Animate to (%)" },
          { key: "ease", type: "select", label: "Easing", options: EASE_OPTIONS },
          { key: "fromOpacity", type: "text", label: "Opacity from (0–1)" },
          { key: "toOpacity", type: "text", label: "Opacity to (0–1)" },
          { key: "fromX", type: "text", label: "X from (px)" },
          { key: "toX", type: "text", label: "X to (px)" },
          { key: "fromY", type: "text", label: "Y from (px)" },
          { key: "toY", type: "text", label: "Y to (px)" },
          { key: "fromScale", type: "text", label: "Scale from" },
          { key: "toScale", type: "text", label: "Scale to" },
          { key: "fromBlur", type: "text", label: "Blur from (px)" },
          { key: "toBlur", type: "text", label: "Blur to (px)" },
          { key: "position", type: "select", label: "Position", options: SCENE_POSITION_OPTIONS },
          { key: "align", type: "select", label: "Alignment", options: ["left", "center", "right"] },
          { key: "width", type: "text", label: "Max width (px or %)" },
          { key: "padding", type: "text", label: "Padding (px)" },
          { key: "zIndex", type: "text", label: "Layer order" },
          { key: "color", type: "color", label: "Text colour" },
          { key: "accent", type: "color", label: "Button colour" },
        ],
      },

      /* ---- Simple caption ---- */
      { group: "Overlay text", key: "title", type: "text", label: "Overlay title (optional)" },
      { group: "Overlay text", key: "subtitle", type: "textarea", label: "Overlay subtitle (optional)" },
      { group: "Overlay text", key: "textColor", type: "color", label: "Overlay text colour" },
      { group: "Overlay text", key: "textAlign", type: "select", label: "Overlay alignment", options: ["left", "center", "right"] },
      { group: "Overlay text", key: "fadeText", type: "boolean", label: "Fade the overlay text with scroll" },
      { group: "Overlay text", key: "accent", type: "color", label: "Accent colour (scenes and buttons)" },

      /* ---- Design ---- */
      { group: "Design", key: "stageHeight", type: "text", label: "Stage height", placeholder: "100vh" },
      { group: "Design", key: "minHeight", type: "text", label: "Minimum height (px)" },
      { group: "Design", key: "fullWidth", type: "boolean", label: "Full width" },
      { group: "Design", key: "maxWidth", type: "text", label: "Maximum width (px)", help: "Only used when Full width is off." },
      { group: "Design", key: "radius", type: "text", label: "Corner radius (px)" },
      { group: "Design", key: "bgColor", type: "color", label: "Stage background" },
      { group: "Design", key: "fit", type: "select", label: "Video fit", options: ["cover", "contain", "fill"] },
      { group: "Design", key: "objectPosition", type: "text", label: "Video position", placeholder: "center" },
      { group: "Design", key: "brightness", type: "text", label: "Brightness (%)" },
      { group: "Design", key: "contrast", type: "text", label: "Contrast (%)" },
      { group: "Design", key: "saturate", type: "text", label: "Saturation (%)" },
      { group: "Design", key: "videoBlur", type: "text", label: "Blur (px)" },
      { group: "Design", key: "videoOpacity", type: "text", label: "Video opacity (%)" },
      {
        group: "Design",
        key: "overlayType",
        type: "select",
        label: "Tint over the picture",
        options: [
          { value: "none", label: "None" },
          { value: "solid", label: "Solid" },
          { value: "gradient", label: "Gradient" },
        ],
      },
      { group: "Design", key: "overlay", type: "text", label: "Tint strength (0–100)" },
      { group: "Design", key: "overlayColor", type: "color", label: "Tint colour", help: "Leave empty for black." },
      { group: "Design", key: "overlayFrom", type: "text", label: "Gradient from" },
      { group: "Design", key: "overlayTo", type: "text", label: "Gradient to" },
      { group: "Design", key: "overlayAngle", type: "text", label: "Gradient angle (deg)" },
      { group: "Design", key: "showProgress", type: "boolean", label: "Show a progress bar" },

      /* ---- Mobile ---- */
      {
        group: "Mobile",
        key: "mobileMode",
        type: "select",
        label: "On a phone",
        options: [
          { value: "same", label: "Same as desktop" },
          { value: "poster", label: "Show the poster image instead" },
          { value: "off", label: "Switch the section off" },
        ],
        help: "A long frame sequence over a mobile connection is a real cost. The poster keeps the text and the design without the download.",
      },
      { group: "Use a video instead (advanced)", key: "mobileSrc", type: "video", label: "Mobile video (optional)", help: "A smaller cut of the same clip, used only on phones." },
      { group: "Mobile", key: "mobileStageHeight", type: "text", label: "Mobile stage height", placeholder: "100svh", help: "svh is the height of the screen with the address bar showing — vh is not, which is why 100vh sections start cut off on a phone." },
      { group: "Mobile", key: "mobileScrollDuration", type: "text", label: "Mobile scroll distance (screens)", placeholder: "same as desktop" },
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

// The catalogue blocks live in their own file — they read published courses,
// sessions and people from the database rather than asking the author to type
// their content, which makes them a different kind of block worth reading as
// one group. Merged here so the builder treats them like any other.
Object.assign(BLOCK_TYPES, TRAINING_BLOCK_TYPES);

/** Blocks whose content comes from the training catalogue, not from props. */
export const LIVE_BLOCK_TYPES = new Set(Object.keys(TRAINING_BLOCK_TYPES));

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
    // The section's own CSS, rewritten to apply only inside it (lib/cms/scopeCss)
    css: "",
    // The ::before / ::after decorative layers (lib/cms/decorations)
    decorBefore: null,
    decorAfter: null,
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

// Blocks that hold other blocks (currently just the repeater).
export const CONTAINER_TYPES = new Set(["repeater"]);

export function isContainer(type) {
  return CONTAINER_TYPES.has(type);
}

export function createBlock(type) {
  const def = BLOCK_TYPES[type];
  if (!def) return null;
  const block = {
    id: newId(),
    type,
    props: structuredClone(def.defaults),
    _style: defaultStyle(),
  };
  if (isContainer(type)) block.children = [];
  return block;
}
