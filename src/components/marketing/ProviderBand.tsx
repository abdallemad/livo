import Link from "next/link"
import { BadgeCheck, HandCoins, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PROVIDER_BAND } from "@/constants/trust"

const ICONS = [Inbox, HandCoins, BadgeCheck]

/** Provider recruitment band (docs/landing-page.md §11): three real benefits and "Join as a provider". */
export function ProviderBand() {
  return (
    <section aria-labelledby="providers-band-title" className="defer-render bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1fr_auto] md:items-center md:px-6">
        <div className="space-y-6">
          <h2 id="providers-band-title" className="text-2xl font-semibold md:text-3xl">
            {PROVIDER_BAND.title}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {PROVIDER_BAND.benefits.map((b, i) => {
              const Icon = ICONS[i] ?? BadgeCheck
              return (
                <li key={b.title} className="space-y-1">
                  <Icon className="size-6 text-primary" aria-hidden />
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                </li>
              )
            })}
          </ul>
        </div>
        <Button size="lg" render={<Link href="/become-provider" />}>
          {PROVIDER_BAND.cta}
        </Button>
      </div>
    </section>
  )
}
