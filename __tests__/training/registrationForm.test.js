import { validateSubmission, toPublicField, promoteContact } from "@/lib/training/registrationForm";
import { DEFAULT_REGISTRATION_FIELDS } from "@/lib/training/defaultFields";
import { resolveCertificate } from "@/lib/training/certificate";

const fields = DEFAULT_REGISTRATION_FIELDS;

const validPayload = {
  firstName: "Ayesha",
  lastName: "Khan",
  email: "ayesha@example.com",
  phone: "+92 300 1234567",
  country: "Pakistan",
};

describe("submission validation", () => {
  test("accepts a complete submission", () => {
    const result = validateSubmission(fields, validPayload);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.bound.email).toBe("ayesha@example.com");
  });

  test("rejects a missing required field", () => {
    const { email, ...rest } = validPayload;
    const result = validateSubmission(fields, rest);
    expect(result.ok).toBe(false);
    expect(result.errors.email).toMatch(/required/i);
  });

  test("rejects a malformed email and phone", () => {
    const result = validateSubmission(fields, {
      ...validPayload,
      email: "not-an-email",
      phone: "abc",
    });
    expect(result.errors.email).toMatch(/valid email/i);
    expect(result.errors.phone).toMatch(/valid phone/i);
  });

  test("drops keys the form never offered", () => {
    const result = validateSubmission(fields, {
      ...validPayload,
      status: "confirmed",
      isAdmin: true,
    });
    const keys = result.values.map((v) => v.key);
    expect(keys).not.toContain("status");
    expect(keys).not.toContain("isAdmin");
  });

  test("a select answer must be one of the offered options", () => {
    const custom = [
      {
        key: "shift",
        label: "Preferred shift",
        type: "select",
        required: true,
        options: [
          { label: "Morning", value: "am" },
          { label: "Evening", value: "pm" },
        ],
      },
    ];
    expect(validateSubmission(custom, { shift: "am" }).ok).toBe(true);
    const bad = validateSubmission(custom, { shift: "night" });
    expect(bad.ok).toBe(false);
    expect(bad.errors.shift).toMatch(/available options/i);
  });

  test("enforces the configured length bounds", () => {
    const custom = [{ key: "note", label: "Note", type: "text", maxLength: 5 }];
    expect(validateSubmission(custom, { note: "way too long" }).ok).toBe(false);
    expect(validateSubmission(custom, { note: "ok" }).ok).toBe(true);
  });

  test("a malformed CMS pattern does not throw", () => {
    const custom = [{ key: "x", label: "X", type: "text", pattern: "([unclosed" }];
    expect(() => validateSubmission(custom, { x: "anything" })).not.toThrow();
    expect(validateSubmission(custom, { x: "anything" }).ok).toBe(true);
  });

  test("strips control characters from answers", () => {
    const custom = [{ key: "n", label: "N", type: "text" }];
    const result = validateSubmission(custom, { n: `He${String.fromCharCode(7)}llo` });
    expect(result.values[0].value).toBe("Hello");
  });

  test("checkbox answers become booleans", () => {
    const custom = [{ key: "agree", label: "Agree", type: "checkbox", required: true }];
    expect(validateSubmission(custom, { agree: "on" }).values[0].value).toBe(true);
    expect(validateSubmission(custom, { agree: false }).ok).toBe(false);
  });

  test("no default field collects payment details", () => {
    const keys = fields.map((f) => f.key.toLowerCase()).join(" ");
    expect(keys).not.toMatch(/card|cvv|iban|account|payment|stripe|jazzcash|easypaisa/);
  });
});

describe("public field shape", () => {
  test("does not leak internal flags", () => {
    const pub = toPublicField(fields[0]);
    expect(pub).not.toHaveProperty("bindTo");
    expect(pub).not.toHaveProperty("system");
    expect(pub).not.toHaveProperty("pattern");
    expect(pub.key).toBe("firstName");
  });
});

describe("contact promotion", () => {
  test("builds a full name from the parts", () => {
    expect(promoteContact({ firstName: "Ayesha", lastName: "Khan" }).fullName).toBe("Ayesha Khan");
  });

  test("falls back to the email when no name was collected", () => {
    expect(promoteContact({ email: "a@b.com" }).fullName).toBe("a@b.com");
  });
});

describe("certificate fallback", () => {
  const training = {
    defaultCertificateImage: "/uploads/default-cert.png",
    certificateNote: "Note",
  };

  test("prefers the course's own certificate", () => {
    const r = resolveCertificate({ certificateImage: "/uploads/asp.png" }, training);
    expect(r).toEqual({ src: "/uploads/asp.png", isDefault: false, note: "Note" });
  });

  test("falls back to the configured default", () => {
    const r = resolveCertificate({ certificateImage: "" }, training);
    expect(r.src).toBe("/uploads/default-cert.png");
    expect(r.isDefault).toBe(true);
  });

  test("returns null when neither exists, rather than a broken image", () => {
    expect(resolveCertificate({}, {})).toBeNull();
    expect(resolveCertificate(null, null)).toBeNull();
  });
});
