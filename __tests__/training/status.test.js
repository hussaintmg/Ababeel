import {
  isRegistrationOpen,
  registrationCta,
  registrationHref,
  modeLabel,
  isCoursePublic,
  isSessionPublic,
} from "@/lib/training/status";

const NOW = new Date("2026-06-15T00:00:00Z");
const future = (days) => new Date(NOW.getTime() + days * 86400000);
const past = (days) => new Date(NOW.getTime() - days * 86400000);

describe("publication rules", () => {
  test("only published courses are public", () => {
    expect(isCoursePublic({ status: "published" })).toBe(true);
    expect(isCoursePublic({ status: "draft" })).toBe(false);
    expect(isCoursePublic({ status: "archived" })).toBe(false);
    expect(isCoursePublic(null)).toBe(false);
  });

  test("draft sessions are never public", () => {
    expect(isSessionPublic({ status: "draft" })).toBe(false);
    expect(isSessionPublic({ status: "open" })).toBe(true);
    expect(isSessionPublic({ status: "cancelled" })).toBe(true);
  });
});

describe("registration availability", () => {
  test("an open future session accepts registrations", () => {
    expect(isRegistrationOpen({ status: "open", startDate: future(10) }, NOW)).toBe(true);
  });

  test("a closed session does not", () => {
    expect(isRegistrationOpen({ status: "closed", startDate: future(10) }, NOW)).toBe(false);
  });

  test("a passed deadline closes registration even while open", () => {
    const session = { status: "open", startDate: future(10), registrationDeadline: past(1) };
    expect(isRegistrationOpen(session, NOW)).toBe(false);
    expect(registrationCta(session, NOW).label).toBe("Registration Closed");
  });

  test("a session that already started closes registration", () => {
    expect(isRegistrationOpen({ status: "open", startDate: past(2) }, NOW)).toBe(false);
  });

  test("cancelled and completed sessions say so", () => {
    expect(registrationCta({ status: "cancelled" }, NOW).label).toBe("Session Cancelled");
    expect(registrationCta({ status: "completed" }, NOW).label).toBe("Session Completed");
  });

  test("a missing session is never registerable", () => {
    expect(registrationCta(null, NOW).available).toBe(false);
    expect(isRegistrationOpen(undefined, NOW)).toBe(false);
  });
});

describe("registration links", () => {
  const course = { _id: "aaaaaaaaaaaaaaaaaaaaaaaa" };
  const openSession = { _id: "bbbbbbbbbbbbbbbbbbbbbbbb", status: "open", startDate: future(5) };

  test("carries both course and reference ids", () => {
    expect(registrationHref(course, openSession, NOW)).toBe(
      "/registration?course=aaaaaaaaaaaaaaaaaaaaaaaa&reference=bbbbbbbbbbbbbbbbbbbbbbbb",
    );
  });

  test("returns nothing when registration is not possible", () => {
    expect(registrationHref(course, { ...openSession, status: "closed" }, NOW)).toBe("");
    expect(registrationHref(course, null, NOW)).toBe("");
    expect(registrationHref(null, openSession, NOW)).toBe("");
  });
});

describe("mode labels", () => {
  test("uses the built-in label", () => {
    expect(modeLabel({ mode: "physical" })).toBe("In Person");
    expect(modeLabel({ mode: "online" })).toBe("Online");
  });

  test("a custom label wins", () => {
    expect(modeLabel({ mode: "other", modeLabel: "Blended — Karachi" })).toBe("Blended — Karachi");
  });

  test("defaults to Online when unset", () => {
    expect(modeLabel({})).toBe("Online");
  });
});
