# Messages — booking chat (CU-06, PR-09, SY-04, BR-02)

Customers and providers chat per **booking**, live through Pusher ([realtime-feature.md](realtime-feature.md)). Same
layering as the rest of the app: server snapshot → client island → hook → `/api/me/messages*` or
`/api/provider/messages*` → `chat.service.ts` → `chat.repository.ts`. The participant always comes from the session.

## Pages

| Route | What it does |
|---|---|
| `/account/messages` | The customer's conversations: one row per booking whose chat is (or was) open — provider avatar + name, job title + booking number, last message ("You: …" when it's yours), time (Cairo), a status badge when the chat is closed. Most recent activity first. Empty state explains when a chat opens. Refreshes every 30 s. |
| `/account/messages/[bookingId]` | The thread: header with the provider, link to the booking, status, **tap-to-call** while the job is live (BR-02); messages grouped by day; composer (Enter sends, Shift+Enter new line, 2000 chars). New messages appear live; your own appear at once ("Sending…") and are matched back to the saved copy. A closed chat stays readable with the reason instead of the composer. |
| `/provider/messages`, `/provider/messages/[bookingId]` | The same two components for the provider side (`side="PROVIDER"`), so a customer's message can be answered. |

The booking page's **Message the provider** button ([customer-booking-detail-feature.md](customer-booking-detail-feature.md))
and the provider booking page's **Message the customer** link here.

## Rules — `src/utils/chat.ts` (pure, tested)

- **A chat exists only once the provider accepted the booking** (`contactUnlockedAt` set). Before that, contact details
  must stay hidden (SY-04) and a chat would be the way around it — so such a thread is a **404**, and it isn't listed.
  (The `Message.contactBlocked` flag stays `false`: nothing is ever sent before unlock.)
- **Sending** is open while the job is live: `CONFIRMED`, `IN_PROGRESS`, `AWAITING_CONFIRMATION`. Finished, cancelled /
  declined, or **disputed** (Livo handles it) → read-only with the reason (409 if posted anyway).
- Only the booking's customer (customer zone) or provider (provider zone) can read or write; anyone else gets a 404.
  Admins read every chat on `/admin/bookings/[id]` (unchanged).
- A thread loads the newest **200** messages.

## Sending

`POST …/messages/[bookingId]` `{ body, clientId? }`:
1. checks the rules above, saves the `Message`;
2. then (best effort) publishes it on `private-booking-<id>` (`message` event) — both open threads update — and sends the
   **other** participant a toast on their user channel ("New message from …", with a link to their thread).

Messages aren't audited and don't create `Notification` rows (one per message would flood the future notification centre).

## API

| Method | Path | Does |
|---|---|---|
| GET | `/api/me/messages` | `ConversationDto[]` (customer) |
| GET / POST | `/api/me/messages/[bookingId]` | `ChatThreadDto` / send → 201 `ChatMessageDto` |
| GET | `/api/provider/messages` | `ConversationDto[]` (provider) |
| GET / POST | `/api/provider/messages/[bookingId]` | same, as the provider |

`requireUser()` / `requireProvider()`; reads are `private, no-store`. Not public: no storefront revalidation.

## Files

| Layer | File |
|---|---|
| Util + tests | `src/utils/chat.ts` (`chatClosedReason`, `canReadChat`, `messagePreview`, `mergeMessage`, limits); `tests/utils/chat.test.ts` |
| Schema | `src/schemas/chat.schema.ts` |
| DTOs | `src/types/chat.ts` |
| Repository | `src/repositories/chat.repository.ts` |
| Service | `src/services/chat.service.ts` (also `assertCanSubscribe` for the real-time auth) |
| Routes | `src/app/api/me/messages/**`, `src/app/api/provider/messages/**` |
| Hooks | `src/hooks/use-chat.ts` (`useConversations`, `useThread` — live via `useChannelEvent`, else polls 10 s — `useSendMessage`, optimistic) |
| Constants | `API_ROUTES.customer.messages / thread`, `API_ROUTES.provider.messages / thread`, `customerKeys` / `providerKeys` `.conversations / .thread` |
| UI | `src/components/chat/{ConversationList,ChatThread}.tsx` |
| Pages | `(app)/account/messages/{page,[bookingId]/page}.tsx`, `(provider)/provider/messages/{page,[bookingId]/page}.tsx` |

No schema change and no migration (`Message` already existed).

## Not done / follow-ups

- **Unread** counts / "seen" (needs a `lastReadAt` per participant — a migration).
- Photo attachments (`Message.attachments` → `File` exists; upload + owner-only links like request photos).
- Loading older messages beyond the newest 200.
- Offline notice for messages (email / SMS, SY-02) — today the other side only gets a toast if a dashboard is open.
- Customer-side requests chat before booking (asking a provider about a quote) — out of scope by SY-04.
