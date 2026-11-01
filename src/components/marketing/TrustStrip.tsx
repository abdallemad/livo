import { TRUST_STRIP } from "@/constants/trust"
import { TRUST_ICONS } from "./trust-icons"

/** The four promises directly under the hero (docs/landing-page.md §2). Copy lives in `constants/trust.ts`. */
export function TrustStrip() {
  return (
    <section aria-label="Our promises" className="border-y bg-card">
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        {TRUST_STRIP.map((item) => {
          const Icon = TRUST_ICONS[item.icon]
          return (
            <li key={item.label} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="pt-1.5 text-sm font-medium">{item.label}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
