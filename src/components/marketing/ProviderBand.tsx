import Link from "next/link"
import { BadgeCheck, HandCoins, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PROVIDER_BAND } from "@/constants/trust"
import { StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { SectionHeading } from "./SectionHeading"

const ICONS = [Inbox, HandCoins, BadgeCheck]

/** Wavy top/bottom edge of the band (website `.joinb::before`). */
const WAVE_MASK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 600' preserveAspectRatio='none'%3E%3Cpath d='M0 34 C240 0 480 68 720 34 S1200 0 1440 34 V566 C1200 600 960 532 720 566 S240 600 0 566Z'/%3E%3C/svg%3E")`

/**
 * Provider recruitment band (docs/landing-page.md §11): three real benefits and "Join as a provider". Styled as the
 * website's join band — a lavender → blush wave (an SVG mask on a background layer only, so content is never masked).
 */
export function ProviderBand() {
  return (
    <section aria-labelledby="providers-band-title" className="defer-render relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f1e8ff,#ffe8ee)] dark:bg-[linear-gradient(180deg,#160c3a,#2a0c2a)]"
        style={{ maskImage: WAVE_MASK, WebkitMaskImage: WAVE_MASK, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
      />
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <SectionHeading id="providers-band-title" ghost="Join" title={PROVIDER_BAND.title} className="mb-8" />
        <StaggerList className="grid gap-6 sm:grid-cols-3">
          {PROVIDER_BAND.benefits.map((b, i) => {
            const Icon = ICONS[i] ?? BadgeCheck
            return (
              <StaggerItem key={b.title} className="flex flex-col items-center text-center">
                <span className="mb-4 flex size-20 items-center justify-center rounded-full bg-brand-gradient text-white shadow-[0_22px_34px_-16px_rgb(196_43_155/0.6),inset_0_0_0_5px_rgb(255_255_255/0.3)]">
                  <Icon className="size-8" aria-hidden />
                </span>
                <p className="font-heading text-lg font-semibold">{b.title}</p>
                <p className="mt-1 max-w-xs text-[15px] text-muted-foreground">{b.body}</p>
              </StaggerItem>
            )
          })}
        </StaggerList>
        <div className="mt-10 flex justify-center">
          <Button size="lg" render={<Link href="/become-provider" />}>
            {PROVIDER_BAND.cta}
          </Button>
        </div>
      </div>
    </section>
  )
}
