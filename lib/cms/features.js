/**
 * Dynamic-CMS feature switches — client-safe.
 *
 * Reads the `features` block of the existing global CMS settings so the toggles
 * live in the same place (and the same editor) as the rest of the site config.
 */
export const FEATURE_KEYS = [
  { key: "dynamicCms", label: "Enable Dynamic CMS", hint: "Master switch. Off = the CMS behaves exactly as it did before variables existed." },
  { key: "variables", label: "Enable Variables", hint: "Variables page and the fx variable picker in the page builder." },
  { key: "liveData", label: "Enable Live Data", hint: "Query real database records in the preview and on published pages." },
  { key: "repeater", label: "Enable Repeater", hint: "Repeat a design once per record in a collection." },
  { key: "conditions", label: "Enable Conditions", hint: "Show/hide blocks and switch properties based on data." },
  { key: "dynamicCss", label: "Enable Dynamic CSS", hint: "Bind variables into colours, sizes and other style values." },
  { key: "expressions", label: "Enable Expressions", hint: "Formulas such as {{= course.price * 0.8 }}." },
  { key: "scrollVideo", label: "Enable Scroll Video", hint: "The scroll-driven video section type." },
  { key: "dataInspector", label: "Enable Data Inspector", hint: "Developer panel showing the resolved data context." },
];

export const DEFAULT_FEATURES = Object.fromEntries(FEATURE_KEYS.map((f) => [f.key, true]));

/** Resolve the feature map from a settings object (missing = enabled). */
export function getFeatures(settings) {
  const raw = settings?.features || {};
  const out = { ...DEFAULT_FEATURES };
  for (const { key } of FEATURE_KEYS) {
    if (typeof raw[key] === "boolean") out[key] = raw[key];
  }
  // The master switch gates everything else.
  if (!out.dynamicCms) {
    for (const { key } of FEATURE_KEYS) {
      if (key !== "dynamicCms") out[key] = false;
    }
  }
  return out;
}

export function isFeatureEnabled(settings, key) {
  return !!getFeatures(settings)[key];
}
