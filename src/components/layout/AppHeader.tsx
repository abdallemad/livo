import Image from "next/image"
import Link from "next/link"
import { MARKETING_NAV } from "@/constants/nav"
import { SITE_LOGO, SITE_NAME } from "@/constants/site"
import { AccountControls } from "./AccountControls"
import { MobileMenu } from "./MobileMenu"
import { ThemeToggle } from "./ThemeToggle"

/**
 * Marketing header (docs/DESIGN-SYSTEM.md §7): logo at start, nav, account
 * island at end. Static; only MobileMenu / ThemeToggle / AccountControls are
 * client islands. Nav links are real <a> elements in the cached HTML.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 md:gap-8 md:px-6">
        <MobileMenu />
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Image src={SITE_LOGO} alt="" width={32} height={32} />
          {SITE_NAME}
        </Link>
        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 md:flex">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-11 items-center rounded-md px-3 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <ThemeToggle />
          <AccountControls />
        </div>
      </div>
    </header>
  )
}
