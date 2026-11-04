# Customer reviews — CU-10, BR-03, SY-05 (+ BR-04)

`/account/bookings/[id]/review`: the customer rates a finished booking with 1–5 stars and an optional comment, then sees
the review the way the provider and visitors do. Same layering as the booking page
([customer-booking-detail-feature.md](customer-booking-detail-feature.md)): server snapshot → client island → hook →
`/api/me/bookings/[id]/review` → service → repository. The customer id always comes **from the session**; someone else's
booking is a 404.

## Where it's reached from

| From | Link |
|---|---|
| `/account/bookings/[id]` | **Leave a review** (finished and not rated yet) / **See your review** (already rated) |
| `/account/bookings` (Finished tab) | **Leave a review** on each finished booking not rated yet |
| `/account` dashboard | "Done. Tell others how it went — leave a review." next step |

## Page

| State | What it shows |
|---|---|
| Can't be rated (`blockedReason`) | A banner with the reason (not done yet / cancelled / open dispute) and **Back to the booking**. No form. |
| Not rated yet | **How did {provider} do?** — star input (radio group, 44 px targets, labels Poor → Excellent), optional comment with a counter (≤ 1000), **Post review**. |
| Rated | **Your review**: stars, posted / edited dates, the comment, the provider's public **reply**, "Hidden by Livo" if moderated, and **Edit review** with "You can change it until …", or why it can't change any more. |
| Editing | The same form pre-filled, **Save changes** / **Cancel** (warns about unsaved changes). |

Side card: the provider (avatar, name, "Job confirmed {date}", link to the public profile) and a note that reviews are
public. Field errors from the API (422) land on the field; 409s show as a toast.

## Rules — `src/utils/customer-review.ts` (pure, tested)

- **Who / when (BR-03):** only the booking's customer, only when the booking is `COMPLETED` or `CLOSED`. `CANCELLED` /
  `REJECTED` → "nothing to rate"; `DISPUTED` → "once it's settled"; anything earlier → "once the job is done". A review
  that already exists is always shown, whatever the booking's status became.
- **Once per booking (SY-05):** the DB unique `(bookingId, reviewerId)`. Two tabs submitting at once → the second gets 409.
- **Editing:** for **7 days** (`REVIEW_EDIT_DAYS`) after posting, and only while the provider hasn't replied (the reply
  would lose its context) and Livo hasn't hidden it (AD-08). The update is one conditional `UPDATE … WHERE isHidden =
  false AND providerReply IS NULL AND createdAt >= now − 7 days`, so a reply or a moderation landing at the same moment wins
  (409 "just changed").
- **Comment:** optional (stars only is fine), trimmed, ≤ 1000 characters. Reviews are **public** (provider profile,
  service page), so phone numbers, emails and WhatsApp/Telegram links are **refused** (422 on `comment`) with the same
  detector as the provider's reply and booking notes (`utils/contact-mask.ts`, SY-04, risk R1).
- No delete: a review the customer regrets can be edited inside the window; abusive ones are hidden by an admin.

## What one save writes (one transaction)

1. The review — created (`revieweeId` = the booking's provider) or updated.
2. The provider's `ratingAvg` / `ratingCount` from **visible** reviews and the BR-04 `underReview` flag
   (`SiteSetting["review.lowRatingThreshold"]`) — `refreshProviderRating()` in `services/provider-rating.service.ts`,
   now shared with admin moderation ([admin-disputes-reviews-feature.md](admin-disputes-reviews-feature.md)).
3. Audit `review.create` / `review.update` (`bookingId`, `rating`, `previousRating`).
4. A `REVIEW_RECEIVED` notification to the provider ("New review on booking LV-…" / "The customer updated their review of
   LV-…", body "4 stars — “…”"), pushed live after the commit; it opens `/provider/reviews`.

Then the route calls `revalidateStorefront()`: the rating and the review appear on public pages.

## API

| Method | Path | Does |
|---|---|---|
| GET | `/api/me/bookings/[id]/review` | `CustomerBookingReview` — booking, provider, `blockedReason`, the review (with `editBlockedReason`, `editableUntil`, `edited`). `private, no-store`; 404 if not yours. |
| PUT | `/api/me/bookings/[id]/review` | `{ rating: 1..5, comment? }` → `CustomerReviewSaveDto` `{ review, created }`. 409 can't be rated / can't be edited / already rated; 422 bad rating or a comment with contact details. |

Both call `requireUser()`; PUT goes through the proxy's CSRF check like every write.

## Files

| Layer | File |
|---|---|
| Util + tests | `src/utils/customer-review.ts`; `tests/utils/customer-review.test.ts` |
| Schema | `src/schemas/customer-review.schema.ts` (`customerReviewSchema`) |
| DTOs | `src/types/customer-review.ts` |
| Repository | `src/repositories/customer-review.repository.ts`; rating aggregates reuse `review.repository.ts` |
| Services | `src/services/customer-review.service.ts`; `src/services/provider-rating.service.ts` (shared with `admin-review.service.ts`) |
| Route | `src/app/api/me/bookings/[id]/review/route.ts` |
| Hook | `useMyBookingReview`, `useSaveMyBookingReview` in `src/hooks/use-customer-account.ts` (key `customerKeys.bookingReview`) |
| Constants | `API_ROUTES.customer.bookingReview`; audit labels `review.create`, `review.update` |
| UI | `src/components/customer/bookings/ReviewBookingForm.tsx` (uses `RatingInput` / `RatingStars` from `components/shared`); "See your review" link in `MyBookingDetail.tsx` |
| Page | `src/app/(app)/account/bookings/[id]/review/page.tsx` |

No schema change and no migration.

## Trying it

After `npm run db:reset -- --yes` (or `npm run db:seed`) the mock data has two finished bookings with no customer
review: **LV-…-000016** (Sophie Muller ← Nico Schroeder, AC service) and **LV-…-000017** (Julien Hoffmann ← Sara Costa,
cash cleaning). Seed users can't sign in (they aren't Clerk users), so to click through it, sign in with your own
account, book and complete a job, or point one of those bookings' `customerId` at your user id.

## Not done / follow-ups

- **The provider's review of the customer** (the other half of SY-05). The model supports it (seed booking 7 has one);
  there's no provider page for writing it yet.
- Notify the customer when the provider replies (also listed in
  [provider-schedule-reviews-feature.md](provider-schedule-reviews-feature.md)).
- Photos on reviews; a "report this review" button for providers.
- When the BR-08 auto-release job is built, it could notify the customer to leave a review.
