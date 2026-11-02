"use client"

import Link from "next/link"
import type { NotificationType } from "@prisma/client"
import { BadgeCheck, Bell, CalendarCheck, CalendarClock, ClipboardList, CreditCard, Handshake, MessageSquare, MessageSquareQuote, ShieldAlert, Star, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotificationDto } from "@/types/notification"
import { formatZonedDateTime } from "@/utils/zoned-time"

const ICON: Record<NotificationType, typeof Bell> = {
  NEW_REQUEST_MATCH: ClipboardList,
  QUOTE_RECEIVED: MessageSquareQuote,
  QUOTE_ACCEPTED: Handshake,
  BOOKING_CREATED: CalendarClock,
  BOOKING_CONFIRMED: CalendarCheck,
  BOOKING_STATUS_CHANGED: CalendarClock,
  PAYMENT_UPDATE: CreditCard,
  NEW_MESSAGE: MessageSquare,
  REVIEW_RECEIVED: Star,
  PROVIDER_DECISION: BadgeCheck,
  DISPUTE_UPDATE: ShieldAlert,
  PAYOUT_UPDATE: Wallet,
  SYSTEM: Bell,
}

/** One notification: icon by type, title, body, time (Cairo), unread dot. Opening it marks it read (`onOpen`). */
export function NotificationItem({ n, onOpen, compact = false }: { n: NotificationDto; onOpen: (n: NotificationDto) => void; compact?: boolean }) {
  const Icon = ICON[n.type]
  const unread = !n.readAt
  return (
    <Link
      href={n.href}
      onClick={() => onOpen(n)}
      className={cn("flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", unread && "bg-primary/5")}
    >
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", unread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", unread ? "font-semibold" : "font-medium")}>
          {n.title}
          {unread ? <span className="sr-only"> (unread)</span> : null}
        </span>
        {n.body ? <span className={cn("block text-sm text-muted-foreground", compact && "line-clamp-2")}>{n.body}</span> : null}
        <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">{formatZonedDateTime(n.createdAt)}</span>
      </span>
      {unread ? <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary" /> : null}
    </Link>
  )
}
