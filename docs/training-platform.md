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

## Status

Done: data models, domain layer, owner CRUD APIs, registration APIs, public read
APIs, seed script.

Remaining: owner dashboard screens, public pages (`/courses`, `/courses/[slug]`,
`/schedule`, `/registration`, `/awarding-bodies`, team/consultants), the
extended template library, header/footer nav wiring, and the animation and SEO
passes.
