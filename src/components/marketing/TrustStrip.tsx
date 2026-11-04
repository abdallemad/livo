import { TRUST_STRIP } from "@/constants/trust"
import { TRUST_ICONS } from "./trust-icons"
import { StaggerItem, StaggerList } from "@/components/motion/Reveal"

/**
 * The four promises directly under the hero (docs/landing-page.md §2), styled as the website's hero strip: a white band
 * with gradient icon discs. Copy lives in `constants/trust.ts`.
 */
export function TrustStrip() {
  return (
    <section aria-label="Our promises" className="relative z-10 border-b bg-card/95">
      <StaggerList className="mx-auto grid max-w-6xl gap-3 px-4 py-5 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        {TRUST_STRIP.map((item) => {
          const Icon = TRUST_ICONS[item.icon]
          return (
            <StaggerItem key={item.label} className="flex items-center gap-3 rounded-full border bg-card py-1.5 ps-1.5 pe-4 shadow-soft">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-[inset_0_0_0_3px_rgb(255_255_255/0.35)]">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-sm leading-snug font-semibold">{item.label}</span>
            </StaggerItem>
          )
        })}
      </StaggerList>
    </section>
  )
}
