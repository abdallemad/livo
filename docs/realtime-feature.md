# Real-time updates with Pusher — live notifications (SY-02)

Livo uses **Pusher Channels** (hosted WebSockets) for anything that should appear without a reload: a toast when a
provider sends a quote on your open request, and booking chat ([messages-feature.md](messages-feature.md)). The app has
no socket server of its own (`docs/SITEMAP.md` §6 "`/api/realtime/*` … if not handled by an external service").

**The database is the fact, the push is a convenience** — same principle as payments. Every event is saved first; the
push is sent **after the transaction commits**, best effort: if Pusher isn't configured or is down, the request still
succeeds and pages still show the data on their next load (the chat thread polls every 10 s when Pusher is off).

## Setup

| Variable | Where | Value |
|---|---|---|
| `PUSHER_APP_ID` | server only | App ID from the Pusher dashboard → App Keys |
| `PUSHER_SECRET` | server only — **never** `NEXT_PUBLIC_` | Secret |
| `NEXT_PUBLIC_PUSHER_KEY` | browser + server | Key |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | browser + server | Cluster, e.g. `eu` |

These replace the earlier `.env.example` names (`PUSHER_KEY`, `PUSHER_SECRETE`, `CLUSTER`): the browser can only read
variables that start with `NEXT_PUBLIC_`, and `NEXT_PUBLIC_*` values are **inlined at build time**, so set them in the
build environment (Hostinger) too. `npm run check-env` fails if only some of the four are set.

In the Pusher dashboard you don't need to enable **client events** (the browser never publishes), and
**authorized connections** can stay off — channels are private and signed per subscription.

## Channels — `src/constants/realtime.ts`

| Channel | Who may subscribe | Events |
|---|---|---|
| `private-user-<userId>` | that user only (`User.id` is the Clerk id) | `notification` → `{ type, title, body, href }` |
| `private-booking-<bookingId>` | the booking's customer and provider, once the provider accepted (chat readable) | `message` → `ChatMessageDto` |

All channels are **private**: pusher-js asks `POST /api/realtime/auth` (form `socket_id`, `channel_name`) to sign the
subscription. The route runs `requireUser()` and `assertCanSubscribe()` (`services/chat.service.ts`): an unknown channel
name, someone else's user channel, or a booking you're not part of → **403**. The success body is Pusher's own `{ auth }`
JSON (the one deliberate exception to the `ApiResponse` envelope — pusher-js reads it as is). It's a same-origin POST, so
the proxy's CSRF guard applies.

## Live notifications

`RealtimeNotifications` (`components/layout/`) is mounted once in `DashboardShell`'s header, so it runs on every
customer, provider and admin dashboard page. It subscribes to the signed-in user's channel and, on `notification`:

1. invalidates the zone's queries (`customerKeys.all` / `providerKeys.all`) — an open `/account/requests/[id]` shows the
   new quote immediately, the home counters update;
2. shows a toast with **View** → the `href`, unless the user is already on that page.

Pushed today: every stored notification listed in [notifications-feature.md](notifications-feature.md) (quotes sent and
accepted, provider booking actions, cash bookings, payments, customer confirm / cancel, new matching requests) through
`pushStoredNotifications()`, plus a toast for each chat message ([messages-feature.md](messages-feature.md)). The toast
also refreshes the **bell** and the **Messages** badge.

Notification rows are still written inside each transaction as before; the push only makes them appear at once.

## Code

| Piece | File |
|---|---|
| Server client, `publish`, `pushNotification`, `signSubscription` | `src/lib/pusher.ts` (lazy; no-op when not configured; errors logged, never thrown) |
| Browser client (one shared connection, `channelAuthorization` → `/api/realtime/auth`) | `src/lib/pusher-client.ts` |
| Channel / event names, `parseChannel` | `src/constants/realtime.ts` |
| Subscribe hook (ref-counted per channel) | `src/hooks/use-realtime.ts` (`useChannelEvent`) |
| Toast listener | `src/components/layout/RealtimeNotifications.tsx` |
| Auth route | `src/app/api/realtime/auth/route.ts` |
| Env | `src/config/env.ts` (`getPusherEnv`), `.env.example`, `tests/prelaunch/check-env.mjs` |
| Tests | `tests/utils/chat.test.ts` (channel parsing) |

Packages: `pusher` (server), `pusher-js` (browser).

## Not done / follow-ups

- The notification centre is built ([notifications-feature.md](notifications-feature.md)); admin decisions, disputes
  and payouts are stored but not pushed live yet.
- Presence ("online"), typing indicators and read receipts.
