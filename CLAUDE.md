# CLAUDE.md — Full-Stack Next.js Template (layered, SSG/ISR-first)

> **What this file is.** A reusable blueprint distilled from a production Next.js e-commerce
> app (ECU Safe Zone). Drop it in the root of a new project. When asked to build a feature or
> scaffold a project, follow it exactly: same folder structure, same layers, same packages,
> same rendering strategy. Replace `<Project>` / `<project>` placeholders with the new domain.
>
> **Next.js 16 warning.** This version has breaking changes from older Next.js. Before writing
> routing/caching code, read the relevant guide in `node_modules/next/dist/docs/`. Heed
> deprecation notices. Do not rely on memory of Next 13–15.
>
> **This project: Livo.** A two-sided home-services & construction marketplace (Egypt, one city
> at launch). Roles `CUSTOMER`, `PROVIDER`, `ADMIN`. UI is **Arabic, RTL-first** (`<html lang="ar" dir="rtl">`,
> shadcn `rtl: true`, IBM Plex Sans Arabic), currency **EGP**. Product requirements live in
> `docs/srs.md` and `docs/business-analysis (1).md`.
>
> **API routes, NOT Server Actions.** Unlike the source template, Livo does **not** use Server
> Actions. Every read/write from the client goes through a **Route Handler in `src/app/api/`**
> (REST-style JSON endpoints) called by a TanStack Query hook. Do not add `"use server"` files.
> See §2 and `docs/api-conventions.md`.

---

## 1. Stack (pin these)

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** App Router | Server Components by default. Build runs with `--webpack` |
| Language | **TypeScript 5**, `strict` | Path alias `@/*` → `./src/*` |
| UI runtime | **React 19.2** | React Compiler lint rules active |
| Styling | **Tailwind CSS v4** | CSS-first (`src/app/globals.css`), `@tailwindcss/postcss`, no `tailwind.config.js` |
| Components | **shadcn/ui on Base UI** (`@base-ui/react`) | style `base-nova`, **not Radix**. `components.json` aliases → `@/components`, `@/components/ui`, `@/lib/utils`, `@/hooks` |
| Icons / motion | `lucide-react`, `motion` | |
| Variants / classes | `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` | `cn()` lives in `src/lib/utils.ts` |
| Theming | `next-themes` (class strategy) | `suppressHydrationWarning` on `<html>` |
| Auth | **Clerk** (`@clerk/nextjs`) | `User.id` in DB **is** the Clerk user id |
| Server state | **TanStack Query v5** | the hooks layer |
| Forms | `react-hook-form` + `@hookform/resolvers` | |
| Validation | **Zod v4** | one schema shared by the form and the API route |
| DB / ORM | **PostgreSQL + Prisma 6** (`@prisma/client`) | pooled `DATABASE_URL` + `DIRECT_URL` for CLI |
| Storage | **Cloudflare R2** via `@aws-sdk/client-s3` + presigner | private bucket |
| Payments | **Stripe Checkout** (hosted) + one webhook | optional module |
| Rich text | Tiptap 3 + `sanitize-html` | optional module (blog/CMS) |
| File drop | `react-dropzone` | optional module |
| Analytics | `@next/third-parties` (GA4) | production builds only |
| Lint | ESLint 9 flat config: `eslint-config-next/core-web-vitals` + `/typescript` | |
| Tests | Node built-in test runner (`node --test`), no Jest/Vitest | see §14 |
| Package manager | **npm** (`package-lock.json`, `npm ci` in CI/Docker) | pick ONE; do not keep two lockfiles |

Core `package.json` scripts to replicate:

```json
{
  "dev": "next dev",
  "postinstall": "prisma generate",
  "prebuild": "node scripts/prebuild-db.cjs",
  "build": "node scripts/build-with-deployment-id.mjs",
  "start": "node .next/standalone/server.js",
  "lint": "eslint",
  "test": "node --test --import ./tests/register-aliases.mjs \"tests/**/*.test.ts\" \"tests/**/*.test.cjs\"",
  "warm": "node scripts/warm-cache.mjs",
  "check-env": "node tests/prelaunch/check-env.mjs",
  "db:generate": "prisma generate",
  "db:seed": "node --env-file-if-exists=.env --env-file-if-exists=.env.local prisma/seed.ts"
}
```

---

## 2. The Layered Architecture (non-negotiable)

Every feature flows in ONE direction:

```
UI (components) → Hook (TanStack Query) → api-client (fetch) → API Route Handler → Service → Repository → Prisma → DB
```

| Layer | Folder | Does | Must NOT |
|---|---|---|---|
| Pages | `src/app/**/page.tsx`, `layout.tsx` | routing, layouts, metadata, Server Components | contain business logic |
| API routes | `src/app/api/<feature>/route.ts`, `…/[id]/route.ts` | export `GET/POST/PUT/PATCH/DELETE`: **authorise → validate → delegate**, answer with the `ApiResponse` JSON envelope + correct HTTP status | call Prisma; leak raw errors / Prisma rows |
| UI | `src/components/` | render, local UI state | call Prisma, services, `fetch` or the api-client directly (use hooks) |
| Hooks | `src/hooks/use-<feature>.ts` | wrap `api.get/post/…` in `useQuery`/`useMutation`; the api-client **unwraps `ApiResponse`** and throws `ApiError` | hold business rules; hand-build URLs (use `API_ROUTES`) |
| Services | `src/services/*.service.ts` | business rules (slugs, uniqueness, delete guards, DTO mapping), auth guards, throw `AppError`s | read the request/session ad hoc |
| Repositories | `src/repositories/*.repository.ts` | **the only place Prisma is called**; dumb queries | contain business rules |
| Schemas | `src/schemas/*.schema.ts` | Zod schemas + inferred types, shared by the form and the API route | |
| Lib | `src/lib/` | infra: `db.ts`, `database-url.ts`, `api-route.ts` (server helpers), `api-client.ts` (browser fetch), `api-guard.ts` (CSRF), `errors.ts`, `r2.provider.ts`, `query-client.ts`, `site-url.ts`, `storefront-cache.ts`, `utils.ts` (`cn`) | |
| Utils | `src/utils/` | **pure** functions (slug, format, pricing, SEO builders, URL builders) | touch DB/env |
| Constants | `src/constants/` | site identity, nav, **`api-routes.ts`** (every endpoint path), query keys, limits, registries | |
| Types | `src/types/` | shared contracts (`api.ts` envelope, DTOs like `user.ts`) — importable by both server and client | |
| Config | `src/config/` | lazily validated server env (`env.ts`) | |

**One documented exception — read-only Server Component trees** (public detail pages, the
admin dashboard): the page may call a **service directly** (never a repository/Prisma). There is
no mutation, no filter state and nothing for TanStack Query to cache, and the content must be in
the first HTML response for crawlers. Wrap shared reads in React `cache()` so `generateMetadata`
and the page share one query.

### 2.1 Canonical building blocks (copy these shapes)

**`src/types/api.ts`** — every API route answers with this envelope; never send raw errors.

```ts
export interface ApiSuccess<T> { success: true; data: T }
export interface ApiFailure { success: false; error: string; code: string; fieldErrors?: Record<string, string[]> }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
export const apiSuccess = <T,>(data: T): ApiSuccess<T> => ({ success: true, data })
export const apiFailure = (error: string, code: string, fieldErrors?: Record<string, string[]>): ApiFailure =>
  ({ success: false, error, code, ...(fieldErrors ? { fieldErrors } : {}) })
export interface Paginated<T> { items: T[]; total: number; page: number; perPage: number; pageCount: number }
```

**`src/lib/errors.ts`** — services throw these; `toErrorResponse()` converts them to JSON + HTTP
status; anything else is logged server-side and returned as a generic 500.
`AppError(message, code, status, fieldErrors?)` → `UnauthorizedError` 401, `ForbiddenError` 403,
`NotFoundError` 404, `ConflictError` 409, `ValidationError` 422, `DependencyError` 409, plus `isAppError()`.

**`src/lib/api-route.ts`** (server only) — `ok(data, init?)` 200, `created(data)` 201, `noContent()` 204,
`toErrorResponse(error, fallback)`, and Zod-backed parsers that throw `ValidationError` with
`fieldErrors`: `parseBody(request, schema)`, `parseQuery(request, schema)`, `parseParams(ctx.params, schema)`.

**`src/lib/api-client.ts`** (browser) — `api.get/post/put/patch/delete<T>(path, …)` sends JSON (or
`FormData`), same-origin credentials, and unwraps the envelope: returns `data`, or throws
`ApiError(message, status, code, fieldErrors)`.

**`src/lib/db.ts`** — ONE `PrismaClient` kept on `globalThis` in **every** environment
(production included) so bundled chunks don't each open a pool. Read the URL via a helper
(`database-url.ts`) that applies pool settings.

**API route template** — collection `src/app/api/admin/things/route.ts`:

```ts
import { created, ok, parseBody, parseQuery, toErrorResponse } from "@/lib/api-route"
import { revalidateStorefront } from "@/lib/storefront-cache"
import { createThingSchema, thingListQuerySchema } from "@/schemas/thing.schema"
import { requireAdmin } from "@/services/auth.service"
import * as thingService from "@/services/thing.service"

export async function GET(request: Request) {
  try {
    await requireAdmin()                                       // 1. authorise (routes are PUBLIC endpoints)
    const query = parseQuery(request, thingListQuerySchema)    // 2. validate
    return ok(await thingService.listThings(query))            // 3. delegate
  } catch (e) { return toErrorResponse(e, "Could not load items.") }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const input = await parseBody(request, createThingSchema)  // never trust the client
    const thing = await thingService.createThing(input)
    revalidateStorefront()                                     // 4. bust cached public pages after a write
    return created(thing)
  } catch (e) { return toErrorResponse(e, "Could not create that item.") }
}
```

Item `src/app/api/admin/things/[id]/route.ts` — `GET` / `PATCH` / `DELETE` with the typed context:

```ts
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/things/[id]">) {
  try {
    await requireAdmin()
    const { id } = await parseParams(ctx.params, idParamSchema)
    const input = await parseBody(request, updateThingSchema)
    const thing = await thingService.updateThing(id, input)
    revalidateStorefront()
    return ok(thing)
  } catch (e) { return toErrorResponse(e, "Could not update that item.") }
}
```

API URL conventions: plural nouns, `/api/<area>/<entity>` + `/[id]`; admin-only endpoints live under
**`/api/admin/*`** (404-gated in the proxy), provider endpoints under `/api/provider/*`, the signed-in
user's own data under `/api/me/*`. Status changes are a sub-resource (`PATCH /api/admin/things/[id]/status`).
Mutations are never `GET`. Register every path in `src/constants/api-routes.ts`.

**Service** — maps Prisma rows to a stable **DTO** (never leak Prisma shapes), derives slugs,
enforces uniqueness/delete guards, throws `AppError`s. DTO types that the browser needs live in
`src/types/` (hooks must not import from `services/`, which are `server-only`). **Repository** — a
class exported as a singleton (`export const thingRepository = new ThingRepository()`), plain Prisma
calls, paginated list = `findMany` + `count` in one `$transaction`.

**Hook** (`src/hooks/use-<feature>.ts`, `"use client"`): `queryFn: () => api.get<T>(API_ROUTES.x, query)`,
`mutationFn: (values) => api.post<T>(API_ROUTES.x, values)`; failures surface as the shared `ApiError`
(with `fieldErrors`); query keys from `src/constants/query-keys.ts` (a central `xxxKeys` factory),
`keepPreviousData` for paged lists, `invalidateQueries` in mutation `onSuccess`.

**Query client** (`src/lib/query-client.ts`): new client **per request on the server**, a single
reused client in the browser. Defaults: `staleTime 30s`, `gcTime 5min`, `retry` ≤ 1,
`refetchOnWindowFocus: false`, mutations `retry: 0`.

---

## 3. Folder structure

```
.
├── CLAUDE.md  AGENTS.md  README.md
├── Dockerfile  .dockerignore  .env.example  .gitignore
├── components.json           # shadcn config
├── eslint.config.mjs  postcss.config.mjs  tsconfig.json
├── next.config.mjs           # ONE config file only (see §13 pitfalls)
├── package.json  package-lock.json
├── .github/workflows/pipeline.yml     # test → docker build → deploy to VPS
├── docs/                              # one markdown per feature (see §15)
├── prisma/
│   ├── schema.prisma  seed.ts
│   └── sql/               # dated, idempotent, additive migrations: 2026-10-10-feature.sql
├── public/                # logo, static assets
├── scripts/               # build & ops scripts (prebuild-db, build-with-deployment-id,
│                          #   prepare-standalone, deployment-id, warm-cache, audits)
├── tests/                 # node:test suites grouped by area (+ alias loader)
└── src/
    ├── proxy.ts           # Next 16 "middleware": Clerk + admin gate + routing rules
    ├── app/
    │   ├── layout.tsx            # <html>, fonts, ClerkProvider > ThemeProvider > QueryProvider, GA
    │   ├── globals.css           # Tailwind v4 + theme tokens
    │   ├── robots.ts  sitemap.ts  not-found.tsx
    │   ├── icon.png  apple-icon.png  favicon.ico
    │   ├── sign-in/[[...sign-in]]  sign-up/[[...sign-up]]  auth-callback/
    │   ├── (marketing)/   # HEADER-only shell: /, /about, /support, /blog, legal pages
    │   ├── (app)/         # SIDEBAR shell: catalog, detail pages, cart, account/*
    │   ├── (admin)/admin/ # dashboard shell + CRUD routes (list / new / [id] / [id]/edit)
    │   └── api/           # ALL client↔server endpoints (Route Handlers, JSON envelope):
    │       ├── me/  auth/sync/  health/
    │       ├── <feature>/route.ts  <feature>/[id]/route.ts     # public / customer
    │       ├── provider/<feature>/…                            # PROVIDER (+ADMIN)
    │       ├── admin/<feature>/…                               # ADMIN only (proxy 404-gates)
    │       ├── webhooks/<provider>/route.ts                    # signature-auth, CSRF-exempt
    │       └── images/<prefix>/[filename]/route.ts             # byte streaming
    ├── services/<feature>.service.ts
    ├── repositories/<feature>.repository.ts
    ├── schemas/<feature>.schema.ts
    ├── hooks/use-<feature>.ts
    ├── components/
    │   ├── ui/            # shadcn primitives (button, card, dialog, table, sheet, select…)
    │   ├── shared/        # domain-neutral (pagination, empty-state, status-badge, user-avatar) + index.ts
    │   ├── layout/        # AppHeader, AppSidebar, AppFooter, AccountControls (client island), ThemeToggle
    │   ├── providers/     # query-provider, theme-provider
    │   ├── seo/           # json-ld.tsx
    │   ├── forms/         # shared form fields / dropzone
    │   ├── marketing/ landing/ motion/      # public page sections
    │   ├── <domain>/      # one folder per storefront domain (product/, category/, cart/, orders/…)
    │   └── admin/         # layout/, shared/ (re-exports shared/), then one folder per admin feature
    ├── config/env.ts      # lazily validated server env
    ├── constants/         # site.ts, api-routes.ts, query-keys.ts, nav.ts, upload.ts, registries
    ├── lib/  utils/  types/  data/
```

**Route groups** `(marketing)`, `(app)`, `(admin)` own separate layouts without changing URLs.
The root layout owns `<html>`/`<body>`/providers, so moving between groups stays a client-side
navigation. Layouts do **not** re-render on navigation: anything pathname-dependent
(active nav, breadcrumbs) is a Client Component using `usePathname()`.

**Naming conventions**
- Files: `kebab-case` for hooks/schemas/services/repos (`brand.service.ts`, `use-brands.ts`);
  `PascalCase.tsx` for domain components, `kebab-case.tsx` acceptable in `ui/`, `shared/`, `admin/`.
- Admin CRUD routes: `/admin/<area>/<entity>`, `/new`, `/[id]`, `/[id]/edit`.
- Pagination: `…/page/[page]` routes (real links), never `<button>` page numbers on crawlable lists.
- Comments explain **why** (long JSDoc headers on non-obvious files are the house style) and point
  to the relevant `docs/*.md`.

---

## 4. Rendering strategy — static / ISR first (the key to this template)

**Goal:** every public page is served from cache without touching the database. Dynamic (ƒ) is
reserved for `/admin/*`, auth pages, API routes, and (rarely) a query-string-driven listing.

### 4.1 The rules

1. **Layouts read NOTHING from the request.** No `auth()`, `cookies()`, `headers()`,
   `searchParams`. A request-time API in a layout makes every page below it dynamic. This single
   mistake destroyed static rendering in the original project.
2. **Per-visitor UI is a client island.** Sign-in button / account menu / admin shortcut / cart
   badge read the session with Clerk's `useAuth()` in the browser (`AccountControls.tsx`).
   Render a **same-size placeholder** until Clerk resolves so cached HTML never shows "Sign In"
   to a signed-in user and nothing shifts. Admin-ness (`User.role` is in Postgres, not Clerk) is
   fetched once via `GET /api/me` (`useViewer()` / `useIsAdmin()`), a query that runs only when signed in.
   The shortcut only decides which *link is shown*; `/admin` is still gated server-side.
3. **`<ClerkProvider>` in the root layout stays static** — never pass the `dynamic` prop.
4. **Both storefront layouts export `revalidate = 3600`.** Pages with no server data are simply
   static; DB-driven ones refresh at most hourly.
5. **Detail pages = ISR with an empty `generateStaticParams`:**

   ```ts
   export const revalidate = 3600
   export async function generateStaticParams() { return [] }   // render on first visit, then cache
   ```
   Do NOT prebuild thousands of detail pages (each deploy would hit the DB thousands of times).
   Pair with `npm run warm` after deploy (see §10).
6. **Category / taxonomy pages = true SSG:** `generateStaticParams` returns every slug
   (brand, model, type, manufacturer…), and each has a `…/page/[page]/page.tsx` sibling for
   paginated listings. Browse index pages read their default view from the DB **at build /
   regeneration time** and pass it to the client island as `initialData` (no first-visit API call).
7. **`searchParams` makes a page dynamic.** Don't read it in a page you want static. Alternatives:
   - noindex rules for query URLs → set `X-Robots-Tag: noindex, follow` in `src/proxy.ts`
     (`/search?…`), not in `generateMetadata`.
   - If a listing truly must read `searchParams` (filters + crawlable page links), accept ƒ, but
     cache its data with `unstable_cache` + a tag (`CATALOG_PAGES_TAG`), cap cacheable page numbers
     (≤ 1000) so query strings can't fill the cache, and keep the client island prop-driven
     (no `useSearchParams()` inside it).
8. **`useSearchParams()` in a prerendered page needs `<Suspense>`** or the build fails. Make the
   fallback the **same markup with no filter highlighted** (not a skeleton) so crawlers still get
   every nav link.
9. **Parallelise independent queries** with `Promise.all`; keep truly dependent ones sequential.
10. **`cache()` (React) around page loaders** shared by `generateMetadata` and the page.
11. **Old URLs never 404:** a retired slug is resolved through a redirect table
    (`ModificationSlugRedirect`) and answered with `permanentRedirect()` (308) from the shared
    loader; static renames go in `redirects()` in `next.config.mjs` with `permanent: true`.

### 4.2 Cache invalidation

`src/lib/storefront-cache.ts` is the single switch:

```ts
export function revalidateStorefront(): void {
  revalidatePath("/", "layout")                    // every cached storefront page → stale (lazy regen)
  revalidatePath("/sitemap.xml")                   // sitemap is outside the root layout tree
  revalidateTag(HOME_STATS_TAG, { expire: 0 })     // data-cache entries are cleared by tag
  revalidateTag(CATALOG_PAGES_TAG, { expire: 0 })
}
```
Call it after **every successful write** in public-facing mutation routes (`POST/PUT/PATCH/DELETE`
under `/api/admin/*` and `/api/provider/*` that change what visitors see). Coarse on purpose:
one edit fans out to titles, landing, search and sitemap; edits are rare; regeneration is lazy.
`unstable_cache` is marked *replaced* in Next 16 (and JSON-serialises `Date`s) — use it only where
documented above; Cache Components (`"use cache"` + `cacheTag`) is the long-term option but changes
rendering rules app-wide, so don't mix it in casually.

### 4.3 `next.config.mjs` baseline

```js
const nextConfig = {
  output: "standalone",                 // Docker / VPS friendly
  expireTime: 3600,                     // CDN must not keep expired HTML for a year
  images: { remotePatterns: [ new URL("https://img.clerk.com/**"), /* + R2 public host /products/** */ ] },
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 2,  // == DB pool limit; keeps builds from exhausting connections
    proxyClientMaxBodySize: "12mb",     // proxy buffers bodies; must be >= the largest API upload or it truncates
  },
  async redirects() { return [ /* permanent: true legacy URLs */ ] },
}
```
If you add `deploymentId` (version-skew protection), it comes from `NEXT_DEPLOYMENT_ID`
(see §10). The body limit lives once in `src/constants/upload-limit.mjs`, read by both
`next.config.mjs` and `src/constants/upload.ts`, so they can't drift. Cache Components
(`cacheComponents`) is **off**: it removes the `revalidate` segment export this ISR strategy relies on.

---

## 5. Auth & authorization (3 independent layers for `/admin` and `/api/admin`)

1. **`src/proxy.ts`** (Next 16 Proxy, runs on **Node runtime** so it can query Prisma):
   `clerkMiddleware` (its matcher includes `/api/*`, so `auth()` works in Route Handlers) →
   - **CSRF guard first** (`isCrossSiteApiWrite()` in `lib/api-guard.ts`): a `POST/PUT/PATCH/DELETE` to
     `/api/*` whose `Origin` isn't this host (or `NEXT_PUBLIC_SERVER_URL`) gets a JSON **403**.
     `/api/webhooks/*` is exempt (signature-authenticated). Clerk session cookies are `SameSite=Lax`,
     but don't rely on that alone.
   - `/admin*`: no session or `role !== "ADMIN"` → `NextResponse.rewrite` to `/__forbidden` with **404**
     (don't confirm the dashboard exists; never 403/redirect). `/api/admin/*` → JSON **404** envelope.
   - `?page=1` on pages → 301 to the clean URL.
2. **`(admin)/admin/layout.tsx`** — `getCurrentUser()`, `notFound()` for non-admins, `robots: noindex,nofollow`.
   Needed because Next renders segments in parallel; the proxy stops the output from shipping.
3. **Every API route handler** calls a guard first — `requireAdmin()`, `requireProvider()`
   (PROVIDER or ADMIN), `requireUser()`, or `requireRole(...)`. Route Handlers are public HTTP
   endpoints; the proxy gate is defence in depth, not the check. Customer/provider routes take the user
   id **from the session**, never from the body, query or URL — and services verify ownership
   (a provider may only touch its own quotes/bookings) by comparing against that id.

Identity model: `User.id` = Clerk user id. First sign-in goes `/auth-callback` → `useSyncUser()` →
`POST /api/auth/sync` → `syncUserWithDatabase` (race-safe: on Prisma `P2002` re-read by id; never merge
accounts by email or phone). Names/emails/phones shown in UI are read from Clerk (DB copy is a
first-sign-in snapshot). `Role { CUSTOMER, PROVIDER, ADMIN }` — sign-up may pick CUSTOMER or PROVIDER
(SRS AU-03); ADMIN is only ever set by hand/an admin. Auth per SRS is phone + OTP → enable Clerk's
phone-number sign-in.

---

## 6. Data layer (Prisma / Postgres)

- `datasource db { provider="postgresql"; url=env("DATABASE_URL"); directUrl=env("DIRECT_URL") }`.
  `DATABASE_URL` = **pooled** (transaction pooler) with `connection_limit=5` & `pool_timeout=30`
  (not missing, not 1 → P2024 timeouts); `DIRECT_URL` = session/direct, **Prisma CLI only**.
- Schema conventions: `cuid` ids except `User` (Clerk id), `slug @unique` on public entities,
  `isActive` visibility flags, `createdAt/updatedAt`, enums for status machines, `Decimal` for money,
  nullable image/file FKs, a `File` table (R2 key, mime, size, sha256) as source of truth for stored objects.
- **Visibility is enforced in the service**, not by callers: a constant like `VISIBLE_PRODUCT` is
  applied inside every public read, so a deactivated row 404s everywhere with no way to bypass.
- **Migrations are additive SQL files** in `prisma/sql/YYYY-MM-DD-name.sql`, idempotent
  (`IF NOT EXISTS`), listed in `scripts/prebuild-db.cjs` (`migrationFiles`) and applied before
  `next build` (so the build can prerender DB pages). The script picks a safe URL, refuses a
  `DIRECT_URL` that belongs to a different database than `DATABASE_URL`, and rewrites the pooler port
  to the session port for schema commands. Never apply destructive changes this way.
- Seeds: `prisma/seed.ts` (Node strips types natively). Seeds must not collide with Clerk-id users.
- Money & concurrency: use single conditional `UPDATE`s for counters/allowances (e.g. spend one
  download atomically); payment state changes only via signature-verified webhook through the one
  `updateOrderStatus()` function (admin buttons call the same function).

---

## 7. Storage (Cloudflare R2, private bucket)

- Client `src/lib/r2.provider.ts`: `S3Client` with `region: "auto"`, custom endpoint.
- **Private bucket, no public URL for paid binaries.** Paid files: presigned GET, **5 min**, signed with
  `Content-Disposition: attachment` + `application/octet-stream` (a bearer token — must not outlive the click).
  Page assets (logos): presigned 1 h or `R2_PUBLIC_URL` if an images-only domain exists.
- Public artwork (product images, post images, PDFs) is **streamed by an app Route Handler**
  (`/api/images/<prefix>/[filename]`, `/api/<prefix>/[filename]`) with an immutable cache header, each
  with its own key prefix so a route can never build another prefix's key. If `NEXT_PUBLIC_R2_PUBLIC_URL`
  is set the route 307-redirects, and `next.config` adds that host's path to `remotePatterns`.
- Validate by **magic bytes**, not just mime/extension (e.g. PDF ≤ 10 MB). Limits in `constants/upload.ts`.
- Route Handlers are the **only** server entry point for the client (no Server Actions). Special kinds:
  payment **webhooks** under `/api/webhooks/<provider>` (no session; auth by signature over the **raw body** —
  `request.text()`, never `.json()`; CSRF-exempt), **byte-streaming** routes (`/api/images/…`), and
  **upload** routes (`multipart/form-data` via `request.formData()`, session guard + the proxy CSRF check,
  size ≤ `MAX_REQUEST_BODY_BYTES`, magic-byte validation in the service).

---

## 8. Payments (optional module — Stripe Checkout)

Hosted page; no card data touches the app. Order placement creates a Checkout session with
`metadata` naming the order/buyer; `POST /api/webhook` verifies the signature, re-loads rows, and calls
`updateOrderStatus(id,"PAID")`, which grants entitlements. **The webhook is the fact, the redirect is
a convenience.** A Stripe price is immutable: reuse the cached `stripePriceId` only while `unit_amount`
matches; otherwise mint a new price on the *same* product. Pin the Stripe API version in `lib/stripe.ts`.
One metadata key can branch the webhook per order type (files / online services / hardware).

---

## 9. UI & styling conventions

- Root layout: `Geist` + `Geist_Mono` via `next/font/google` (`display: "swap"`, CSS variables),
  `className="… antialiased"`, `<body className="min-h-dvh flex flex-col bg-background text-foreground">`.
- Use **`dvh`, not `vh`** for shells; app shell = `h-dvh overflow-hidden` with only `<main>` scrolling.
- Provider order: `ClerkProvider > ThemeProvider > QueryProvider`. Dark by default via `next-themes`.
- Add primitives with `npx shadcn@latest add <component>` (base-nova style); keep them in `components/ui`.
- Below-the-fold landing bands use `content-visibility: auto` (`defer-render` class in `globals.css`);
  put spacing *inside* each band so paint containment doesn't clip rings.
- Images: always through a `ProductImage`-style wrapper using `getImageProps` → `srcSet`+`sizes`,
  `loading="lazy"` unless `priority` (main image only), layered fallbacks (optimized → raw route → placeholder).
  Never serve originals eagerly in grids.
- Admin tables: `DataTableWrapper`, bulk-selection checkboxes, `BulkChoiceDialog`, toasts via `components/ui/toast`.
- Forms: `react-hook-form` + `zodResolver(schema)`; replay `fieldErrors` from the mutation's `ApiError`
  into the form; warn on unsaved changes (`use-unsaved-changes`).
- Brand/site identity lives **only** in `src/constants/site.ts` (`SITE_NAME`, `SITE_TITLE`, logo, OG defaults).
  Never hard-code the brand name elsewhere.

---

## 10. Build, deploy, operate

**Build pipeline** (`npm run build`):
1. `prebuild` → `scripts/prebuild-db.cjs` applies pending `prisma/sql` migrations. **The build needs a reachable DB**
   (it prerenders DB-driven pages and category pages).
2. `scripts/build-with-deployment-id.mjs` sets a random `NEXT_DEPLOYMENT_ID` (12 random bytes, hex) unless provided,
   runs `next build --webpack`, then `prepare-standalone.mjs` copies `.next/static` and `public/` into
   `.next/standalone` and **asserts** `server.js` and `server-reference-manifest.json` exist.
3. `npm start` = `node .next/standalone/server.js`.

**Docker** (multi-stage, `node:22-alpine`): builder `npm ci` → copy → require `.env` present → `npm run build`;
production stage copies the build, `EXPOSE 3000`, `CMD ["npm","start"]`. `.dockerignore` excludes
`node_modules .next .git .github` and pre-launch envs.

**CI/CD** (`.github/workflows/pipeline.yml`): on push to `main` (or manual dispatch with `update_image` /
`update_production` choices), `concurrency: production-deploy` with cancel-in-progress.
Jobs: `test` (Node 20 & 22 matrix: `npm ci`, write `.env` from the `ENVS` secret, **fail fast if required keys are
missing**, `npm run build`) → `build` (buildx with local cache, `docker save | gzip`, `gzip -t` verify, upload artifact) →
`deploy` (scp image to VPS, `docker load`, stop/rm old container, `docker run -d --restart always -p 4000:3000`,
show logs, prune). Secrets: `ENVS`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`.

**After every deploy:** `npm run warm` (`scripts/warm-cache.mjs`) — reads `/sitemap.xml`, requests each `<loc>` once,
**2 concurrent** (DB pool limit), browser User-Agent, `accept: */*` (with `text/html` Clerk dev instances 307 to a
handshake and nothing warms), 30 s timeout, 2 retries on timeout/network/429/5xx, prints status histogram, median,
slowest, and exits 1 on any non-2xx. Options: `--concurrency --timeout --retries --limit --slowest`; pass a base URL
to warm another origin. Needs no DB access. A non-2xx sitemap URL is a bug in the sitemap, not something to ignore.
With `expireTime: 3600` warmed pages go stale again in an hour — warm priority pages (`--limit`) or run near the DB.

**Performance notes:** keep the DB in the same region as the server (first-visit renders are many round trips);
free serverless DBs cold-start in seconds. Use a **production** Clerk instance (`pk_live_…`) — dev instances
add a handshake redirect on every first visit and are rate-limited. Measure Lighthouse in Incognito
(extensions inflate TBT). Rejected experiment: `experimental.inlineCss` (doubled HTML).

---

## 11. SEO layer (built in, not bolted on)

- `src/lib/site-url.ts`: `getSiteUrl()` (from `NEXT_PUBLIC_SERVER_URL`, trimmed) + `absoluteUrl(path)`.
  **Production must set the env var** or canonicals point at localhost. Root layout sets `metadataBase`.
- Root `metadata`: `title.default` + `title.template: "%s | <SITE_NAME>"`, OG/Twitter defaults from `constants/site.ts`.
  Pages that set their own `openGraph` must spread the shared constant (a page's object **replaces** the root's).
- `src/utils/seo-metadata.ts`: pure builders (`productMetadata`, `categoryMetadata`, `catalogListingMetadata`,
  `notFoundMetadata`…) taking the DTO already loaded — **no DB access**, **relative URLs only** (metadataBase makes them absolute).
- `src/utils/structured-data.ts` + `components/seo/json-ld.tsx`: `Product`/`Offer`/`MerchantReturnPolicy`/`shippingDetails`,
  `Service`, `Organization`/`WebSite`, `BreadcrumbList`, `BlogPosting`. `<JsonLd>` renders one `<script type="application/ld+json">`
  and **escapes `<` as `<`** (DB text could contain `</script>`). Breadcrumb `<ol>` mirrors the JSON-LD crumb for crumb.
- `app/sitemap.ts` (ISR `revalidate = 3600`): static pages (no `lastModified`) + DB pages (real `lastModified`, image entries).
  A DB outage **degrades to static entries** (try/catch + log) instead of 500. Excludes private/noindex/search URLs.
  Kicked by `revalidateStorefront()`.
- `app/robots.ts`: `allow: ["/", "/api/images/", "/api/pinouts/"]`, `disallow: ["/api/", "/search?"]`, sitemap URL.
  Private pages (`/cart`, `/account/*`, sign-in…) use **`noindex` meta, not `Disallow`** (a disallowed URL can still be
  indexed from links). `/admin` is NOT named in robots (it 404s for probers).
- URL rules in one util (`catalog-url.ts`, `category-url.ts`): defaults dropped from URLs (`sort=newest`, `page=1`),
  `?page=1` → **301** to the clean URL (in proxy), malformed `?page` → 404, page past the end → `notFound()`,
  page N ≥ 2 self-canonical with "Page N" in the title, any filter/search/sort view → `noindex, follow`, no canonical.
- Crawlability: listings must contain **real `<a href>` links** to items and pages (server-rendered HTML), never
  buttons/client-fetched-only grids. Detail pages link to related items and to their category pages.
- Content quality gates live in pure utils with tests (`product-seo.ts`, `category-content.ts`, `seo-data-report.ts`).

---

## 12. Testing

No Jest/Vitest. Node's built-in runner, TypeScript stripped natively (Node 22.18+), `@/…` aliases via a loader:

```bash
npm test   # = node --test --import ./tests/register-aliases.mjs "tests/**/*.test.ts" "tests/**/*.test.cjs"
```
`tests/alias-hooks.mjs` + `tests/register-aliases.mjs` map `@/x → src/x`, extensionless imports → `.ts`, and
`server-only` → no-op. Folders by area: `api/ utils/ seo/ prelaunch/` (+ one per feature). Test **pure utils and
guards** (CSRF api-guard, SEO builders, URL rules, slug logic, deployment-id, migration list).
Pre-launch env validation lives in `tests/prelaunch/check-env.mjs`.

---

## 13. Environment variables

`.env.example` documents placeholders only; real values in `.env` / `.env.local` (git-ignored) and the CI `ENVS` secret.

| Var | Purpose |
|---|---|
| `DATABASE_URL` | pooled Postgres URL (runtime + build) |
| `DIRECT_URL` | session/direct URL (Prisma CLI & schema changes only) |
| `NEXT_PUBLIC_SERVER_URL` | public origin → metadataBase, sitemap, robots, Stripe return URLs (**required in prod**) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `…SIGN_UP_URL`, `…SIGN_IN_FALLBACK_REDIRECT_URL`, `…SIGN_UP_FALLBACK_REDIRECT_URL` | Clerk routing (`/auth-callback`) |
| `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` (`STRIPE_KEY` unused for hosted checkout) | Stripe |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | storage |
| `NEXT_PUBLIC_R2_PUBLIC_URL` (optional) | images-only public host |
| `R2_PUBLIC_URL` (optional) | **never** point at a bucket holding paid binaries |
| `NEXT_PUBLIC_GA_ID` | GA4, inlined at build; only production loads it |
| `NEXT_DEPLOYMENT_ID` | optional; auto-generated per build |

---

## 14. Recipe — add a new CRUD feature (do these in order)

1. **Prisma**: add model + enum to `schema.prisma`; add `prisma/sql/<date>-<name>.sql` (idempotent) and register it in `prebuild-db.cjs`; `npx prisma generate`.
2. **Schema** `src/schemas/<x>.schema.ts`: name/slug rules, `create`/`update`/`id`/`listQuery` Zod schemas, exported `…Values`/`…Query` types, limit constants.
3. **Repository** `src/repositories/<x>.repository.ts`: dumb Prisma methods (`findById`, `findBySlug`, `findMany`, `findPage` (+count in `$transaction`), `create`, `update`, `delete`).
4. **Service** `src/services/<x>.service.ts`: DTO interface, `toListItem`, `SORT_MAP`, slug via `utils/slug.ts` (`slugify`, `uniqueSlug`), `ConflictError` / `DependencyError` / `NotFoundError` rules.
5. **API routes** `src/app/api/<area>/<x>/route.ts` (`GET` list, `POST` create) and `…/<x>/[id]/route.ts`
   (`GET`, `PATCH`, `DELETE`; status via `…/[id]/status/route.ts`) using the template in §2.1 (+ `revalidateStorefront()` if public).
   Add the paths to `constants/api-routes.ts`.
6. **DTO types** the browser needs in `src/types/<x>.ts`; **query keys** in `constants/query-keys.ts`; **Hook** `src/hooks/use-<x>.ts`.
7. **Admin UI** `src/components/admin/<x>/` (list table, form, row actions) + routes under `src/app/(admin)/admin/<area>/<x>/{page,new,[id],[id]/edit}`; add to `constants/admin-nav.ts`.
8. **Public UI** (if any): service-direct Server Component page in `(app)` or `(marketing)`; ISR (`revalidate = 3600`, `generateStaticParams → []`) for detail, full `generateStaticParams` for taxonomy; `generateMetadata` using `cache()`d loader; `<JsonLd>`; breadcrumb; add to `sitemap.ts` via `sitemap.service.ts`.
9. **Docs** `docs/<x>-feature.md` + link from `docs/folder-structure.md`.
10. **Tests** for any pure util / rule you added. Run `npm run lint` and `npm run build`.

**Definition of done:** layer rules respected (no Prisma outside repositories, no Server Actions, no route handler without
authorise→validate→delegate, every response in the `ApiResponse` envelope with the right status),
no request-time API in a layout, public writes call `revalidateStorefront()`, new public URLs are in the sitemap with canonicals,
private URLs are `noindex`, lint and build pass.

---

## 15. Bootstrapping a NEW project from this template

1. `npx create-next-app@latest <project> --ts --app --src-dir --tailwind --eslint --import-alias "@/*"` (Next 16, npm).
2. `npx shadcn@latest init` → style **base-nova**, base color neutral, `rsc: true`, aliases as in §1; add ui primitives.
3. Install: `@clerk/nextjs @tanstack/react-query react-hook-form @hookform/resolvers zod@4 @prisma/client next-themes lucide-react motion class-variance-authority clsx tailwind-merge tw-animate-css @next/third-parties` and (as needed) `stripe @aws-sdk/client-s3 @aws-sdk/s3-request-presigner react-dropzone sanitize-html @tiptap/*`; dev: `prisma`, `@types/sanitize-html`.
4. Create the empty layer folders (§3) and the infra files first: `lib/db.ts`, `lib/errors.ts`, `types/api.ts`, `lib/api-route.ts`, `lib/api-client.ts`, `lib/api-guard.ts`, `lib/query-client.ts`, `lib/site-url.ts`, `lib/storefront-cache.ts`, `services/auth.service.ts` (`getCurrentUser`, `requireUser`, `requireAdmin`, `syncUserWithDatabase`), `proxy.ts`, providers, root layout.
5. Create `(marketing)` and `(app)` layouts with **no request reads**, `export const revalidate = 3600`, and the `AccountControls` client island.
6. Add `constants/site.ts`, `robots.ts`, `sitemap.ts`, `components/seo/json-ld.tsx`, `utils/seo-metadata.ts`, `utils/structured-data.ts`.
7. Add `next.config.mjs` (§4.3), the `scripts/` build set (§10), `Dockerfile`, `.dockerignore`, `.github/workflows/pipeline.yml`, `.env.example`.
8. Add `tests/` loader and a `"test"` script. Write `docs/folder-structure.md` & `docs/tech-stack.md` for the new domain.
9. Create the **Clerk production instance** and real keys before launch; set `NEXT_PUBLIC_SERVER_URL`; put the DB near the server.
10. First feature: build the simplest CRUD end to end (§14) as the reference implementation, then copy its shape.

---

## 16. Pitfalls found in the source project — do NOT copy these

- **Two Next config files** (`next.config.mjs` and `next.config.ts`) with different content. Keep exactly one; Next picks by precedence and the other silently drifts.
- **Two lockfiles** (`package-lock.json` + `pnpm-lock.yaml`) and a half-filled `pnpm-workspace.yaml`. Choose one package manager.
- **Docs drifted from reality**: tech-stack doc says Neon while `.env.example` and `prebuild-db` target Supabase. Update docs in the same change as the code.
- **Root clutter**: dozens of one-off `patch-*.py`, `audit-*.mjs`, `MERGE_REPORT_*.md`, `tmp/`, logs in the repo root. Put one-offs in `scripts/archive/` or don't commit them; keep release notes in `docs/releases/`.
- **Clerk development keys in production** (handshake redirect, rate limits, dev tooling). Use `pk_live_/sk_live_`.
- **Secrets baked into the image**: the source Dockerfile requires `.env` at build and copies it into the image (`.env*` is git-ignored, which is right). Prefer BuildKit secrets/build args. Keep committing only `.env.example`.
- **Tracked junk**: `tmp/*.csv` is committed; keep generated audit output out of git.
- **Hard-coded fallback IDs** (e.g. a GA ID fallback in code, a Bing verification token in metadata) — acceptable only for a single-tenant site; make them env-driven in a template.
- **Orphan routes** like `_debug-menu` and `zz-preview` in `src/app`. Delete or guard before launch.
- A client `README.md` that is still the create-next-app boilerplate. Write a real one.
- **Livo-specific:** don't reintroduce Server Actions "just for one form" — two server entry points
  means two auth/CSRF/error paths to keep in sync. Everything goes through `src/app/api/`.
- **Livo-specific:** recent shadcn CLIs generate `import { cn } from "cn"` (a separate npm package).
  This project keeps `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge); after `npx shadcn add`, rewrite
  the import to `@/lib/utils`.
- **Livo-specific:** `create-next-app` 16.4 enables `cacheComponents` and a Turbopack Tailwind loader by
  default. Both were removed: this template uses route-segment `revalidate` (ISR) and `@tailwindcss/postcss`
  with `next build --webpack`.
