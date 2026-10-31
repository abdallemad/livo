import Image from "next/image"
import Link from "next/link"
import { MARKETING_NAV } from "@/constants/nav"
import { SITE_LOGO, SITE_NAME } from "@/constants/site"
import { AccountControls } from "./AccountControls"
import { ThemeToggle } from "./ThemeToggle"

/** Static header shell; only `AccountControls` / `ThemeToggle` are client islands. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src={SITE_LOGO} alt="" width={28} height={28} className="text-primary" />
          {SITE_NAME}
        </Link>
        <nav className="hidden gap-4 text-sm text-muted-foreground md:flex">
          {MARKETING_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle />
          <AccountControls />
        </div>
      </div>
    </header>
  )
}
