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
| `/services` | All services | Browse service categories | placeholder | ◐ | MK-02 |
| `/services/[category]` | Category services | Fixed-price services in a category, or request a quote | placeholder | ● | MK-02 |
| `/services/[category]/page/[page]` | Category services | Paginated listing of the same | placeholder | ● | MK-02 |
| `/services/[category]/[service]` | Service details | Description, fixed price, duration, provider, book | placeholder | ● | MK-02 |
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
| `/account` | My account | Upcoming bookings, open requests, new quotes | built | CU-08 |
| `/account/book/[serviceId]` | Book the service | Date & time → address → notes → payment → confirmation | placeholder | CU-02, CU-07 |
| `/account/requests` | My requests | Quote requests and their status | placeholder | CU-13 |
| `/account/requests/new` | New quote request | Job description, photos, category, address, budget | placeholder | CU-03 |
| `/account/requests/[id]` | Request details | Request stages, quotes received, accept one | placeholder | CU-04, CU-05, CU-08 |
| `/account/bookings` | My bookings | Upcoming and past bookings | placeholder | CU-13 |
| `/account/bookings/[id]` | Booking details | Stages, payment, confirm completion, cancel, dispute | placeholder | CU-09…CU-12 |
| `/account/bookings/[id]/review` | Rate the service | Stars and a comment, after completion | placeholder | CU-10 |
| `/account/bookings/[id]/dispute` | Open a dispute | Reason plus photos or documents | placeholder | CU-12 |
| `/account/messages` | Messages | Chats for confirmed bookings | placeholder | CU-06 |
| `/account/messages/[bookingId]` | Chat | Thread; contact details blocked before confirmation | placeholder | CU-06, SY-04 |
| `/account/payments` | Payments and invoices | Payments and invoices | placeholder | CU-13, SY-07 |
| `/account/addresses` | Addresses | Saved addresses | placeholder | CU-14 |
| `/account/notifications` | Notifications | Updates on requests and bookings | placeholder | SY-02 |
| `/account/settings` | Settings | Name, photo, account deletion | placeholder | AU-06, AU-07 |

## Provider: `(provider)/provider`

Sidebar shell, dynamic, `noindex`. Signed-in `PROVIDER` with onboarding finished (admins may enter).

| Route | Page | What it shows | Status | Req |
|---|---|---|---|---|
| `/provider` | Provider dashboard | New matching requests, today's bookings, monthly earnings | built | PR-14 |
| `/provider/onboarding` | Complete your profile | Superseded by `/onboarding`; retire this placeholder | placeholder | PR-01 |
| `/provider/verification` | Account verification | Documents and review status | placeholder | PR-02, PR-03 |
| `/provider/services` | My services | Fixed-price services offered | placeholder | PR-05 |
| `/provider/services/new` | Add a service | Title, description, price, category, duration | placeholder | PR-05 |
| `/provider/services/[id]/edit` | Edit service | Edit or pause a service | placeholder | PR-05 |
| `/provider/requests` | Available requests | Requests in your specialty and area | placeholder | PR-06, SY-01 |
| `/provider/requests/[id]` | Request details | Details + send a quote | placeholder | PR-07 |
| `/provider/quotes` | Quotes | Quotes sent and their status | placeholder | PR-07 |
| `/provider/bookings` | My bookings | Accept, decline, start, complete | placeholder | PR-08 |
| `/provider/bookings/[id]` | Booking details | Customer details only after confirmation | placeholder | PR-08 |
| `/provider/messages` | Messages | Chats with customers | placeholder | PR-09 |
| `/provider/messages/[bookingId]` | Chat | Thread; contact details blocked before confirmation | placeholder | PR-09 |
| `/provider/portfolio` | Portfolio | Photos of past work | placeholder | PR-04 |
| `/provider/schedule` | Schedule | Available days and hours | placeholder | PR-10 |
| `/provider/earnings` | Earnings | Owed, collected, commission deducted | placeholder | PR-11 |
| `/provider/payouts` | Payouts | Request a payout + history | placeholder | PR-12 |
| `/provider/reviews` | Reviews | Customer reviews and replies | placeholder | PR-13 |
| `/provider/notifications` | Notifications | New requests, bookings, payments | placeholder | SY-02 |
| `/provider/settings` | Settings | Profile, areas, account | placeholder | AU-06 |

## Admin: `(admin)/admin`

Dashboard shell, dynamic, `noindex`; non-admins get a 404 (proxy + layout + every API guard).

| Route | Page | What it shows | Status | Req |
|---|---|---|---|---|
| `/admin` | Dashboard | Live KPIs, "needs attention" counts, approve/reject pending providers, start dispute review, latest bookings ([admin-dashboard-feature.md](admin-dashboard-feature.md)) | built | AD-09, AD-01, AD-05 |
| `/admin/providers` | Provider applications | Status tabs with counts, search, approve / reject / suspend / reinstate ([admin-providers-users-feature.md](admin-providers-users-feature.md)) | built | AD-01 |
| `/admin/providers/[id]` | Review provider | Profile, private documents (signed links), services, track record, history, decisions | built | AD-01 |
| `/admin/users` | Users | Search + role/status filters, suspend / activate | built | AD-03 |
| `/admin/users/[id]` | User details | Account, activity counts, recent bookings, history, suspend / activate | built | AD-03 |
| `/admin/categories` | Categories | Fixed price, quote, or both | placeholder | AD-02 |
| `/admin/categories/new` | New category | Type, parent, status | placeholder | AD-02 |
| `/admin/categories/[id]/edit` | Edit category | Type, parent, status | placeholder | AD-02 |
| `/admin/services` | Services | All fixed-price services; review or suspend | placeholder | AD-02 |
| `/admin/requests` | Requests and quotes | All quote requests and quotes | placeholder | AD-04 |
| `/admin/bookings` | Bookings | Every booking | placeholder | AD-04 |
| `/admin/bookings/[id]` | Booking details | Payment status, held amount, chats | placeholder | AD-04 |
| `/admin/disputes` | Disputes | Open disputes | placeholder | AD-05 |
| `/admin/disputes/[id]` | Resolve dispute | Evidence, decision, full or partial refund | placeholder | AD-05 |
| `/admin/payments` | Payments | Review all payments | placeholder | AD-07 |
| `/admin/payouts` | Payout requests | Approve, reject, mark as paid | placeholder | AD-07 |
| `/admin/settings/commission` | Commission | Platform-wide commission rate | placeholder | AD-06 |
| `/admin/reviews` | Reviews | Hide abusive reviews | placeholder | AD-08 |
| `/admin/content` | Page content | FAQ, terms, static pages | placeholder | AD-10 |
| `/admin/audit-log` | Audit log | Financial operations and admin decisions | placeholder | AD-11, NF-12 |

## Internal

| Route | Page | Notes |
|---|---|---|
| `/design-system-preview` | Design system | Living style guide; open in development, admin-only (404) in production |
| `/robots.txt`, `/sitemap.xml` | (generated) | `src/app/robots.ts`, `src/app/sitemap.ts` |
| `not-found` | Page not found | `src/app/not-found.tsx` |

API endpoints are listed in `docs/api-conventions.md` and `docs/onboarding-feature.md`.
