# Training platform — audit and implementation map

The public training catalogue, schedule and registration flow, and how they sit
alongside what was already here.

## What the audit found

The repository is a Next 16 App Router app (React 19, Tailwind v4, Mongoose 9)
with a mature CMS already in place:

| Area | Where | State |
| --- | --- | --- |
| Page builder | `Components/owner/cms/PageBuilder.jsx`, `Components/cms/BlockRenderer.jsx` | 25 block types, drag reorder, per-block design/animation/visibility |
| Section templates | `Components/cms/templates.js` | ~17 categories of ready-made patterns |
| Variables | `models/CmsVariable.js`, `lib/cms/variableRegistry.js` | custom variables + auto-discovered schema fields, with a sync job |
| Data binding | `lib/cms/dataQuery.js` | validated queries, no raw Mongo from content |
| Dynamic routes | `SiteContent.dynamicRoute` | a page can template over any model |
| Media | `app/api/owner/cms/upload`, `utils/upload.js` | owner-only, type- and size-checked |
| Auth | `lib/auth.js`, `lib/cms/permissions.js` | four roles; CMS is an owner tool |

The important discovery: **`Course` and `CourseReference` are not the public
catalogue.** They are the partner/ATC commercial records — `Course` carries
price, currency and country; `CourseReference` owns candidates, an invoice and a
payment status, and drives `Invoice` and `Deposit`.

So the brief's "remove price and currency from the master Course" could not be
applied to `Course` without breaking invoicing, and its "Course Reference" is a
different thing from the one already in the schema.

## The decision

The public catalogue is its own layer. Nothing in the existing partner, invoice,
candidate or certificate flow was changed.

| Brief calls it | This codebase calls it | Why |
| --- | --- | --- |
| Course | `TrainingCourse` | `Course` is taken by the billing record |
| Course Reference | `CourseReferenceSession` | `CourseReference` is taken by the ATC booking batch |
| Level | `CourseLevel` | — |
| Awarding Body | `AwardingBody` | — |

`TrainingCourse` has **no price and no currency**, which is what the brief asked
for, achieved without putting marketing copy inside a financial record.

## Data flow

```
AwardingBody ──┐
CourseLevel ───┼──▶ TrainingCourse ──▶ CourseReferenceSession ──▶ Registration
               │         (public         (dated intake;            (by id, never
               │          catalogue)      the schedule reads        by name)
               │                          these directly)
```

The schedule is not a stored list. It is `CourseReferenceSession` filtered by
`showInSchedule === true` and a publicly valid status, with the course
populated — so there is nothing to keep in sync and nothing to duplicate.

A registration stores `course` and `session` as ObjectIds plus a name snapshot
for display. Renaming a course leaves historical registrations correctly
attached.

## Payments

There are none, and the absence is enforced rather than assumed:

- `lib/payments/provider.js` describes the future boundary and every method
  throws. `PAYMENTS_ENABLED` is `false`.
- `Registration` has no amount, no payment status and no provider field.
- `/api/registration` never touches the `stripe` dependency (which belongs to
  the separate partner deposit flow).
- A test asserts no default form field collects card, bank or wallet details.

Adding Stripe later means a new provider object and a call site — not a rebuild
of registration.

## Security

- Registrations and the form definition are in `BLOCKED_MODELS`
  (`lib/cms/fieldPolicy.js`): no CMS page binding can read them, only the
  authenticated owner APIs.
- Every owner write goes through a per-resource field whitelist
  (`lib/training/resources.js`); a body containing `$` operators or dotted keys
  is refused outright.
- Registration submissions are re-validated on the server from the live field
  definitions. Unknown keys are dropped; a select answer must be one the form
  offered; a CMS-authored regex is length-capped and cannot throw out of the
  handler.
- Both `courseId` and `referenceId` are re-checked on submit, so a hand-edited
  URL cannot register against a draft course or a closed session.

## Files

```
lib/models/shared.js            SEO / gallery / social sub-schemas, slugify
lib/payments/provider.js        the disabled payment boundary
lib/training/status.js          publication + registration rules (pure)
lib/training/queries.js         public read layer, published-only
lib/training/settings.js        CMS-backed training settings
lib/training/certificate.js     course certificate → default fallback
lib/training/registrationForm.js server-side form validation
lib/training/defaultFields.js   the form a site starts with
lib/training/resources.js       owner resource registry
lib/training/ownerCrud.js       one CRUD implementation for all of them
```

## Seeding

```
npm run seed:training -- --dry-run   # show what would change
npm run seed:training                # write it
```

Idempotent and additive: it inserts the default registration fields and four
course levels, and never overwrites or deletes anything an owner has edited. It
deliberately does not seed courses, awarding bodies, consultants or
testimonials — those are the client's own content, and plausible placeholders on
a safety-training site are how invented claims get published.

## Client-safe modules

`lib/training/constants.js` holds every status and mode enumeration, and the
models import it rather than defining their own. This is not tidiness: card
components import `registrationCta` from `lib/training/status.js`, and while
that file imported a Mongoose model it dragged the whole MongoDB driver into
the browser bundle and failed the production build.

`__tests__/training/clientSafety.test.js` guards the rule at source level,
because the failure only shows up at bundle time.

Client-safe, and required to stay so:

```
lib/training/constants.js
lib/training/status.js
lib/training/format.js
lib/training/defaultFields.js
Components/owner/training/fieldSpecs.js
```

## Design system

`Components/ui/` — import from `Components/ui/index.js`. Tokens and the
typography scale are in `app/globals.css` under `@theme`; Tailwind v4 reads its
theme from CSS, so `tailwind.config.js` has not been read since that upgrade.

`Reveal` reuses the CMS's `[data-cms-anim]` rules rather than adding a second
animation system — those already honour `prefers-reduced-motion`.

`CourseCard` ships five designs chosen by name from
`settings.training.courseCardTemplate`.

## Owner screens

`/owner/training/<resource>` — list, create and edit for all nine resources,
rendered from `Components/owner/training/fieldSpecs.js` and built on the CMS's
existing field editors (`Components/owner/cms/fields`), so the image picker,
rich-text editor and list editor are the ones owners already know.

The spec and the server whitelist are separate files on purpose: the whitelist
in `lib/training/resources.js` is the security boundary, the spec is the user
interface. A field can be moved or relabelled without changing what the API
accepts.

`/owner/registrations` — list with status, course and date filters;
`/owner/registrations/<id>` — the submitted answers (read-only), status, and
appended internal notes.

## Status

Done: data models, domain layer, owner CRUD APIs, registration APIs, public read
APIs, seed script, design system, owner dashboard screens.

Remaining: public pages (`/courses`, `/courses/[slug]`, `/schedule`,
`/registration`, `/awarding-bodies`, team/consultants), the extended template
library and page-builder blocks, header/footer nav wiring, and the SEO,
performance and accessibility passes.
