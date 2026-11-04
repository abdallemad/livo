# Livo AI Assistant (Gemini)

Four modes share one engine (`services/ai-assistant.service.ts`):

| Mode | Where | Entry point | Endpoint | Grounded in |
|---|---|---|---|---|
| `public` | marketing pages | floating button (`AssistantLauncher`) | `POST /api/assistant/chat` (guests allowed) | live catalog |
| `customer` | `/account/*` | "Ask AI" in the dashboard header (`AssistantHeaderButton`) | `POST /api/me/assistant` (`requireRole("CUSTOMER","ADMIN")`) | catalog + the customer's dashboard: to-dos (confirm / pay / compare quotes / review), upcoming bookings, open requests |
| `provider` | `/provider/*` | "Ask AI" in the dashboard header | `POST /api/provider/assistant` (`requireProvider()`) | catalog (other providers' listed prices) + the provider's dashboard: approval & verification (with rejection reason), setup gaps, new matching requests, today's jobs, quotes/bookings counts, earnings and wallet |
| `admin` | `/admin/*` | "Ask AI" in the dashboard header | `POST /api/admin/assistant` (`requireAdmin()`, proxy 404-gate) | catalog + platform KPIs and queues: pending applications, open disputes (reason only), payout requests, recent bookings — **no customer/provider names** |

**Customer assistant** — what needs attention first, writing a clear quote request (draft + "Request quotes" link for the
right category), comparing quotes, payments held until confirmation, polite messages to the provider, plus the public
diagnosis/price help.

**Provider assistant** — a work coach: what to do first today, a fair price range for a quote (from listed catalog prices
and the request details) and a professional quote message, fixed-price service titles/descriptions, replies to customers,
growing (portfolio, areas, schedule, reviews), explaining earnings/wallet/payouts, and what's missing when not approved.
It never states a commission rate (it points to Earnings) and never suggests getting around hidden contact details.

**Admin assistant** — an operations helper: what to handle first, a review checklist and rejection reasons for provider
applications (AD-01), user suspensions (AD-03), category structure and copy (AD-02), stuck requests/bookings (AD-04), a fair
framework and decision message for disputes (AD-05), commission trade-offs (AD-06), payment and payout checks (AD-07),
review moderation (AD-08), static page copy (AD-10) and the audit log (AD-11). It advises; every decision stays with the admin.

### Per-page sections

In dashboards the assistant adapts to the page it's opened on. `constants/ai-assistant-sections.ts` lists every dashboard
page per zone with its SRS requirement ids, a `focus` for the model and the opening `starters`. The panel sends the current
pathname as `path`; the server resolves it with `resolveAssistantSection()` (longest matching prefix, else the zone home) and
adds "the user is on <page> (requirements …), focus: …" to the instruction — the raw path is never put in the prompt. The
sheet title shows the page ("Livo Work Assistant · Quotes") and the starters change with it. The business rules BR-01…BR-08
(docs/srs.md) are part of every dashboard instruction. Prices are quoted in the app currency (`CURRENCY_SYMBOL`).

Add a dashboard page → add its section in the same change (a test checks every section has starters and requirement ids).

Each reply may carry a **draft** — ready-to-paste text shown in a card with a Copy button. Dashboard links come from fixed
tables per mode (`CUSTOMER_ASSISTANT_LINKS`, `PROVIDER_ASSISTANT_LINKS` in `utils/ai-assistant.ts`); the model only picks
a key (sent as the JSON schema enum), and an unknown key renders no button. The dashboard snapshot is loaded from the
session user's id via the existing dashboard services — never from the request body. In dashboards the entry point is a
header button, not a floating one, because a floating button would cover the mobile bottom tabs. 

## Public mode

A floating **"Ask Livo"** button on every public page opens a chat that helps a visitor describe a problem or project,
gives a short diagnosis and 2–3 safety tips, a rough price in USD, and the right next step as a real link
(book a fixed-price service, request quotes, or browse). It answers in the visitor's language (English or Egyptian Arabic),
can read replies aloud and take voice input.

## Flow

```
AssistantLauncher (client island, marketing layout)
  → AssistantPanel (lazy-loaded on first open)
  → useAssistantChat()  (hooks/use-ai-assistant.ts, useMutation)
  → POST /api/assistant/chat  (app/api/assistant/chat/route.ts)
  → askAssistant()  (services/ai-assistant.service.ts)
      → catalogRepository.findActiveCategories + priceStatsByCategory  (live catalog, cached 10 min in memory)
      → Gemini generateContent (lib/gemini.ts) with a JSON response schema
      → assistantModelReplySchema (re-validate) → toAssistantReply (utils/ai-assistant.ts)
```

## Design decisions

- **Grounded in the live catalog.** The system instruction lists the active categories, their type (fixed / quote / both)
  and the real min–max listed prices. The model is told not to invent fees, warranties or promises. Prices in a prompt
  copied from elsewhere would drift from what providers actually charge.
- **The model never builds a URL.** It returns `action` + `categorySlug`; `toAssistantAction()` builds the href from a
  known category (`/services/<slug>`, `/account/requests/new?category=<slug>`, `/category`). An unknown slug or an action
  the category doesn't support degrades to a general link.
- **Untrusted in, untrusted out.** The request accepts only `user` / `assistant` turns (no `system`), ≤ 20 messages of
  ≤ 1000 characters; the last must be the visitor's. The role used to tailor answers comes from the session, never the body.
  The model's JSON is re-validated with a lenient Zod schema and its lengths are capped.
- **Open to guests, rate limited.** The assistant lives on public pages, so the route doesn't require sign-in. A per-visitor
  in-memory limit (8/min, 60/h, keyed by user id, else IP) protects the Gemini quota. It is per process — move it to a shared
  store if the app runs on more than one instance. Suspended accounts get 403. Same-origin only via the proxy CSRF check.
- **Model fallback.** Each configured model is tried in order; a busy (503), rate-limited (429), timed-out (12 s) or unknown (404) model falls through to the next.
- **Honest failures.** When every model fails, or on a non-retryable error (bad key) or malformed output → `503` with a friendly message (logged server-side);
  the UI shows it and puts the text back in the box. There is no canned "fake" answer.
- **Nothing stored.** The conversation lives in the panel's state; closing the tab forgets it. Voice in/out uses the browser's
  Speech APIs and never touches our server (buttons hide where unsupported).
- **Static pages stay static.** The launcher is a client island with no request reads; the panel code loads on first open.
  It is mounted in the `(marketing)` layout only — dashboards have mobile bottom tabs it would cover.

## Configuration

| Var | |
|---|---|
| `GEMINI_API_KEY` | Server only. Optional: without it the route answers 503 and the panel says the assistant is unavailable. |
| `GEMINI_MODEL` | Optional. One model or a comma-separated fallback list. Default `gemini-3-flash-preview,gemini-3.5-flash-lite,gemini-3.1-flash-lite` — `gemini-3-flash-preview` answers; the Flash-Lite models are fallbacks when it is busy (503) or rate limited (429). Avoid `gemini-flash-latest`: it tracks the newest Flash and can change under you. |

## Files

`src/config/env.ts` (`getGeminiEnv`), `src/lib/gemini.ts`, `src/lib/rate-limit.ts`, `src/lib/errors.ts` (`RateLimitError` 429),
`src/schemas/ai-assistant.schema.ts`, `src/types/ai-assistant.ts`, `src/utils/ai-assistant.ts`,
`src/services/ai-assistant.service.ts`, `src/repositories/catalog.repository.ts` (`priceStatsByCategory`),
`src/app/api/assistant/chat/route.ts`, `src/app/api/me/assistant/route.ts`, `src/app/api/provider/assistant/route.ts`,
`src/app/api/admin/assistant/route.ts`, `src/constants/ai-assistant.ts` (per-mode UI copy + endpoint),
`src/constants/ai-assistant-sections.ts` (per-page sections), `src/hooks/use-ai-assistant.ts`, `src/components/ai-assistant/*`
(`AssistantLauncher`, `AssistantHeaderButton`, `AssistantSheet`, `AssistantPanel`), `src/components/layout/DashboardShell.tsx`,
tests in `tests/ai-assistant/`.
