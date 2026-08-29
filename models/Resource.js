import mongoose from "mongoose";
import { SeoSchema, PUBLISH_STATUSES, slugify } from "@/lib/models/shared";
import { RESOURCE_TYPES } from "@/lib/training/constants";

/**
 * Resource
 * --------
 * The resource library: guides, articles, downloadable PDFs, external links
 * and announcements.
 *
 * A dedicated model rather than a custom CMS page, because a resource library
 * is a *filtered list* — it needs a type, a publication date, a file or an
 * external URL, and an ordering, none of which a page-builder page can express.
 * A custom page can hold an article; it cannot answer "show me every PDF".
 *
 * Everything else is shared with the rest of the platform: the same owner CRUD
 * registry, the same media library for images and files, the same SEO
 * sub-document, and the same automatic variable discovery.
 */
const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },

    shortDescription: { type: String, default: "", trim: true, maxlength: 500 },
    content: { type: String, default: "", trim: true, maxlength: 40000 },

    featuredImage: { type: String, default: "", trim: true },

    type: { type: String, enum: RESOURCE_TYPES, default: "article", index: true },

    /**
     * Where the resource actually lives.
     *
     * `file` is a path in the media library; `externalUrl` points off-site.
     * A resource may have neither — an article's content is the resource — so
     * the public card decides its action from whichever is present rather than
     * assuming one always is.
     */
    file: { type: String, default: "", trim: true },
    fileLabel: { type: String, default: "", trim: true, maxlength: 120 },
    externalUrl: { type: String, default: "", trim: true },

    publishedDate: { type: Date, default: null, index: true },

    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: PUBLISH_STATUSES, default: "draft", index: true },
    displayOrder: { type: Number, default: 0, index: true },

    seo: { type: SeoSchema, default: () => ({}) },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

resourceSchema.pre("validate", function ensureSlug() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
});

resourceSchema.index({ status: 1, featured: -1, publishedDate: -1 });
resourceSchema.index({ status: 1, type: 1, displayOrder: 1 });

export default mongoose.models.Resource || mongoose.model("Resource", resourceSchema);
