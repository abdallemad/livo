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
const migrationFiles = ["2026-10-31-init.sql"]

function dbIdentity(raw) {
  const url = new URL(raw)
  return `${url.hostname.replace(/^[^.]*pooler\./, "")}/${url.pathname.replace(/^\//, "")}`
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

  const prismaBin = path.join(__dirname, "..", "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma")
  for (const file of migrationFiles) {
    const fullPath = path.join(__dirname, "..", "prisma", "sql", file)
    if (!fs.existsSync(fullPath)) throw new Error(`[prebuild-db] missing migration ${file}`)
    console.log(`[prebuild-db] applying ${file}`)
    execFileSync(prismaBin, ["db", "execute", "--file", fullPath, "--url", url], {
      stdio: "inherit",
      shell: process.platform === "win32",
    })
  }
}

module.exports = { migrationFiles }

if (require.main === module) main()
