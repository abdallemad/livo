import { ArrowDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A short step-by-step flow ("You pay → … → Provider is paid"), horizontal from `md`, vertical on phones. The step
 * at `highlight` is the navy "held by Livo" pill. Plain markup — the generic form of the landing `MoneyFlow`.
 */
export function FlowSteps({ steps, highlight = 1, className }: { steps: readonly string[]; highlight?: number; className?: string }) {
  return (
    <ol className={cn("flex flex-col items-stretch gap-2 md:flex-row md:items-center", className)}>
      {steps.map((step, i) => (
        <li key={step} className="contents">
          <span
            className={cn(
              "flex flex-1 items-center gap-3 rounded-3xl border p-4 text-[15px] shadow-soft",
              i === highlight ? "border-transparent bg-brand-navy font-semibold text-white" : "bg-card",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold tabular-nums",
                i === highlight ? "bg-white text-navy" : "bg-brand-gradient text-white",
              )}
            >
              {i + 1}
            </span>
            {step}
          </span>
          {i < steps.length - 1 ? (
            <span className="flex justify-center text-coral" aria-hidden>
              <ArrowDown className="size-5 md:hidden" />
              <ArrowRight className="hidden size-5 md:block rtl:-scale-x-100" />
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
