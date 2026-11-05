import { createElement } from "react"
import type { HelpIconKey } from "@/constants/help"
import { cn } from "@/lib/utils"
import { StaggerItem, StaggerList } from "@/components/motion/Reveal"
import { HELP_ICONS } from "./help-icons"

/**
 * Vertical numbered timeline (docs/help-pages-feature.md): a gradient / navy disc per step joined by a dashed rail,
 * title + body beside it. An `<ol>`, so screen readers announce the order. Needs `MotionProvider`.
 */
export function StepTimeline({
  steps,
  className,
}: {
  steps: readonly { title: string; body: string; icon?: HelpIconKey }[]
  className?: string
}) {
  return (
    <StaggerList as="ol" className={cn("relative space-y-6", className)}>
      {steps.map((step, i) => (
        <StaggerItem key={step.title} className="relative flex gap-4 md:gap-5">
          {i < steps.length - 1 ? (
            <span aria-hidden className="absolute start-6 top-14 bottom-[-1.5rem] w-0 border-s-2 border-dashed border-violet/25 md:start-7" />
          ) : null}
          <span
            aria-hidden
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center rounded-full font-heading text-lg font-bold text-white shadow-[0_18px_28px_-14px_rgb(196_43_155/0.6),inset_0_0_0_4px_rgb(255_255_255/0.25)] md:size-14",
              i % 2 === 0 ? "bg-brand-gradient" : "bg-brand-navy",
            )}
          >
            {step.icon ? createElement(HELP_ICONS[step.icon], { className: "size-5 md:size-6" }) : i + 1}
          </span>
          <div className="min-w-0 flex-1 rounded-3xl border bg-card p-4 shadow-soft md:p-5">
            <p className="text-xs font-semibold tracking-wider text-coral uppercase">Step {i + 1}</p>
            <p className="mt-0.5 font-heading text-lg font-semibold">{step.title}</p>
            <p className="mt-1 text-[15px] text-muted-foreground">{step.body}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerList>
  )
}
