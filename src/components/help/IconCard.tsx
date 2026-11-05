import { createElement } from "react"
import type { HelpIconKey } from "@/constants/help"
import { cn } from "@/lib/utils"
import { HELP_ICONS } from "./help-icons"

/** White marketing card with a gradient icon tile — benefits, values, contact channels. Lifts and gains a coral border on hover. */
export function IconCard({
  icon,
  title,
  children,
  className,
}: {
  icon: HelpIconKey
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "group flex h-full flex-col gap-3 rounded-3xl border bg-card p-6 shadow-soft transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-coral hover:shadow-card motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <span className="flex size-13 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow transition-transform duration-300 group-hover:scale-105">
        {createElement(HELP_ICONS[icon], { className: "size-6", "aria-hidden": true })}
      </span>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <div className="text-[15px] text-muted-foreground">{children}</div>
    </div>
  )
}
