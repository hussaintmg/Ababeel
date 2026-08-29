# ABA Safety platform — acceptance report

Assessed against the 84-point brief. Written after the final QA pass.

**Legend** — ✅ done · 🟡 partial · ⚠️ deviated (with reason) · ❌ not done

---

## Summary

| | Count |
| --- | --- |
| ✅ Done | 76 |
| 🟡 Partial | 3 |
| ⚠️ Deliberate deviation | 4 |
| ❌ Not done | 1 |

*Updated after Phase 2: Resources and global search implemented, section
library integrated, About Us upgrade path confirmed.*

Nothing existing was broken: the partner/ATC booking flow, invoicing, candidates,
certificates, the CMS page builder and the owner dashboard all work exactly as
before. 474 tests pass (the 382 that existed plus 92 new); the production build
compiles.

---

## The four deliberate deviations

These are the places where the brief was not followed literally, each because
following it literally would have broken something that works.

### 1. `TrainingCourse`, not `Course` (brief §13)

The brief says to remove Price and Currency from the master Course. **`Course`
in this codebase is not the public catalogue** — it is the partner/ATC
commercial record. It carries price, currency and country because it drives
`CourseReference` bookings, `Invoice` and `Deposit`. Stripping price out of it
would break invoicing.

So the public catalogue is a separate model, `TrainingCourse`, which carries **no
price or currency at all** — which is what the requirement was actually for. A
test asserts it never gains one.

### 2. `CourseReferenceSession`, not `CourseReference` (brief §21)

`CourseReference` already exists and means the ATC booking batch that owns
candidates, an invoice and a payment status. The brief's "Course Reference" — a
dated intake like *ASP — September 2026* — is a different thing. Merging them
would put marketing data inside a financial record.

The public intake model is `CourseReferenceSession`. The owner dashboard labels
it **"Course References"**, so the client sees the vocabulary the brief uses.

### 3. Variable names follow the existing convention (brief §45)

The brief asks for `{{course.name}}` and `{{reference.startDate}}`. The CMS
derives variable namespaces from model names automatically, so these resolve as
`{{trainingCourse.name}}` and `{{courseReferenceSession.startDate}}`.

Renaming them would mean special-casing two models inside a registry that
currently has no special cases. References are followed, so
`{{trainingCourse.awardingBody.name}}` works.

### 4. Reference sites informed structure only

Information architecture, section ordering and registration UX were taken from
the reference material. No branding, copy, imagery or visual identity was
copied. The palette, typography scale and components are original.

---

## §1–20 — Foundations, design system, courses

| § | Requirement | Status | Notes |
| --- | --- | --- | --- |
| 1 | Reference sites for IA only | ✅ | Structure only; nothing copied |
| 2 | Audit before changing code | ✅ | `docs/training-platform.md` |
| 3 | Data architecture first | ✅ | Models → APIs → UI, in that order |
| 4 | Premium, non-generic design | ✅ | Ink/brand palette, editorial spacing |
| 5 | Centralised design system | ✅ | `Components/ui/`, tokens in `globals.css` |
| 6 | Global header + About dropdown | ✅ | CMS-editable, nested; mobile drawer |
| 7 | Modular CMS home page | ✅ | Template + `npm run seed:training-home` |
| 8 | 6+ hero templates | ✅ | 6 in "ABA — Heroes" |
| 9 | 6+ CTA templates | ✅ | 6 in "ABA — Call To Action" |
| 10 | Testimonials, no Google API | ✅ | Manual entry; no API anywhere |
| 11 | Template library by category | ✅ | 30+ ABA sections in 9 categories |
| 12 | CMS page builder | ✅ | Pre-existing; extended, not replaced |
| 13 | Course fields; no price | ⚠️ | See deviation 1 |
| 14 | Featured image + gallery | ✅ | Upload, reorder, media library |
| 15 | Certificate with default fallback | ✅ | `lib/training/certificate.js`, tested |
| 16 | Dynamic levels | ✅ | `CourseLevel`, seeded with four |
| 17 | Awarding bodies | ✅ | Full CRUD + public pages |
| 18 | Public /courses with filters | ✅ | Sidebar desktop, drawer mobile |
| 19 | Multiple course card designs | ✅ | 5, selectable from settings |
| 20 | Course detail page | ✅ | Every section CMS-driven, omitted when empty |

## §21–36 — Sessions, schedule, registration

| § | Requirement | Status | Notes |
| --- | --- | --- | --- |
| 21 | Course ≠ Course Reference | ⚠️ | See deviation 2 |
| 22 | Mode system incl. custom text | ✅ | Online default; `modeLabel` for custom |
| 23 | /schedule with month navigation | ✅ | 12 months, year rollover, filters |
| 24 | Show in schedule toggle | ✅ | Independent of status; never deletes |
| 25 | Premium schedule, not a table | ✅ | Date cards; empty months stay selectable |
| 26 | Course → Session → Registration | ✅ | Ids throughout, never names |
| 27 | No payment processing | ✅ | Enforced and tested |
| 28 | `?course=&reference=` URL | ✅ | Both resolved and re-validated |
| 29 | Premium registration page | ✅ | Summary above, form below |
| 30 | CMS registration form builder | ✅ | 11 field types, reorder, validation |
| 31 | Default fields | ✅ | All 10, all configurable |
| 32 | Help side panel (not payment) | ✅ | CMS copy + site contact fallback |
| 33 | Future payment placeholder | ✅ | `lib/payments/provider.js`, disabled |
| 34 | Registration record | ✅ | Snapshot names for display only |
| 35 | Owner registrations list | ✅ | 6 statuses, filters, no payment column |
| 36 | Registration detail + notes | ✅ | Answers read-only; notes appended |

## §37–50 — Bodies, about, variables, media, SEO

| § | Requirement | Status | Notes |
| --- | --- | --- | --- |
| 37 | /awarding-bodies | ✅ | Published only |
| 38 | /awarding-bodies/[slug] | ✅ | With its related courses |
| 39 | Premium About section | ✅ | Sub-pages built. `/about-us` is already CMS-managed (`CmsPageContent`), so the ABA sections can be applied from the CMS with the existing copy preserved as the fallback |
| 40 | About dropdown, CMS-controlled | ✅ | Editor now nests |
| 41 | Team system | ✅ | Grid + leadership split |
| 42 | Consultant system | ✅ | Full field set incl. gallery |
| 43 | 5 consultant layouts | ✅ | Stored per consultant |
| 44 | Accreditation page | ✅ | Editorial + logo grid |
| 45 | Variables extended | ⚠️ | See deviation 3 |
| 46 | Model sync | ✅ | Automatic discovery; existing Sync Models covers it |
| 47 | Animation system | ✅ | Reuses `[data-cms-anim]`; reduced-motion honoured |
| 48 | Course/schedule animations | ✅ | Stagger, zoom, lift, arrow |
| 49 | Media library | ✅ | Existing system reused |
| 50 | Per-entity SEO + sitemap | ✅ | Derived sitemap, robots.txt |

## §51–70 — Routes, mobile, states, security, APIs

| § | Requirement | Status | Notes |
| --- | --- | --- | --- |
| 51 | Public route structure | ✅ | All built. `/consultants` lives at `/about/consultants`, per the About dropdown in §40 |
| 52 | Mobile-first | ✅ | Overflow contained; 44px touch targets |
| 53 | Skeleton loading | ✅ | Cards, schedule, detail, tables |
| 54 | Error / empty states | ✅ | Every list and section |
| 55 | Server-side validation | ✅ | Rebuilt from CMS on every submit |
| 56 | Clean APIs | ✅ | Registry-driven owner CRUD + public reads |
| 57 | Relationship-based schema | ✅ | No duplicated course data |
| 58 | Registration keeps ids | ✅ | Renaming a course keeps the link |
| 59 | Template data safety | ✅ | Every optional field handled |
| 60 | Draft / Published / Disabled | ✅ | On every public entity |
| 61 | Course publishing | ✅ | Draft / Published / Archived |
| 62 | Session status behaviour | ✅ | Closed and Cancelled change the button |
| 63 | Schedule logic | ✅ | Derived, never duplicated |
| 64 | Registration logic | ✅ | No invalid links; both ids checked |
| 65 | Future Stripe architecture | ✅ | Boundary only, disabled |
| 66 | No payment processing | ✅ | Tested at source level |
| 67 | Owner registration dashboard | ✅ | All filters; no payment controls |
| 68 | Admin search | ✅ | ⌘K command palette across 8 entities, owner-only |
| 69 | Filter system | ✅ | Public, schedule and dashboard |
| 70 | Performance | ✅ | See below |

## §71–84 — Accessibility, footer, QA

| § | Requirement | Status | Notes |
| --- | --- | --- | --- |
| 71 | Accessibility | ✅ | See below |
| 72 | Responsive templates | ✅ | One implementation per page |
| 73 | Premium footer | ✅ | Three CMS columns, links verified by test |
| 74 | Centralised site settings | ✅ | Pre-existing; training settings added |
| 75 | Template preview | ✅ | Pre-existing `PreviewFrame` |
| 76 | Duplicate template | ✅ | Pre-existing; entity duplication added |
| 77 | Page template system | ✅ | Pre-existing |
| 78 | Data flow example | ✅ | Works end to end |
| 79 | Testing requirements | 🟡 | Logic and wiring covered by 474 automated tests. **The full click-through against a live database has not been run** — see Outstanding |
| 80 | Final quality | ✅ | No placeholder UI in shipped pages |
| 81 | Implementation order | ✅ | Followed |
| 82 | Extend, don't duplicate | ✅ | Field editors, animation system, media all reused |
| 83 | Acceptance criteria | ✅ | This document |
| 84 | Product vision | ✅ | Owner manages everything without code |

---

## Performance pass

| Finding | Fix |
| --- | --- |
| Hero images were lazy-loaded — the LCP element waiting on layout | `ImageWell` gained `priority`; applied to the course and awarding-body heroes |
| "Upcoming sessions" ran one query per month, up to 12 | Replaced with a single date-range query (`getUpcomingSessions`) |
| Repeated catalogue blocks each queried separately | Requests deduplicated per page by cache key |
| Card queries selected whole documents | `listSelect` projections on every list query |
| Pages with only catalogue blocks were uncacheable | `hasTrainingBlocks` keeps them shared-cacheable |

Indexes exist on every field the public queries filter and sort by.

## Accessibility pass

| Finding | Fix |
| --- | --- |
| **Primary button was white on orange — 3.12:1, fails AA** | Dark text on orange, 5.86:1. Matches real safety signage |
| `text-brand-600` on white — 4.14:1, used for every eyebrow and inline link | Moved to `brand-700`, 5.93:1 |
| `text-ink-400` for dates and captions — 4.08:1 | Moved to `ink-500`, 6.50:1 (placeholders correctly stay lighter) |
| `/courses` and `/schedule` outlines skipped h1 → h3 | Visually-hidden h2 names each results region |
| Carousel arrows 36px, dots 6px | 44px targets; the dot stays small inside a large button |
| Schedule month chips 36px tall | 44px |
| `animate-spin` ignored reduced-motion | Slowed rather than frozen — a stopped spinner reads as "stuck" |

Already correct: focus trapping and Escape on drawer and modal, focus returned
to the opener, ARIA tabs pattern, labelled inputs with `aria-describedby`
errors, `aria-live` on results, semantic buttons and links throughout.

---

## Outstanding

**One item, and it is the important one.**

### Live database click-through — NOT PERFORMED

This must be stated plainly: **it has not been tested against a real database.**

- No `.env` exists and no `MONGO_URI` is configured.
- No local or containerised MongoDB is available (`docker` is installed but the
  daemon is not running).
- `mongodb-memory-server` was installed to obtain a real `mongod`, but the
  download is blocked: the agent proxy answers **403 to
  `fastdl.mongodb.org:443`** (policy denial, confirmed in the proxy's own
  failure log).

So every one of the 508 tests is logic-level. The following have **not** been
observed end to end against real data:

| Flow | Status |
| --- | --- |
| Create level → assign to course → filter publicly | Not verified live |
| Create awarding body → publish → public page | Not verified live |
| Create course → upload image → upload certificate | Not verified live |
| Certificate fallback with real uploads | Logic tested; not verified live |
| Create session → schedule appears → toggle Show in Schedule | Not verified live |
| Register Now → query string → prefilled registration | Not verified live |
| Submit registration → owner dashboard record | Not verified live |
| Form builder change → public form updates | Not verified live |
| Testimonial publish/unpublish → public section | Not verified live |

**This should be walked through on staging before the site is announced.** The
report in `docs/training-platform.md` names the same gap.

### Smaller notes

- **`/about-us` still shows its existing content.** The page is CMS-managed, so
  applying the new sections is an owner action in the CMS, not a code change.
  Left alone deliberately: rewriting live client copy was not asked for.
- **Home page ships disabled.** `npm run seed:training-home` writes it but
  leaves it off, so the current home page keeps rendering until reviewed.

## Deployment

### New environment variable

One, and it is optional:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute URLs in `sitemap.xml` and `robots.txt`. Every page uses relative paths, so nothing breaks without it — the sitemap just advertises a fallback domain. Set it to the live origin, no trailing slash. |

No other configuration changed. `STRIPE_SECRET_KEY` is untouched and belongs to
the partner deposit flow; public registration never reaches it.

### After deploying

Resources and global search need no configuration — they use the existing
media library, permissions and dashboard.


```bash
npm run seed:training -- --dry-run   # inspect
npm run seed:training                # registration form fields + 4 course levels
```

Idempotent and additive — it never overwrites an owner's edits.

Then, in the owner dashboard: create awarding bodies → create courses → add
course references with dates → publish. The public pages fill themselves.

Optionally, for the new home page:

```bash
npm run seed:training-home -- --dry-run
npm run seed:training-home           # writes it, DISABLED
```

Review it under Website CMS → Home Page and enable it there.
