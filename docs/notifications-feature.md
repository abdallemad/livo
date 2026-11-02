# Notifications — bell, notification centre, live pushes (SY-02)

Every event that already wrote a `Notification` row (quote received, quote accepted, booking confirmed, payment
received…) is now **visible** and **live**: a bell with an unread count in every dashboard header, a full list on
`/account/notifications` (and `/provider/notifications`), and a Pusher push the moment the row is committed
([realtime-feature.md](realtime-feature.md)). Same layering as the rest of the app: client island → hook →
`/api/me/notifications*` → `notification.service.ts` → `notification.repository.ts`.

## UI

| Where | What |
|---|---|
| **Bell** (`NotificationBell`, in `DashboardShell`'s header — customer, provider and admin zones) | Badge with unread count (`9+`), popover with the 8 newest (icon by type, title, body, time in Cairo, unread dot), **Mark all read**, **See all** (not for admins). Opening one marks it read and goes to its page. Same-size placeholder until Clerk resolves. |
| `/account/notifications`, `/provider/notifications` (`NotificationsList`) | Every notification, newest first; **All / Unread (n)** filter; **Mark all read**; 20 at a time with **Load more**; empty state. |
| Toast (`RealtimeNotifications`) | On every push: a toast with **View**, and the bell + the zone's lists refresh. |

## Where each notification leads — `src/utils/notification.ts` (pure, tested)

`notificationHref(type, payload, recipientRole)`; payload ids are URL-encoded and anything that isn't a short string is
ignored.

| Role | Type | Page |
|---|---|---|
| Customer | `QUOTE_RECEIVED` | `/account/requests/[requestId]` |
| Customer | anything with a `bookingId` (confirmed, status changed, payment, dispute…) | `/account/bookings/[bookingId]` |
| Provider | `QUOTE_ACCEPTED`, `NEW_REQUEST_MATCH` | `/provider/requests/[requestId]` (shows the booking even while it's unpaid) |
| Provider | `BOOKING_*`, `DISPUTE_UPDATE`… with a `bookingId` | `/provider/bookings/[bookingId]` |
| Provider | `PROVIDER_DECISION` / `PAYOUT_UPDATE` / `REVIEW_RECEIVED` | `/provider/verification` / `/provider/earnings` / `/provider/reviews` |
| Admin | with a `bookingId` / `requestId` | `/admin/bookings/[id]` / `/admin/requests/[id]` |
| any | nothing to link | the zone's home |

## Live pushes

`pushStoredNotifications(rows)` (`services/notification.service.ts`) looks up each recipient's role, builds the link and
publishes `{ type, title, body, href }` on `private-user-<id>`. Services call it **after** their transaction commits,
with the same rows they wrote — best effort, never failing the request.

| Event | Recipient | Notification |
|---|---|---|
| Provider sends / re-sends / changes a quote | customer | `QUOTE_RECEIVED` "New quote on …" |
| Customer **accepts a quote** | chosen provider | `QUOTE_ACCEPTED` "Your quote on … was accepted" |
| Customer accepts a quote | the other providers who quoted | `SYSTEM` "The customer chose another quote" |
| Provider **accepts** / declines / starts / marks done a booking | customer | `BOOKING_CONFIRMED` "Booking LV-… is confirmed" / `BOOKING_STATUS_CHANGED` |
| Customer books a service with **cash** | provider | `BOOKING_CREATED` "New booking LV-…" |
| **Online payment** confirmed (webhook / reconcile) | provider + customer (+ admins if paid after close) | `BOOKING_CREATED` / `PAYMENT_UPDATE` |
| Customer **confirms** the job or cancels before acceptance | provider | `BOOKING_STATUS_CHANGED` |
| Customer posts a quote request | matching providers | `NEW_REQUEST_MATCH` "New request: …" |
| Chat message | the other participant | live toast only (not stored — [messages-feature.md](messages-feature.md)) |

Other existing rows (admin decisions, disputes, payouts, suspensions) appear in the bell on the next refresh (60 s poll or
any push); making them live is one `pushStoredNotifications` call after each of those transactions.

## API

| Method | Path | Does |
|---|---|---|
| GET | `/api/me/notifications?filter=all\|unread&page&perPage` | `NotificationList` (`Paginated<NotificationDto>` + `unread` total) |
| PATCH | `/api/me/notifications/read` | `{ ids }` → those read; `{}` → all read. `{ updated }` |

`requireUser()`; the user id comes from the session; reads are `private, no-store`.

## Files

| Layer | File |
|---|---|
| Util + tests | `src/utils/notification.ts` (`notificationHref`, `countBadge`); `tests/utils/notification.test.ts` |
| Schema | `src/schemas/notification.schema.ts` |
| DTOs | `src/types/notification.ts` |
| Repository | `src/repositories/notification.repository.ts` |
| Service | `src/services/notification.service.ts` (list, mark read, `pushStoredNotifications`) |
| Wired into | `provider-request.service.ts` (quotes), `customer-request.service.ts` (accept quote), `provider-booking.service.ts` (provider actions), `booking-checkout.service.ts` (cash booking, `markCheckoutPaid`), `customer-booking.service.ts` (confirm / cancel), `new-request.service.ts` (matching providers) |
| Routes | `src/app/api/me/notifications/route.ts`, `…/read/route.ts` |
| Hook | `src/hooks/use-notifications.ts` (`notificationKeys`) |
| UI | `src/components/notifications/{NotificationBell,NotificationsList,NotificationItem}.tsx`; `RealtimeNotifications` invalidates `notificationKeys.all` |
| Pages | `(app)/account/notifications/page.tsx`, `(provider)/provider/notifications/page.tsx` |

No schema change for notifications (`Notification.readAt` already existed).

## Not done / follow-ups

- SMS / WhatsApp / email for critical events (SY-02) — only in-app today.
- Notification preferences (mute types).
- Clean-up of old read notifications.
