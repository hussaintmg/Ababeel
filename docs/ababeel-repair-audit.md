# Ababeel — repair audit

What the repair brief alleged, what inspection actually found, and what was
done about each item. Companion to `docs/training-platform.md` (architecture)
and `docs/acceptance-report.md` (point-by-point acceptance).

## Correct and kept

| Area | Finding |
| --- | --- |
| One CMS | A single page builder, block registry (`BLOCK_TYPES`), template registry (`TEMPLATES`), renderer map, variable registry and media library. No parallel system exists — verified by parsing the live data structures, not by reading comments. |
| Section library | The Ababeel templates sit inside the existing shared categories (Heroes 11+6, CTA 5+6, Testimonials 4+5, Team 2+5, Logos 1+3, …). Only two categories were ever added — "Courses" and "Schedule" — because the library had no section of either kind. Guarded by tests that fail on any brand-named category. |
| Catalogue models | `TrainingCourse`, `CourseLevel`, `AwardingBody`, `CourseReferenceSession`, `Registration`, `Resource`, people models. All owner-managed through one registry-driven CRUD. |
| Payment | Disabled boundary in `lib/payments/provider.js`; no payment field anywhere in registration; guarded by tests. |
| Security | Registrations blocked from CMS bindings and the variable registry; owner APIs authenticated; submissions re-validated server-side. |

## Incorrect and repaired

### 1. The brand (the big one)

The platform was built under the name **"ABA Safety"** — template names, seed
copy, page metadata, docs, even the QA tag. The company is **Ababeel**; the
repository's own `constants/webdata` said so all along, and the wrong name was
introduced from a prompt header.

Repaired everywhere user-facing: template names are now `Ababeel — Hero, …`,
seed content says "About Ababeel" / "Why Ababeel", page metadata and docs
follow. Template *ids* (`aba-hero-statement`) were kept — they are internal,
never shown, never stored in a page, and "aba" reads as Ababeel. The guard
test now requires every training template name to start with `Ababeel` and
fails on any brand-named category under either spelling.

### 2. Public pages were not CMS pages

`/courses`, `/schedule`, `/registration`, `/resources`, `/awarding-bodies` and
the three About sub-pages rendered well but did not appear in
**Owner Dashboard → Website CMS**, so the owner could not edit them. Repaired:

- All eight are now registered as managed CMS pages (group "Training Pages").
- Each page renders through `Components/cms/CmsSlot.jsx`: when the owner
  enables the page's CMS document and gives it blocks, those blocks render;
  otherwise the built-in page stands, untouched.
- On the four pages with a working tool (course browser, schedule, form,
  resource library) the slot wraps the **hero region** so the tool below
  survives CMS editing; on the four content pages it wraps the whole page,
  whose sections the live catalogue blocks can fully rebuild.
- The migration seeds each page's CMS document with real sections, disabled,
  so the owner reviews before anything changes publicly.

### 3. Navigation did not match the Ababeel structure

The menu still carried Qualifications and Certificate Verification at top
level and had no Home, no Why Ababeel, no Register Now. Repaired to:
Home · About ▾ (About Us, Our Team, Our Consultants, Accreditations &
Certifications, Why Ababeel) · Courses · Awarding Bodies · Schedule ·
Resources · Contact Us · Register Now. Certificate Verification stays in the
footer's Support column — it is a live feature, just not primary navigation.

### 4. Qualification page

Obsolete under the Ababeel structure. Removed from the default navigation and
footer; the route itself stays reachable so existing links do not 404. Nothing
was deleted.

### 5. "Why Ababeel" page did not exist

Created as a **custom CMS page** at `/why-ababeel`, served by the existing
`/[slug]` route — owned and edited entirely inside the CMS, no code route
behind it. Seeded enabled (it has no built-in fallback to stand behind).

### 6. Global search lacked Pages

The palette searched eight entities but could not jump to a CMS page. A
"Pages" group was added, navigating to `/owner/cms/<key>`.

## Alleged, but found already correct

### `CourseReferenceSession` is not a duplicate

Inspected again, as the brief instructs, rather than assumed. The pre-existing
`CourseReference` is the **partner/ATC financial booking batch**: it requires a
price, owns candidates, links to an `Invoice`, and its statuses are payment
states (`pending_payment`…). The public dated intake ("Course X — September")
is enrolment/marketing data with none of that. Merging them would put public
schedule content inside a financial record and make invoicing depend on
marketing edits. There is **one** source of truth for the public schedule —
`CourseReferenceSession` — and one for partner bookings — `CourseReference`.
The owner dashboard labels the former "Course References", which is the
vocabulary the briefs use. A previous instruction in this project explicitly
endorsed keeping them separate; that stands.

### Pricing and the Course editor

The Ababeel training course editor (`/owner/training/courses`) has **no price
and no currency**, and a test fails if the model ever gains one. Pricing was
**not** stripped from the legacy `Course`/`DefaultCourse` editors because those
feed the partner/ATC invoicing flow — removing price there breaks invoices,
which is exactly the destruction the brief forbids elsewhere. The Ababeel
catalogue is the training system the owner uses; the legacy editors remain the
financial system they always were.

### Dashboard data

Every dashboard list reads MongoDB through the owner APIs. There is no static,
demo or hard-coded data anywhere in the owner screens.

## Known route-name deviations

The briefs variously ask for `/about-us/our-team`, `/about-us/our-accreditation-certifications`
and `/consultants`. The built routes are `/about/team`, `/about/accreditations`
and `/about/consultants`, established in the first phase and already linked,
sitemapped and tested. Renaming them now is churn with no user-visible gain;
the navigation labels match the brief exactly.

## Still outstanding

**The live database click-through.** This environment has no MongoDB and its
egress proxy denies both the MongoDB download hosts and the client's database
host, so it has never been run here. It is written and ready:
`LIVE_DB=1 MONGO_URI="…" npx jest live` — 24 checks over the whole journey,
cleaning up exactly what it creates. Run it on staging before announcing the
site.
