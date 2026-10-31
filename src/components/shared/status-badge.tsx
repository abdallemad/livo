import { Badge } from "@/components/ui/badge"
import {
  VERIFICATION_STATUS,
  WORK_STATUS,
  type VerificationStatus,
  type WorkStatus,
} from "@/constants/status"
import { cn } from "@/lib/utils"

/** Request / booking / dispute state → icon + Arabic label (never colour alone). */
export function StatusBadge({ status, className }: { status: WorkStatus; className?: string }) {
  const { label, variant, icon: Icon } = WORK_STATUS[status]
  return (
    <Badge variant={variant} className={cn(className)}>
      <Icon data-icon="inline-start" aria-hidden />
      {label}
    </Badge>
  )
}

/** Provider verification state (PR-03). */
export function VerificationBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  const { label, variant, icon: Icon } = VERIFICATION_STATUS[status]
  return (
    <Badge variant={variant} className={cn(className)}>
      <Icon data-icon="inline-start" aria-hidden />
      {label}
    </Badge>
  )
}
