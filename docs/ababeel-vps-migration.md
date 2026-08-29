# Ababeel — VPS migration

One command sets the CMS up on a fresh or existing deployment.

## On the VPS

From the project directory (where `.env` holds the application's `MONGO_URI`):

```bash
npm run migrate:ababeel -- --dry-run     # show exactly what would change
npm run migrate:ababeel                  # apply it
npm run migrate:ababeel -- --publish-home  # …and publish the new home page immediately
```

The script reads `MONGO_URI` from the environment or the project's `.env`
itself — never retype the connection string on the command line. It refuses to
run against a database that does not look like the application's (no `users`
collection) unless `--force` is passed, and refuses a URI that names no
database at all.

## What it does

| # | Step | Behaviour |
| --- | --- | --- |
| 1 | Registration form fields (10) | **Additive** — fields that already exist are untouched |
| 2 | Course levels (4) | **Additive** |
| 3 | Navigation + footer | Replaced; the previous global settings are backed up first |
| 4 | Training CMS pages (8) | Created with real sections, **disabled**; a page any person has edited is never touched |
| 5 | "Why Ababeel" custom page | Created **enabled** at `/why-ababeel` (it has no built-in fallback) |
| 6 | Home page | Written with the full Ababeel section stack, **disabled** unless `--publish-home`; the previous home page is backed up first |

After it runs, **Owner Dashboard → Website CMS** lists Home, About Us,
Contact Us, Courses, Schedule, Registration, Resources, Awarding Bodies,
Our Team, Our Consultants, and Accreditations & Certifications — each with
editable sections — plus the Why Ababeel custom page.

## Idempotency

Running it twice changes nothing the second time:

- Fields and levels are matched by key/slug and only missing ones are inserted.
- Pages are keyed upserts on their CMS key — no duplicates are possible.
- A page whose `updatedByEmail` is a real person's address is **never**
  overwritten; only untouched or seed-authored documents are refreshed.

## Safety

- It never deletes a record and never drops or empties a collection.
- Everything it replaces (global settings, home page) is copied into the
  `cmsbackups` collection first, and the backup id is printed.
- It creates **no courses, awarding bodies, consultants, testimonials or
  resources** — those are statements about the business and are the owner's to
  write in the dashboard.
- `--dry-run` writes nothing at all.

These properties are asserted by `__tests__/training/seedData.test.js`, which
also keeps the script's data in step with the application's own defaults.

## After migrating

1. Open **Website CMS → Home Page**, review, and enable it (or re-run with
   `--publish-home`).
2. Review each Training Page's seeded sections and enable the ones you want
   CMS-controlled; until then the built-in pages render.
3. In the dashboard, create awarding bodies → courses → course references with
   dates → publish. The public pages fill themselves.
4. Optionally set `NEXT_PUBLIC_SITE_URL` (live origin, no trailing slash) so
   `sitemap.xml` and `robots.txt` carry absolute URLs.

## Verifying against the live database

```bash
LIVE_DB=1 npx jest live
```

runs the 24-step end-to-end click-through (course → reference → schedule →
registration → dashboard) against the configured database, creating tagged QA
records and deleting exactly those on completion.
