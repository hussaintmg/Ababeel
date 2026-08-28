import mongoose from "mongoose";

/**
 * CmsRegistryState
 * ----------------
 * A single document ("singleton") recording the last variable sync: when the
 * schema registry was last rescanned, how many models/variables it found, and
 * what changed. The Variables page shows this ("Last synced 2 minutes ago —
 * 16 models, 247 variables").
 */
const cmsRegistryStateSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "registry", unique: true, index: true },
    lastSyncedAt: { type: Date, default: null },
    modelCount: { type: Number, default: 0 },
    variableCount: { type: Number, default: 0 },
    addedCount: { type: Number, default: 0 },
    deprecatedCount: { type: Number, default: 0 },
    restoredCount: { type: Number, default: 0 },
    lastSyncedByEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.CmsRegistryState ||
  mongoose.model("CmsRegistryState", cmsRegistryStateSchema);
