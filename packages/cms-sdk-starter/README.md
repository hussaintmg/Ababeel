# Platform CMS Template SDK Developer Guide (v2.0.0)

Welcome to the **Platform CMS Template SDK**. This SDK is the official contract between template developers, the CMS Page Builder, the Preview Runtime, and the Public Production Renderer. It empowers developers to author rich, dynamic, type-safe CMS components using React and JSX without needing to understand MongoDB queries or internal renderer machinery.

---

## Table of Contents
1. [Installation](#1-install-sdk)
2. [Creating Your First Section](#2-create-first-section)
3. [Editable Static Props](#3-editable-static-props)
4. [Dynamic Variables](#4-dynamic-variables)
5. [Data Sources](#5-data-sources)
6. [Working with Arrays](#6-arrays)
7. [Loops & Repeaters](#7-loops)
8. [Loop Aliases](#8-loop-aliases)
9. [Nested Loops](#9-nested-loops)
10. [Conditional Rendering](#10-conditions)
11. [Images & Media](#11-images--media)
12. [Links & Navigation](#12-links)
13. [Relations & References](#13-relations)
14. [Theme Tokens](#14-theme)
15. [Responsive Values](#15-responsive-values)
16. [Animations](#16-animations)
17. [Validating Templates](#17-validate)
18. [Previewing Locally](#18-preview)
19. [Building & Exporting](#19-build--export)

---

### 1. Install SDK

In your template project or custom template workspace:

```bash
npm install @platform/cms-sdk
# or yarn add @platform/cms-sdk
# or pnpm add @platform/cms-sdk
```

Verify your `package.json` contains:
```json
{
  "dependencies": {
    "@platform/cms-sdk": "^2.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

---

### 2. Create First Section

Use `defineSection` to register a section. Each section exports its schema configuration and a React render function:

```jsx
import React from "react";
import { defineSection, CMSField } from "@platform/cms-sdk";

export default defineSection({
  id: "announcement-bar",
  name: "Announcement Bar",
  category: "Header",
  props: {
    message: {
      type: "string",
      default: "Welcome to our newly updated platform!",
      dynamic: true,
    },
  },
  component: ({ message }) => (
    <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm font-medium">
      <CMSField value={message} />
    </div>
  ),
});
```

---

### 3. Editable Static Props

Props declared in the `props` map automatically generate control widgets in the CMS Page Builder inspector:

```javascript
props: {
  headline: {
    type: "string",
    label: "Headline Text",
    default: "Build Modern Web Experiences",
    dynamic: true,
  },
  showBadge: {
    type: "boolean",
    label: "Show New Badge",
    default: true,
  },
  columns: {
    type: "number",
    label: "Columns Count",
    default: 3,
  },
  themeVariant: {
    type: "string",
    label: "Visual Theme",
    default: "primary",
    options: ["primary", "dark", "gradient", "minimal"],
  }
}
```

---

### 4. Dynamic Variables

Any prop marked with `dynamic: true` can accept either a static literal value or a CMS binding. The `CMSField` component automatically resolves dynamic bindings, handles fallback values, and applies formatting:

```jsx
<CMSField 
  value={props.price} 
  format="currency" 
  fallback="Free" 
/>
```

Available formatters:
- `currency`: Localized currency formatting (`$49.00`).
- `decimal`: Fixed decimal points (`99.50`).
- `percentage`: Formatted as percent (`15%`).
- `uppercase` / `lowercase`: Text transformation.
- `date`: Formatted date string (`MMM DD, YYYY`).
- `relative`: Relative time (`3 days ago`).

---

### 5. Data Sources

A **Data Source** describes HOW runtime data is fetched from the database, adhering to strict tenant isolation and public allowlist policies.

Pages declare Data Sources:
- `featuredCourses`: `Course.findMany({ featured: true, status: 'published' })`
- `course`: `Course.findOne({ slug: route.params.slug })`
- `siteSettings`: `SiteSettings.findOne()`

In your template, components receive the resulting dataset cleanly:
```jsx
// Single-record Data Source
function CourseDetail({ course }) {
  return (
    <div>
      <h1><CMSField value={course.title} /></h1>
      <p><CMSField value={course.description} /></p>
    </div>
  );
}
```

---

### 6. Arrays

When a Data Source or model field contains multiple items (e.g. `courses: Course[]` or `course.modules: Module[]`), it is an array. Arrays must not be rendered directly as raw strings. Instead, use a loop or repeater.

---

### 7. Loops

Use `CMSLoop` to repeat over an array source. Inside `CMSLoop`, scope is cleanly encapsulated:

```jsx
import { CMSLoop, CMSField, CMSImage } from "@platform/cms-sdk";

export function CourseList({ courses }) {
  return (
    <CMSLoop source={courses} as="course">
      {(course, loop) => (
        <article key={loop.index} className="p-4 border rounded-xl">
          <CMSImage source={course.coverImage} />
          <h3><CMSField value={course.title} /></h3>
          <CMSField value={course.price} format="currency" />
        </article>
      )}
    </CMSLoop>
  );
}
```

#### Loop Metadata
The second callback argument `loop` provides namespaced metadata:
- `loop.index`: 0-indexed number (`0, 1, 2...`).
- `loop.number`: 1-indexed number (`1, 2, 3...`).
- `loop.first`: Boolean, true for the first element.
- `loop.last`: Boolean, true for the last element.
- `loop.even`: Boolean, true on even indexes.
- `loop.odd`: Boolean, true on odd indexes.
- `loop.count`: Total items count in the array.

---

### 8. Loop Aliases

Always specify the `as` prop to declare a semantic loop alias:
- `<CMSLoop source={courses} as="course">` → Use `course.title`
- `<CMSLoop source={testimonials} as="testimonial">` → Use `testimonial.quote`
- `<CMSLoop source={teamMembers} as="member">` → Use `member.avatar`

> **Rule**: Do not use `item.title` unless your alias is literally declared as `as="item"`. The binding engine resolves the alias directly from the nearest lexical scope!

---

### 9. Nested Loops

CMS Template SDK fully supports multi-level nested loops (e.g. Course → Modules → Lessons). Nearest scope wins when resolving variables:

```jsx
<CMSLoop source={courses} as="course">
  {(course) => (
    <div key={course._id}>
      <h2><CMSField value={course.title} /></h2>

      {/* Nested Loop Level 1 */}
      <CMSLoop source={course.modules} as="module">
        {(module) => (
          <div key={module._id} className="ml-4">
            <h3><CMSField value={module.title} /></h3>

            {/* Nested Loop Level 2 */}
            <CMSLoop source={module.lessons} as="lesson">
              {(lesson, lessonLoop) => (
                <div key={lesson._id} className="ml-8 text-sm">
                  <span>{lessonLoop.number}. </span>
                  <CMSField value={lesson.title} />
                  <span className="text-gray-400"> (<CMSField value={lesson.duration} />)</span>
                </div>
              )}
            </CMSLoop>
          </div>
        )}
      </CMSLoop>
    </div>
  )}
</CMSLoop>
```

---

### 10. Conditions

Use `CMSIf` to conditionally render sections, badges, or blocks based on AST condition definitions or boolean bindings:

```jsx
import { CMSIf, CMSField } from "@platform/cms-sdk";

// Direct boolean condition
<CMSIf condition={course.featured}>
  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
    Featured
  </span>
</CMSIf>

// Structured AST condition
<CMSIf condition={{ field: "price", op: "greater_than", value: 0 }}>
  <CMSField value={course.price} format="currency" />
</CMSIf>
```

---

### 11. Images & Media

Always use `CMSImage` for images. It handles media objects `{ url, alt, width, height }`, responsive sizing, fallback placeholders, and CDN domains securely:

```jsx
import { CMSImage } from "@platform/cms-sdk";

<CMSImage
  source={course.coverImage}
  fallback="/assets/placeholder-course.jpg"
  className="w-full h-48 object-cover rounded-t-xl"
  loading="lazy"
/>
```

---

### 12. Links

Use `CMSLink` to render safe, tenant-aware hyperlinks:

```jsx
import { CMSLink } from "@platform/cms-sdk";

<CMSLink
  href={`/courses/${course.slug}`}
  className="text-blue-600 hover:underline font-semibold"
>
  Explore Course →
</CMSLink>
```

---

### 13. Relations

When a Data Source configures relation expansion (e.g., `Course.instructor` pointing to `User`), fields on the related object can be accessed directly:

```jsx
<div className="flex items-center gap-2 mt-4">
  <CMSImage source={course.instructor.avatar} className="w-8 h-8 rounded-full" />
  <span className="text-sm font-medium">
    <CMSField value={course.instructor.firstName} /> <CMSField value={course.instructor.lastName} />
  </span>
</div>
```

---

### 14. Theme Tokens

Templates access brand styling tokens through the `cms.theme` API:

```javascript
import { cms } from "@platform/cms-sdk";

const cardStyle = {
  backgroundColor: cms.theme.colors.surface,
  color: cms.theme.colors.text,
  borderRadius: cms.theme.radius.card,
  boxShadow: cms.theme.shadows.md,
};
```

---

### 15. Responsive Values

Use the `responsive` utility or Tailwind CSS classes to ensure layouts adapt across desktop, tablet, and mobile breakpoints:

```javascript
import { responsive } from "@platform/cms-sdk";

const gridColumns = responsive({
  desktop: 3,
  tablet: 2,
  mobile: 1,
});
```

---

### 16. Animations

The SDK provides declarative animation presets that respect reduced motion preferences:

```jsx
import { motion, AnimatePresence } from "@platform/cms-sdk";

<motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  <CMSField value={headline} />
</motion.div>
```

---

### 17. Validate

Before publishing or importing a template, validate its syntax, imports, and security constraints:

```bash
npm run validate
```

Validation ensures:
- Zero unauthorized Node.js system imports (`fs`, `child_process`).
- Zero direct database / MongoDB calls (`mongoose`).
- Zero unsafe `eval` or prototype manipulation (`__proto__`).
- Correct SDK version compatibility.
- Proper prop definitions and valid loop bindings.

---

### 18. Preview

Preview your templates in the CMS Studio or using the local starter dev server:

```bash
npm run dev
```

---

### 19. Build & Export

Package your template bundle for distribution or CMS import:

```bash
npm run build
```

Generates a validated template JSON package containing:
- `template.manifest.js`: Component metadata & prop definitions.
- `template.jsx`: Standalone executable JSX component.
- `template.d.ts`: TypeScript typings.
