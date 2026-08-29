import {
  formatDate,
  formatDateRange,
  formatMonth,
  toLines,
  stripHtml,
  truncate,
} from "@/lib/training/format";

describe("dates", () => {
  test("formats a single day", () => {
    expect(formatDate("2026-09-10T00:00:00Z")).toBe("10 September 2026");
  });

  test("a day is the same day everywhere", () => {
    // Stored at UTC midnight. Formatted in local time this would read
    // "9 September" for any reader west of Greenwich, which on a training
    // schedule is a wrong answer, not a rounding difference.
    expect(formatDate("2026-09-10T00:00:00Z")).toBe("10 September 2026");
    expect(formatDate(new Date(Date.UTC(2026, 8, 10)))).toBe("10 September 2026");
  });

  test("an invalid or missing date formats as empty, not 'Invalid Date'", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("")).toBe("");
    expect(formatDate("not a date")).toBe("");
  });
});

describe("date ranges", () => {
  const d = (y, m, day) => new Date(Date.UTC(y, m - 1, day));

  test("collapses a same-month range", () => {
    expect(formatDateRange(d(2026, 9, 10), d(2026, 9, 14))).toBe("10 – 14 September 2026");
  });

  test("keeps both months when it spans two", () => {
    expect(formatDateRange(d(2026, 9, 28), d(2026, 10, 3))).toBe("28 September – 3 October 2026");
  });

  test("keeps both years when it spans two", () => {
    expect(formatDateRange(d(2026, 12, 28), d(2027, 1, 3))).toBe(
      "28 December 2026 – 3 January 2027",
    );
  });

  test("a one-day session is not shown as a range", () => {
    expect(formatDateRange(d(2026, 9, 10), d(2026, 9, 10))).toBe("10 September 2026");
  });

  test("handles a missing end date", () => {
    expect(formatDateRange(d(2026, 9, 10), null)).toBe("From 10 September 2026");
  });

  test("returns empty when there are no dates at all", () => {
    expect(formatDateRange(null, null)).toBe("");
  });

  test("formats a month heading", () => {
    expect(formatMonth(2026, 9)).toBe("September 2026");
  });
});

describe("text helpers", () => {
  test("splits a one-per-line field on newlines or pipes", () => {
    expect(toLines("Alpha\nBeta\n\nGamma")).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(toLines("Alpha | Beta")).toEqual(["Alpha", "Beta"]);
    expect(toLines("")).toEqual([]);
  });

  test("strips markup from a rich-text bio", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
    expect(stripHtml(null)).toBe("");
  });

  test("truncates on a word boundary", () => {
    expect(truncate("one two three four five", 12)).toBe("one two…");
    expect(truncate("short", 12)).toBe("short");
  });
});
