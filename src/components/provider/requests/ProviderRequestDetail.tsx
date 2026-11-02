"use client"

import { useState } from "react"
import Link from "next/link"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CalendarDays, Clock, Lock, MapPin, MessageSquareQuote, Send, Wallet } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { BookingStatusBadge, ConfirmDialog, PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useProviderRequest, useSendQuote, useWithdrawQuote } from "@/hooks/use-provider-workspace"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { applyApiErrors } from "@/lib/form-errors"
import { providerQuoteSchema, type ProviderQuoteInput, type ProviderQuoteValues } from "@/schemas/provider.schema"
import type { ProviderRequestDetail as Detail } from "@/types/provider"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import { QUOTE_MESSAGE_MAX, QUOTE_PRICE_MIN, QUOTE_VALID_DAYS, QUOTE_VALID_DAYS_DEFAULT } from "@/utils/provider-quote"

const FIELDS = ["price", "durationDays", "message", "validDays"] as const
const STATUS_LABEL = { PENDING: "Waiting for the customer", ACCEPTED: "Accepted", REJECTED: "Not chosen", WITHDRAWN: "Withdrawn", EXPIRED: "Expired" } as const

function closes(days: number | null) {
  if (days === null || days < 0) return null
  return days === 0 ? "Closes today" : days === 1 ? "Closes tomorrow" : `Closes in ${formatNumber(days)} days`
}

function QuoteForm({ r, onDone }: { r: Detail; onDone: () => void }) {
  const send = useSendQuote(r.id)
  const q = r.myQuote
  const form = useForm<ProviderQuoteInput, unknown, ProviderQuoteValues>({
    resolver: zodResolver(providerQuoteSchema),
    defaultValues: {
      price: q ? String(q.price) : "",
      durationDays: q?.durationDays ? String(q.durationDays) : "",
      message: q?.message ?? "",
      validDays: QUOTE_VALID_DAYS_DEFAULT,
    },
  })
  const { register, control, handleSubmit, setError, formState } = form
  const message = useWatch({ control, name: "message" }) ?? ""
  useUnsavedChanges(formState.isDirty && !send.isSuccess)
  const errors = formState.errors

  const submit = handleSubmit((values) =>
    send.mutate(values, {
      onSuccess: ({ mode }) => {
        toast.success(mode === "UPDATE" ? "Quote updated" : "Quote sent", { description: "The customer was notified." })
        onDone()
      },
      onError: (e) => applyApiErrors(e, setError, FIELDS),
    }),
  )

  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="quote-price" label="Your price (EGP)" error={errors.price?.message} helper="The full price for the job as described.">
          <Input id="quote-price" type="number" inputMode="decimal" min={QUOTE_PRICE_MIN} dir="ltr" className="h-12 text-start text-lg tabular-nums" aria-invalid={!!errors.price} aria-describedby="quote-price-msg" {...register("price")} />
        </FormField>
        <FormField id="quote-days" label="How many days?" optional error={errors.durationDays?.message} helper="How long the work takes.">
          <Input id="quote-days" type="number" inputMode="numeric" min={1} dir="ltr" className="h-12 text-start tabular-nums" aria-invalid={!!errors.durationDays} aria-describedby="quote-days-msg" {...register("durationDays")} />
        </FormField>
      </div>
      <FormField
        id="quote-message"
        label="Message to the customer"
        optional
        error={errors.message?.message}
        helper={
          <span className="flex w-full justify-between gap-3">
            <span>What&apos;s included, materials, when you can start. No phone numbers — they&apos;re shared once the customer books.</span>
            <span className="shrink-0 tabular-nums">
              {message.length}/{QUOTE_MESSAGE_MAX}
            </span>
          </span>
        }
      >
        <Textarea id="quote-message" rows={4} maxLength={QUOTE_MESSAGE_MAX} aria-invalid={!!errors.message} aria-describedby="quote-message-msg" {...register("message")} />
      </FormField>
      <FormField id="quote-valid" label="Price valid for" error={errors.validDays?.message}>
        <Controller
          control={control}
          name="validDays"
          render={({ field }) => (
            <OptionSelect
              id="quote-valid"
              value={String(field.value ?? QUOTE_VALID_DAYS_DEFAULT)}
              onChange={(v) => field.onChange(Number(v))}
              options={QUOTE_VALID_DAYS.map((d) => ({ id: String(d), name: `${d} days` }))}
              placeholder="Choose"
            />
          )}
        />
      </FormField>
      <div>
        <Button type="submit" size="lg" disabled={send.isPending}>
          {send.isPending ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" aria-hidden />}
          {r.sendMode === "UPDATE" ? "Update my quote" : r.sendMode === "RESEND" ? "Send my quote again" : "Send quote"}
        </Button>
      </div>
    </form>
  )
}

/**
 * `/provider/requests/[id]` (PR-07; docs/provider-request-detail-feature.md): the job as the customer described it —
 * area and city only, never the customer's name, phone or street (BR-02, SY-04) — its photos, budget and date, and my
 * quote: send it, edit it while it waits, withdraw it, or send it again. Once accepted, a link to the booking.
 */
export function ProviderRequestDetail({ initialData }: { initialData: Detail }) {
  const { data: r } = useProviderRequest(initialData.id, initialData)
  const withdraw = useWithdrawQuote()
  const q = r.myQuote
  const [editing, setEditing] = useState(false)
  const closing = r.status === "OPEN" ? closes(r.expiresInDays) : null
  // Form: no quote yet, a withdrawn / expired one to send again, or "Change my quote" on a waiting one.
  const formVisible = !r.sendBlockedReason && (!q || q.status !== "PENDING" || editing)

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ms-2" render={<Link href="/provider/requests" />}>
        <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
        Requests
      </Button>
      <PageHeader title={r.title} description={`${r.parentCategory ? `${r.parentCategory} › ` : ""}${r.category} · posted ${r.postedDaysAgo === 0 ? "today" : `${formatNumber(r.postedDaysAgo)} days ago`}`} />

      {q?.booking ? (
        <Alert>
          <AlertTitle className="flex flex-wrap items-center gap-2">
            The customer accepted your quote — booking <span className="tabular-nums">{q.booking.number}</span> <BookingStatusBadge status={q.booking.status} />
          </AlertTitle>
          <AlertDescription className="mt-2">
            {q.booking.status === "PENDING_PAYMENT" ? (
              "The customer is paying online. The booking appears in your bookings once paid."
            ) : (
              <Button render={<Link href={`/provider/bookings/${q.booking.id}`} />}>Open the booking</Button>
            )}
          </AlertDescription>
        </Alert>
      ) : r.sendBlockedReason && !(q?.status === "PENDING") ? (
        <Alert>
          <AlertTitle>{r.sendBlockedReason}</AlertTitle>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">The job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base whitespace-pre-line">{r.description}</p>
              {r.descriptionMasked ? (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3" aria-hidden />
                  Contact details are hidden until the customer books.
                </p>
              ) : null}
              {r.photos.length ? (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {r.photos.map((p, i) => (
                    <li key={p.id}>
                      <a href={p.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- provider-scoped signed redirect, not optimizable */}
                        <img src={p.url} alt={`Photo ${i + 1}`} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          <Card className={q?.status === "PENDING" ? "border-primary/40" : undefined}>
            <CardHeader>
              <CardTitle className="text-lg">{q ? "Your quote" : "Send a quote"}</CardTitle>
              {!q ? <CardDescription>The customer compares quotes by price, duration and your rating, then picks one.</CardDescription> : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {q ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-2xl font-semibold tabular-nums">
                      <bdi dir="ltr">{formatPrice(q.price)}</bdi>
                    </span>
                    {q.durationDays ? <span className="text-muted-foreground">· {formatNumber(q.durationDays)} days</span> : null}
                    <Badge variant={q.status === "ACCEPTED" ? "default" : "outline"}>{STATUS_LABEL[q.status]}</Badge>
                  </div>
                  {q.message ? <p className="whitespace-pre-line text-sm">{q.message}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDate(q.createdAt)}
                    {q.validUntil && q.status === "PENDING" ? ` · valid until ${formatDate(q.validUntil)}` : ""}
                  </p>
                </div>
              ) : null}
              {formVisible ? <QuoteForm key={`${q?.status ?? "new"}-${editing}`} r={r} onDone={() => setEditing(false)} /> : null}
            </CardContent>
            {q?.status === "PENDING" && !editing ? (
              <CardFooter className="flex flex-wrap gap-2">
                {!r.sendBlockedReason ? (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    Change my quote
                  </Button>
                ) : null}
                {!r.withdrawBlockedReason ? (
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" className="text-destructive" disabled={withdraw.isPending}>
                        Withdraw
                      </Button>
                    }
                    title="Withdraw your quote?"
                    description="The customer won't be able to accept it. You can send a new quote while the request is open."
                    confirmLabel="Withdraw quote"
                    cancelLabel="Keep it"
                    onConfirm={() =>
                      withdraw.mutate(q.id, {
                        onSuccess: () => toast.success("Quote withdrawn"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  />
                ) : null}
              </CardFooter>
            ) : null}
          </Card>
        </div>

        <aside>
          <Card className="lg:sticky lg:top-4">
            <CardContent className="space-y-3 text-sm">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  {[r.area, r.city].filter(Boolean).join(", ")}
                  {r.outsideMyAreas ? <span className="block text-xs text-muted-foreground">Outside your work areas</span> : null}
                  <span className="block text-xs text-muted-foreground">Exact address after the customer books.</span>
                </span>
              </p>
              <p className="flex gap-2">
                <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                Customer&apos;s budget: {r.budget !== null ? <bdi dir="ltr">{formatPrice(r.budget)}</bdi> : "not set"}
              </p>
              <p className="flex gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                Wanted on: {r.preferredDate ? formatDate(r.preferredDate) : "flexible"}
              </p>
              <p className="flex gap-2">
                <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                {r.quoteCount === 0 ? "No quotes yet — be the first" : `${formatNumber(r.quoteCount)} ${r.quoteCount === 1 ? "quote" : "quotes"} so far`}
              </p>
              {closing ? (
                <p className="flex gap-2 font-medium">
                  <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {closing}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
