"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { z, ZodType } from "zod"

type Patch = Record<string, string | number | undefined | null>

/**
 * List filters kept in the URL (`?status=APPROVED&q=ali&page=2`) so admin
 * views are shareable and survive reload. Parsed with the SAME Zod schema the
 * API route uses; an invalid URL falls back to the schema defaults.
 * Needs a `<Suspense>` boundary above it (`useSearchParams`, CLAUDE.md §4.1 rule 8).
 */
export function useUrlQuery<S extends ZodType>(schema: S) {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const search = params.toString()

  const query = useMemo(() => {
    const parsed = schema.safeParse(Object.fromEntries(new URLSearchParams(search)))
    return (parsed.success ? parsed.data : schema.parse({})) as z.output<S>
  }, [schema, search])

  /** URL for the current filters with `patch` applied. Any filter change resets to page 1. */
  function hrefWith(patch: Patch) {
    const next = new URLSearchParams(search)
    if (!("page" in patch)) next.delete("page")
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === null || value === "" || (key === "page" && Number(value) === 1)) next.delete(key)
      else next.set(key, String(value))
    }
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const setQuery = (patch: Patch) => router.replace(hrefWith(patch), { scroll: false })

  return { query, hrefWith, setQuery }
}
