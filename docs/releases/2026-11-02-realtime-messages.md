# 2026-11-02 — Real-time with Pusher: live quote notifications, booking chat

Details: [realtime-feature.md](../realtime-feature.md), [messages-feature.md](../messages-feature.md).

- **Live notifications (SY-02):** when a provider sends, re-sends or changes a quote on your open request, you get a toast
  with **View** wherever you are in your dashboard, and the request page / home counts refresh by themselves. New chat
  messages toast the other side the same way.
- **Messages (CU-06, PR-09):** `/account/messages` (conversations) and `/account/messages/[bookingId]` (live thread), plus
  the same two pages for providers so they can reply. Chat opens only once the provider accepted the booking (SY-04) and
  becomes read-only when the job ends, is cancelled or disputed.
- **Pusher:** private channels per user and per booking, signed by `POST /api/realtime/auth` after an ownership check.
  Pushes are sent after the database write, best effort; without Pusher the chat polls every 10 s.
- **Env renamed:** `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` (were
  `PUSHER_KEY`, `PUSHER_SECRETE`, `CLUSTER`). Update `.env` and the Hostinger build environment. `check-env` flags a half setup.
- New packages: `pusher`, `pusher-js`.

No schema change and no migration.

## Verification

- `tsc --noEmit`, `npm run lint`, `npm test` (202/202; `tests/utils/chat.test.ts` new) pass;
  `next build --webpack --experimental-build-mode=compile` compiles.
- Run once (not kept, it needs type transforms): `assertCanSubscribe` accepts your own user channel and refuses another
  user's and unknown channels; `signSubscription` produces Pusher's HMAC signature.
- **Not verified with a real Pusher app, a database or a browser.** Worth checking: two browsers (a customer and a provider
  on a confirmed booking) — messages appear on both sides instantly; the provider sends a quote → the customer's dashboard
  shows a toast and the request page lists the quote without reloading; the Pusher dashboard's debug console shows
  `private-user-…` / `private-booking-…` subscriptions succeeding.
