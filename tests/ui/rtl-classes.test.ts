import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

/**
 * Direction guard (docs/DESIGN-SYSTEM.md §6.3): the UI is LTR today, but
 * components and pages must still use
 * logical utilities (`ms-` `pe-` `start-` `text-end` `border-s` …), never
 * physical ones. Run after every `npx shadcn add`.
 *
 * Allowed: `slide-in-from-left/right` under a `data-[side=…]` variant —
 * Base UI's `side` is the physical popup side, so the animation must be too.
 */
const ROOTS = ["src/components", "src/app"]
const BANNED = [
  /^-?(ml|mr|pl|pr|left|right|scroll-ml|scroll-mr|scroll-pl|scroll-pr)-/,
  /^text-(left|right)$/,
  /^(border|rounded)-(l|r|tl|tr|bl|br)(-|$)/,
  /^(slide-in|slide-out)-from-(left|right)/,
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(tsx|ts)$/.test(name) ? [path] : []
  })
}

/** Strip variant prefixes (`md:`, `data-[side=left]:`, `group-hover/x:`) → the bare utility. */
const utilityOf = (token: string) => token.replace(/^(?:(?:[^\s:[\]]|\[[^\]]*\])+:)*/, "").replace(/^!/, "")

test("no physical-direction Tailwind utilities in components or pages", () => {
  const offenders: string[] = []
  for (const root of ROOTS) {
    for (const file of files(root)) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          for (const token of line.split(/[\s"'`{}()]+/)) {
            const utility = utilityOf(token)
            if (!BANNED.some((re) => re.test(utility))) continue
            if (/^(slide-in|slide-out)-from-/.test(utility) && token.includes("data-[side=")) continue
            offenders.push(`${relative(process.cwd(), file)}:${i + 1}  ${token}`)
          }
        })
    }
  }
  assert.deepEqual(offenders, [], `Use logical utilities instead:\n${offenders.join("\n")}`)
})
