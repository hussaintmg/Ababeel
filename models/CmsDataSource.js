import mongoose from "mongoose";

/**
 * CmsDataSource
 * -------------
 * A saved, reusable query definition: "published courses, newest first, 12 max".
 *
 * It stores only the *shape* of a query. `lib/cms/dataQuery` is what turns it
 * into a Mongo call, and it validates every model name, field name and
 * operator against the discovered schema registry — a stored data source can
 * never smuggle an arbitrary query into the database.
 */
const filterSchema = new mongoose.Schema(
  {
    field: { type: String, default: "" },
    op: { type: String, default: "equals" },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
    // When true the value is a `{{ }}` template resolved from the page context
    // (route params, the logged-in user…) rather than a literal.
    dynamic: { type: Boolean, default: false },
  },
  { _id: false }
);

const cmsDataSourceSchema = new mongoose.Schema(
  {
    // Variable name this source publishes into the page context, e.g. "courses".
    key: { type: String, required: true, unique: true, trim: true, index: true },
    label: { type: String, default: "" },
    model: { type: String, required: true, trim: true },
    // "list" → array of documents, "single" → one document.
    mode: { type: String, enum: ["list", "single"], default: "list" },

    filters: { type: [filterSchema], default: [] },
    match: { type: String, enum: ["all", "any"], default: "all" },
    sortField: { type: String, default: "createdAt" },
    sortDir: { type: String, enum: ["asc", "desc"], default: "desc" },
    limit: { type: Number, default: 12, min: 1, max: 200 },
    skip: { type: Number, default: 0, min: 0 },
    paginate: { type: Boolean, default: false },
    // Reference paths to populate, e.g. ["instructor"]. Validated against the
    // schema registry before use.
    populate: { type: [String], default: [] },

    updatedByEmail: { type: String, default: "" },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.models.CmsDataSource ||
  mongoose.model("CmsDataSource", cmsDataSourceSchema);
