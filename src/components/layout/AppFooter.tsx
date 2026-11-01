import Image from "next/image"
import Link from "next/link"
import { MessageCircle, Phone } from "lucide-react"
import { FOOTER_NAV } from "@/constants/nav"
import { SITE_DESCRIPTION, SITE_LOGO, SITE_NAME, SOCIAL_LINKS, SUPPORT_PHONE, SUPPORT_WHATSAPP } from "@/constants/site"

/**
 * Marketing footer (docs/landing-page.md §13). Static — the year is computed at build/regeneration time (the layout
 * revalidates hourly). Support phone / WhatsApp and social links come from `constants/site.ts` and render only once
 * they're filled in (they're TODO placeholders until launch) — never a made-up number.
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
          {SUPPORT_PHONE || SUPPORT_WHATSAPP ? (
            <ul className="space-y-1 text-sm">
              {SUPPORT_PHONE ? (
                <li>
                  <a href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-9 items-center gap-2 hover:underline">
                    <Phone className="size-4" aria-hidden />
                    <bdi dir="ltr">{SUPPORT_PHONE}</bdi>
                  </a>
                </li>
              ) : null}
              {SUPPORT_WHATSAPP ? (
                <li>
                  <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-9 items-center gap-2 hover:underline">
                    <MessageCircle className="size-4" aria-hidden />
                    WhatsApp support
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-muted-foreground md:px-6">
          <p>
            © <span className="tabular-nums">{new Date().getFullYear()}</span> {SITE_NAME}
          </p>
          {SOCIAL_LINKS.length ? (
            <ul className="flex flex-wrap gap-4" aria-label="Social media">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener noreferrer" target="_blank" className="hover:text-foreground hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
