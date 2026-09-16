/**
 * Dynamic Template Prompt Generator for CMS Template SDK.
 *
 * Generates rich, context-aware AI prompts based on real runtime metadata:
 * - Selected template purpose & category
 * - Selected models and only their public fields
 * - Active Data Sources and exact TypeScript/JSON contract
 * - Explicit loop alias instructions to avoid the "item.title" trap
 * - Accurate SDK version and authorized imports
 */

export const SDK_VERSION = "2.0.0";
import { inferAlias } from "@/lib/cms/binding";

export function generateTemplatePrompt({
  sectionType = "Course Grid",
  category = "Courses",
  purpose = "Display a modern responsive grid of courses with cover images, title, price, and CTA",
  selectedModel = "Course",
  modelFields = [],
  dataSourceName = "featuredCourses",
  isCollection = true,
  alias = "",
  expectedProps = [],
  additionalNotes = "",
} = {}) {
  const loopAlias = alias || inferAlias(dataSourceName || selectedModel);
  const typeStr = isCollection ? `${selectedModel}[]` : selectedModel;

  // Filter model fields to only relevant ones or default common ones
  const fieldsToInclude =
    modelFields.length > 0
      ? modelFields
      : [
          { name: "title", type: "string" },
          { name: "slug", type: "string" },
          { name: "description", type: "richtext" },
          { name: "price", type: "number" },
          { name: "coverImage", type: "image" },
          { name: "featured", type: "boolean" },
          { name: "instructor", type: "reference" },
        ];

  const fieldList = fieldsToInclude
    .map((f) => `  ${isCollection ? loopAlias : dataSourceName}.${f.name}: ${f.type || "string"}`)
    .join("\n");

  const defaultPropsList =
    expectedProps.length > 0
      ? expectedProps
      : [
          { key: "heading", label: "Heading", type: "text", default: "Our Courses", dynamic: true },
          { key: "subheading", label: "Subheading", type: "textarea", default: "Explore our accredited industry courses", dynamic: true },
          { key: "badgeText", label: "Badge", type: "text", default: "Accredited", dynamic: true },
          { key: "buttonText", label: "Button Label", type: "text", default: "View Course", dynamic: false },
        ];

  const propsJson = JSON.stringify(
    defaultPropsList.map((p) => ({
      key: p.key,
      label: p.label,
      type: p.type,
      default: p.default,
      dynamic: p.dynamic !== false,
    })),
    null,
    2
  );

  return `You are creating a CMS-compatible ${sectionType} section template using our official CMS Template SDK.

SDK Version:
${SDK_VERSION}

The template must be implemented as a React 19 / Tailwind CSS JSX Component.

Allowed SDK imports:
\`\`\`javascript
import {
  defineSection,
  CMSField,
  CMSText,
  CMSRichText,
  CMSImage,
  CMSLink,
  CMSLoop,
  CMSIf,
  useCMSContext,
  useCMSData,
  cms,
} from "@platform/cms-sdk";
\`\`\`
Do not invent SDK functions or import from unauthorized external packages.

### AVAILABLE RUNTIME DATA SOURCE:
Name: \`${dataSourceName}\`
Type: \`${typeStr}\`

${
  isCollection
    ? `### LOOP & VARIABLE SCOPE RULES:
The \`${dataSourceName}\` data source is an ARRAY of ${selectedModel} records.
To render the cards, repeat over \`${dataSourceName}\` using \`<CMSLoop source="${dataSourceName}" as="${loopAlias}">\`.

Inside that loop, the alias is:
\`${loopAlias}\`

Valid fields available in that scope:
${fieldList}

Loop metadata helpers available:
  loop.index (0-based number)
  loop.number (1-based number)
  loop.first (boolean)
  loop.last (boolean)
  loop.count (total items)

CRITICAL:
Do NOT use `item.title` or `items.title`! The loop alias is explicitly `${loopAlias}`, so use `${loopAlias}.title`, `${loopAlias}.price`, `${loopAlias}.coverImage`.
Do NOT access `${dataSourceName}.title` directly because `${dataSourceName}` is an array containing multiple records.
Do NOT manually query related models by foreign ID. Registered relations such as `${loopAlias}.level.name` or `${loopAlias}.instructor.firstName` are resolved automatically by the CMS data layer.
Render the list using ONE repeatable card template inside `<CMSLoop>`. At runtime the CMS renders that single card template N times.`
    : `### VARIABLE SCOPE RULES:
The \`${dataSourceName}\` source resolves to a SINGLE ${selectedModel} document.
No loop or repeater is needed. Bind fields directly:
${fieldList}

Registered relations (e.g. \`${dataSourceName}.level.name\`, \`${dataSourceName}.instructor.firstName\`) are populated automatically by the CMS data layer. Do NOT create a secondary query by ID.`
}

### COMPONENT EDITABLE PROPS:
Declare these props in the section definition so CMS users can customize them in the editor:
\`\`\`json
${propsJson}
\`\`\`

### DESIGN & ACCESSIBILITY REQUIREMENTS:
1. Make the section fully responsive:
   - Desktop: 3 or 4 columns
   - Tablet: 2 columns
   - Mobile: 1 column
2. Theme Tokens:
   - Use Tailwind classes or CMS theme tokens via \`cms.theme.colors\` (e.g. \`var(--studio-accent)\`).
3. Media:
   - Always use \`<CMSImage source={${loopAlias}.coverImage} alt={${loopAlias}.title} />\` for course images.
4. Links:
   - Use \`<CMSLink href={\`/courses/\${${loopAlias}.slug}\`}>View Details</CMSLink>\`.
5. Empty State:
   - If \`${dataSourceName}\` is empty, render a clean, accessible empty state message.
6. Safety & Security:
   - Do NOT query MongoDB or call backend database APIs.
   - Do NOT use \`process.env\` or Node.js server APIs.
   - Do NOT use \`eval()\` or unsafe DOM injection.
   - All external props and dynamic data are provided via component arguments and SDK context.

${additionalNotes ? `### ADDITIONAL REQUIREMENTS:\n${additionalNotes}\n` : ""}
### OUTPUT CONTRACT:
Respond with a valid JSON object formatted as follows:
\`\`\`json
{
  "name": "${sectionType}",
  "category": "${category}",
  "description": "${purpose}",
  "options": {
    "enableFramerMotion": true,
    "enableTailwind": true,
    "googleFont": "Outfit"
  },
  "fields": ${propsJson},
  "code": "// Full React component JSX returning <section>...",
  "css": "/* Optional scoped CSS */"
}
\`\`\``;
}
