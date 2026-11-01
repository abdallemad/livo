import Link from "next/link"
import { LockKeyhole } from "lucide-react"
import { VerifiedBadge } from "@/components/shared"
import { POLICIES_PATH } from "@/constants/site"
import { WHY_TRUST } from "@/constants/trust"
import { TRUST_ICONS } from "./trust-icons"

/**
 * Why trust Livo (docs/landing-page.md §5) — the page's core section, so it gets the strongest visual weight. Every
 * claim is in `constants/trust.ts` and limited to what the product does (see the rules there). The policies link is
 * shown only when the `policies` StaticPage is published, so it never leads to a 404.
 */
export function WhyTrust({ policiesPublished }: { policiesPublished: boolean }) {
  return (
    <section id="trust" aria-labelledby="trust-title" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl space-y-3">
          <h2 id="trust-title" className="text-3xl font-semibold md:text-4xl">
            {WHY_TRUST.title}
          </h2>
          <p className="text-lg opacity-90">{WHY_TRUST.intro}</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {WHY_TRUST.cards.map((card) => {
            const Icon = TRUST_ICONS[card.icon]
            return (
              <li key={card.title} className="rounded-2xl bg-card p-6 text-card-foreground shadow-sm">
                <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="mt-2 text-muted-foreground">{card.body}</p>
                {card.icon === "verified" ? (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
                    Look for this badge: <VerifiedBadge />
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
        <p className="flex flex-wrap items-center gap-2 text-base">
          <LockKeyhole className="size-5 shrink-0" aria-hidden />
          <span>{WHY_TRUST.privacyNote}</span>
          {policiesPublished ? (
            <Link href={POLICIES_PATH} className="font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground">
              {WHY_TRUST.policiesLink}
            </Link>
          ) : null}
        </p>
      </div>
    </section>
  )
}
