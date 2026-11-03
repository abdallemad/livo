# Livo AI Assistant (Gemini)

A floating **"Ask Livo"** button on every public page opens a chat that helps a visitor describe a problem or project,
gives a short diagnosis and 2–3 safety tips, a rough price in EGP, and the right next step as a real link
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
`src/app/api/assistant/chat/route.ts`, `src/hooks/use-ai-assistant.ts`, `src/components/ai-assistant/*`,
tests in `tests/ai-assistant/`.
