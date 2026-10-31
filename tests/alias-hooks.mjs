/**
 * Node module-resolution hooks for tests: `@/x` → `src/x`, extensionless
 * relative/alias imports → `.ts`, and `server-only` → a no-op.
 */
import { existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src")
const EXTENSIONS = [".ts", ".tsx", "/index.ts"]

function withExtension(filePath) {
  if (existsSync(filePath) && path.extname(filePath)) return filePath
  for (const ext of EXTENSIONS) if (existsSync(filePath + ext)) return filePath + ext
  return null
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true }

  if (specifier.startsWith("@/")) {
    const target = withExtension(path.join(srcRoot, specifier.slice(2)))
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true }
  }

  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL))
    const target = withExtension(path.resolve(parentDir, specifier))
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true }
  }

  return nextResolve(specifier, context)
}
