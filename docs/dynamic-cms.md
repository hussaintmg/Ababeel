# Dynamic CMS — data engine, variables, and the Scroll Video section

This document describes the data-driven layer added on top of the existing CMS.
Everything here is **additive**: a page with no bindings renders exactly the same
bytes it did before, and the whole layer can be switched off from
**Owner → Website CMS → Global Site Settings → Dynamic CMS**.

---

## 1. The pipeline

```
MongoDB / Mongoose models
        ↓  lib/cms/schemaRegistry.js      introspects mongoose.models
Schema registry (models → typed field trees)
        ↓  lib/cms/variableRegistry.js    + custom variables + annotations
Variable registry  (user.email, course.instructor.firstName, courses[] …)
        ↓  page builder                   fx picker, tokens, drag & drop
Page blocks with {{ }} bindings, conditions, repeats
        ↓  lib/cms/dataQuery.js           validated, projected, sanitised
        ↓  lib/cms/pageData.js            route params + data sources → context
Data context
        ↓  lib/cms/binding.js             conditions → repeats → variables
Render-ready blocks
        ↓  Components/cms/BlockRenderer   semantic HTML + resolved CSS
Public page
```

## 2. Modules

| Module | Responsibility |
| --- | --- |
| `lib/cms/types.js` | The variable type system, type icons, and the field ↔ type compatibility matrix. |
| `lib/cms/fieldPolicy.js` | Field exposure policy: which models and fields may never leave the server. |
| `lib/cms/schemaRegistry.js` | Introspects every registered Mongoose schema into typed field trees (nested objects, arrays, references, enums). |
| `lib/cms/variableRegistry.js` | Merges discovered fields with custom variables and owner annotations; runs "Sync Models". |
| `lib/cms/expression.js` | The safe template + formula engine (`{{ path \| pipe }}`, `{{= expr }}`). |
| `lib/cms/conditions.js` | Visual condition groups (AND/OR, 16 operators). |
| `lib/cms/binding.js` | Applies conditions, unrolls repeats, resolves every binding. |
| `lib/cms/dataQuery.js` | The only path from CMS content to MongoDB. |
| `lib/cms/pageData.js` | Builds a page's data context (route params, data sources, custom variables, signed-in user). |
| `lib/cms/publicData.js` | Public-page resolution + the "does this page need data?" fast path. |
| `lib/cms/sampleData.js` | Schema-derived placeholder records for designing without production data. |
| `lib/cms/importExport.js` | Variable export (JSON/CSV) and validated import with a preview. |
| `lib/cms/features.js` | The developer feature switches. |
| `lib/cms/permissions.js` | CMS capabilities mapped onto the app's existing roles. |
| `Components/cms/ScrollVideo.jsx` | The scroll-driven video engine. |

## 3. Binding syntax

Bindings live inside ordinary block property strings, which is what makes them
backward compatible — a property with no `{{ }}` is static text.

```
{{ course.title }}                     a variable
{{ course.price | currency:GBP }}      a variable through a pipe chain
{{= course.price * 0.8 }}              a formula
Hello {{ user.firstName }}, welcome!   a composition of text and variables
```

Available pipe/formula functions: `concat`, `uppercase`, `lowercase`,
`capitalize`, `trim`, `formatDate`, `formatNumber`, `currency`, `truncate`,
`default`, `join`, `length`, `first`, `last`, `lookup`, `slug`, `abs`, `round`,
`ceil`, `floor`, `min`, `max`, `if`.

Formulas are parsed by a hand-written recursive-descent parser that understands
only literals, variable paths, `+ - * / %`, comparisons, `&& || !`, `? :` and the
whitelisted functions above. **No JavaScript is ever executed** — `eval` and
`new Function` are not used anywhere in the engine.

## 4. Block-level dynamic features

Each block may carry (all optional, all absent on legacy blocks):

- `_conditions` — visibility condition group.
- `_condProps` — conditional property/style overrides.
- `_repeat` — repeat this single block once per record.
- `_fallbacks` — per-property fallback when a binding is missing **or empty**.
- `_style` values may themselves be bindings (dynamic CSS).

The `repeater` block type is the visual Repeat container: it holds `children`
blocks and renders them once per record with the item exposed under the
configured name (plus `index`, `number`, `isFirst`, `isLast`, `isEven`, `isOdd`).

## 5. Page-level configuration

`SiteContent` gained two additive fields:

- **`dataSources`** — visual queries (`{ key, model, mode, filters, sort, limit, populate }`)
  whose results become page variables.
- **`dynamicRoute`** — `{ enabled, model, lookupField, paramName, itemKey }`, which
  turns a custom page into a template served at `/<key>/<param>` by
  `app/[slug]/[param]/page.jsx`. One template renders every record.

## 6. Security

- CMS content can express **queries, never Mongo operators**. Model names, filter
  fields, sort fields and populate paths are all validated against the discovered
  schema; anything unknown or blocked is dropped rather than passed through.
- Regex operands are escaped; `$where` and friends are unreachable.
- `lib/cms/fieldPolicy.js` blocks credential fields (`password`, `resetToken`,
  `authToken`, `stripeCustomerId`, payment transactions…), whole models
  (activation tokens, audit log, the CMS's own config collections), and applies
  name patterns to any model added in future. Blocked fields are excluded from
  discovery, from the Mongo projection, and again from the returned documents.
- Values resolved into HTML-bearing properties are HTML-escaped, so a record
  whose title contains `<script>` cannot inject markup.
- Expressions run in the controlled evaluator described above.
- Public responses that contain resolved data are never shared-cached.

## 7. Permissions

| Capability | owner | admin | others |
| --- | :-: | :-: | :-: |
| View variables / data inspector / live preview | ✓ | ✓ | — |
| Export variables | ✓ | ✓ | — |
| Create, edit, import, sync variables | ✓ | — | — |
| Manage data sources | ✓ | — | — |

## 8. Scroll Video

`Components/cms/ScrollVideo.jsx` maps scroll progress onto `video.currentTime`.

- One HTML5 `<video>`; **no frame-image sequence is generated or downloaded**.
- `IntersectionObserver` gates the work; scroll/resize listeners are passive.
- A single `requestAnimationFrame` loop eases towards the target and exits as
  soon as it arrives, so an idle pinned section costs nothing.
- Range requests are served by `app/uploads/[...path]/route.js`, so seeking
  fetches only the bytes it needs.
- Modes: frame scrubbing, progressive, reverse, ping-pong, loop-while-scrolling,
  with start/end offsets, scroll speed, smoothing and an optional mobile source.
- `prefers-reduced-motion` renders a static poster and releases the scroll.
- The builder shows the real duration, dimensions and (where the browser exposes
  `requestVideoFrameCallback`) the measured frame rate, with a frame scrubber.

## 9. API

| Route | Purpose |
| --- | --- |
| `GET /api/owner/cms/variables` | Registry: variables, model tree, categories, sync state |
| `POST/PUT/DELETE /api/owner/cms/variables` | Custom variables and field annotations |
| `POST /api/owner/cms/variables/sync` | Rescan the schemas |
| `GET /api/owner/cms/variables/export` | JSON or CSV export |
| `POST /api/owner/cms/variables/import` | Validated import (preview by default) |
| `GET/POST /api/owner/cms/data/query` | Model metadata; run one query |
| `GET/PUT/DELETE /api/owner/cms/data/sources` | Reusable named data sources |
| `POST /api/owner/cms/preview/data` | Resolve a page's context (live / sample / mixed) |
| `GET /api/cms/[key]` | Public page blocks, plus the resolved context when the page is dynamic |
| `GET /api/cms/[key]/data` | Public resolved context on its own |

## 10. Seeing it work

`scripts/seed-demo-page.mjs` builds a working example against your own database:

```bash
MONGO_URI=... node scripts/seed-demo-page.mjs --with-courses
```

It publishes two pages:

- **`/courses`** — a Scroll Video hero, a heading whose subtitle is the formula
  `{{= length(courses) }}`, and a Repeat over a live `courses` data source
  (DefaultCourse, `status equals active`, sorted by price) rendering one card
  per record with a dynamic `/course/<id>` link.
- **`/course/<id>`** — a detail template rendered once per record, with a CTA
  that only appears while the course is active.

Both open normally in Owner → Website CMS afterwards, so they double as a
worked example of how the pieces fit together. Drop a video at
`public/uploads/cms/demo-scroll.mp4` (or pick one in the block's settings) to
see the scroll section with real frames.

Adding a course straight into MongoDB makes it appear on `/courses` on the next
request — no CMS edit needed. That is the whole point of the data source.

## 11. Tests

`__tests__/cms/` covers schema discovery (simple, nested, arrays, references,
nested references, enums, optional fields), variable resolution, repeaters,
conditions, dynamic HTML/CSS/links, import/export, missing variables,
permissions, sensitive fields, scroll-video mapping, and an end-to-end
acceptance test that renders real HTML from a discovered model.

```
npm test
```
