# Provider home & available requests — PR-14, PR-03, PR-06, SY-01

The first two working pages of the provider workspace. Providers are mostly non-technical and on
phones (SRS NF-06), so both pages use cards and large touch targets, plain language, and one clear next
step. Same layering as the admin areas: Server Component page → client island → TanStack Query hook →
`/api/provider/*` → service → repository.

## Pages

| Route | What it does |
|---|---|
| `/provider` | **Account status** (PR-03) when the provider isn't active yet: Incomplete / Under review / Rejected (with the admin's reason) / Suspended, linking to `/provider/verification`. A warning when the profile is under review for low ratings (BR-04). **Four numbers** (PR-14), each a link: new requests (+ quotes still waiting), bookings to accept (+ confirmed / in progress), earned this month (+ wallet balance), rating (+ reviews, jobs done). A **setup checklist** while specialties, areas or a fixed-price service are missing. **New requests for you** (5 newest matching, "See all N") and **Today's bookings** (time in Cairo, title, customer first name, place, number, status). First snapshot rendered on the server. |
| `/provider/requests` | Tabs **New for you** (matching requests not quoted yet) and **Quoted** (every request I sent a quote on, with my quote's price, days and status), with counts. Filters in the URL: specialty (my categories and their sub-categories), sort (newest / closing soon / highest budget), search (title and description), and where — **my areas** (default) or **the whole city**. Each card: category, area, posted N days ago, description, budget, wanted-on date, quotes so far, photo count, closing countdown (highlighted in the last 2 days), "Outside your areas" when browsing the whole city, and **View & send a quote** / **View your quote**. 10 per page, real links. |

Both cards link to `/provider/requests/[id]`, where the quote is sent (PR-07). **That page is still a
placeholder**: it was outside this change's scope.

## Matching rules (SY-01) — `src/utils/request-matching.ts` (pure, 6 tests)

A request is listed under **New for you** when:

1. the provider is **APPROVED** — SRS Flow 3: requests only after activation. Otherwise the page explains
   the account status instead of showing a list;
2. the request is **OPEN** and not past `expiresAt` (BR-05);
3. it is in the provider's **city** (one city at launch, A1);
4. its **category** is one of the provider's, or a **sub-category** of one ("Plumbing" sees "Leak repair";
   a "Tiling" provider does not see every "Finishing" request);
5. its **area** is one of the provider's areas, or the request has no area (whole city). A provider with no
   areas covers the whole city. **Whole city** scope drops this rule — useful while the market is thin
   (business analysis §6.1);
6. the provider hasn't quoted it yet (those are on **Quoted**).

`services/provider-request.service.ts` `matchWhere()` is the same rules as a Prisma filter; the util is the
tested spec — change both together.

## Privacy (BR-02, SY-04, business analysis R1)

Request DTOs carry **no customer name, phone, email or street address** — only area and city — so a deal
can't move off-platform before a booking. On the home page's bookings, the provider sees the customer's
**first name** and the **area** until the booking's contact is unlocked (`contactUnlockedAt`); then the full
address. Request photos are counted but not shown here.

## Numbers on the home page

| Number | Source |
|---|---|
| New requests | the matching rules above, "my areas" scope |
| Quotes waiting | my `PENDING` quotes on `OPEN` requests |
| Bookings to accept | my bookings in `PENDING_PROVIDER`; hint = `CONFIRMED` + `IN_PROGRESS` + `AWAITING_CONFIRMATION` |
| Earned this month | wallet ledger `EARNING` + `REFUND_CLAWBACK` rows created this **Cairo** month (net of commission, PR-11) |
| Wallet balance | `SUM` of all my ledger rows (may be negative: cash-job commission owed) |
| Rating | `ProviderProfile.ratingAvg / ratingCount / completedCount` |
| Today's bookings | `scheduledAt` within today in **Cairo** time, excluding cancelled / declined |

"Today" and "this month" use `src/utils/zoned-time.ts` (`Africa/Cairo`, DST read from `Intl`, 5 tests) — the
server runs in UTC, so a 23:30 booking would otherwise land on the wrong day. Booking times are printed with
a fixed Cairo time zone so the server render and the browser agree.

## Admins

`requireProvider()` lets admins call these endpoints and the zone lets them open `/provider`. An admin has no
provider profile, so both pages say so (`eligibility: "NO_PROFILE"`) instead of failing.

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/provider/dashboard` | `ProviderDashboardDto` |
| GET | `/api/provider/requests?tab&scope&sort&categoryId&q&page&perPage` | `ProviderRequestList` (`Paginated` + `eligibility`, `verificationStatus`, tab `counts`, filter options) |

Both call `requireProvider()`, take the provider id **from the session only**, and answer
`cache-control: private, no-store`. Read-only: no storefront revalidation.

## Files

| Layer | File |
|---|---|
| Schema | `src/schemas/provider.schema.ts` (`providerRequestListQuerySchema`) |
| DTOs | `src/types/provider.ts` |
| Repositories | `request.repository.ts` (`findProviderPage`, `count`, provider-safe select), `provider-dashboard.repository.ts` |
| Services | `provider-request.service.ts`, `provider-dashboard.service.ts` |
| Routes | `api/provider/dashboard/route.ts`, `api/provider/requests/route.ts` |
| Utils + tests | `utils/request-matching.ts`, `utils/zoned-time.ts`; `tests/utils/request-matching.test.ts`, `zoned-time.test.ts` |
| Hook | `src/hooks/use-provider-workspace.ts` (`providerKeys` in `constants/query-keys.ts`) |
| Constants | `API_ROUTES.provider.{dashboard,requests}` |
| UI | `components/provider/dashboard/ProviderDashboard.tsx`, `components/provider/requests/{RequestsBoard,RequestCard}.tsx` |
| Pages | `(provider)/provider/page.tsx`, `(provider)/provider/requests/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

- `/provider/requests/[id]` — request details and **sending a quote** (PR-07). When it lands, invalidate
  `providerKeys.all` after a quote so both pages update.
- The provider layout's `VerificationBanner` is still hard-coded to "Under review" for every provider (a
  TODO in `(provider)/layout.tsx`, outside this change). The home page shows the real status.
- Notifications for new matching requests (SY-02, Flow 2 step 2) aren't sent yet.
- Customer-side request creation (CU-03) doesn't exist yet, so only seeded requests appear.
