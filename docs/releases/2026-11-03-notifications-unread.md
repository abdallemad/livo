# 2026-11-03 — Notification centre, live notifications for every booking step, unread message badge

Details: [notifications-feature.md](../notifications-feature.md), [messages-feature.md](../messages-feature.md#unread-counts),
[realtime-feature.md](../realtime-feature.md).

- **Bell** in every dashboard header: unread count, the 8 newest, mark all read, see all. **`/account/notifications`**
  (and `/provider/notifications`): all / unread, mark all read, load more.
- **Live** (Pusher, after each commit): customer — new / updated quote, booking confirmed / declined / started / done,
  payment received; provider — **quote accepted**, quote not chosen, new booking (cash or paid), customer confirmed /
  cancelled, new matching request. Each shows a toast with **View** and updates the bell.
- **Messages badge**: unread count on **Messages** in the sidebar and the mobile tab bar, per-conversation counts on
  `/account/messages`, updated live; opening a thread marks it read.
- **Migration** `2026-11-03-chat-read-markers.sql`: `Booking.customerLastReadAt`, `Booking.providerLastReadAt` (additive,
  idempotent; applied by `npm run build`'s prebuild step).

## Verification

- `tsc --noEmit`, `npm run lint`, `npm test` (206/206; `tests/utils/notification.test.ts` new; the migration-list test
  covers the new SQL file); `next build --webpack --experimental-build-mode=compile` compiles.
- **Not verified against a database, Pusher or in a browser.** Worth checking with two browsers: the customer accepts a
  provider's quote → the provider gets a toast and the bell shows 1; the provider accepts the booking → the customer gets
  "Booking LV-… is confirmed"; a chat message raises the **Messages** badge on the other side and clears it when they open
  the thread. Check the unread SQL runs on your Postgres (column names are Prisma's defaults).
