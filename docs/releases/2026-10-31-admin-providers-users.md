# 2026-10-31 — Admin providers & users pages

Details: [admin-providers-users-feature.md](../admin-providers-users-feature.md).

- `/admin/providers`: status tabs with counts, search, approve / reject / suspend / reinstate per row.
- `/admin/providers/[id]`: full review page with private documents (admin-only signed links), services,
  track record and audit history.
- `/admin/users` and `/admin/users/[id]`: search, role/status filters, suspend (with reason) / activate,
  activity counts, recent bookings, history.
- Account suspension is enforced: `requireUser()` returns 403 for non-ACTIVE users, and the zone gate sends
  them to the new static `/account-suspended` page.
- Provider decisions gained `SUSPEND` and `REINSTATE` (same endpoint, same audit + notification pattern).
- New shared admin pieces: `ReasonDialog`, `SearchBox`, `ListPagination`, `HistoryCard`, `DetailField`,
  `useUrlQuery`; `ProviderStatusBadge`, `UserStatusBadge`; `ServiceUnavailableError` (503).
- `ProviderDecisionActions` moved from `components/admin/dashboard/` to `components/admin/providers/`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `eslint src tests`, `npm test` (41/41, new zone-access case for suspended users) pass.
- Services run against the seeded dev DB: provider list (counts per status, search), provider detail
  (documents → admin file URLs), user list (role filter) and detail return real data. Refusals checked
  without writing: suspend yourself → 422, activate an active user → 409, reinstate a pending provider →
  409, unknown user → 404.
- Browser: `/account-suspended` renders with header + footer; every new `/api/admin/*` route answers the
  404 envelope when signed out.
- **Not verified in a browser:** the admin list/detail screens and successful decisions (needs an admin
  sign-in; successful writes would change dev data).
