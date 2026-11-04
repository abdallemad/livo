import Link from "next/link"
import { MessageCircle, Phone } from "lucide-react"
import { FOOTER_NAV } from "@/constants/nav"
import { BrandWordmark } from "@/components/shared/brand-logo"
import { SITE_DESCRIPTION, SITE_NAME, SOCIAL_LINKS, SUPPORT_PHONE, SUPPORT_WHATSAPP } from "@/constants/site"

/**
 * Marketing footer (docs/landing-page.md §13), styled as the website's navy footer with the brand-gradient top bar.
 * Static — the year is computed at build/regeneration time (the layout revalidates hourly). Support phone / WhatsApp
 * and social links come from `constants/site.ts` and render only once they're filled in (they're TODO placeholders
 * until launch) — never a made-up number.
 */
export function AppFooter() {
  return (
    <footer className="relative mt-[clamp(30px,4vw,60px)] bg-[linear-gradient(180deg,#04123a,#030b24)] text-[15px] text-[#c9cee8]">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-brand-gradient" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 pb-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-6">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center rounded-md focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none">
            <BrandWordmark height={52} tone="onDark" />
          </Link>
          <p className="max-w-xs">{SITE_DESCRIPTION}</p>
          {SUPPORT_PHONE || SUPPORT_WHATSAPP ? (
            <ul className="space-y-2">
              {SUPPORT_PHONE ? (
                <li>
                  <a
                    href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center gap-2.5 rounded-full bg-brand-gradient px-5 py-3 font-semibold text-white shadow-[0_18px_30px_-16px_rgb(255_61_90/0.8)] transition-transform hover:-translate-y-0.5"
                  >
                    <Phone className="size-4" aria-hidden />
                    <bdi dir="ltr">{SUPPORT_PHONE}</bdi>
                  </a>
                </li>
              ) : null}
              {SUPPORT_WHATSAPP ? (
                <li>
                  <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-9 items-center gap-2 transition-colors hover:text-white">
                    <MessageCircle className="size-4" aria-hidden />
                    WhatsApp support
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
        {FOOTER_NAV.map((group) => (
          <nav key={group.label} aria-label={group.label} className="space-y-3">
            <p className="font-heading text-[15px] font-semibold tracking-[0.02em] text-white">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-9 items-center transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/14">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-[13.5px] text-[#9ca4c8] md:px-6">
          <p>
            © <span className="tabular-nums">{new Date().getFullYear()}</span> {SITE_NAME}
          </p>
          {SOCIAL_LINKS.length ? (
            <ul className="flex flex-wrap gap-2" aria-label="Social media">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-flex h-9 items-center rounded-full bg-white/10 px-4 text-white transition-[background,transform] hover:-translate-y-0.5 hover:bg-brand-gradient"
                  >
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
