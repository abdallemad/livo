import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperProps {
  steps: string[]
  /** 0-based index of the current step. */
  current: number
  className?: string
}

/**
 * Wizard progress (booking wizard, provider onboarding — max ~5 steps).
 * Flex order follows the document direction, so it runs left→right in LTR (§6.6).
 */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <nav aria-label="Steps" className={cn("w-full min-w-0", className)}>
      <p className="mb-3 text-sm text-muted-foreground md:hidden">
        Step <span className="tabular-nums">{current + 1}</span> of <span className="tabular-nums">{steps.length}</span>:{" "}
        <span className="font-medium text-foreground">{steps[current]}</span>
      </p>
      <ol className="flex items-center gap-2">
        {steps.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-2 last:flex-initial" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn("hidden min-w-0 truncate text-sm md:inline", active ? "font-medium" : "text-muted-foreground")}>
                {label}
              </span>
              {i < steps.length - 1 ? (
                <span aria-hidden className={cn("h-0.5 flex-1 rounded-full", done ? "bg-primary" : "bg-border")} />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
