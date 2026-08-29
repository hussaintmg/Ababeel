# Ababeel — VPS migration

One command sets the CMS up on a fresh or existing deployment.

## On the VPS

From the project directory (where `.env` holds the application's `MONGO_URI`):

```bash
npm run migrate:ababeel -- --dry-run   # show exactly what would change
npm run migrate:ababeel                # apply it — pages and home page go LIVE
npm run migrate:ababeel -- --draft     # …seed everything switched off for review instead
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
| 3 | Navigation + footer | Replaced; the previous global settings are backed up first. Logo settings still pointing at the leftover pre-Ababeel template assets (`/logo.png`, `/logo-2.png`, `/favicon.ico`) are re-pointed to the Ababeel logo files; a logo the owner uploaded themselves is never touched |
| 4 | Training CMS pages (8) | Written **LIVE** with their complete designed section stacks (`--draft` seeds them switched off); a page any person has edited is never touched |
| 5 | "Why Ababeel" custom page | Created **enabled** at `/why-ababeel` (it has no built-in fallback) |
| 6 | Home page | Written **LIVE** with the full Ababeel section stack (`--draft` leaves it off); the previous home page is backed up first |

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

1. Every page is live and editable in **Website CMS** immediately. The shipped
   design of any page is also in the template library ("Full Pages" category),
   so a page can be reset to it with one click.
2. In the dashboard, create awarding bodies → courses → course references with
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
