# Livo

Home-services & construction marketplace (customers ↔ verified providers). Arabic, RTL-first.
Requirements: [`docs/srs.md`](docs/srs.md). Architecture rules: [`CLAUDE.md`](CLAUDE.md).

## Getting started

Requires Node 22.18+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL, DIRECT_URL, Clerk keys
node scripts/prebuild-db.cjs   # apply prisma/sql migrations
npm run dev
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | apply SQL migrations, `next build --webpack`, prepare standalone output |
| `npm start` | run `.next/standalone/server.js` |
| `npm run lint` | ESLint |
| `npm test` | Node test runner over `tests/` |
| `npm run warm [url]` | request every sitemap URL once after a deploy |
| `npm run check-env` | verify required env keys |
| `npm run db:seed` | seed reference data |

## Architecture in one line

`component → hook (TanStack Query) → /api route handler → service → repository → Prisma`.
See [`docs/api-conventions.md`](docs/api-conventions.md) and [`docs/folder-structure.md`](docs/folder-structure.md).
