import Link from "next/link"
import { ArrowRight, CircleHelp, MessagesSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HELP_CTA } from "@/constants/help"
import { Reveal } from "@/components/motion/Reveal"

/**
 * "Still have a question?" band closing every Help page (docs/help-pages-feature.md): navy card, coral glow, links to
 * the FAQ and the contact page. No commit (gradient) button — nothing is being booked here. Needs `MotionProvider`.
 */
export function HelpCta({ hideFaq = false, hideContact = false }: { hideFaq?: boolean; hideContact?: boolean }) {
  return (
    <section aria-labelledby="help-cta-title" className="defer-render">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <Reveal scale>
          <div className="relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-[36px] bg-[linear-gradient(120deg,#04123a,#0a1f5c_60%,#3a1a8a)] p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
            <span aria-hidden className="absolute -end-[10%] -top-[60%] -z-10 aspect-square w-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_61_90/0.35),transparent_65%)]" />
            <div className="max-w-xl">
              <h2 id="help-cta-title" className="text-[clamp(22px,3vw,34px)] font-bold tracking-tight text-white">
                {HELP_CTA.title}
              </h2>
              <p className="mt-2 text-[#c9cee8]">{HELP_CTA.body}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hideFaq ? null : (
                <Button size="lg" variant="outline" className="border-white/70 bg-transparent text-white hover:bg-white/10" render={<Link href="/faq" />}>
                  <CircleHelp data-icon="inline-start" aria-hidden />
                  Read the FAQ
                </Button>
              )}
              {hideContact ? null : (
                <Button size="lg" className="bg-white text-navy hover:bg-white/90" render={<Link href="/contact" />}>
                  <MessagesSquare data-icon="inline-start" aria-hidden />
                  Contact us
                  <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
