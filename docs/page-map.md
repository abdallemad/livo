# Page map

Every page that exists in `src/app` today (74 pages), with its English title and status. Generated from the
`page.tsx` files and the `npm run build` route table on 2026-10-31. `docs/SITEMAP.md` is the plan (which pages
*should* exist); this file is what *does* exist. Update both when you add or remove a page.

UI language: **English, LTR** (`SITE_LANG` / `SITE_DIR` in `src/constants/site.ts`).

**Status:** *built* = real UI · *placeholder* = `PagePlaceholder` (title, description, requirement ids) waiting for its feature.
**Rendering** (from the build): ○ static · ◐ ISR (`revalidate = 3600`) · ● SSG (`generateStaticParams`) · ƒ dynamic.

## Public site: `(marketing)`

Header-only shell, no request reads, `noindex` only on `/search?…` (via the proxy).

| Route | Page | What it shows | Status | Rendering | Req |
|---|---|---|---|---|---|
| `/` | Home | Hero, categories, how it works, trust points, provider CTA | built | ◐ | MK-01 |
| `/category` | Categories | Every category with its sub-categories (moved out of `/services`) | built | ◐ | MK-02 |
| `/services` | All services | All fixed-price services with advanced filters (filtered views noindex) ([catalog-feature.md](catalog-feature.md)) | built | ◐ | MK-02, MK-06 |
| `/services/[category]` | Category services | Description, sub-categories, providers count, quote CTA, services, pagination, JSON-LD | built | ● | MK-02 |
| `/services/[category]/page/[page]` | Category services | Page N (page 1 → 308, past the end → 404) | built | ● | MK-02 |
| `/services/[category]/[service]` | Service details | Gallery, price, duration, Book now, provider summary, reviews, more / similar services, JSON-LD; 308 if moved ([catalog-feature.md](catalog-feature.md)) | built | ● | MK-02 |
| `/providers/[id]` | Provider profile | Bio, portfolio, reviews, services; no contact details | placeholder | ● | PR-04, SY-04 |
| `/search` | Search | Find a service in your area | placeholder | ◐ | MK-06 |
| `/how-it-works` | How it works | Steps for customers and providers | placeholder | ◐ | MK-03 |
| `/become-provider` | Join as a provider | Provider landing + sign-up CTA | placeholder | ◐ | MK-04 |
| `/about` | About us | Who we are | placeholder | ◐ | MK-05 |
| `/contact` | Contact us | Contact form | placeholder | ◐ | MK-05 |
| `/faq` | FAQ | Booking, payment, held funds, disputes | placeholder | ◐ | MK-05 |
| `/terms` | Terms of use | Terms of service | placeholder | ◐ | MK-05 |
| `/privacy` | Privacy policy | How data is collected and protected | placeholder | ◐ | MK-05 |

## Auth and onboarding

| Route | Page | What it shows | Status | Rendering | Req |
|---|---|---|---|---|---|
| `/sign-in/[[...sign-in]]` | Sign in | Clerk sign-in inside the site header + footer (`(auth)` group); the header "Sign in" button links here (no modal) | built | ƒ | AU-01, AU-02 |
| `/sign-up/[[...sign-up]]` | Create account | Clerk sign-up inside the site header + footer (`(auth)` group) | built | ƒ | AU-01 |
| `/account-suspended` | Account suspended | Where the zone gate sends a suspended user (static) | built | ○ | AD-03 |
| `/auth-callback` | (none) | Syncs the Clerk user to the DB, then routes to `/onboarding` or the dashboard | built | ○ | AU-03 |
| `/onboarding` | Finish signing up | Post-signup wizard, customer and provider paths ([onboarding-feature.md](onboarding-feature.md)) | built | ○ | AU-03, PR-01, PR-02, PR-05 |

## Customer: `(app)/account`

Sidebar shell, dynamic, `noindex`. Signed-in `CUSTOMER` with onboarding finished (admins may enter).

| Route | Page | What it shows | Status | Req |
|---|---|---|---|---|
| `/account` | My account | Counts, needs your attention (confirm, pay, compare, review), upcoming bookings, open requests ([customer-dashboard-requests-feature.md](customer-dashboard-requests-feature.md)) | built | CU-08 |
| `/account/book/[serviceId]` | Book the service | Date & time → address → notes → payment → confirmation | placeholder | CU-02, CU-07 |
| `/account/requests` | My requests | Active / Booked / Closed, quotes + lowest price, booking link, cancel (draft / open) | built | CU-13, CU-11 |
| `/account/requests/new` | New quote request | Job description, photos, category, address, budget | placeholder | CU-03 |
| `/account/requests/[id]` | Request details | Request stages, quotes received, accept one | placeholder | CU-04, CU-05, CU-08 |
| `/account/bookings` | My bookings | Current / Finished / Cancelled, next step, provider phone once confirmed, review link ([customer-account-feature.md](customer-account-feature.md)) | built | CU-13 |
| `/account/bookings/[id]` | Booking details | Stages, payment, confirm completion, cancel, dispute | placeholder | CU-09…CU-12 |
| `/account/bookings/[id]/review` | Rate the service | Stars and a comment, after completion | placeholder | CU-10 |
| `/account/bookings/[id]/dispute` | Open a dispute | Reason plus photos or documents | placeholder | CU-12 |
| `/account/messages` | Messages | Chats for confirmed bookings | placeholder | CU-06 |
| `/account/messages/[bookingId]` | Chat | Thread; contact details blocked before confirmation | placeholder | CU-06, SY-04 |
| `/account/payments` | Payments and invoices | Paid / held / refunded totals, payment history, invoices (PDF to come) | built | CU-13, SY-07 |
| `/account/addresses` | Addresses | Add, edit, delete, one default, up to 10 | built | CU-14 |
| `/account/notifications` | Notifications | Updates on requests and bookings | placeholder | SY-02 |
| `/account/settings` | Settings | Personal details (Clerk-synced), interests, sign-in & security; deletion via support | built | AU-06 |

## Provider: `(provider)/provider`

Sidebar shell, dynamic, `noindex`. Signed-in `PROVIDER` with onboarding finished (admins may enter).

| Route | Page | What it shows | Status | Req |
|---|---|---|---|---|
| `/provider` | Provider dashboard | Account status, new requests, bookings to accept, month earnings + wallet, rating; 5 newest matching requests, today's bookings (Cairo time) ([provider-dashboard-requests-feature.md](provider-dashboard-requests-feature.md)) | built | PR-14, PR-03 |
| `/provider/onboarding` | Complete your profile | Superseded by `/onboarding`; retire this placeholder | placeholder | PR-01 |
| `/provider/verification` | Account verification | Status + reason, documents (editable per status), send for review again, history ([provider-verification-settings-feature.md](provider-verification-settings-feature.md)) | built | PR-02, PR-03 |
| `/provider/services` | My services | Visibility + reason, on/off switch, edit, delete (only without bookings) ([provider-services-portfolio-feature.md](provider-services-portfolio-feature.md)) | built | PR-05 |
| `/provider/services/new` | Add a service | Title, category, description, price, duration, photos, live preview | built | PR-05 |
| `/provider/services/[id]/edit` | Edit service | Same form; slug never changes; hidden-by-Livo banner | built | PR-05 |
| `/provider/requests` | Available requests | Matching engine (approved only; city, categories + sub-categories, my areas or whole city); tabs New / Quoted, filters, sort | built | PR-06, SY-01 |
| `/provider/requests/[id]` | Request details | Details + send a quote | placeholder | PR-07 |
| `/provider/quotes` | My quotes | Status tabs + counts, price / duration / budget, booking link, withdraw a waiting quote ([provider-quotes-bookings-feature.md](provider-quotes-bookings-feature.md)) | built | PR-07 |
| `/provider/bookings` | My bookings | Current / Finished / Cancelled; accept, decline (reason), start, mark done | built | PR-08 |
| `/provider/bookings/[id]` | Booking details | Next step + actions, when/where, customer (locked until accepted, notes masked), money, timeline | built | PR-08, BR-02 |
| `/provider/messages` | Messages | Chats with customers | placeholder | PR-09 |
| `/provider/messages/[bookingId]` | Chat | Thread; contact details blocked before confirmation | placeholder | PR-09 |
| `/provider/portfolio` | Portfolio | Gallery of past work: add / edit (1–6 photos), delete, reorder | built | PR-04 |
| `/provider/schedule` | Schedule | Weekly hours (Sat→Fri, up to 3 ranges a day) + next 14 days of bookings, flags bookings outside hours ([provider-schedule-reviews-feature.md](provider-schedule-reviews-feature.md)) | built | PR-10 |
| `/provider/earnings` | Earnings | Available, on hold, received, commission; this vs last month; wallet movements with balance after ([provider-earnings-payouts-feature.md](provider-earnings-payouts-feature.md)) | built | PR-11 |
| `/provider/payouts` | Payouts | Request (wallet / InstaPay / bank, min 100 EGP, one at a time) + history with status | built | PR-12 |
| `/provider/reviews` | Reviews | Rating summary + distribution, Needs a reply / Replied, rating filter, public reply (no contact details) | built | PR-13, SY-05 |
| `/provider/notifications` | Notifications | New requests, bookings, payments | placeholder | SY-02 |
| `/provider/settings` | Settings | Personal details (Clerk-synced), work profile (bio, specialties, areas), sign-in & security | built | AU-06 |

## Admin: `(admin)/admin`

Dashboard shell, dynamic, `noindex`; non-admins get a 404 (proxy + layout + every API guard).

| Route | Page | What it shows | Status | Req |
|---|---|---|---|---|
| `/admin` | Dashboard | Live KPIs, "needs attention" counts, approve/reject pending providers, start dispute review, latest bookings ([admin-dashboard-feature.md](admin-dashboard-feature.md)) | built | AD-09, AD-01, AD-05 |
| `/admin/providers` | Provider applications | Status tabs with counts, search, approve / reject / suspend / reinstate ([admin-providers-users-feature.md](admin-providers-users-feature.md)) | built | AD-01 |
| `/admin/providers/[id]` | Review provider | Profile, private documents (signed links), services, track record, history, decisions | built | AD-01 |
| `/admin/users` | Users | Search + role/status filters, suspend / activate | built | AD-03 |
| `/admin/users/[id]` | User details | Account, activity counts, recent bookings, history, suspend / activate | built | AD-03 |
| `/admin/categories` | Categories | Tree with usage counts, on-site switch, edit, delete when unused ([admin-catalog-feature.md](admin-catalog-feature.md)) | built | AD-02 |
| `/admin/categories/new` | New category | Names (EN + AR), URL, type, parent, order, icon, description, status | built | AD-02 |
| `/admin/categories/[id]/edit` | Edit category | Same form; URL read-only | built | AD-02 |
| `/admin/services` | Services | Search, category + visibility filters, why each is (not) public, hide / restore | built | AD-02 |
| `/admin/requests` | Requests and quotes | Status tabs + counts, category filter, search ([admin-requests-bookings-feature.md](admin-requests-bookings-feature.md)) | built | AD-04 |
| `/admin/requests/[id]` | Request details | Request, every quote, its booking, history, close request | built | AD-04 |
| `/admin/bookings` | Bookings | Status (with counts) + type filters, search; amount, commission, payment/escrow | built | AD-04 |
| `/admin/bookings/[id]` | Booking details | Money snapshot, payments/escrow, milestones, timeline, read-only chat, reviews, history, cancel while unpaid | built | AD-04 |
| `/admin/disputes` | Disputes | Status tabs + counts, search, money held ([admin-disputes-reviews-feature.md](admin-disputes-reviews-feature.md)) | built | AD-05 |
| `/admin/disputes/[id]` | Resolve dispute | Evidence, chat, money, start review, decision with live money preview (release / partial / full refund / no action) | built | AD-05 |
| `/admin/payments` | Payments | Totals (collected, held, released, refunded, cash), every payment with status / method / escrow filters + search; read-only ([admin-payments-feature.md](admin-payments-feature.md)) | built | AD-07 |
| `/admin/payouts` | Payout requests | Totals, status filter + search, provider wallet (available / reserved); approve, reject, mark paid ([admin-commission-payouts-feature.md](admin-commission-payouts-feature.md)) | built | AD-07 |
| `/admin/settings/commission` | Commission | Platform rate, per-category rates (inherit from parent), change history | built | AD-06 |
| `/admin/reviews` | Reviews | Both directions, filters, hide / show (rating recomputed, BR-04 flag) | built | AD-08 |
| `/admin/content` | Page content | FAQ, terms, static pages | placeholder | AD-10 |
| `/admin/audit-log` | Audit log | Financial operations and admin decisions | placeholder | AD-11, NF-12 |

## Internal

| Route | Page | Notes |
|---|---|---|
| `/design-system-preview` | Design system | Living style guide; open in development, admin-only (404) in production |
| `/robots.txt`, `/sitemap.xml` | (generated) | `src/app/robots.ts`, `src/app/sitemap.ts` |
| `not-found` | Page not found | `src/app/not-found.tsx` |

API endpoints are listed in `docs/api-conventions.md` and `docs/onboarding-feature.md`.
