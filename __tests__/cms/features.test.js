import { getFeatures, isFeatureEnabled, FEATURE_KEYS, DEFAULT_FEATURES } from "@/lib/cms/features";
import { DEFAULT_GLOBAL_SETTINGS } from "@/lib/cmsDefaults";

describe("feature switches", () => {
  test("everything is on by default, including for pre-existing settings docs", () => {
    expect(getFeatures(null)).toEqual(DEFAULT_FEATURES);
    expect(getFeatures({})).toEqual(DEFAULT_FEATURES);
    expect(getFeatures(DEFAULT_GLOBAL_SETTINGS).dynamicCms).toBe(true);
  });

  test("an individual switch can be turned off", () => {
    const f = getFeatures({ features: { scrollVideo: false } });
    expect(f.scrollVideo).toBe(false);
    expect(f.variables).toBe(true);
    expect(isFeatureEnabled({ features: { repeater: false } }, "repeater")).toBe(false);
  });

  test("the master switch disables everything downstream", () => {
    const f = getFeatures({ features: { dynamicCms: false, variables: true } });
    expect(f.dynamicCms).toBe(false);
    for (const { key } of FEATURE_KEYS.filter((k) => k.key !== "dynamicCms")) {
      expect(f[key]).toBe(false);
    }
  });
});
