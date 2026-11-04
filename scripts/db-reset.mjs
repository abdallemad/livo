/**
 * Wipes the database and rebuilds it from scratch: every table and enum in the `public`
 * schema is dropped, the `prisma/sql` migrations are re-applied in order, and the seed runs
 * (reference data + mock data). docs/database-reset-seed.md.
 *
 *   npm run db:reset -- --yes            → drop everything, migrate, seed
 *   npm run db:reset -- --yes --no-seed  → drop everything, migrate (empty database)
 *
 * DESTRUCTIVE: real users, bookings and payments go too, not only the `seed_` rows (for that,
 * use `npm run db:seed -- --reset`). Signed-in Clerk users get a fresh `User` row on their next
 * visit to `/auth-callback`, but lose their role and onboarding, so they go through onboarding again.
 *
 * Guards: refuses with NODE_ENV=production, and without `--yes`. The URL rules are the
 * build's (`scripts/prebuild-db.cjs`): DIRECT_URL must point at the same database as
 * DATABASE_URL, and a pooler port is swapped for the session port, because DDL through a
 * transaction pooler is unreliable.
 *
 * Tables and enums are dropped one by one instead of `DROP SCHEMA public`, so the schema keeps
 * the owner and grants the host (Neon, Supabase…) gave it.
 */
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const { schemaUrl, applyMigrations, prismaCli } = require("./prebuild-db.cjs")

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = new Set(process.argv.slice(2))

const DROP_EVERYTHING = `
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;
  FOR r IN
    SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  LOOP
    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
  END LOOP;
END $$;
`

function main() {
  if (process.env.NODE_ENV === "production") throw new Error("[db-reset] Refusing to reset with NODE_ENV=production.")

  const url = schemaUrl()
  if (!url) throw new Error("[db-reset] DATABASE_URL is not set (put it in .env or .env.local).")

  const target = new URL(url)
  const where = `${target.hostname}${target.pathname}`
  if (!args.has("--yes")) {
    console.error(`[db-reset] This DELETES EVERY ROW in ${where} (real users included).`)
    console.error("[db-reset] Re-run with --yes to confirm:  npm run db:reset -- --yes")
    process.exitCode = 1
    return
  }

  console.log(`[db-reset] dropping every table and enum in ${where}`)
  try {
    execFileSync(process.execPath, [prismaCli, "db", "execute", "--stdin", "--url", url], { input: DROP_EVERYTHING, stdio: ["pipe", "inherit", "inherit"] })
  } catch {
    // The default error repeats the argv, which contains the DB password.
    throw new Error("[db-reset] dropping the schema failed (see the Prisma output above).")
  }

  applyMigrations(url)

  if (args.has("--no-seed")) {
    console.log("[db-reset] done — empty database (seed skipped)")
    return
  }
  console.log("[db-reset] seeding")
  execFileSync(process.execPath, [path.join(root, "prisma", "seed.ts")], { stdio: "inherit", cwd: root })
  console.log("[db-reset] done")
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
