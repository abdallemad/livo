# Admin providers & users — AD-01, AD-03

Two admin areas built on the same pattern as the dashboard ([admin-dashboard-feature.md](admin-dashboard-feature.md)):
lists are client islands whose filters live in the URL, detail pages get their first snapshot from
the server, and every action goes through `/api/admin/*` and refetches.

## Pages

| Route | What it does |
|---|---|
| `/admin/providers` | Status tabs with live counts — **Pending review** (default, oldest first), **Active**, **Suspended**, **Rejected**, **Incomplete** (DRAFT, still in the wizard). Search by name / email / phone. Each row has the actions for its status plus **Review**. |
| `/admin/providers/[id]` | Review page: profile (phone, email, specialties, areas, experience, bio), **verification documents** (open in a new tab through a 5-minute signed link), services, track record (rating, completed jobs, portfolio), the current reason if rejected/suspended, account-status warning, BR-04 low-rating flag, and the audit history. |
| `/admin/users` | Every account. Search by name / email / phone / exact id, filter by role and status, suspend / activate inline. |
| `/admin/users/[id]` | Account details, activity counts, recent bookings (either side), link to the provider review page, suspension reason, history, suspend / activate. |
| `/account-suspended` | Public static page a suspended user is redirected to from any dashboard zone. |

URL state: `?status=APPROVED&q=ali&page=2` (providers), `?q=&role=PROVIDER&status=SUSPENDED&page=2` (users).
Defaults are dropped from the URL; any filter change resets to page 1; an invalid value falls back to the
schema default. Parsed with the same Zod schema the API route uses (`useUrlQuery` in `hooks/use-url-query.ts`).

## Provider verification (AD-01)

`PATCH /api/admin/providers/[id]/status` — body `{ decision, reason? }`:

| decision | from → to | reason | notification |
|---|---|---|---|
| `APPROVE` | PENDING → APPROVED | — | "Your provider account is approved" |
| `REJECT` | PENDING → REJECTED | required (10–500) | the reason |
| `SUSPEND` | APPROVED → SUSPENDED | required | the reason |
| `REINSTATE` | SUSPENDED → APPROVED | — | "Your provider account is active again" |

One conditional `UPDATE … WHERE verificationStatus = <from>`: a stale button or a second admin gets
**409**. The audit row (`provider.approve|reject|suspend|reinstate`, `metadata: { from, to, reason? }`) and
the `PROVIDER_DECISION` notification commit in the same transaction. `rejectionReason` holds the reason the
provider currently sees (rejection or suspension). The route calls `revalidateStorefront()`.

Provider suspension only affects the provider side (profile/services hidden, no new requests); the person
can still use the app as a customer. To lock someone out entirely, suspend the **user**.

## Account suspension (AD-03)

`PATCH /api/admin/users/[id]/status` — `{ status: "SUSPENDED", reason }` or `{ status: "ACTIVE" }`.

- Refused: your own account (422), admin accounts (409 — roles are managed by hand, CLAUDE.md §5),
  deleted accounts (409), already in that status (409), unknown id (404).
- Audit `user.suspend` / `user.activate` + a `SYSTEM` notification, same transaction.
- **Enforcement** (in the app, not in Clerk):
  - `requireUser()` throws 403 for any non-ACTIVE user → every customer/provider API call is blocked.
  - The zone gate (`utils/zone-access.ts`, used by `src/proxy.ts` and the zone layouts) sends a suspended
    user from `/account*`, `/provider*`, `/onboarding` to `/account-suspended`.
  - Public pages stay open. The Clerk session itself is not revoked (see "Not done").
  - The route calls `revalidateStorefront()` so a suspended provider drops out of public pages; the
    public catalog service must filter on `User.status = ACTIVE` as well as `verificationStatus = APPROVED`.

## Document previews

`GET /api/admin/files/[id]` (admin only) → **307** to a 5-minute signed inline R2 link, `no-store`. Only a
`File` attached to a `ProviderDocument` resolves, so the route can't be used to read other uploads. If R2
isn't configured it answers **503**.

## API

| Method | Path | Returns |
|---|---|---|
| GET | `/api/admin/providers?status&q&page&perPage` | `AdminProviderList` (`Paginated` + `counts` per status) |
| GET | `/api/admin/providers/[id]` | `AdminProviderDetail` |
| PATCH | `/api/admin/providers/[id]/status` | `ProviderDecisionDto` |
| GET | `/api/admin/files/[id]` | 307 redirect |
| GET | `/api/admin/users?q&role&status&page&perPage` | `Paginated<AdminUserListItem>` |
| GET | `/api/admin/users/[id]` | `AdminUserDetail` |
| PATCH | `/api/admin/users/[id]/status` | `UserStatusDto` |

All call `requireAdmin()` first and are 404-gated by the proxy.

## Files

| Layer | File |
|---|---|
| Schemas | `src/schemas/admin.schema.ts` (`providerDecisionSchema`, `userStatusSchema`, `providerListQuerySchema`, `userListQuerySchema`, `reasonFormSchema`) |
| DTOs | `src/types/admin.ts` |
| Repositories | `provider.repository.ts`, `user.repository.ts`, `audit.repository.ts` |
| Services | `provider-review.service.ts`, `admin-user.service.ts`, `audit.service.ts`; guard change in `auth.service.ts` |
| Hooks | `use-admin-providers.ts`, `use-admin-users.ts`, `use-url-query.ts` |
| UI | `components/admin/providers/*`, `components/admin/users/*`, `components/admin/shared/` (`ReasonDialog`, `SearchBox`, `ListPagination`, `HistoryCard`, `DetailField`); `ProviderStatusBadge`, `UserStatusBadge` in `components/shared/status-badge.tsx`; `constants/audit-actions.ts` |
| Pages | `(admin)/admin/providers/{page,[id]/page}.tsx`, `(admin)/admin/users/{page,[id]/page}.tsx`, `(auth)/account-suspended/page.tsx` |
| Tests | `tests/utils/zone-access.test.ts` (suspended users) |

## Not done / follow-ups

- Suspension doesn't revoke the Clerk session or ban the Clerk user; the app blocks every dashboard and API
  call instead. Banning in Clerk (`users.banUser`) can be added in `setUserStatus` once production Clerk is set up.
- No bulk actions or sortable columns yet (DESIGN-SYSTEM §5 tables).
