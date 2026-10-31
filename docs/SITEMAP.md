# SITEMAP.md — Livo Page & Route Map

> **What this file is.** The single source of truth for *which pages exist* in Livo.
> Read it together with `CLAUDE.md` (architecture, layers, rendering rules) and `docs/srs.md` (requirements).
> **Before creating any route, check it is listed here.** If a page is not listed, do not invent it. Ask, or add it here first.
> When you add/remove a page, update this file in the same change.

- Language: **Arabic, RTL** (`<html lang="ar" dir="rtl">`). All UI copy in Arabic. Route paths stay English.
- Currency: EGP. Launch scope: one city, 3–5 service categories.
- Requirement IDs (e.g. `CU-02`) refer to `srs.md`.

---

## 1. Roles & route zones

| Role | Zone | Route group | Shell | Rendering |
|---|---|---|---|---|
| Visitor | public | `(marketing)` | Header-only | **Static / ISR / SSG** |
| Customer | `/account/*` | `(app)` | Sidebar | Dynamic, `noindex` |
| Provider | `/provider/*` | `(provider)` | Sidebar | Dynamic, `noindex` |
| Admin | `/admin/*` | `(admin)` | Dashboard shell | Dynamic, `noindex`, 3-layer gate |

`Role { CUSTOMER, PROVIDER, ADMIN }`. `User.id` = Clerk user id (see CLAUDE.md §5).
Open decision: allow one account to act as both customer and provider (a "switch mode" toggle). Until decided, a user has **one** role.

### Access rules
| Zone | Who may enter | If not allowed |
|---|---|---|
| Public | everyone | — |
| `/account/*` | signed-in `CUSTOMER` | redirect to `/sign-in` |
| `/provider/*` | signed-in `PROVIDER` | redirect to `/sign-in`; if role is wrong → `/onboarding` |
| `/provider/*` (except onboarding & verification) | provider with `verification_status = ACTIVE` | redirect to `/provider/verification` |
| `/admin/*` | `ADMIN` only | **rewrite to 404** (never 403/redirect) |

Enforce at all three layers: `src/proxy.ts` → zone `layout.tsx` → every Server Action (`requireUser()` / `requireProvider()` / `requireAdmin()`). Ids come from the session, never from the request body.

---

## 2. Public site — `src/app/(marketing)/`

Static/ISR, indexed, in `sitemap.ts`. Layouts read nothing from the request.

| Route | Page | Rendering | Req |
|---|---|---|---|
| `/` | Home: value prop, categories, how-it-works teaser, CTA for customer & provider | static, `revalidate = 3600` | MK-01 |
| `/services` | All categories | SSG | MK-02 |
| `/services/[category]` | Category page: fixed-price services + "request a quote" CTA | SSG (`generateStaticParams` = all slugs) + `…/page/[page]` | MK-02 |
| `/services/[category]/[service]` | Fixed-price service detail + "Book now" | ISR (`generateStaticParams → []`, `revalidate = 3600`) | MK-02 |
| `/providers/[id]` | Public provider profile: bio, portfolio, rating, reviews, services. **No contact details** | ISR | PR-04, SY-04 |
| `/how-it-works` | Two tabs/sections: for customers, for providers | static | MK-03 |
| `/become-provider` | Provider landing + CTA to sign-up as provider | static | MK-04 |
| `/about` | About | static | MK-05 |
| `/contact` | Contact form | static | MK-05 |
| `/faq` | FAQ | static (or CMS-driven, AD-10) | MK-05 |
| `/terms` | Terms of service | static | MK-05 |
| `/privacy` | Privacy policy | static | MK-05 |
| `/search` | Search service + area (**SHOULD**) | dynamic; `X-Robots-Tag: noindex, follow` set in proxy | MK-06 |
| `/blog`, `/blog/[slug]` | **COULD** — skip in MVP | | MK-08 |

### Auth pages — `src/app/`
| Route | Page | Req |
|---|---|---|
| `/sign-in/[[...sign-in]]` | Phone + OTP sign-in | AU-01, AU-02 |
| `/sign-up/[[...sign-up]]` | Phone + OTP sign-up | AU-01 |
| `/auth-callback` | Sync Clerk user → DB, then route by role | CLAUDE.md §5 |
| `/onboarding` | First sign-in: choose Customer or Provider, then redirect | AU-03 |

> Open point: SRS says phone + OTP. CLAUDE.md assumes Clerk. Verify Clerk phone-OTP availability/cost for Egypt before locking this in.

---

## 3. Customer — `src/app/(app)/account/`

All `noindex`. Per-visitor UI is a client island (`AccountControls`), layouts stay request-free.

| Route | Page | Purpose | Req |
|---|---|---|---|
| `/account` | Dashboard | Upcoming bookings, open requests, new quotes | CU-08 |
| `/account/book/[serviceId]` | **Book fixed-price service** (wizard, ≤ 5 steps) | date/time → address → notes → payment → confirm | CU-02, CU-07 |
| `/account/requests` | My requests | List with status | CU-13 |
| `/account/requests/new` | **New quote request** | description, photos, category, address, optional budget, preferred time | CU-03 |
| `/account/requests/[id]` | Request details | Timeline, received quotes, compare, accept one | CU-04, CU-05, CU-08 |
| `/account/bookings` | My bookings | List | CU-13 |
| `/account/bookings/[id]` | Booking details | Status timeline, pay, confirm completion, review, cancel, open dispute | CU-09…CU-12 |
| `/account/bookings/[id]/review` | Leave review (stars + comment) | Only when `Completed` (BR-03) | CU-10 |
| `/account/bookings/[id]/dispute` | Open dispute with reason + evidence | | CU-12 |
| `/account/messages` | Conversations list | Only for confirmed bookings | CU-06 |
| `/account/messages/[bookingId]` | Chat thread | Block phone/email patterns (SY-04) | CU-06, SY-04 |
| `/account/payments` | Payments & invoices | PDF invoices (SHOULD) | CU-13, SY-07 |
| `/account/addresses` | Saved addresses | SHOULD | CU-14 |
| `/account/notifications` | Notification center | | SY-02 |
| `/account/settings` | Profile (name, photo), delete account | | AU-06, AU-07 |

Browsing services reuses the **public** pages (`/services/*`). Do not duplicate them under `/account`.
Later (not MVP): `/account/favorites` (CU-15), coupons (CU-16), milestone payments (CU-17).

---

## 4. Provider — `src/app/(provider)/provider/`

All `noindex`. Gate by verification status (see §1).

| Route | Page | Purpose | Req |
|---|---|---|---|
| `/provider/onboarding` | Complete profile | specialty, experience, categories, coverage areas | PR-01 |
| `/provider/verification` | Verification | Upload ID/photo/certificates + status: `PENDING` / `ACTIVE` / `SUSPENDED` / `REJECTED` (with reason) | PR-02, PR-03 |
| `/provider` | Dashboard | New matching requests, today's bookings, month earnings, simple stats | PR-14 |
| `/provider/services` | My fixed-price services | List | PR-05 |
| `/provider/services/new` | Add service | title, description, price, category, duration | PR-05 |
| `/provider/services/[id]/edit` | Edit / deactivate service | | PR-05 |
| `/provider/requests` | **Available project requests** matching category + area | | PR-06, SY-01 |
| `/provider/requests/[id]` | Request details + **submit quote** (price, duration, message) | Customer contact hidden | PR-07 |
| `/provider/quotes` | My quotes | Status of each | PR-07 |
| `/provider/bookings` | Bookings | Accept / reject / start / finish | PR-08 |
| `/provider/bookings/[id]` | Booking details | Customer info only after confirmation (BR-02) | PR-08 |
| `/provider/messages` | Conversations list | | PR-09 |
| `/provider/messages/[bookingId]` | Chat thread | | PR-09 |
| `/provider/portfolio` | Portfolio gallery (upload/delete photos) | | PR-04 |
| `/provider/schedule` | Availability / calendar | SHOULD | PR-10 |
| `/provider/earnings` | Wallet: due, collected, commission deducted | | PR-11 |
| `/provider/payouts` | Request payout + history | | PR-12 |
| `/provider/reviews` | Reviews received, reply | SHOULD | PR-13 |
| `/provider/notifications` | Notification center | | SY-02 |
| `/provider/settings` | Profile, areas, account | | AU-06 |

Out of MVP: company/team accounts (PR-15), paid promotion (PR-16).

---

## 5. Admin — `src/app/(admin)/admin/`

All `noindex`. Do **not** list `/admin` in `robots.ts`. CRUD routes follow `/admin/<area>/<entity>`, `/new`, `/[id]`, `/[id]/edit`.

| Route | Page | Purpose | Req |
|---|---|---|---|
| `/admin` | KPI dashboard | users, requests, GMV, commission | AD-09 |
| `/admin/providers` | Provider applications | Queue filtered by status | AD-01 |
| `/admin/providers/[id]` | Review provider | View documents, approve / reject with reason (notifies provider) | AD-01 |
| `/admin/users` | All users (customers + providers) | Suspend / activate | AD-03 |
| `/admin/users/[id]` | User detail | | AD-03 |
| `/admin/categories` | Categories list | | AD-02 |
| `/admin/categories/new`, `/[id]/edit` | Category CRUD | type: `fixed` / `quote` / `both`, parent, active flag | AD-02 |
| `/admin/services` | All fixed-price services | Moderate / deactivate | AD-02 |
| `/admin/requests` | All quote requests (+ quotes) | | AD-04 |
| `/admin/bookings` | All bookings | | AD-04 |
| `/admin/bookings/[id]` | Booking detail | Payment/escrow state, messages (for disputes) | AD-04 |
| `/admin/disputes` | Disputes queue | | AD-05 |
| `/admin/disputes/[id]` | Resolve dispute | Review evidence, decide, full/partial refund; writes audit log | AD-05 |
| `/admin/payments` | Payments | Review | AD-07 |
| `/admin/payouts` | Payout requests | Approve / reject / mark paid | AD-07 |
| `/admin/settings/commission` | Commission % (global; per-category later) | | AD-06 |
| `/admin/reviews` | Reviews moderation | Hide offending reviews (SHOULD) | AD-08 |
| `/admin/content` | Static page content (FAQ, terms…) | SHOULD | AD-10 |
| `/admin/audit-log` | Audit log | All financial ops and admin decisions | AD-11, NF-12 |

---

## 6. API routes — `src/app/api/` (exceptions only)

Everything else is a Server Action. Allowed Route Handlers (CLAUDE.md §7):

| Route | Purpose |
|---|---|
| `/api/webhook/payments` | Payment gateway webhook (verify signature on raw body; the webhook is the source of truth for payment state) |
| `/api/upload` | Image/document upload (session + `Origin` check; compress, magic-byte validation) |
| `/api/images/[prefix]/[filename]` | Stream public images (portfolio, services) with immutable cache |
| `/api/realtime/*` | Chat / notifications transport (WebSocket or SSE, if not handled by an external service) |

Verification documents (ID, certificates) are **private**: presigned short-lived URLs, admin-only.

---

## 7. Request / booking state machine (pages must reflect this)

```
Draft → Open → (Quotes received) → Accepted → Paid/Escrowed
      → In Progress → Completed → Reviewed → Closed
Exceptions: Cancelled · Disputed · Expired
```

- Customer pages show the current state as a **timeline** (CU-08).
- Provider and admin pages only expose the actions valid for the current state.
- `Open` requests with no quotes `Expired` after a configurable period (BR-05).
- Escrow released only after customer confirmation or objection-window expiry (BR-08).

---

## 8. Cross-cutting page rules

1. **Contact masking (SY-04 / BR-02):** no phone/email shown to the other party in any page or chat message before booking confirmation.
2. **Empty, loading, and error states** are required for every list/detail page (RTL, Arabic copy, weak-connection friendly: NF-08).
3. **Providers are mostly non-technical:** keep provider screens minimal, large tap targets, few steps (NF-06).
4. **Every private page** exports `robots: { index: false, follow: false }`; `/admin` returns 404 to non-admins.
5. **Public pages** need `generateMetadata`, canonical, breadcrumbs + JSON-LD (`Service`, `BreadcrumbList`, `Organization`) and must appear in `sitemap.ts`. Private routes must not.
6. **Pagination** on crawlable lists uses real links `…/page/[page]`; `?page=1` → 301 to clean URL.
7. After any write that changes public content (service, category, provider profile/rating), call `revalidateStorefront()`.
8. Shared layouts: `(marketing)` header, `(app)` and `(provider)` sidebar, `(admin)` dashboard. The nav lists live in `src/constants/` (e.g. `customer-nav.ts`, `provider-nav.ts`, `admin-nav.ts`). Add a page there when you add the route.

---

## 9. Suggested build order

1. **Foundation:** infra files, layers, providers, RTL root layout, auth + `/onboarding`, `proxy.ts` zone gates.
2. **Admin core:** categories CRUD → provider review queue. (Without categories and active providers there is nothing to browse.)
3. **Provider:** onboarding → verification → services (fixed-price) → portfolio.
4. **Public site:** home, categories, service detail, provider profile, static pages, sitemap/robots/SEO.
5. **Customer – fixed-price flow:** book service → booking details → chat → completion → review.
6. **Quote flow:** customer request → provider requests list → submit quote → compare/accept → booking.
7. **Money:** payments + escrow, provider earnings/payouts, admin payments/payouts, commission settings.
8. **Trust & ops:** disputes, notifications, audit log, KPIs, moderation.
9. **SHOULD/COULD items** only after the Must items pass acceptance criteria (`srs.md` §9).

---

## 10. Out of scope for MVP (do NOT build pages for these)

Native mobile apps · airport transfer / any transport (SY-09) · building-materials store (SY-10) · provider subscriptions/ads (PR-16) · company/team accounts (PR-15) · live provider tracking (SY-08) · multi-city/multi-country · blog (MK-08) · English UI (MK-09) · AI price estimation.

---

## 11. Open decisions that affect pages

| # | Decision | Affects |
|---|---|---|
| 1 | One account with both roles, or separate? | `/onboarding`, nav, role model |
| 2 | Payment: online + cash, or one only? | booking wizard, payments, escrow pages |
| 3 | Free on-site inspection in the model? | quote flow (inspection step, BR-07 price adjustment page) |
| 4 | Milestone payments in MVP? | booking details, CU-17 |
| 5 | Phone OTP via Clerk or custom SMS provider? | auth pages |
| 6 | First city and first 3–5 categories | seed data, home/category pages |
