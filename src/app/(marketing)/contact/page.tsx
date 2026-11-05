import { createElement } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Hammer, Mail, MessageCircle, Phone } from "lucide-react"
import { HELP_ICONS, HelpCta, HelpNav } from "@/components/help"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { MotionProvider } from "@/components/motion/MotionProvider"
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { CONTACT_PAGE as C } from "@/constants/help"
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from "@/constants/site"
import { pageMetadata } from "@/utils/seo-metadata"
import { breadcrumbJsonLd } from "@/utils/structured-data"

/**
 * /contact — every way to get help (docs/SITEMAP.md §2, MK-05; docs/help-pages-feature.md). STATIC.
 * Routes people to the channel that can actually act: the booking chat, the booking's "report a problem", the AI
 * assistant, the FAQ. Phone / WhatsApp / email cards render ONLY when set in `constants/site.ts` — never a made-up
 * number. No contact form yet (it would need a message store and an admin inbox).
 */
export const metadata: Metadata = pageMetadata({
  title: "Contact us",
  description: "Get help with a booking, a payment or your account — find the fastest way to reach us.",
  path: "/contact",
})

const direct = [
  SUPPORT_PHONE ? { key: "phone", Icon: Phone, label: "Call us", value: SUPPORT_PHONE, href: `tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}` } : null,
  SUPPORT_WHATSAPP ? { key: "wa", Icon: MessageCircle, label: "WhatsApp", value: `+${SUPPORT_WHATSAPP}`, href: `https://wa.me/${SUPPORT_WHATSAPP}` } : null,
  SUPPORT_EMAIL ? { key: "mail", Icon: Mail, label: "Email", value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` } : null,
].filter((d) => d !== null)

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact us", path: "/contact" },
        ])}
      />
      <MotionProvider>
        <PageHero title={C.title} ghost="Contact" lead={C.lead} />
        <HelpNav active="/contact" />

        <section aria-labelledby="channels-title" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <SectionHeading id="channels-title" ghost="Help" title="How can we help?" className="mb-8 md:mb-10" />
          <StaggerList className="grid gap-5 sm:grid-cols-2">
            {C.channels.map((ch) => {
              const body = (
                <>
                  <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow transition-transform duration-300 group-hover:scale-105">
                    {createElement(HELP_ICONS[ch.icon], { className: "size-6", "aria-hidden": true })}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-lg font-semibold">{ch.title}</span>
                    <span className="mt-1 block text-[15px] text-muted-foreground">{ch.body}</span>
                    {ch.cta ? (
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet dark:text-primary">
                        {ch.cta}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
                      </span>
                    ) : null}
                  </span>
                </>
              )
              const cls =
                "group flex h-full items-start gap-4 rounded-3xl border bg-card p-6 shadow-soft transition-[border-color,transform,box-shadow] duration-200"
              return (
                <StaggerItem key={ch.title} className="h-full">
                  {ch.href ? (
                    <Link
                      href={ch.href}
                      className={`${cls} hover:-translate-y-1 hover:border-coral hover:shadow-card focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none motion-reduce:hover:translate-y-0`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </StaggerItem>
              )
            })}
          </StaggerList>

          {direct.length ? (
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {direct.map(({ key, Icon, label, value, href }) => (
                <li key={key}>
                  <a href={href} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-colors hover:border-coral">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-navy text-white">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-xs text-muted-foreground">{label}</span>
                      <bdi dir="ltr" className="font-semibold">
                        {value}
                      </bdi>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section aria-labelledby="topics-title" className="defer-render bg-page-gradient">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-[28px] border bg-card p-7 shadow-card md:p-9">
                <h2 id="topics-title" className="font-heading text-2xl font-bold">
                  {C.topicsTitle}
                </h2>
                <ul className="mt-5 divide-y">
                  {C.topics.map((t) => (
                    <li key={t.href}>
                      <Link href={t.href} className="group flex items-center justify-between gap-3 py-3.5 font-medium transition-colors hover:text-violet dark:hover:text-primary">
                        {t.label}
                        <ArrowUpRight className="size-4 text-coral transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="relative isolate flex h-full flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#0b1150_0%,#1b1466_55%,#2c1a83_100%)] p-7 text-white shadow-card md:p-9">
                <span aria-hidden className="absolute -end-16 -bottom-16 -z-10 size-64 rounded-full bg-[radial-gradient(circle,rgb(255_61_90/0.3),transparent_65%)]" />
                <span className="flex size-13 items-center justify-center rounded-2xl bg-white text-violet">
                  <Hammer className="size-6" aria-hidden />
                </span>
                <h2 className="mt-5 font-heading text-2xl font-bold">{C.providerTitle}</h2>
                <p className="mt-2 text-white/75">{C.providerBody}</p>
                <div className="mt-auto flex flex-wrap gap-3 pt-6">
                  <Button size="lg" className="bg-white text-navy hover:bg-white/90" render={<Link href="/provider" />}>
                    Provider dashboard
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/70 bg-transparent text-white hover:bg-white/10" render={<Link href="/become-provider" />}>
                    Become a provider
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <HelpCta hideContact />
      </MotionProvider>
    </>
  )
}
