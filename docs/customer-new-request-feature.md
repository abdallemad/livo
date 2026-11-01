# New quote request — `/account/requests/new` (CU-03)

The customer describes a job once; verified providers who cover the area and category are notified and reply with quotes
(SRS CU-03, Flow 2, BR-05, SY-01, SY-04). Listed in `docs/SITEMAP.md` §3.

## What the page does

| Part | Behaviour |
|---|---|
| Category | Only active categories priced **by quote** (`type` `QUOTE` or `BOTH`, `takesQuotes()`); fixed-price-only categories are booked directly from `/services`. `?category=<slug>` preselects one — the links on category pages, the service page and the provider profile use it. |
| Title / description | 5–80 and 20–2000 characters. **Contact details are refused** (phone numbers, emails, chat links — `contactProblem()` → `maskContactDetails`), in the Zod schema *and* again in the service, because providers read both before any booking (SY-04). |
| Approximate size (m²) | Optional. There is no column for it, so it becomes the description's first line (`Approximate size: N m²`) where every provider reads it (`composeDescription()`). |
| Photos | Optional, up to 6. Uploaded one by one (compressed in the browser, magic-byte checked, ≤ the image limit) to private R2 under `uploads/requests/<userId>/`, attached on submit. Unsent uploads survive a refresh (listed as pending). Only the owner previews them, through `GET /api/me/files/[id]` (5-minute signed link). They are **not** public — the public image routes only serve `uploads/services/` and `uploads/portfolio/`. |
| Where | A saved address (default preselected) **or** just an area of the customer's city. Providers see only the area before booking (BR-02). No address and no areas → a prompt to add an address. |
| Budget | Optional, 50 – 5,000,000 EGP. |
| Preferred date | Optional; today (Cairo) up to 120 days ahead, stored as Cairo midnight. |
| Send | Opens the request straight away (`OPEN`; there is no draft step), `expiresAt` = now + `SiteSetting["request.expiryDays"]` (1–60, default 7 — BR-05). Redirects to `/account/requests` with a toast naming how many providers were told. Unsaved changes warn before leaving. |

Side panel: what happens next (who is notified, where quotes appear, contact stays private until booking).

## Flow

```
NewRequestForm ─ useCreateRequest()        POST   /api/me/requests                 requireRole("CUSTOMER") → newRequestSchema → createRequest()
               ─ useUploadRequestPhoto()   POST   /api/me/requests/images          requireRole("CUSTOMER") → parseUpload → uploadRequestPhoto()
               ─ useDeleteRequestPhoto()   DELETE /api/me/requests/images/[id]     requireRole("CUSTOMER") → deleteRequestPhoto()   (unsent only)
thumbnails     ─ <img src=…>               GET    /api/me/files/[id]               requireUser() → owner + prefix check → 307 signed link
page.tsx (server) → getNewRequestFormData(userId, ?category)
```

`createRequest()` (one transaction): validate category → resolve address (must be the customer's, in their city) or area (in their
city) → check the date → check every photo is the customer's own **unsent** request upload → create the request → attach photos
(count must match) → `NEW_REQUEST_MATCH` notifications to matching providers.

**Matching** (SY-01, the mirror of `utils/request-matching.ts`): approved providers with an active account, in the same city, offering
the category or its parent, covering the area (or listing no areas = whole city); capped at 200 notifications — the provider inbox
`/provider/requests` lists every match regardless.

## Files

| Layer | File |
|---|---|
| Page | `src/app/(app)/account/requests/new/page.tsx` (dynamic, private, `noindex` from the zone layout) |
| UI | `src/components/customer/requests/NewRequestForm.tsx` (reuses `ImageUploader`, `FormField`, `OptionSelect`) |
| Hooks | `src/hooks/use-customer.ts` — `useCreateRequest`, `useUploadRequestPhoto`, `useDeleteRequestPhoto` |
| API | `src/app/api/me/requests/route.ts` (`POST` added), `…/requests/images/route.ts`, `…/requests/images/[id]/route.ts`, `src/app/api/me/files/[id]/route.ts` |
| Service | `src/services/new-request.service.ts`; `REQUEST_IMAGE_PREFIX` in `services/file-upload.service.ts` |
| Repository | `src/repositories/new-request.repository.ts` |
| Schema | `newRequestSchema` in `src/schemas/customer.schema.ts` |
| Types | `RequestPhotoDto`, `NewRequestFormData` in `src/types/customer.ts` |
| Utils | `src/utils/new-request.ts` (limits, `takesQuotes`, `composeDescription`, `contactProblem`, `expiryDays`, `preferredDateProblem`); `zonedIsoDay`, `zonedDayStart` in `utils/zoned-time.ts` |
| Tests | `tests/utils/new-request.test.ts` |

No schema change and no migration.

## Not done yet

- Providers see a request's photo **count**, not the photos: a provider-side request detail with signed previews is a follow-up.
- No "save as draft" (the status exists; the form sends straight to `OPEN`).
- Notifications are in-app rows only; push/SMS delivery is a separate feature.
