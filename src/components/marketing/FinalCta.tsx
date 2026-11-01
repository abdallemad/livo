import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FINAL_CTA, HERO } from "@/constants/trust"

/** Final CTA band (docs/landing-page.md §12): repeats the primary action. The page's second (and last) amber button. */
export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="defer-render">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-12">
          <div className="space-y-1">
            <h2 id="final-cta-title" className="text-2xl font-semibold md:text-3xl">
              {FINAL_CTA.title}
            </h2>
            <p className="opacity-90">{FINAL_CTA.body}</p>
          </div>
          <Button size="lg" variant="commit" render={<Link href="/services" />}>
            {HERO.primaryCta}
          </Button>
        </div>
      </div>
    </section>
  )
}
