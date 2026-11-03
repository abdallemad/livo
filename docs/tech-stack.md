# Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, `next build --webpack`, `output: "standalone"`) |
| UI | React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn/ui `base-nova` on Base UI, LTR (logical utilities only) |
| Fonts | IBM Plex Sans (body), Readex Pro (headings), system mono |
| Auth | Clerk (`@clerk/nextjs`) — phone + OTP per SRS AU-01 |
| Server endpoints | Route Handlers in `src/app/api` (no Server Actions) — see `api-conventions.md` |
| Client data | TanStack Query v5 + `src/lib/api-client.ts` |
| Forms / validation | react-hook-form + Zod v4 |
| Database | PostgreSQL + Prisma 6 (pooled `DATABASE_URL`, `DIRECT_URL` for CLI) |
| Storage | Cloudflare R2 (private bucket) via AWS S3 SDK |
| Real-time | **Pusher Channels** (`pusher` server, `pusher-js` browser), private channels signed by `POST /api/realtime/auth` — [realtime-feature.md](realtime-feature.md) |
| Payments | **Stripe Checkout** (`stripe`, API version pinned in `src/lib/stripe.ts`), EGP, webhook `POST /api/webhook/stripe` — [booking-checkout-feature.md](booking-checkout-feature.md). Other gateways' webhooks go in `/api/webhooks/<provider>` |
| AI assistant | **Google Gemini** (`@google/genai`, free-tier `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` fallback, override with `GEMINI_MODEL`), JSON-schema output, `POST /api/assistant/chat` — [ai-assistant-feature.md](ai-assistant-feature.md) |
| Analytics | GA4 via `@next/third-parties`, production only |
| Tests | Node built-in test runner |
| Deploy | Docker (node:22-alpine) → VPS via GitHub Actions |
