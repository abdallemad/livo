import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  /** Primary action(s), rendered at the end side. */
  actions?: React.ReactNode
  className?: string
}

/** Dashboard page anatomy step 1 (docs/DESIGN-SYSTEM.md §7): title → description → actions at end. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {description ? <p className="max-w-prose text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
