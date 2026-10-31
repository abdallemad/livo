import Image from "next/image"
import Link from "next/link"
import { FOOTER_NAV } from "@/constants/nav"
import { SITE_DESCRIPTION, SITE_LOGO, SITE_NAME } from "@/constants/site"

/**
 * Marketing footer. Static — the year is computed at build/regeneration time
 * (the layout revalidates hourly), which is accurate enough for a copyright line.
 */
export function AppFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Image src={SITE_LOGO} alt="" width={28} height={28} />
            {SITE_NAME}
          </Link>
          <p className="text-sm text-muted-foreground">{SITE_DESCRIPTION}</p>
        </div>
        {FOOTER_NAV.map((group) => (
          <nav key={group.label} aria-label={group.label} className="space-y-2">
            <p className="font-heading font-semibold">{group.label}</p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-9 items-center text-sm text-muted-foreground hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-sm text-muted-foreground md:px-6">
          © <span className="tabular-nums">{new Date().getFullYear()}</span> {SITE_NAME}
        </p>
      </div>
    </footer>
  )
}
