import type { NavGroup, NavLink } from "@/constants/nav"

/**
 * Header navigation (docs/navigation.md) — pure, tested. Category links come from the DB at build / regeneration time so
 * the menu never links a retired category (a hard-coded list would 404 once an admin deactivates one).
 */

/** How many categories the Services dropdown lists before "All categories". */
export const NAV_CATEGORY_LIMIT = 8

export interface ResolvedNavGroup extends Omit<NavGroup, "withCategories"> {
  /** Category links, shown as their own column. Empty when the group has none or the DB was unreachable. */
  categories: NavLink[]
}

export function buildNavGroups(groups: readonly NavGroup[], categories: { slug: string; name: string }[], limit = NAV_CATEGORY_LIMIT): ResolvedNavGroup[] {
  const links = categories.slice(0, limit).map((c) => ({ href: `/services/${c.slug}`, label: c.name }))
  return groups.map(({ withCategories, ...g }) => ({ ...g, items: [...g.items], categories: withCategories ? links : [] }))
}

/** The group containing the current page (for `aria-current` on its trigger). Longest matching href wins. */
export function activeGroupId(groups: ResolvedNavGroup[], pathname: string): string | null {
  let best: { id: string; length: number } | null = null
  for (const g of groups) {
    for (const link of [...g.items, ...g.categories]) {
      const hit = pathname === link.href || pathname.startsWith(`${link.href}/`)
      if (hit && (!best || link.href.length > best.length)) best = { id: g.id, length: link.href.length }
    }
  }
  return best?.id ?? null
}
