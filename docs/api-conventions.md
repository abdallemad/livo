# API conventions (Route Handlers instead of Server Actions)

Livo exposes every client↔server operation as a JSON endpoint in `src/app/api/`. There are **no
Server Actions** in this codebase.

```
Component → hook (TanStack Query) → api-client → /api/... route.ts → service → repository → Prisma
```

## Endpoint layout

| Path | Who | Guard |
|---|---|---|
| `/api/health` | anyone | none (no DB) |
| `/api/me`, `/api/me/*` | the signed-in user's own data | `requireUser()` / `getViewer()` |
| `/api/auth/sync` | first sign-in | Clerk session |
| `/api/<feature>` | public reads / customer writes | per route |
| `/api/provider/<feature>` | providers (and admins) | `requireProvider()` |
| `/api/admin/<feature>` | admins only | proxy 404 + `requireAdmin()` |

Admin endpoints today: `GET /api/admin/dashboard`, `GET /api/admin/providers`, `GET /api/admin/providers/[id]`,
`PATCH /api/admin/providers/[id]/status`, `GET /api/admin/files/[id]`, `GET /api/admin/users`, `GET /api/admin/users/[id]`,
`PATCH /api/admin/users/[id]/status`, `PATCH /api/admin/disputes/[id]/status`, `GET|POST /api/admin/categories`,
`GET|PATCH|DELETE /api/admin/categories/[id]`, `PATCH /api/admin/categories/[id]/status`, `GET /api/admin/services`,
`PATCH /api/admin/services/[id]/status` (see `docs/admin-dashboard-feature.md`, `docs/admin-providers-users-feature.md`,
`docs/admin-catalog-feature.md`).

`requireUser()` (and so `requireRole`/`requireProvider`/`requireAdmin`) also rejects accounts whose
`User.status` isn't `ACTIVE` with **403** (AD-03 suspension).
| `/api/webhooks/<provider>` | payment gateway etc. | signature over raw body |

Collections: `GET` (list, paginated via `?page&perPage`) and `POST` (create) in `route.ts`.
Items: `GET`, `PATCH`, `DELETE` in `[id]/route.ts`. State transitions as sub-resources:
`PATCH /api/admin/bookings/[id]/status`. Every path is registered in `src/constants/api-routes.ts`.

## Handler shape

1. **Authorise** — a `require*` guard from `services/auth.service.ts`.
2. **Validate** — `parseBody` / `parseQuery` / `parseParams` from `lib/api-route.ts` (Zod).
3. **Delegate** — call one service function.
4. If the write changes public pages — `revalidateStorefront()`.
5. Respond with `ok()` / `created()` / `noContent()`; `catch` → `toErrorResponse(e, "fallback")`.

## Response envelope (`src/types/api.ts`)

```json
{ "success": true, "data": { } }
{ "success": false, "error": "Human message", "code": "VALIDATION", "fieldErrors": { "name": ["Required"] } }
```

| Error class | `code` | HTTP |
|---|---|---|
| `UnauthorizedError` | `UNAUTHORIZED` | 401 |
| `ForbiddenError` | `FORBIDDEN` | 403 |
| `NotFoundError` | `NOT_FOUND` | 404 |
| `ConflictError` | `CONFLICT` | 409 |
| `DependencyError` | `DEPENDENCY` | 409 |
| `ValidationError` | `VALIDATION` | 422 |
| anything else | `INTERNAL` | 500 (real cause logged server-side only) |

## Client side

Hooks call `api.get/post/put/patch/delete` from `src/lib/api-client.ts`. It returns `data` or throws
`ApiError` (`status`, `code`, `fieldErrors`) — replay `fieldErrors` into react-hook-form with
`form.setError`. Components never call `fetch` or the api-client directly.

## Security

- CSRF: `src/proxy.ts` rejects cross-origin `POST/PUT/PATCH/DELETE` to `/api/*` (except webhooks).
- The user id comes from the Clerk session, never from the body/query/URL.
- Responses that contain per-user data are `cache-control: private, no-store`.
- Mutations are never `GET`.
