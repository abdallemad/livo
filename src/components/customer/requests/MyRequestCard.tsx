"use client"

import Link from "next/link"
import { CalendarDays, Camera, Clock, MapPin, MessageSquareQuote, Wallet } from "lucide-react"
import { toast } from "sonner"
import { BookingStatusBadge, ConfirmDialog, MetaBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { WORK_STATUS } from "@/constants/status"
import { useCancelMyRequest } from "@/hooks/use-customer"
import { cn } from "@/lib/utils"
import type { CustomerRequestCard } from "@/types/customer"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"

function closes(days: number | null) {
  if (days === null || days < 0) return null
  return days === 0 ? "Closes today" : days === 1 ? "Closes tomorrow" : `Closes in ${formatNumber(days)} days`
}

/**
 * One of the customer's quote requests (CU-13): what, where, its state in the customer's words
 * ("Quotes received"), the quotes waiting and the lowest price, the booking once a quote is accepted,
 * and the next step. `compact` drops the description (dashboard).
 */
export function MyRequestCard({ r, compact = false }: { r: CustomerRequestCard; compact?: boolean }) {
  const cancel = useCancelMyRequest()
  const href = `/account/requests/${r.id}`
  const closing = r.status === "OPEN" ? closes(r.expiresInDays) : null

  return (
    <Card className={cn("gap-3", r.state === "QUOTES_RECEIVED" && "border-primary/40")}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <MetaBadge meta={WORK_STATUS[r.state]} />
          <Badge variant="secondary">{r.parentCategory ? `${r.parentCategory} › ${r.category}` : r.category}</Badge>
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link href={href} className="hover:underline">
            {r.title}
          </Link>
        </CardTitle>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {r.area ? (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {r.area}
            </span>
          ) : null}
          <span>Posted {formatDate(r.createdAt)}</span>
          {closing ? (
            <span className="flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              {closing}
            </span>
          ) : null}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!compact ? <p className="line-clamp-2 whitespace-pre-line">{r.description}</p> : null}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquareQuote className="size-3.5" aria-hidden />
              Quotes
            </dt>
            <dd className="font-medium">
              {r.quoteCount === 0 ? "None yet" : formatNumber(r.quoteCount)}
              {r.lowestPendingPrice !== null ? (
                <span className="block text-xs font-normal text-muted-foreground">
                  from <bdi dir="ltr">{formatPrice(r.lowestPendingPrice)}</bdi>
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="size-3.5" aria-hidden />
              Your budget
            </dt>
            <dd className="font-medium tabular-nums">{r.budget !== null ? <bdi dir="ltr">{formatPrice(r.budget)}</bdi> : "Not set"}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              Wanted on
            </dt>
            <dd className="font-medium">{r.preferredDate ? formatDate(r.preferredDate) : "Flexible"}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Camera className="size-3.5" aria-hidden />
              Photos
            </dt>
            <dd className="font-medium tabular-nums">{formatNumber(r.photoCount)}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        {r.booking ? (
          <>
            <span className="flex flex-wrap items-center gap-2 text-sm">
              Booking <span className="tabular-nums">{r.booking.number}</span> <BookingStatusBadge status={r.booking.status} />
            </span>
            <Button render={<Link href={`/account/bookings/${r.booking.id}`} />}>Open the booking</Button>
          </>
        ) : (
          <>
            {!r.cancelBlockedReason && !compact ? (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" className="text-destructive" disabled={cancel.isPending}>
                    Cancel request
                  </Button>
                }
                title={`Cancel “${r.title}”?`}
                description={
                  r.pendingQuotes
                    ? `The ${r.pendingQuotes} ${r.pendingQuotes === 1 ? "quote" : "quotes"} you received will be withdrawn and the providers told. This can't be undone.`
                    : "Providers won't be able to send quotes any more. This can't be undone."
                }
                confirmLabel="Cancel request"
                cancelLabel="Keep it"
                onConfirm={() => cancel.mutate(r.id, { onSuccess: () => toast.success("Request cancelled"), onError: (e) => toast.error(e.message) })}
              />
            ) : (
              <span />
            )}
            <Button variant={r.state === "QUOTES_RECEIVED" ? "default" : "outline"} size={r.state === "QUOTES_RECEIVED" ? "lg" : "default"} render={<Link href={href} />}>
              {r.state === "QUOTES_RECEIVED" ? "Compare quotes" : r.status === "DRAFT" ? "Finish the request" : "View request"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
