# Provider schedule & reviews — PR-10, PR-13 (+ icon-only sidebar)

Two SHOULD pages of the provider workspace, plus a shell change for every dashboard. Same layering as
the rest of the app: page (server snapshot or URL-driven client island) → hook → `/api/provider/*` →
service → repository. The provider id always comes **from the session**.

## Pages

| Route | What it does |
|---|---|
| `/provider/schedule` | **Working hours**: one row per weekday, Saturday → Friday (the Egyptian week); a switch for day off / working, up to **3 time ranges** a day (e.g. 9–1 and 4–9), half-hour steps, midnight = 24:00; inline errors; total hours per week; a one-tap preset "Sat–Thu, 9 to 6"; Save / Undo; warns before leaving with unsaved changes. **Next 14 days** (Cairo time, today first): each day's hours (or "Day off") and its bookings (time, title, place, status → booking page), with **"Outside your working hours"** on any booking that falls outside them. |
| `/provider/reviews` | **Summary**: average (as stored on the profile), star distribution 5 → 1, replied / waiting / hidden counts, the BR-04 "under review" warning. Tabs **All / Needs a reply / Replied** (with counts) and a rating filter, in the URL. Each review: stars, customer first name, date, the booking it's for (→ booking page), the comment, and the **public reply** — Reply / Edit / Remove. Reviews Livo hid show as "Hidden by Livo", can't be replied to and don't count. |

## Schedule (PR-10) — `src/utils/availability.ts` (pure, 5 tests)

- Stored as `Availability` rows (`weekday` 0 = Sunday … 6 = Saturday, `startTime` / `endTime` "HH:MM", Cairo
  local). Saving **replaces the whole week** in one transaction; a weekday with no ranges is a day off.
- Rules (`dayError`, applied in the form and again in `scheduleSchema` on the server): times on the 30-minute
  grid between 00:00 and 24:00, end after start, no overlaps, at most 3 ranges a day; no overnight ranges.
- "Outside your working hours" = the booking's Cairo weekday + minute isn't inside any range (end exclusive)
  — `isWithinHours`, with `zonedWeekdayMinutes()` from `utils/zoned-time.ts`. With no hours set there's
  nothing to compare, so nothing is flagged.
- Bookings shown: awaiting the provider, confirmed, in progress, awaiting the customer.
- **Hours are not enforced yet**: the customer booking flow (CU-02) should offer only times inside them when
  it's built. Saving calls `revalidateStorefront()` because hours belong on the public profile and booking flow.

## Reviews received (PR-13, SY-05, BR-04) — `src/utils/review-summary.ts` (pure, 3 tests)

- Only reviews **about** the provider (`revieweeId` = provider). Reviews the provider wrote about customers
  (the other half of SY-05) aren't on this page.
- The summary counts **visible reviews only**, matching the stored `ratingAvg` / `ratingCount`, which admin
  moderation recomputes without hidden reviews (AD-08).
- **Replies are public** (shown under the review on the profile), so a reply with a phone number, email or
  WhatsApp/Telegram link is **refused** (422 on the field) using the same detector as booking notes
  (`utils/contact-mask.ts`) — otherwise every visitor could take the deal off-platform (SY-04, risk R1).
  2–500 characters.
- `PUT …/reply` adds or edits; `DELETE …/reply` removes. One conditional UPDATE scoped to "this provider's
  review and not hidden": someone else's review is 404, a hidden one 409 with the reason.
- Every reply change calls `revalidateStorefront()`. No notification to the customer yet.
- Naming: `provider-received-reviews.service.ts` — `provider-review.service.ts` is the admin's *verification* review.

## Sidebar: icons only instead of hiding (all dashboards)

The header button (and the rail on the sidebar's edge) now collapses the **customer and provider** sidebars to
an **icon strip with tooltips**, exactly like the admin one, instead of sliding them off-screen.

- `DashboardShell`: `collapsible="icon"` and `<SidebarRail />` for every zone (previously only admin).
  Mobile is unchanged: a sheet from the start edge plus the bottom tab bar.
- `components/ui/sidebar.tsx`: the 44px `touch` rows use 20px icons; when collapsed the button is 32px, so the
  icon drops back to 16px (`group-data-[collapsible=icon]:[&_svg]:size-4`) instead of being clipped.
- The open / collapsed state is the shadcn `sidebar_state` cookie, shared by all zones.

## API

| Method | Path | Does |
|---|---|---|
| GET / PUT | `/api/provider/schedule` | week + next 14 days / replace the week `{ days: [{ weekday, ranges: [{ start, end }] }] }` |
| GET | `/api/provider/reviews?filter&rating&page&perPage` | `ProviderReviewList` (`Paginated` + `summary`) |
| PUT / DELETE | `/api/provider/reviews/[id]/reply` | `{ reply }` / remove |

All call `requireProvider()`; reads answer `private, no-store`. Errors: 404 not yours, 409 hidden review,
422 validation.

## Files

| Layer | File |
|---|---|
| Schemas | `src/schemas/provider-schedule.schema.ts` (`scheduleSchema`, `providerReviewListQuerySchema`, `reviewReplySchema`) |
| DTOs | `src/types/provider-schedule.ts` |
| Repository | `src/repositories/provider-schedule.repository.ts` |
| Services | `provider-schedule.service.ts`, `provider-received-reviews.service.ts` |
| Routes | `api/provider/schedule/route.ts`, `api/provider/reviews/route.ts`, `api/provider/reviews/[id]/reply/route.ts` |
| Utils + tests | `utils/availability.ts`, `utils/review-summary.ts`, `zonedWeekdayMinutes` in `utils/zoned-time.ts`; `tests/utils/availability.test.ts`, `review-summary.test.ts` |
| Hook | `src/hooks/use-provider-schedule.ts` (`providerKeys.schedule/reviews/reviewList`) |
| UI | `components/provider/schedule/ScheduleEditor.tsx`, `components/provider/reviews/ReviewsBoard.tsx` |
| Pages | `(provider)/provider/schedule/page.tsx`, `(provider)/provider/reviews/page.tsx` |
| Shell | `components/layout/DashboardShell.tsx`, `components/ui/sidebar.tsx` (`touch` size) |

No schema change and no migration.

## Not done / follow-ups

- Use the hours in the customer booking flow (offer only free slots inside them); days off / holidays.
- Notify the customer when the provider replies; reviews the provider writes about customers (SY-05).
- A month calendar view (the 14-day list covers the MVP need).
