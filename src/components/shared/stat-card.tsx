import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  /** Pre-formatted value (use formatPrice/formatNumber). */
  value: string
  icon?: LucideIcon
  /** Change vs. previous period in percent, e.g. 12 or -4. */
  change?: number
  hint?: string
  className?: string
}

export function StatCard({ label, value, icon: Icon, change, hint, className }: StatCardProps) {
  const up = (change ?? 0) >= 0
  return (
    <Card className={cn("gap-2 p-4 md:p-5", className)}>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        {Icon ? <Icon className="size-4" aria-hidden /> : null}
      </div>
      <p className="font-heading text-2xl font-semibold tabular-nums md:text-3xl">{value}</p>
      {change !== undefined || hint ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {change !== undefined ? (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", up ? "text-success" : "text-destructive")}>
              {up ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
              <bdi dir="ltr" className="tabular-nums">{`${up ? "+" : ""}${change}%`}</bdi>
            </span>
          ) : null}
          {hint}
        </p>
      ) : null}
    </Card>
  )
}
