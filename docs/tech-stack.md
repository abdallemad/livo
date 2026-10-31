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
| Payments | Local Egyptian gateway — **not chosen yet** (SRS A5); webhooks go in `/api/webhooks/<provider>` |
| Analytics | GA4 via `@next/third-parties`, production only |
| Tests | Node built-in test runner |
| Deploy | Docker (node:22-alpine) → VPS via GitHub Actions |
