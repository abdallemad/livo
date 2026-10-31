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
  DRAFT: { label: "مسودة", variant: "neutral", icon: FileEdit },
  OPEN: { label: "مفتوح", variant: "info", icon: CircleDot },
  QUOTES_RECEIVED: { label: "وصلت عروض", variant: "info", icon: MessageSquareQuote },
  ACCEPTED: { label: "تم القبول", variant: "primary", icon: Handshake },
  PAID: { label: "الدفع محجوز", variant: "primary", icon: ShieldCheck },
  IN_PROGRESS: { label: "قيد التنفيذ", variant: "warning", icon: Wrench },
  COMPLETED: { label: "مكتمل", variant: "success", icon: CheckCircle2 },
  REVIEWED: { label: "تم التقييم", variant: "success", icon: Star },
  CLOSED: { label: "مغلق", variant: "neutral", icon: Archive },
  CANCELLED: { label: "ملغي", variant: "destructive", icon: XCircle },
  DISPUTED: { label: "نزاع", variant: "destructive", icon: AlertTriangle },
  EXPIRED: { label: "منتهي", variant: "neutral", icon: Clock },
}

export const VERIFICATION_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const VERIFICATION_STATUS: Record<VerificationStatus, StatusMeta> = {
  PENDING: { label: "قيد المراجعة", variant: "warning", icon: Clock },
  ACTIVE: { label: "مفعّل", variant: "success", icon: CheckCircle2 },
  SUSPENDED: { label: "موقوف", variant: "destructive", icon: AlertTriangle },
  REJECTED: { label: "مرفوض", variant: "destructive", icon: XCircle },
}

/** The happy path shown by `BookingTimeline` (exceptions are rendered as a final step). */
export const WORK_TIMELINE: WorkStatus[] = ["OPEN", "ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED", "REVIEWED"]
