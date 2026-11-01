# Customer home & requests — CU-08, CU-11, CU-13

The first two working pages of the customer zone. Same layering as the provider and admin areas: page (server
snapshot or URL-driven client island) → hook → `/api/me/*` (the signed-in user's own data, `requireUser()`) →
service → repository. Every query is scoped by the customer id **from the session**; another customer's request
is a 404.

## Pages

| Route | What it does |
|---|---|
| `/account` | "Welcome, *first name*", Browse services / Request a quote. **Four numbers**, each a link: upcoming bookings, open requests, quotes waiting for you, finished jobs to review. **Needs your attention** (only when there's something): jobs the provider marked done — confirm or report a problem before the auto-release deadline (CU-09, BR-08); bookings waiting for payment; requests with quotes waiting — "*n* quotes, from *X* EGP" (CU-04); finished jobs from the last 30 days without your review (CU-10, BR-03). **Upcoming bookings** (5 soonest, Cairo time, provider, price, status) and **Open requests** (5 newest, compact cards). First snapshot rendered on the server. |
| `/account/requests` | Tabs **Active** (draft, open), **Booked** (a quote was accepted), **Closed** (cancelled, expired) with counts; search by title; 10 per page, in the URL. Each card: the state in the customer's words (**Quotes received** for an open request with quotes waiting — SRS 2.3), category, area, posted date, "Closes in N days" (BR-05), description, quotes (count + lowest waiting price), budget, wanted-on date, photos; the **booking** once a quote is accepted; the next step — **Compare quotes** / **Finish the request** (draft) / **View request**, and **Cancel request**. |

## Rules — `src/utils/customer-request.ts` (pure, 3 tests)

- State shown: `customerRequestState(status, pendingQuotes)` → `QUOTES_RECEIVED` for OPEN with waiting quotes,
  otherwise the request status (ACCEPTED reads "Booked").
- **Cancel (CU-11)**: only `DRAFT` or `OPEN`. An accepted request is a booking — that's cancelled from the booking
  under the BR-06 policy (not built yet). `PATCH /api/me/requests/[id]/status { status: "CANCELLED" }` runs in one
  transaction: conditional UPDATE scoped to the owner (409 if a quote was accepted a moment ago), waiting quotes →
  `EXPIRED`, audit `request.cancel_by_customer`, a `SYSTEM` notification to each provider who quoted. Same writes as
  the admin's "Close request" ([admin-requests-bookings-feature.md](admin-requests-bookings-feature.md)), with the
  customer as actor and no reason required.
- "Quotes waiting" counts `PENDING` quotes on the customer's `OPEN` requests. There's no "seen" flag yet, so "new"
  means "waiting for your decision".
- Review nudges: `COMPLETED` / `CLOSED` bookings completed in the last 30 days (Cairo) with no review **by this
  customer** (reviews are one per side per booking, SY-05).
- Days and times use `utils/zoned-time.ts` (Cairo) and "Closes in N days" is computed on the server, so the server
  render and the browser agree.

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/me/dashboard` | `CustomerDashboardDto` |
| GET | `/api/me/requests?tab&q&page&perPage` | `CustomerRequestList` (`Paginated` + tab `counts`) |
| PATCH | `/api/me/requests/[id]/status` | `{ id, status: "CANCELLED" }` |

All call `requireUser()` and take the user id from the session; reads answer `private, no-store`. Requests aren't
public pages, so nothing revalidates the storefront.

## Files

| Layer | File |
|---|---|
| Schema | `src/schemas/customer.schema.ts` |
| DTOs | `src/types/customer.ts` |
| Repository | `src/repositories/customer.repository.ts` |
| Service | `src/services/customer.service.ts` |
| Routes | `api/me/dashboard/route.ts`, `api/me/requests/route.ts`, `api/me/requests/[id]/status/route.ts` |
| Utils + tests | `src/utils/customer-request.ts`, `tests/utils/customer-request.test.ts` |
| Hook | `src/hooks/use-customer.ts` (`customerKeys` in `constants/query-keys.ts`) |
| Constants | `API_ROUTES.customer.{dashboard,requests,requestStatus}`; audit label `request.cancel_by_customer` |
| UI | `components/customer/dashboard/CustomerDashboard.tsx`, `components/customer/requests/{MyRequestsList,MyRequestCard}.tsx` |
| Pages | `(app)/account/page.tsx`, `(app)/account/requests/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

`/account/requests/new` (create a request, CU-03) is now built — `docs/customer-new-request-feature.md`. The cards link to pages that are still placeholders:
`/account/requests/[id]` (compare and accept quotes, CU-04/05), `/account/bookings[/id]` (confirm completion, pay,
cancel, dispute — CU-07, CU-09, CU-11, CU-12) and `/account/bookings/[id]/review` (CU-10). Also: a "seen" marker for
new quotes, and notifying providers when a request they matched (but didn't quote) is cancelled.
