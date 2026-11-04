import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FINAL_CTA, HERO } from "@/constants/trust"
import { AnimatedTitle } from "@/components/motion/AnimatedTitle"
import { Reveal } from "@/components/motion/Reveal"

/**
 * Final CTA band (docs/landing-page.md §12): repeats the primary action. The website's navy end card with a coral
 * glow; the page's second (and last) gradient commit button.
 */
export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="defer-render">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <Reveal scale>
          <div className="relative isolate overflow-hidden rounded-[36px] bg-[linear-gradient(120deg,#04123a,#0a1f5c_60%,#3a1a8a)] px-6 py-12 text-center text-white md:px-10 md:py-16">
            <span aria-hidden className="absolute -end-[10%] -top-[40%] -z-10 aspect-square w-3/5 rounded-full bg-[radial-gradient(circle,rgb(255_61_90/0.35),transparent_65%)]" />
            <AnimatedTitle id="final-cta-title" className="mx-auto max-w-3xl text-[clamp(24px,3.8vw,46px)] font-bold tracking-tight text-white" text={FINAL_CTA.title} />
            <p className="mx-auto mt-3 mb-7 max-w-xl text-[#c9cee8]">{FINAL_CTA.body}</p>
            <Button size="lg" variant="commit" render={<Link href="/services" />}>
              {HERO.primaryCta}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
