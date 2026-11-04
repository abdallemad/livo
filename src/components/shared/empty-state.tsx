import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  /** ONE action that gets the user out of the empty state (§8). */
  action?: React.ReactNode
  icon?: LucideIcon
  className?: string
}

export function EmptyState({ title, description, action, icon: Icon = Inbox, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed bg-card/70 px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="font-heading text-lg font-semibold">{title}</p>
      {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
