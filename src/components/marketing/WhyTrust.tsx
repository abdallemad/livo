import Link from "next/link"
import { LockKeyhole } from "lucide-react"
import { VerifiedBadge } from "@/components/shared"
import { POLICIES_PATH } from "@/constants/site"
import { WHY_TRUST } from "@/constants/trust"
import { TRUST_ICONS } from "./trust-icons"
import { StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { SectionHeading } from "./SectionHeading"

/**
 * Why trust Livo (docs/landing-page.md §5) — the page's core section, so it gets the strongest visual weight: the
 * website's navy brand band with violet / coral glows and white "why" rows. Every claim is in `constants/trust.ts` and
 * limited to what the product does. The policies link is shown only when the `policies` StaticPage is published, so it
 * never leads to a 404.
 */
export function WhyTrust({ policiesPublished }: { policiesPublished: boolean }) {
  return (
    <section
      id="trust"
      aria-labelledby="trust-title"
      className="relative isolate overflow-hidden bg-navy text-white bg-[radial-gradient(60%_90%_at_100%_0%,rgb(123_47_247/0.55),transparent_62%),radial-gradient(50%_80%_at_0%_100%,rgb(255_61_90/0.3),transparent_62%),linear-gradient(120deg,#04123a,#0a1f5c)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <SectionHeading id="trust-title" ghost="Trust" tone="onDark" title={WHY_TRUST.title} lead={WHY_TRUST.intro} className="mb-10" />
        <StaggerList className="grid gap-4 md:grid-cols-2">
          {WHY_TRUST.cards.map((card) => {
            const Icon = TRUST_ICONS[card.icon]
            return (
              <StaggerItem
                key={card.title}
                lift
                className="flex gap-5 rounded-3xl border border-transparent bg-card p-6 text-card-foreground shadow-card transition-colors hover:border-coral"
              >
                <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                  <Icon className="size-7" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                  <p className="mt-1.5 text-[15px] text-muted-foreground">{card.body}</p>
                  {card.icon === "verified" ? (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-soft px-3 py-1.5 text-xs text-muted-foreground dark:bg-muted">
                      Look for this badge: <VerifiedBadge />
                    </p>
                  ) : null}
                </div>
              </StaggerItem>
            )
          })}
        </StaggerList>
        <p className="mt-8 flex flex-wrap items-center justify-center gap-2 text-center text-base text-[#c9cee8]">
          <LockKeyhole className="size-5 shrink-0 text-coral" aria-hidden />
          <span>{WHY_TRUST.privacyNote}</span>
          {policiesPublished ? (
            <Link href={POLICIES_PATH} className="font-semibold text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {WHY_TRUST.policiesLink}
            </Link>
          ) : null}
        </p>
      </div>
    </section>
  )
}
