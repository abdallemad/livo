import { ArrowDown, ArrowRight } from "lucide-react"
import { MONEY_FLOW } from "@/constants/trust"
import { Reveal } from "@/components/motion/Reveal"
import { SectionHeading } from "./SectionHeading"

/**
 * "Where your money is" (docs/landing-page.md §9): a static five-step timeline — plain markup, no chart library.
 * Horizontal from `md` up, vertical on phones. The footnote limits the promise to online payments.
 */
export function MoneyFlow() {
  return (
    <section aria-labelledby="money-title" className="defer-render">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6 md:py-20">
        <SectionHeading id="money-title" ghost="Payments" title={MONEY_FLOW.title} className="mb-8" />
        <Reveal>
          <ol className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
            {MONEY_FLOW.steps.map((step, i) => (
              <li key={step} className="contents">
                <span className={`flex flex-1 items-center gap-3 rounded-3xl border p-4 shadow-soft ${i === 1 ? "border-transparent bg-brand-navy font-semibold text-white" : "bg-card"}`}>
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold tabular-nums ${i === 1 ? "bg-white text-navy" : "bg-brand-gradient text-white"}`} aria-hidden>
                    {i + 1}
                  </span>
                  {step}
                </span>
                {i < MONEY_FLOW.steps.length - 1 ? (
                  <span className="flex justify-center text-coral" aria-hidden>
                    <ArrowDown className="size-5 md:hidden" />
                    <ArrowRight className="hidden size-5 md:block rtl:-scale-x-100" />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Reveal>
        <p className="text-center text-sm text-muted-foreground">{MONEY_FLOW.footnote}</p>
      </div>
    </section>
  )
}
