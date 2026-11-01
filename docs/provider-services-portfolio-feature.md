# Provider services & portfolio — PR-05, PR-04

Providers manage their fixed-price services (SRS 2.2 type A) and show photos of past work. Mobile-first
cards and forms with large targets (NF-06). Same layering as the rest of the app: page (server snapshot)
→ client island → hook → `/api/provider/*` → service → repository. Every read and write is scoped to the
provider id **from the session**; another provider's service or portfolio item is a 404.

## Pages

| Route | What it does |
|---|---|
| `/provider/services` | Every service as a card: cover photo, **visibility badge** and one sentence saying whether customers can see it and why not, category, price, duration, bookings and photo counts, an **On/Off switch**, **Edit**, **Delete** (disabled with the reason once it has bookings). "Add a service" (up to 30). Quote-only providers get an explanation instead of an empty list. |
| `/provider/services/new` | The service form with a **live preview** of the customer's card: name, category (the provider's own specialties that allow fixed prices), description, price, duration, up to 5 photos. Leftover unsaved uploads are offered back. Warns before leaving with unsaved changes. |
| `/provider/services/[id]/edit` | Same form, prefilled. A banner when Livo has hidden the service (with the admin's reason — saving doesn't un-hide it). |
| `/provider/portfolio` | A gallery of past work: cover, title, details, photo count; **Add past work** / **Edit** in a dialog (title, details, 1–6 photos), **Delete**, and **move up / down** (the order customers will see). Up to 30 items. |

## Services (PR-05)

### Same rules as onboarding

The form and API use `serviceFormSchema` = onboarding's `firstServiceStepSchema`, so a service has one set of
rules wherever it's created: title 5–80, description 20–1,000, price 50–100,000 EGP (2 decimals, stored as
`Decimal`), duration 15 min–1 day, up to 5 photos. The category must be one of the provider's **own**
specialties whose type isn't `QUOTE` and that is switched on (parent too); keeping a service's current
category is allowed even if it was switched off later.

### Visibility — what the provider sees

The list uses the same pure rule as the admin catalog (`utils/service-visibility.ts`) and explains it in the
provider's words (`serviceStatusText` in `utils/provider-catalog.ts`):

| State | Badge | Sentence |
|---|---|---|
| `LIVE` | Live | Customers can see and book it. |
| `PROVIDER_OFF` | Off | Switched off. Customers can't see it. |
| `HIDDEN_BY_ADMIN` | Hidden by Livo | Hidden by Livo: *reason*. Contact support to have it reviewed. |
| `PROVIDER_INACTIVE` | Waiting for activation | Customers will see it once your account is active. |
| `CATEGORY_OFF` | Category paused | Its category is paused on Livo… |

The provider's switch is `Service.isActive`; an admin hide (`hiddenByAdminAt`) is separate, so switching on
never re-publishes a hidden service (AD-02).

### Other rules

- **The slug never changes** after creation: it's the public URL and services have no redirect table
  (CLAUDE.md §4.1 rule 11). Editing the title keeps the URL.
- **Delete only without bookings** (`serviceDeleteBlockedReason`): a booked service is part of the booking's
  history — switch it off instead (409 `DEPENDENCY`). The delete itself is conditional on "still no bookings".
- Up to **30 services** per provider (409 past that).
- Every write (create, edit, on/off, delete) calls `revalidateStorefront()`: services appear on public pages.
- Not audited: no money moves and no admin decision is involved (NF-12).

## Portfolio (PR-04)

- An item is a title (3–80), optional details (≤ 500) and **1–6 photos**; up to **30 items**.
- New items go to the end; **reorder** sends every id in the new order (`PUT /api/provider/portfolio/order`),
  which must be exactly the provider's items (`validateOrder`, else 409). The list moves at once and rolls
  back if the server refuses.
- Every write calls `revalidateStorefront()`: the portfolio is shown on the public provider profile
  (`/providers/[id]`, still a placeholder).

## Photos (both features)

- Upload first (`POST …/images`, multipart `file`), then save the form with the photo ids. Same pipeline as
  onboarding, now shared in `src/services/file-upload.service.ts`: magic-byte check (JPG / PNG / WebP),
  5 MB max, browser-side compression, private R2 bucket. Prefixes: `uploads/services/<userId>/`,
  `uploads/portfolio/<userId>/` — a route only ever builds keys under its own prefix.
- **Saving decides** which photos stay (`planImageChanges`, pure, tested): the list may only contain photos
  already on that item or the provider's own unsaved uploads; photos dropped from the list are deleted (row +
  object). In the form, removing an **already saved** photo only takes it out of the form, so cancelling an
  edit never loses a photo; removing an **unsaved** upload deletes it at once (`DELETE …/images/[id]`, which
  refuses attached photos with 409).
- Photos keep **upload order**; the first is the cover.
- A cap per prefix (all slots full + a little room for unsaved uploads) stops anyone parking unlimited files.
- Thumbnails use **`GET /api/provider/files/[id]`**: owner-only, service and portfolio photos only (never
  verification documents), 307 to a 5-minute signed link, `no-store`. **Public pages will need their own
  image route** (`/api/images/<prefix>/[filename]`, CLAUDE.md §7) when the public catalog and profile are built.

## API

| Method | Path | Does |
|---|---|---|
| GET / POST | `/api/provider/services` | list (with visibility + allowed categories) / create |
| GET / PUT / DELETE | `/api/provider/services/[id]` | form data / save / delete (409 with bookings) |
| PATCH | `/api/provider/services/[id]/status` | `{ isActive }` |
| POST | `/api/provider/services/images` | upload a service photo (201) |
| DELETE | `/api/provider/services/images/[id]` | delete an unsaved service photo |
| GET / POST | `/api/provider/portfolio` | items + unsaved photos / add an item |
| PUT / DELETE | `/api/provider/portfolio/[id]` | save / delete an item |
| PUT | `/api/provider/portfolio/order` | `{ ids }` in the new order |
| POST | `/api/provider/portfolio/images` | upload a portfolio photo (201) |
| DELETE | `/api/provider/portfolio/images/[id]` | delete an unsaved portfolio photo |
| GET | `/api/provider/files/[id]` | owner-only photo preview (307) |

All call `requireProvider()`; the proxy's CSRF check covers every write. Errors: 404 not found / not yours,
409 rule (limit, bookings, attached photo, stale order), 422 validation (on the form field), 503 if storage
isn't configured.

## Files

| Layer | File |
|---|---|
| Constants | `src/constants/provider-catalog.ts` (limits, photo caps); service field limits stay in `constants/onboarding.ts` |
| Schemas | `src/schemas/provider-catalog.schema.ts` |
| DTOs | `src/types/provider-catalog.ts` |
| Repository | `src/repositories/provider-catalog.repository.ts` |
| Services | `provider-catalog.service.ts` (services, uploads, preview), `provider-portfolio.service.ts`, **`file-upload.service.ts`** (shared upload plumbing, moved out of `onboarding.service.ts`) |
| Routes | `src/app/api/provider/{services,portfolio,files}/**` |
| Utils + tests | `src/utils/provider-catalog.ts`, `tests/utils/provider-catalog.test.ts` |
| Hook | `src/hooks/use-provider-catalog.ts` (`providerKeys.services/service/portfolio`) |
| UI | `components/provider/services/{ServicesList,ServiceForm}.tsx`, `components/provider/portfolio/{PortfolioManager,PortfolioItemDialog}.tsx`; reuses `components/forms/ImageUploader.tsx` (**moved** from `components/onboarding/`) and `components/onboarding/ServicePreviewCard.tsx` |
| Pages | `(provider)/provider/services/{page,new/page,[id]/edit/page}.tsx`, `(provider)/provider/portfolio/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

- Public image route + the public provider profile / service pages that show these photos.
- Reordering photos inside a service or item (they keep upload order; the first is the cover).
- Seeded portfolio items have no photos; editing one asks for at least one.
- Admin moderation of portfolio items (only services can be hidden today).
