# Provider request details — send a quote (PR-07, SY-01, SY-04, BR-02)

`/provider/requests/[id]`: one quote request as a provider may see it, and the provider's quote on it — send, edit while
it waits, withdraw, or send again. Mobile-first, plain language, large targets (NF-06). Same layering as the rest of the
provider workspace: server snapshot → client island → hook → `/api/provider/requests/[id]*` → service → repository.
The provider id always comes from the session (`requireProvider()`).

## Who can open a request

`canView()` in `services/provider-request.service.ts`:

- a provider who **already quoted** it (any status — it's their history), or
- an **APPROVED** provider it **matches**: open, not expired, same city, one of their categories or a sub-category
  (rules 1–4 of `utils/request-matching.ts`). **Areas are ignored** here, like the list's "whole city" scope, so every
  link from `/provider/requests` opens; the page says "Outside your work areas".

Anyone else gets a **404** (the request's existence isn't confirmed). The same rule guards the photos.

## Page

| Section | What it shows |
|---|---|
| Header | Title, category (› sub-category), posted N days ago. |
| Banner | Quote **accepted** → booking number + status + *Open the booking* (or "the customer is paying online" while unpaid — unpaid bookings are hidden from providers). Otherwise the reason quoting isn't possible (closed, not chosen, account not active…). |
| The job | Description with contact details **masked** (`maskContactDetails` — SY-04; a note says so), photos (provider-scoped signed links). |
| Your quote / Send a quote | My quote (price, days, status in words, message, sent / valid-until) with **Change my quote** and **Withdraw** while it waits; the **form** when there's no quote, after withdrawing / expiry ("Send my quote again"), or when changing a waiting one. |
| Side card | Area + city only ("exact address after the customer books" — BR-02), the customer's budget, wanted-on date, how many quotes so far (never other providers' prices), closing countdown (BR-05). |

The customer's **name, phone, email and street address are never sent** to this page; `customerId` is read only to refuse
quoting your own request and to notify the customer.

## Sending a quote — `src/utils/provider-quote.ts` (pure, tested)

`PUT /api/provider/requests/[id]/quote` — `{ price, durationDays?, message?, validDays }`:

| Field | Rule |
|---|---|
| `price` | $50 – $5,000,000 |
| `durationDays` | optional, whole days 1–365 |
| `message` | optional, ≤ 1000, **no phone numbers / emails / chat links** (SY-04, same check as requests) |
| `validDays` | 3, 7 (default), 14 or 30 → `validUntil = now + days`; the customer can't accept it after that |

`quoteSendBlockedReason` (409 with the sentence): your own request; account not APPROVED; quote already **accepted** or
**not chosen**; request not OPEN or past `expiresAt`. `quoteSendMode`:

| Mode | When | Write |
|---|---|---|
| CREATE | no quote yet | new `PENDING` quote (a parallel double-submit hits the unique key → 409) |
| UPDATE | my quote is `PENDING` | conditional update on `PENDING` + request `OPEN` |
| RESEND | my quote was `WITHDRAWN` / `EXPIRED` | same row back to `PENDING`, `createdAt = now` (one quote per provider per request — `@@unique([requestId, providerId])`) |

One transaction; the customer gets a `QUOTE_RECEIVED` notification ("New quote" / "A provider updated their quote", with
price and days) and, after the commit, a **live toast** through Pusher ([realtime-feature.md](realtime-feature.md)). Quotes move no money, so — like withdrawing — they aren't audited. Withdrawing still uses
`PATCH /api/provider/quotes/[id]/status` ([provider-quotes-bookings-feature.md](provider-quotes-bookings-feature.md)).
Every write invalidates `providerKeys.all`, so the home counts, requests and quotes lists update.

## Photos

`GET /api/provider/requests/[id]/photos/[fileId]` → **307** to a 5-minute signed R2 link (`private, no-store`), only for a
provider who may open the request, and only for a file attached to *that* request. 503 if R2 isn't configured.

## API

| Method | Path | Does |
|---|---|---|
| GET | `/api/provider/requests/[id]` | `ProviderRequestDetail` (`private, no-store`; 404 per the rule above) |
| PUT | `/api/provider/requests/[id]/quote` | `ProviderQuoteSentDto` `{ id, status: "PENDING", mode }` |
| GET | `/api/provider/requests/[id]/photos/[fileId]` | 307 to a signed link |

All call `requireProvider()`. Not public: no storefront revalidation.

## Files

| Layer | File |
|---|---|
| Util + tests | `quoteSendBlockedReason`, `quoteSendMode`, `quoteValidUntil`, limits in `src/utils/provider-quote.ts`; `tests/utils/provider-quote-send.test.ts` |
| Schema | `providerQuoteSchema` in `src/schemas/provider.schema.ts` |
| DTOs | `ProviderRequestDetail`, `ProviderQuoteSentDto` in `src/types/provider.ts` |
| Repository | `src/repositories/provider-request.repository.ts` (provider-safe select) |
| Service | `getRequestForProvider`, `sendQuote`, `getRequestPhotoUrlForProvider` in `src/services/provider-request.service.ts` |
| Routes | `src/app/api/provider/requests/[id]/route.ts`, `…/[id]/quote/route.ts`, `…/[id]/photos/[fileId]/route.ts` |
| Hook | `useProviderRequest`, `useSendQuote` in `src/hooks/use-provider-workspace.ts` (key `providerKeys.request`) |
| Constants | `API_ROUTES.provider.request / requestQuote / requestPhoto` |
| UI | `src/components/provider/requests/ProviderRequestDetail.tsx` |
| Page | `src/app/(provider)/provider/requests/[id]/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

- "What you'd get" after Livo's commission next to the price (needs the category's rate on this page).
- Asking the customer a question before quoting (chat only opens after booking, CU-06) and on-site inspection (BR-07, open decision #3).
- Notifications to providers when a matching request is posted are saved by the new-request flow but not pushed live yet.
