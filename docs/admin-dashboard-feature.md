# Admin dashboard (`/admin`) — AD-09, AD-01, AD-05

The admin home page shows live platform numbers from Postgres and lets an admin act on the two
queues that need a person: provider applications and disputes.

## What's on the page

| Block | Source | Action |
|---|---|---|
| **Key metrics**: users (+ new in 30 days), active providers, booking value, commission earned | counts and sums in one `$transaction` | — |
| **Needs attention**: pending applications, open disputes, payout requests (count + EGP), bookings awaiting provider | counts | each card links to its admin list |
| **Pending provider applications** (oldest 5) | `ProviderProfile.verificationStatus = PENDING` | **Approve** (confirm dialog) / **Reject** (dialog with a reason, 10–500 chars, shown to the provider) |
| **Open disputes** (oldest 5) | `Dispute.status IN (OPEN, UNDER_REVIEW)` | **Start review** (OPEN → UNDER_REVIEW); resolving refunds/releases belongs on `/admin/disputes/[id]` |
| **Latest bookings** (5) | `Booking` by `createdAt desc` | links to `/admin/bookings/[id]` |

Metric definitions (in `services/admin-dashboard.service.ts`):

- **Booking value** = sum of `Booking.amount` for bookings that went ahead: every status except
  `PENDING_PAYMENT`, `CANCELLED`, `REJECTED`.
- **Commission earned** = sum of `Booking.commissionAmount` for `COMPLETED` + `CLOSED` only (the
  customer confirmed the job, CU-09).
- **Users** exclude soft-deleted accounts (`status = DELETED`).

## Flow

```
page.tsx (Server Component, dynamic: the admin layout reads the session)
  └─ getAdminDashboard()  ── first snapshot, service called directly (CLAUDE.md §2 exception)
       └─ <AdminDashboard initialData> (client)
            ├─ useAdminDashboard()         GET   /api/admin/dashboard
            ├─ useProviderDecision()       PATCH /api/admin/providers/[id]/status   { decision: "APPROVE" } | { decision: "REJECT", reason }
            └─ useStartDisputeReview()     PATCH /api/admin/disputes/[id]/status    { status: "UNDER_REVIEW" }
```

Each mutation invalidates `adminKeys.all`, so the KPIs and queues refetch in place.

## Rules (services)

- `provider-review.service.ts` `decideProvider()`: only a `PENDING` application can be decided. The
  change is one conditional `UPDATE … WHERE verificationStatus = 'PENDING'`, so two admins clicking
  at once can't both decide (the second gets **409**). In the same transaction it writes an
  `AuditLog` row (`provider.approve` / `provider.reject`, reason in `metadata`) and a
  `PROVIDER_DECISION` notification to the provider. Sets `reviewedById`, `reviewedAt`,
  `rejectionReason`. The route calls `revalidateStorefront()` because an approved provider becomes public.
- `dispute.service.ts` `startDisputeReview()`: `OPEN → UNDER_REVIEW` with the same conditional-update
  pattern, an audit row (`dispute.start_review`) and a `DISPUTE_UPDATE` notification to whoever
  opened the dispute. Not public, so no storefront revalidation.
- Unknown id → **404**, already decided / not OPEN → **409**, bad body → **422** with `fieldErrors`
  (the reject dialog replays them into the form).

## Security

All three routes call `requireAdmin()` first; `/api/admin/*` is also 404-gated in `src/proxy.ts`
and the page sits behind the admin layout's `notFound()` (CLAUDE.md §5). The admin id comes from the
session, never from the body.

## Files

| Layer | File |
|---|---|
| Schemas | `src/schemas/admin.schema.ts` |
| DTOs | `src/types/admin.ts` |
| Repositories | `src/repositories/admin-dashboard.repository.ts`, `provider.repository.ts`, `dispute.repository.ts`, `audit.repository.ts` |
| Services | `src/services/admin-dashboard.service.ts`, `provider-review.service.ts`, `dispute.service.ts` |
| API | `src/app/api/admin/dashboard/route.ts`, `…/providers/[id]/status/route.ts`, `…/disputes/[id]/status/route.ts` |
| Hook | `src/hooks/use-admin-dashboard.ts`, `useProviderDecision` in `use-admin-providers.ts`, `useStartDisputeReview` in `use-admin-moderation.ts` (keys: `adminKeys` in `constants/query-keys.ts`) |
| UI | `src/components/admin/dashboard/AdminDashboard.tsx`, `components/admin/providers/ProviderDecisionActions.tsx`; `BookingStatusBadge` / `DisputeStatusBadge` in `components/shared/status-badge.tsx` (labels in `constants/status.ts`) |
| Page | `src/app/(admin)/admin/page.tsx` |
