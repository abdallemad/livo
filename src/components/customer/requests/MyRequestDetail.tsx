"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Banknote, BriefcaseBusiness, CalendarDays, Clock, CreditCard, Lock, MapPin, Wallet } from "lucide-react"
import { toast } from "sonner"
import { BookingStatusBadge, BookingTimeline, ConfirmDialog, MetaBadge, PageHeader, RatingStars } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { WORK_STATUS } from "@/constants/status"
import { useAcceptQuote, useCancelMyRequest, useMyRequest } from "@/hooks/use-customer"
import { cn } from "@/lib/utils"
import type { CustomerQuoteDto, CustomerRequestDetail } from "@/types/customer"
import type { BookingPaymentMethod } from "@/utils/booking-checkout"
import { QUOTE_SORTS, sortQuotes, type QuoteSort } from "@/utils/customer-request"
import { formatDate, formatDateTime, formatNumber, formatPrice } from "@/utils/format"

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
const SORT_LABEL: Record<QuoteSort, string> = { price: "Lowest price", rating: "Best rated", newest: "Newest" }
const QUOTE_STATUS_LABEL: Record<CustomerQuoteDto["status"], string> = { PENDING: "Waiting", ACCEPTED: "Accepted", REJECTED: "Not chosen", WITHDRAWN: "Withdrawn", EXPIRED: "Expired" }

function AcceptQuoteDialog({ requestId, quote, onlineAvailable }: { requestId: string; quote: CustomerQuoteDto; onlineAvailable: boolean }) {
  const router = useRouter()
  const accept = useAcceptQuote(requestId)
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<BookingPaymentMethod>(onlineAvailable ? "ONLINE" : "CASH")
  const [leaving, setLeaving] = useState(false)
  const busy = accept.isPending || leaving

  const submit = () =>
    accept.mutate(
      { quoteId: quote.id, paymentMethod: method },
      {
        onSuccess: (r) => {
          setLeaving(true)
          if (r.checkoutUrl) {
            window.location.assign(r.checkoutUrl)
            return
          }
          if (r.paymentError) toast.error("Quote accepted, but the payment page didn't open. Use Pay now on the booking.")
          else toast.success(`Booking ${r.number} sent to ${quote.provider.name}`)
          router.push(`/account/bookings/${r.bookingId}`)
        },
        onError: (e) => toast.error(e.message),
      },
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="commit">Accept this quote</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Accept {quote.provider.name}&apos;s quote of {formatPrice(quote.price)}?
          </DialogTitle>
          <DialogDescription>This books the job. The other quotes are declined, and you agree the date with the provider once they accept.</DialogDescription>
        </DialogHeader>
        <div role="radiogroup" aria-label="Payment" className="grid gap-3">
          {(
            [
              { id: "ONLINE", icon: CreditCard, title: "Pay online now", body: "Card payment on Stripe's secure page. Livo holds it until you confirm the job is done.", available: onlineAvailable },
              { id: "CASH", icon: Banknote, title: "Cash after the job", body: "Pay the provider in cash when the work is finished.", available: true },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              disabled={!m.available}
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex gap-3 rounded-xl border p-3 text-start transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                method === m.id ? "border-primary ring-1 ring-primary" : "hover:bg-muted",
              )}
            >
              <m.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-medium">{m.title}</span>
                <span className="text-sm text-muted-foreground">{m.available ? m.body : "Not available right now."}</span>
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Not yet</DialogClose>
          <Button variant="commit" onClick={submit} disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            {method === "ONLINE" ? "Accept and pay" : "Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QuoteCard({ q, requestId, onlineAvailable }: { q: CustomerQuoteDto; requestId: string; onlineAvailable: boolean }) {
  const p = q.provider
  const waiting = q.status === "PENDING"
  return (
    <Card className={cn("gap-3", q.status === "ACCEPTED" && "border-primary", !waiting && q.status !== "ACCEPTED" && "opacity-70")}>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Link href={`/providers/${p.id}`} className="flex items-center gap-3 hover:underline">
            <Avatar className="size-11">
              {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt="" /> : null}
              <AvatarFallback>{initials(p.name)}</AvatarFallback>
            </Avatar>
            <span>
              <span className="block font-semibold">{p.name}</span>
              {p.reviewsCount ? <RatingStars value={p.rating} count={p.reviewsCount} /> : <span className="text-sm text-muted-foreground">No reviews yet</span>}
            </span>
          </Link>
          <div className="text-end">
            <p className="font-heading text-2xl font-semibold tabular-nums">
              <bdi dir="ltr">{formatPrice(q.price)}</bdi>
            </p>
            <div className="flex flex-wrap justify-end gap-1.5">
              {q.isLowest ? <Badge variant="secondary">Lowest price</Badge> : null}
              <Badge variant={q.status === "ACCEPTED" ? "default" : "outline"}>{QUOTE_STATUS_LABEL[q.status]}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <li className="flex items-center gap-1">
            <Clock className="size-4" aria-hidden />
            {q.durationDays ? `${formatNumber(q.durationDays)} ${q.durationDays === 1 ? "day" : "days"}` : "Duration not given"}
          </li>
          <li className="flex items-center gap-1">
            <BriefcaseBusiness className="size-4" aria-hidden />
            {formatNumber(p.completedCount)} jobs done{p.yearsExperience ? ` · ${formatNumber(p.yearsExperience)} years' experience` : ""}
          </li>
          {q.validUntil && waiting ? <li>Valid until {formatDate(q.validUntil)}</li> : null}
        </ul>
        {q.message ? (
          <div>
            <p className="whitespace-pre-line">{q.message}</p>
            {q.messageMasked ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="size-3" aria-hidden />
                Contact details are hidden until you book.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
      {waiting ? (
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Sent {formatDateTime(q.createdAt)}</span>
          {q.acceptBlockedReason ? <span className="text-sm text-muted-foreground">{q.acceptBlockedReason}</span> : <AcceptQuoteDialog requestId={requestId} quote={q} onlineAvailable={onlineAvailable} />}
        </CardFooter>
      ) : null}
    </Card>
  )
}

/**
 * `/account/requests/[id]` (CU-04, CU-05, CU-08, CU-11; docs/customer-request-detail-feature.md): the request's stage,
 * what was asked, and the quotes to compare — price, duration, the provider's rating, finished jobs and experience;
 * sorted by price, rating or date. Accepting one books it (cash, or Stripe Checkout). Draft / open requests can be cancelled.
 */
export function MyRequestDetail({ initialData }: { initialData: CustomerRequestDetail }) {
  const { data: r } = useMyRequest(initialData.id, initialData)
  const cancel = useCancelMyRequest()
  const [sort, setSort] = useState<QuoteSort>("price")
  const quotes = sortQuotes(r.quotes, sort)
  const waiting = quotes.filter((q) => q.status === "PENDING")
  const others = quotes.filter((q) => q.status !== "PENDING")

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ms-2" render={<Link href="/account/requests" />}>
        <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
        My requests
      </Button>
      <PageHeader
        title={r.title}
        description={`${r.parentCategory ? `${r.parentCategory} › ` : ""}${r.category} · posted ${formatDate(r.createdAt)}`}
        actions={<MetaBadge meta={WORK_STATUS[r.state]} />}
      />

      {r.booking ? (
        <Alert>
          <AlertTitle className="flex flex-wrap items-center gap-2">
            Booked — booking <span className="tabular-nums">{r.booking.number}</span> <BookingStatusBadge status={r.booking.status} />
          </AlertTitle>
          <AlertDescription className="mt-2">
            <Button render={<Link href={`/account/bookings/${r.booking.id}`} />}>Open the booking</Button>
          </AlertDescription>
        </Alert>
      ) : r.status === "OPEN" && r.pendingQuotes === 0 ? (
        <Alert>
          <Clock aria-hidden />
          <AlertTitle>Waiting for quotes</AlertTitle>
          <AlertDescription>
            Matching providers were told about your request. Quotes appear here
            {r.expiresInDays !== null && r.expiresInDays >= 0 ? `; the request stays open for ${r.expiresInDays === 0 ? "today" : `${formatNumber(r.expiresInDays)} more day${r.expiresInDays === 1 ? "" : "s"}`}` : ""}.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="min-w-0 space-y-4" aria-labelledby="quotes-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="quotes-title" className="text-lg font-semibold">
              Quotes <span className="font-normal text-muted-foreground tabular-nums">({formatNumber(r.quotes.length)})</span>
            </h2>
            {r.quotes.length > 1 ? (
              <div role="radiogroup" aria-label="Sort quotes" className="inline-flex rounded-lg border p-1">
                {QUOTE_SORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={sort === s}
                    onClick={() => setSort(s)}
                    className={cn("h-8 rounded-md px-3 text-sm transition-colors", sort === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    {SORT_LABEL[s]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {r.quotes.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">No quotes yet.</p> : null}
          {waiting.map((q) => (
            <QuoteCard key={q.id} q={q} requestId={r.id} onlineAvailable={r.onlinePaymentAvailable} />
          ))}
          {others.length ? (
            <>
              {waiting.length ? <h3 className="pt-2 text-sm font-medium text-muted-foreground">Other quotes</h3> : null}
              {others.map((q) => (
                <QuoteCard key={q.id} q={q} requestId={r.id} onlineAvailable={r.onlinePaymentAvailable} />
              ))}
            </>
          ) : null}
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingTimeline current={r.timeline.current} events={r.timeline.events.map((e) => ({ status: e.status, at: formatDateTime(e.at) }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your request</CardTitle>
              <CardDescription className="whitespace-pre-line">{r.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                {r.place ?? "No address"}
              </p>
              <p className="flex gap-2">
                <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                Budget: {r.budget !== null ? <bdi dir="ltr">{formatPrice(r.budget)}</bdi> : "not set"}
              </p>
              <p className="flex gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                Wanted on: {r.preferredDate ? formatDate(r.preferredDate) : "flexible"}
              </p>
              {r.photos.length ? (
                <ul className="grid grid-cols-3 gap-2">
                  {r.photos.map((f, i) => (
                    <li key={f.id}>
                      <a href={f.previewUrl} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- owner-only signed redirect, not optimizable */}
                        <img src={f.previewUrl} alt={`Photo ${i + 1}`} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
            {!r.cancelBlockedReason ? (
              <CardFooter>
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
              </CardFooter>
            ) : null}
          </Card>
        </aside>
      </div>
    </div>
  )
}
