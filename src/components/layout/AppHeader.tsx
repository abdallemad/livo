import { cache } from "react"
import Link from "next/link"
import { MARKETING_NAV_GROUPS } from "@/constants/nav"
import { BrandWordmark } from "@/components/shared/brand-logo"
import { getNavCategories } from "@/services/catalog.service"
import { buildNavGroups } from "@/utils/nav"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { AccountControls } from "./AccountControls"
import { MobileMenu } from "./MobileMenu"
import { NavMenu } from "./NavMenu"
import { RealtimeNotifications } from "./RealtimeNotifications"

/**
 * Category links for the Services dropdown, read at build / ISR regeneration time (never per request — CLAUDE.md §4.1
 * rule 1). A DB outage degrades to the static links instead of failing every page.
 */
const loadNavCategories = cache(async () => {
  try {
    return await getNavCategories()
  } catch (error) {
    console.error("[nav] categories skipped (database unavailable)", error)
    return []
  }
})

/**
 * Marketing header (docs/DESIGN-SYSTEM.md §7, docs/navigation.md): logo at start, grouped hover dropdowns, account
 * island at end. Reads nothing from the request; NavMenu / MobileMenu / AccountControls are client islands, and every
 * nav link is a real <a> in the cached HTML. Dark mode lives in the account dropdown (`AccountMenu`).
 */
export async function AppHeader() {
  const groups = buildNavGroups(MARKETING_NAV_GROUPS, await loadNavCategories())
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 shadow-[0_12px_30px_-24px_rgb(4_18_58/0.55)] backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-2 px-4 md:gap-6 md:px-6">
        <MobileMenu groups={groups} />
        <Link href="/" className="flex items-center rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <BrandWordmark height={40} priority />
        </Link>
        <NavMenu groups={groups} />
        <div className="ms-auto flex items-center gap-1">
          {/* Client islands: render nothing for signed-out visitors, so this static header stays static. */}
          <RealtimeNotifications />
          <NotificationBell />
          <AccountControls />
        </div>
      </div>
    </header>
  )
}
