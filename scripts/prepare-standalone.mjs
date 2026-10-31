/**
 * Copies `.next/static` and `public/` into `.next/standalone` (Next does not)
 * and asserts the files `npm start` needs are there.
 */
import { cpSync, existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export function prepareStandalone(baseDir = root) {
  const standalone = path.join(baseDir, ".next", "standalone")
  const required = [path.join(standalone, "server.js")]

  for (const file of required) {
    if (!existsSync(file)) throw new Error(`[prepare-standalone] missing ${path.relative(baseDir, file)}`)
  }

  cpSync(path.join(baseDir, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true })
  if (existsSync(path.join(baseDir, "public"))) {
    cpSync(path.join(baseDir, "public"), path.join(standalone, "public"), { recursive: true })
  }
  console.log("[prepare-standalone] standalone output ready")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareStandalone()
