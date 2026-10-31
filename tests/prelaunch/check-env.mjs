/**
 * Pre-launch / CI env check: `node tests/prelaunch/check-env.mjs [path/to/.env]`.
 * Fails fast when a required key is missing or a production build uses
 * Clerk development keys.
 */
import { readFileSync, existsSync } from "node:fs"

const REQUIRED = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SERVER_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
]

const file = process.argv[2] ?? ".env"
const fromFile = existsSync(file)
  ? Object.fromEntries(
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.trim() && !line.trim().startsWith("#") && line.includes("="))
        .map((line) => {
          const index = line.indexOf("=")
          return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, "")]
        }),
    )
  : {}

const env = { ...fromFile, ...process.env }
const missing = REQUIRED.filter((key) => !env[key])
const problems = missing.map((key) => `missing ${key}`)

if (env.NODE_ENV === "production" && env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")) {
  problems.push("Clerk development key used for a production build (use pk_live_/sk_live_)")
}

if (problems.length) {
  console.error(`[check-env] ${problems.join("\n[check-env] ")}`)
  process.exit(1)
}
console.log("[check-env] ok")
