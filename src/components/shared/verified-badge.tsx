import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

/** "مزود موثّق" — shown on provider cards/profiles once verification is ACTIVE. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium text-primary", className)}>
      <BadgeCheck className="size-4" aria-hidden />
      مزود موثّق
    </span>
  )
}
