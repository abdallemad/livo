import { ArrowDown, ArrowRight } from "lucide-react"
import { MONEY_FLOW } from "@/constants/trust"

/**
 * "Where your money is" (docs/landing-page.md §9): a static five-step timeline — plain markup, no chart library.
 * Horizontal from `md` up, vertical on phones. The footnote limits the promise to online payments.
 */
export function MoneyFlow() {
  return (
    <section aria-labelledby="money-title" className="defer-render">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6">
        <h2 id="money-title" className="text-2xl font-semibold md:text-3xl">
          {MONEY_FLOW.title}
        </h2>
        <ol className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          {MONEY_FLOW.steps.map((step, i) => (
            <li key={step} className="contents">
              <span className={`flex flex-1 items-center gap-3 rounded-xl border p-4 ${i === 1 ? "border-primary bg-primary/8 font-semibold" : "bg-card"}`}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums" aria-hidden>
                  {i + 1}
                </span>
                {step}
              </span>
              {i < MONEY_FLOW.steps.length - 1 ? (
                <span className="flex justify-center text-muted-foreground" aria-hidden>
                  <ArrowDown className="size-5 md:hidden" />
                  <ArrowRight className="hidden size-5 md:block rtl:-scale-x-100" />
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">{MONEY_FLOW.footnote}</p>
      </div>
    </section>
  )
}
