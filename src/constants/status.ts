import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleDot,
  Clock,
  FileEdit,
  Handshake,
  MessageSquareQuote,
  ShieldCheck,
  Star,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react"

/**
 * Request / booking state machine → label, badge variant and icon
 * (docs/DESIGN-SYSTEM.md §8, docs/SITEMAP.md §7). Status is never colour alone:
 * `StatusBadge` always renders the icon AND the label.
 */
export type StatusVariant = "neutral" | "info" | "primary" | "warning" | "success" | "destructive"

interface StatusMeta {
  label: string
  variant: StatusVariant
  icon: LucideIcon
}

export const WORK_STATUSES = [
  "DRAFT",
  "OPEN",
  "QUOTES_RECEIVED",
  "ACCEPTED",
  "PAID",
  "IN_PROGRESS",
  "COMPLETED",
  "REVIEWED",
  "CLOSED",
  "CANCELLED",
  "DISPUTED",
  "EXPIRED",
] as const
export type WorkStatus = (typeof WORK_STATUSES)[number]

export const WORK_STATUS: Record<WorkStatus, StatusMeta> = {
  DRAFT: { label: "Draft", variant: "neutral", icon: FileEdit },
  OPEN: { label: "Open", variant: "info", icon: CircleDot },
  QUOTES_RECEIVED: { label: "Quotes received", variant: "info", icon: MessageSquareQuote },
  ACCEPTED: { label: "Accepted", variant: "primary", icon: Handshake },
  PAID: { label: "Payment held", variant: "primary", icon: ShieldCheck },
  IN_PROGRESS: { label: "In progress", variant: "warning", icon: Wrench },
  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle2 },
  REVIEWED: { label: "Reviewed", variant: "success", icon: Star },
  CLOSED: { label: "Closed", variant: "neutral", icon: Archive },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: XCircle },
  DISPUTED: { label: "Dispute", variant: "destructive", icon: AlertTriangle },
  EXPIRED: { label: "Expired", variant: "neutral", icon: Clock },
}

export const VERIFICATION_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const VERIFICATION_STATUS: Record<VerificationStatus, StatusMeta> = {
  PENDING: { label: "Under review", variant: "warning", icon: Clock },
  ACTIVE: { label: "Active", variant: "success", icon: CheckCircle2 },
  SUSPENDED: { label: "Suspended", variant: "destructive", icon: AlertTriangle },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
}

/** The happy path shown by `BookingTimeline` (exceptions are rendered as a final step). */
export const WORK_TIMELINE: WorkStatus[] = ["OPEN", "ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED", "REVIEWED"]
