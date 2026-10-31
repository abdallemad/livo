/**
 * Applies pending additive SQL migrations (prisma/sql) before `next build`,
 * so the build can prerender DB-driven pages (CLAUDE.md §6, §10).
 *
 * - Every file must be idempotent (IF NOT EXISTS / duplicate_object guards).
 * - Uses DIRECT_URL when it points at the SAME database as DATABASE_URL;
 *   otherwise refuses. A pooler URL on 6543 is rewritten to the session port 5432.
 * - Without DATABASE_URL it skips locally but fails in CI.
 */
const { execFileSync } = require("node:child_process")
const path = require("node:path")
const fs = require("node:fs")

// Order matters. Append new files; never edit or remove applied ones.
// (2026-10-31-init.sql was replaced by the baseline pre-launch; it never reached a real database.)
const migrationFiles = ["2026-11-01-schema-baseline.sql", "2026-11-01-onboarding.sql"]

// Neon names the pooled endpoint `ep-xxx-pooler.<region>…` and the direct one `ep-xxx.<region>…`.
function dbIdentity(raw) {
  const url = new URL(raw)
  return `${url.hostname.replace(/^([^.]*)-pooler\./, "$1.")}/${url.pathname.replace(/^\//, "")}`
}

function schemaUrl() {
  const pooled = process.env.DATABASE_URL?.trim()
  const direct = process.env.DIRECT_URL?.trim()
  if (!pooled) return null

  if (direct) {
    if (dbIdentity(direct) !== dbIdentity(pooled)) {
      throw new Error("[prebuild-db] DIRECT_URL points at a different database than DATABASE_URL — refusing.")
    }
    return direct
  }

  const url = new URL(pooled)
  if (url.port === "6543") url.port = "5432"
  url.searchParams.delete("pgbouncer")
  url.searchParams.delete("connection_limit")
  url.searchParams.delete("pool_timeout")
  return url.toString()
}

function main() {
  const url = schemaUrl()
  if (!url) {
    if (process.env.CI) throw new Error("[prebuild-db] DATABASE_URL is required in CI.")
    console.warn("[prebuild-db] DATABASE_URL not set — skipping migrations (local build only).")
    return
  }

  // Run the CLI's JS entry with node, never through a shell: on Windows `prisma.cmd` needs
  // `shell: true`, and cmd.exe splits the URL at `&` (e.g. `?sslmode=require&channel_binding=…`).
  const prismaCli = path.join(__dirname, "..", "node_modules", "prisma", "build", "index.js")
  for (const file of migrationFiles) {
    const fullPath = path.join(__dirname, "..", "prisma", "sql", file)
    if (!fs.existsSync(fullPath)) throw new Error(`[prebuild-db] missing migration ${file}`)
    console.log(`[prebuild-db] applying ${file}`)
    try {
      execFileSync(process.execPath, [prismaCli, "db", "execute", "--file", fullPath, "--url", url], { stdio: "inherit" })
    } catch {
      // The default error repeats the argv, which contains the DB password.
      throw new Error(`[prebuild-db] ${file} failed (see the Prisma output above).`)
    }
  }
}

module.exports = { migrationFiles }

if (require.main === module) main()
