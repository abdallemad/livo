import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleDot,
  Clock,
  CreditCard,
  Eye,
  Ban,
  RotateCcw,
  Trash2,
  Hourglass,
  FileEdit,
  Handshake,
  MessageSquareQuote,
  ShieldCheck,
  Star,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import type {
  BookingStatus,
  DisputeResolution,
  DisputeStatus,
  EscrowState,
  PaymentMethod,
  PaymentStatus,
  QuoteStatus,
  RequestStatus,
  Role,
  UserStatus,
  VerificationStatus as DbVerificationStatus,
} from "@prisma/client"

/**
 * Request / booking state machine → label, badge variant and icon
 * (docs/DESIGN-SYSTEM.md §8, docs/SITEMAP.md §7). Status is never colour alone:
 * `StatusBadge` always renders the icon AND the label.
 */
export type StatusVariant = "neutral" | "info" | "primary" | "warning" | "success" | "destructive"

export interface StatusMeta {
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

/** Raw `Booking.status` (DB enum) → badge, for admin tables that show the exact state. */
export const BOOKING_STATUS: Record<BookingStatus, StatusMeta> = {
  PENDING_PAYMENT: { label: "Awaiting payment", variant: "neutral", icon: CreditCard },
  PENDING_PROVIDER: { label: "Awaiting provider", variant: "info", icon: Hourglass },
  CONFIRMED: { label: "Confirmed", variant: "primary", icon: Handshake },
  IN_PROGRESS: { label: "In progress", variant: "warning", icon: Wrench },
  AWAITING_CONFIRMATION: { label: "Awaiting customer", variant: "info", icon: Clock },
  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle2 },
  CLOSED: { label: "Closed", variant: "neutral", icon: Archive },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: XCircle },
  REJECTED: { label: "Declined", variant: "destructive", icon: XCircle },
  DISPUTED: { label: "Dispute", variant: "destructive", icon: AlertTriangle },
}

/** `Dispute.status` (AD-05). */
export const DISPUTE_STATUS: Record<DisputeStatus, StatusMeta> = {
  OPEN: { label: "Open", variant: "destructive", icon: AlertTriangle },
  UNDER_REVIEW: { label: "Under review", variant: "warning", icon: Eye },
  RESOLVED: { label: "Resolved", variant: "success", icon: CheckCircle2 },
}

/** Raw `ProviderProfile.verificationStatus` (DB enum) for admin screens; DRAFT = still in the wizard. */
export const PROVIDER_STATUS: Record<DbVerificationStatus, StatusMeta> = {
  DRAFT: { label: "Incomplete", variant: "neutral", icon: FileEdit },
  PENDING: { label: "Under review", variant: "warning", icon: Clock },
  APPROVED: { label: "Active", variant: "success", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
  SUSPENDED: { label: "Suspended", variant: "destructive", icon: AlertTriangle },
}

/** `User.status` (AD-03). */
export const USER_STATUS: Record<UserStatus, StatusMeta> = {
  ACTIVE: { label: "Active", variant: "success", icon: CheckCircle2 },
  SUSPENDED: { label: "Suspended", variant: "destructive", icon: Ban },
  DELETED: { label: "Deleted", variant: "neutral", icon: Trash2 },
}

export const ROLE_LABEL: Record<Role, string> = { CUSTOMER: "Customer", PROVIDER: "Provider", ADMIN: "Admin" }

/** `ServiceRequest.status` (DB enum) for admin screens. OPEN with quotes reads "Quotes received" in the UI. */
export const REQUEST_STATUS: Record<RequestStatus, StatusMeta> = {
  DRAFT: WORK_STATUS.DRAFT,
  OPEN: WORK_STATUS.OPEN,
  ACCEPTED: { label: "Booked", variant: "primary", icon: Handshake },
  CANCELLED: WORK_STATUS.CANCELLED,
  EXPIRED: WORK_STATUS.EXPIRED,
}

/** `Quote.status`. */
export const QUOTE_STATUS: Record<QuoteStatus, StatusMeta> = {
  PENDING: { label: "Waiting", variant: "info", icon: Clock },
  ACCEPTED: { label: "Accepted", variant: "success", icon: CheckCircle2 },
  REJECTED: { label: "Not chosen", variant: "neutral", icon: XCircle },
  WITHDRAWN: { label: "Withdrawn", variant: "neutral", icon: Archive },
  EXPIRED: { label: "Expired", variant: "neutral", icon: Clock },
}

/** `Payment.status`. */
export const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  PENDING: { label: "Pending", variant: "neutral", icon: Clock },
  PAID: { label: "Paid", variant: "success", icon: CheckCircle2 },
  FAILED: { label: "Failed", variant: "destructive", icon: XCircle },
  REFUNDED: { label: "Refunded", variant: "warning", icon: RotateCcw },
  PARTIALLY_REFUNDED: { label: "Partly refunded", variant: "warning", icon: RotateCcw },
}

/** `Payment.escrowState` (BR-08). */
export const ESCROW_LABEL: Record<EscrowState, string> = {
  NONE: "No escrow",
  HELD: "Held by Livo",
  RELEASED: "Released to provider",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partly refunded",
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { ONLINE: "Online", CASH: "Cash" }

/** `Dispute.resolution` (AD-05). */
export const RESOLUTION_LABEL: Record<DisputeResolution, string> = {
  RELEASE_TO_PROVIDER: "Released to provider",
  PARTIAL_REFUND: "Partial refund",
  FULL_REFUND: "Full refund",
  NO_ACTION: "No action",
}

/** What each decision means, shown on the resolve form. */
export const RESOLUTION_HELP: Record<DisputeResolution, string> = {
  RELEASE_TO_PROVIDER: "The provider did the job: release the held payment to them.",
  PARTIAL_REFUND: "Refund part of the payment to the customer; the rest goes to the provider.",
  FULL_REFUND: "Refund everything to the customer. Anything already paid out is taken back from the provider's wallet.",
  NO_ACTION: "Close the dispute without moving money (e.g. a cash job, or the complaint isn't upheld).",
}
