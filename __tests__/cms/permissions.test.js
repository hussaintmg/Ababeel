import { can, capabilitiesFor, CAPABILITIES } from "@/lib/cms/permissions";

describe("CMS capabilities by role", () => {
  test("owners can do everything", () => {
    for (const cap of CAPABILITIES) expect(can("owner", cap)).toBe(true);
  });

  test("admins may look but not change definitions", () => {
    expect(can("admin", "viewVariables")).toBe(true);
    expect(can("admin", "useLiveData")).toBe(true);
    expect(can("admin", "dataInspector")).toBe(true);
    expect(can("admin", "manageVariables")).toBe(false);
    expect(can("admin", "importVariables")).toBe(false);
    expect(can("admin", "manageDataSources")).toBe(false);
  });

  test("organizations, users and unknown roles have no CMS capability", () => {
    for (const role of ["organization", "user", "nonsense", undefined]) {
      for (const cap of CAPABILITIES) expect(can(role, cap)).toBe(false);
    }
  });

  test("capabilitiesFor returns a complete map", () => {
    expect(Object.keys(capabilitiesFor("owner")).sort()).toEqual([...CAPABILITIES].sort());
  });
});
