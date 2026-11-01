# 2026-11-01 — New quote request, public provider profile, grouped header navigation

- **`/account/requests/new`** (CU-03) — details: [customer-new-request-feature.md](../customer-new-request-feature.md).
  Category (quote categories only, `?category=` preselects), title, description (contact details refused — SY-04), approximate size,
  up to 6 private photos, saved address or area, optional budget and preferred date. Sending opens the request, sets its expiry
  from `request.expiryDays` and notifies matching providers (`NEW_REQUEST_MATCH`) in one transaction.
  New endpoints: `POST /api/me/requests`, `POST /api/me/requests/images`, `DELETE /api/me/requests/images/[id]`, `GET /api/me/files/[id]`.
- **`/providers/[id]`** (PR-04, PR-10, SY-04) — details: [provider-profile-feature.md](../provider-profile-feature.md).
  ISR profile for approved, active providers only (else 404): verified badge, specialties, areas, working hours, bio, track record,
  live services, portfolio, visible reviews with a breakdown. No contact details; provider text is masked. `Person` + breadcrumb
  JSON-LD; every public provider is in the sitemap.
- **Header navigation** — details: [navigation.md](../navigation.md). Three grouped dropdowns (Services with a live category
  column, For providers, Help) that open on hover, click and keyboard focus; the same groups in the mobile sheet. Pages stay static.
- Small fixes: "1 jobs done" → "1 job done"; review **replies** on the service page are now contact-masked too.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `npm run lint`, `npm test` pass (new: `new-request`, `provider-profile`, `nav`, Person JSON-LD tests).
- `npm run build` against a local seeded Postgres: `/`, `/services`, `/about`, `/faq`… stay ○ (1h); `/providers/[id]` is ●;
  `/account/requests/new` is ƒ (private).
- Running build: `/providers/<approved>` 200 with two JSON-LD blocks and no `tel:`/`mailto:`; an unapproved provider and a malformed
  id 404; `sitemap.xml` lists the public providers; all four new API routes answer 401 when signed out.
- `createRequest()` against the seeded DB: request `OPEN`, size line in the description, expiry +7 days, preferred date at Cairo
  midnight, 1 matching provider notified; a phone number in the title, a past date, a foreign address and a fixed-only category are
  each rejected. Test rows removed.
- Browser (Playwright): the Services dropdown opens on hover and closes on leave; mobile sheet shows the groups.
- **Not verified in a browser:** the signed-in form itself (needs a real Clerk instance) and photo upload (needs R2).
