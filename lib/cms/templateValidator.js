/**
 * Template Validator for CMS SDK Templates.
 *
 * Validates template packages, ASTs, and components before import/installation.
 * Enforces security constraints, checks SDK compatibility, validates props and loop bindings,
 * and produces actionable diagnostics.
 */

export const SDK_VERSION = "2.0.0";

export const FORBIDDEN_PATTERNS = [
  { pattern: /\bprocess\.env\b/, error: "Direct access to process.env is forbidden for security." },
  { pattern: /\b(child_process|fs|net|tls|dns|cluster)\b/, error: "Node.js server system APIs cannot be accessed inside CMS templates." },
  { pattern: /\b(eval|Function)\s*\(/, error: "Arbitrary dynamic code evaluation (eval/Function) is forbidden." },
  { pattern: /\bmongoose\b/, error: "Direct database access via mongoose is forbidden. Use CMS Data Sources." },
  { pattern: /\b(__proto__|prototype|constructor)\b/, error: "Prototype access is forbidden." },
  { pattern: /<script\b[^>]*>/i, error: "Raw <script> tags are forbidden. Use SDK loaders or approved scripts." },
];

export const ALLOWED_SDK_EXPORTS = new Set([
  "defineSection",
  "defineTemplate",
  "CMSField",
  "CMSText",
  "CMSRichText",
  "CMSImage",
  "CMSVideo",
  "CMSButton",
  "CMSLink",
  "CMSLoop",
  "CMSRepeater",
  "CMSIf",
  "CMSCondition",
  "useCMSData",
  "useCMSBinding",
  "useCMSContext",
  "useCMSLoopItem",
  "cms",
]);

/**
 * Validate an SDK template definition and source code.
 *
 * @param {object} templateDef { id, name, version, sdkVersion, props, code, css, options, dataRequirements }
 * @returns {object} { valid: boolean, errors: string[], warnings: string[], diagnostics: object[] }
 */
export function validateTemplate(templateDef) {
  const errors = [];
  const warnings = [];
  const diagnostics = [];

  if (!templateDef || typeof templateDef !== "object") {
    return {
      valid: false,
      errors: ["Template must be a valid JSON object or module definition."],
      warnings: [],
      diagnostics: [],
    };
  }

  // 1. Metadata Checks
  const name = templateDef.name || templateDef.title;
  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Missing required template 'name'.");
  }

  const id = templateDef.id || templateDef.sectionId;
  if (!id) {
    warnings.push("No explicit template 'id' provided; a random ID will be generated.");
  }

  if (!templateDef.thumbnail) {
    warnings.push("Missing thumbnail image; the default CMS placeholder will be displayed in the template library.");
  }

  // 2. SDK Version Compatibility Check
  const requiredSdk = templateDef.sdkVersion || templateDef.version || "2.0.0";
  const [reqMajor] = requiredSdk.replace(/^[^\d]*/, "").split(".");
  const [platMajor] = SDK_VERSION.split(".");
  if (reqMajor && platMajor && reqMajor !== platMajor) {
    errors.push(
      `Incompatible SDK version: Template requires SDK ${requiredSdk}, but current platform SDK is ${SDK_VERSION}.`
    );
  }

  const code = String(templateDef.code || "");
  if (!code.trim()) {
    errors.push("Template contains no executable code or component definition.");
    return { valid: false, errors, warnings, diagnostics };
  }

  // 3. Security Checks (Forbidden APIs)
  for (const { pattern, error } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Security violation: ${error}`);
      diagnostics.push({ severity: "error", rule: "forbidden-api", message: error });
    }
  }

  // 4. SDK Import Validation
  const importMatches = code.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](@platform\/cms-sdk|@\/lib\/cms\/sdk)['"]/g);
  for (const match of importMatches) {
    const rawImports = match[1];
    const importedNames = rawImports.split(",").map((s) => s.trim()).filter(Boolean);
    for (const item of importedNames) {
      const cleanName = item.split(/\s+as\s+/)[0].trim();
      if (!ALLOWED_SDK_EXPORTS.has(cleanName)) {
        errors.push(`Unknown SDK export "${cleanName}". Allowed SDK exports are: ${Array.from(ALLOWED_SDK_EXPORTS).join(", ")}`);
        diagnostics.push({
          severity: "error",
          rule: "unknown-sdk-export",
          message: `"${cleanName}" is not an exported function of the CMS SDK.`,
        });
      }
    }
  }

  // 5. Loop & Scope Diagnostic Checks
  // E.g. Check for typical mistake: accessing array field directly (e.g. `courses.title`)
  const arrayFieldMistakes = [
    { source: "courses", field: "title", alias: "course" },
    { source: "testimonials", field: "name", alias: "testimonial" },
    { source: "teamMembers", field: "name", alias: "member" },
    { source: "lessons", field: "title", alias: "lesson" },
    { source: "candidates", field: "name", alias: "candidate" },
  ];

  for (const { source, field, alias } of arrayFieldMistakes) {
    const directPattern = new RegExp(`\\b${source}\\.${field}\\b`);
    if (directPattern.test(code)) {
      warnings.push(
        `"${source}.${field}" is invalid because "${source}" is an array. Create a loop over "${source}" with alias "${alias}", and use "${alias}.${field}".`
      );
      diagnostics.push({
        severity: "warning",
        rule: "array-field-direct-access",
        message: `"${source}.${field}" cannot be resolved directly on a collection array. Use <CMSLoop source={${source}} as="${alias}"> and bind ${alias}.${field}.`,
      });
    }
  }

  // Check for "item.*" without an alias named item
  if (/\bitem\.[a-zA-Z0-9_]+\b/.test(code)) {
    const hasItemAlias = /as=["']item["']/.test(code) || /alias:\s*["']item["']/.test(code);
    if (!hasItemAlias) {
      warnings.push(
        `Found references to "item.*" in code without an explicit loop alias named "item". If your loop uses a custom alias like "course" or "testimonial", use that alias instead.`
      );
    }
  }

  // 6. Property Definition Checks
  const fields = templateDef.fields || (templateDef.props ? Object.entries(templateDef.props).map(([k, v]) => ({ key: k, ...v })) : []);
  if (Array.isArray(fields)) {
    for (const f of fields) {
      if (!f.key) {
        errors.push("All template fields must declare a 'key' identifier.");
      }
      if (!f.type) {
        warnings.push(`Field "${f.key || "unknown"}" is missing a type definition (defaulting to 'text').`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    diagnostics,
    report: {
      sdkCompatible: !errors.some((e) => e.includes("SDK version")),
      noForbiddenApis: !errors.some((e) => e.includes("Security violation")),
      propsValid: !errors.some((e) => e.includes("template fields")),
      bindingsValid: !errors.some((e) => e.includes("Unknown SDK export")),
      hasThumbnail: Boolean(templateDef.thumbnail),
    },
  };
}
