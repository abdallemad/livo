# Customer account pages — bookings, payments, addresses, settings (CU-13, CU-14, SY-07, AU-06)

Four more customer pages. Same layering as the rest of the app: page (server snapshot or URL-driven client island)
→ hook → `/api/me/*` (the signed-in user's own data, `requireUser()`) → service → repository. Every query is scoped by
the user id **from the session**; another user's address is a 404.

## Pages

| Route | What it does |
|---|---|
| `/account/bookings` | Tabs **Current** (awaiting payment, awaiting provider, confirmed, in progress, awaiting your confirmation, disputed — soonest first), **Finished**, **Cancelled** with counts; search by number or job. Each card: status, fixed price / from a quote, number, title, provider, appointment (Cairo time), the address, price and how it's paid, **the next step in plain words**, the provider's **phone (tap to call) once confirmed** (BR-02), **Leave a review** for finished jobs not reviewed yet (CU-10), and **Pay now / Confirm the job / Details**. A banner when bookings on another tab need you to pay or confirm. |
| `/account/payments` | Totals: **Paid** (online + cash, all time), **Held safely by Livo** (until you confirm — BR-08), **Refunded to you**. Tabs **Payments** (date, booking, online / cash, amount + refunded part, status and a one-line explanation) and **Invoices** (number, booking, date, total; PDF "soon"). |
| `/account/addresses` | Saved addresses (name, street, details, area, city) with one **Default** (preselected by booking and request forms); **Add** / **Edit** in a dialog (name with Home / Work / Family shortcuts, area in your city, street, building / floor / landmark, "use by default"); **Make default**; **Delete**. Up to 10. |
| `/account/settings` | **Personal details** (photo via Clerk, name, email; mobile and city read-only), **Interests** (onboarding step 4, up to 8), **Account** (Clerk's sign-in & security dialog, sign out, delete account → support). |

## Rules

### Bookings & payments — `src/utils/customer-booking.ts` (pure, tested)

- `customerNextStep(status, { deadline, reviewed })` — one sentence per status, e.g. "The provider marked it done.
  Confirm, or report a problem before *deadline*" (Cairo time, BR-08).
- `contactVisible` — the provider's phone only while a confirmed booking is live (`CONFIRMED`, `IN_PROGRESS`,
  `AWAITING_CONFIRMATION`) and contact is unlocked (BR-02, SY-04). Customers see `PENDING_PAYMENT` bookings
  (providers don't).
- `customerPaymentLabel` — escrow explained: "Paid — held safely by Livo until you confirm the job", "passed to the
  provider", "Cash — pay the provider when the job is done", "Refunded to you"…
- `customerPaymentTotals` — paid = every non-pending, non-failed payment (online and cash); refunded = refunded amounts;
  held = online money still in escrow.
- "Can review" = `COMPLETED` / `CLOSED` and no review by this customer yet (one per side, SY-05).

### Addresses — `src/utils/address-book.ts` (pure, tested)

- Same fields and rules as onboarding's address step (`addressStepSchema`) plus an optional name (≤ 30) and "use by
  default". The area must be active and in the customer's city (one city at launch, A1).
- **Exactly one default** whenever there are addresses: the first address is the default; "make default" clears the
  others in the same transaction; deleting the default promotes the **newest** remaining one (`nextDefaultAfterDelete`).
- Up to **10** (409 past that). Deleting is safe: bookings keep their own address snapshot; a request pointing to the
  address keeps its area (`Address` is `SET NULL` on requests).

### Settings

- **Personal details are shared with provider settings**: one `PersonalDetailsCard` (`components/account/`) and one
  `savePersonalDetails` (`services/account-settings.service.ts`), each zone passing its own route. A photo change re-sends
  the *saved* details only.
- Interests: active top-level categories, same as onboarding.
- **Account deletion (AU-07) via support** for now (same reason as on the provider side:
  [provider-verification-settings-feature.md](provider-verification-settings-feature.md)).
- Customer names aren't on public pages, so these saves don't revalidate the storefront.

### Invoices (SY-07)

Invoice rows exist for finished bookings (number, total, date), but **PDF generation isn't built**, so the button reads
"PDF soon". When it is, serve the file through an owner-only signed link like the other private files.

## API

| Method | Path | Does |
|---|---|---|
| GET | `/api/me/bookings?tab&q&page&perPage` | `CustomerBookingList` (`Paginated` + tab `counts` + `needsAction`) |
| GET | `/api/me/payments?view=payments\|invoices&page&perPage` | `CustomerPayments` (totals + the chosen page) |
| GET / POST | `/api/me/addresses` | list + city areas / add |
| PUT / DELETE | `/api/me/addresses/[id]` | edit / delete |
| PUT | `/api/me/addresses/[id]/default` | make default |
| GET | `/api/me/settings` | personal, interests, options |
| PUT | `/api/me/settings/personal` | `{ name, email }` |
| PUT | `/api/me/settings/interests` | `{ categoryIds }` |

All call `requireUser()`; reads answer `private, no-store`.

## Files

| Layer | File |
|---|---|
| Schemas | `src/schemas/customer-account.schema.ts` (reuses onboarding / provider-account schemas) |
| DTOs | `src/types/customer-account.ts` |
| Repository | `src/repositories/customer-account.repository.ts`; profile writes reuse `onboarding.repository.ts` |
| Services | `customer-account.service.ts`, `account-settings.service.ts` (shared personal details) |
| Routes | `src/app/api/me/{bookings,payments,addresses,settings}/**` |
| Utils + tests | `utils/customer-booking.ts`, `utils/address-book.ts`; `tests/utils/customer-account.test.ts` |
| Hook | `src/hooks/use-customer-account.ts` (`customerKeys.settings/addresses/bookingList/payments`) |
| UI | `components/customer/bookings/MyBookingsList.tsx`, `components/customer/account/{PaymentsHistory,AddressBook,CustomerSettingsForm}.tsx`, shared `components/account/{PersonalDetailsCard,AccountActionsCard}.tsx` (moved out of `ProviderSettingsForm`) |
| Pages | `(app)/account/{bookings,payments,addresses,settings}/page.tsx` |

No schema change and no migration.

## Not done / follow-ups

- The booking detail, payment and review pages the cards link to (`/account/bookings/[id]`, `/review`, `/dispute`) are
  still placeholders, so **Pay now** and **Confirm the job** lead there.
- PDF invoices (SY-07); self-service account deletion (AU-07); map pins for addresses (SY-06).
