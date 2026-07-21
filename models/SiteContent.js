import mongoose from "mongoose";

/**
 * SiteContent
 * ------------
 * One document per manageable page or global section. This is the storage
 * layer for the WordPress-style CMS in the owner dashboard.
 *
 * - `key`      unique slug: "global", "home", "about-us", "contact-us", etc.
 * - `title`    human label shown in the CMS dashboard.
 * - `blocks`   ordered page-builder blocks ([{ id, type, props }]).
 * - `settings` free-form settings — used by the "global" doc for branding,
 *              logos, favicon, topbar nav, footer, SEO, etc.
 * - `customCss` raw CSS injected on the page (or globally for "global").
 * - `enabled`  when false the public page renders its built-in content and
 *              ignores the CMS blocks (safe default so nothing breaks).
 */
const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    // Page-builder blocks. Mixed so each block can carry an arbitrary prop bag.
    blocks: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    // Global / section settings (branding, nav, footer, seo...).
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    customCss: {
      type: String,
      default: "",
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    // ----- custom (owner-created) pages -----
    // A custom page is a page the owner added from the CMS (not one of the
    // built-in MANAGED_PAGES). It is served by the /[slug] dynamic route.
    isCustom: {
      type: Boolean,
      default: false,
    },
    route: {
      type: String,
      default: "",
    },
    navLabel: {
      type: String,
      default: "",
    },
    showInNav: {
      type: Boolean,
      default: false,
    },
    updatedByEmail: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.models.SiteContent ||
  mongoose.model("SiteContent", siteContentSchema);
