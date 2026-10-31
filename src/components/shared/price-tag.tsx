import { formatPrice } from "@/utils/format"
import { cn } from "@/lib/utils"

interface PriceTagProps {
  amount: number | string
  /** `fixed` = سعر ثابت, `from` = يبدأ من, none = just the amount. */
  kind?: "fixed" | "from"
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE = { sm: "text-base", md: "text-xl", lg: "text-3xl" } as const

export function PriceTag({ amount, kind, size = "md", className }: PriceTagProps) {
  return (
    <span className={cn("inline-flex flex-col gap-0.5", className)}>
      {kind ? (
        <span className="text-xs text-muted-foreground">{kind === "fixed" ? "سعر ثابت" : "يبدأ من"}</span>
      ) : null}
      <span className={cn("font-heading font-semibold tabular-nums", SIZE[size])}>{formatPrice(amount)}</span>
    </span>
  )
}
