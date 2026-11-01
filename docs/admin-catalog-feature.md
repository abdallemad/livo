# Admin catalog: categories & services — AD-02, NF-09

Admins manage what customers can browse (categories) and moderate the fixed-price services providers list.
Same pattern as the other admin areas ([admin-providers-users-feature.md](admin-providers-users-feature.md)).

## Pages

| Route | What it does |
|---|---|
| `/admin/categories` | The whole tree (each parent followed by its sub-categories): English + Arabic name, URL, booking type, services (total / switched on), providers, requests, an **on-site switch**, edit, delete (only when unused). |
| `/admin/categories/new` | Create: names (EN + AR), optional URL name, booking type, parent, order, icon, description, show-on-site. |
| `/admin/categories/[id]/edit` | Same form; the URL is read-only. Warns before leaving with unsaved changes. |
| `/admin/services` | Every fixed-price service: search (title / slug / provider), category filter (a parent includes its sub-categories), visibility filter, why it is or isn't public, **Hide** (with reason) / **Restore**. Filters live in the URL. |

## Category rules (`services/category.service.ts`)

- **Two levels only.** A parent must be top-level; a category with sub-categories can't move under another.
- **Slug = public URL** (`/services/<slug>`). Chosen once at creation (typed, or derived from the English
  name, made unique), never edited — there is no redirect table for categories, so changing it would
  break links and search results.
- **Both names are required** in the form: the site is English, and the Arabic name keeps the RTL switch
  possible (`nameAr` is required in the DB anyway).
- **Type** `FIXED` / `QUOTE` / `BOTH` (SRS 2.2). Switching to `QUOTE` is refused (409, on the `type` field)
  while the category still has switched-on, non-hidden fixed-price services.
- **On/off.** A sub-category can't be switched on under an inactive parent. Switching a parent off hides its
  sub-categories and every service in them (see visibility below).
- **Delete** only when no sub-category, service, request or provider references it; otherwise **409
  DEPENDENCY** "…Deactivate it instead". The table disables the button with a tooltip in that case.
- **Icons** are picked from `constants/category-icons.ts` (keys match the seed) — categories are data
  (NF-09), but an icon must be one the bundle ships.
- Every write is audited (`category.create|update|activate|deactivate|delete`) and calls `revalidateStorefront()`.

## Service moderation

New columns (additive migration `prisma/sql/2026-11-02-service-moderation.sql`):
`Service.hiddenByAdminAt`, `Service.hiddenByAdminReason`.

Hiding is **separate from the provider's own `isActive` switch**, so a provider can't re-publish a listing
an admin hid. `PATCH /api/admin/services/[id]/status` — `{ action: "HIDE", reason }` / `{ action: "RESTORE" }`;
conditional update (409 if already in that state), audit `service.hide|restore`, a `SYSTEM` notification to
the provider with the reason, `revalidateStorefront()`.

### Visibility — one rule, two forms

`utils/service-visibility.ts` (pure, tested) explains each row; `SERVICE_VISIBILITY_WHERE` in
`services/admin-catalog.service.ts` is the same rule as Prisma filters. First failing rule wins:

| State | Meaning |
|---|---|
| `HIDDEN_BY_ADMIN` | an admin hid it |
| `PROVIDER_INACTIVE` | provider isn't `APPROVED`, or the account isn't `ACTIVE` |
| `CATEGORY_OFF` | its category or that category's parent is switched off |
| `PROVIDER_OFF` | the provider switched it off |
| `LIVE` | public |

**The public catalog must read services through `VISIBLE_SERVICE`** (= `SERVICE_VISIBILITY_WHERE.LIVE`)
so a hidden / suspended / category-off service 404s everywhere (CLAUDE.md §6). It does: `/services`, the category
pages, `GET /api/services` and the public image route all use it ([catalog-feature.md](catalog-feature.md)).

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/categories` | tree order, with counts |
| POST | `/api/admin/categories` | `createCategorySchema` → 201 `{ id }` |
| GET / PATCH / DELETE | `/api/admin/categories/[id]` | PATCH = `updateCategorySchema` (no slug); DELETE → 204 or 409 |
| PATCH | `/api/admin/categories/[id]/status` | `{ isActive }` |
| GET | `/api/admin/services?q&categoryId&visibility&page&perPage` | `Paginated<AdminServiceListItem>` |
| PATCH | `/api/admin/services/[id]/status` | hide / restore |

All call `requireAdmin()` and are 404-gated by the proxy.

## Files

| Layer | File |
|---|---|
| Migration | `prisma/sql/2026-11-02-service-moderation.sql` (registered in `scripts/prebuild-db.cjs`), `schema.prisma` |
| Schemas | `src/schemas/category.schema.ts`; `serviceListQuerySchema`, `serviceModerationSchema` in `admin.schema.ts` |
| Constants | `src/constants/category-icons.ts` (icons, type labels/help); audit labels in `audit-actions.ts` |
| Repositories | `category.repository.ts`, `service.repository.ts` |
| Services | `category.service.ts`, `admin-catalog.service.ts` |
| Utils + tests | `src/utils/service-visibility.ts`, `tests/utils/service-visibility.test.ts` |
| Hook | `src/hooks/use-admin-catalog.ts` |
| UI | `src/components/admin/catalog/` (`CategoriesTable`, `CategoryForm`, `ServicesTable`) |
| Pages | `(admin)/admin/categories/{page,new/page,[id]/edit/page}.tsx`, `(admin)/admin/services/page.tsx` |

## Not done / follow-ups

- Per-category commission is on `/admin/settings/commission` (AD-06), not on the category form.
- No category image upload (icons only) and no drag-to-reorder (the `Order` number sets it).
- The service detail and provider profile pages are still placeholders; when built they must use `VISIBLE_SERVICE`
  like the catalog pages do.
