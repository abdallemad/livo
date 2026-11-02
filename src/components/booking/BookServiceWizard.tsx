"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Banknote, CalendarClock, CreditCard, MapPin, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { PageHeader, PriceTag, Stepper } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useCreateServiceBooking } from "@/hooks/use-booking"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { applyApiErrors } from "@/lib/form-errors"
import { cn } from "@/lib/utils"
import { createServiceBookingSchema, type CreateServiceBookingInput, type CreateServiceBookingValues } from "@/schemas/booking.schema"
import type { BookServiceFormData } from "@/types/booking"
import { timeLabel } from "@/utils/availability"
import { BOOKING_NOTES_MAX, BOOKING_STEPS, type BookingPaymentMethod } from "@/utils/booking-checkout"
import { durationLabel } from "@/utils/catalog"
import { formatZonedDay } from "@/utils/zoned-time"

const STEP_FIELDS: FieldPath<CreateServiceBookingInput>[][] = [["date", "time"], ["addressId"], ["notes"], ["paymentMethod"]]
const ALL_FIELDS = ["serviceId", "date", "time", "addressId", "notes", "paymentMethod"] as const

const PAYMENT_COPY: Record<BookingPaymentMethod, { title: string; body: string; icon: typeof CreditCard }> = {
  ONLINE: { title: "Pay online now", body: "Card payment on Stripe's secure page. Livo holds the money until you confirm the job is done.", icon: CreditCard },
  CASH: { title: "Cash after the job", body: "Pay the provider in cash when the work is finished.", icon: Banknote },
}

/** "2026-11-05" → "Thu, 5 Nov" in Cairo time (noon avoids any day shift). */
const dayLabel = (isoDay: string) => formatZonedDay(`${isoDay}T12:00:00+02:00`)

function ChoiceButton({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  )
}

/**
 * `/account/book/[serviceId]` (CU-02, CU-07; docs/booking-checkout-feature.md). Four input steps in one form; each
 * "Next" validates only its own fields, and the server checks everything again (slot still free, address yours,
 * price from the service). Online payment sends the browser to Stripe Checkout; cash shows the confirmation directly.
 */
export function BookServiceWizard({ data }: { data: BookServiceFormData }) {
  const s = data.service
  const router = useRouter()
  const create = useCreateServiceBooking()
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const defaultAddress = data.addresses.find((a) => a.isDefault) ?? data.addresses[0]
  const onlineAvailable = data.paymentMethods.some((m) => m.id === "ONLINE" && m.available)

  const form = useForm<CreateServiceBookingInput, unknown, CreateServiceBookingValues>({
    resolver: zodResolver(createServiceBookingSchema),
    defaultValues: {
      serviceId: s.id,
      date: data.days[0]?.date ?? "",
      time: "",
      addressId: defaultAddress?.id ?? "",
      notes: "",
      paymentMethod: onlineAvailable ? "ONLINE" : "CASH",
    },
  })
  const { control, handleSubmit, setError, setValue, trigger, formState, register } = form
  const [date, time, addressId, notes, paymentMethod] = useWatch({ control, name: ["date", "time", "addressId", "notes", "paymentMethod"] })
  const confirmLeave = useUnsavedChanges(formState.isDirty && !create.isSuccess && !leaving)
  const errors = formState.errors
  const times = data.days.find((d) => d.date === date)?.times ?? []
  const address = data.addresses.find((a) => a.id === addressId)

  const next = async () => {
    if (await trigger(STEP_FIELDS[step], { shouldFocus: true })) setStep((n) => Math.min(n + 1, 3))
  }

  const submit = handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: (booking) => {
        setLeaving(true)
        if (booking.checkoutUrl) {
          window.location.assign(booking.checkoutUrl)
          return
        }
        toast.success(`Booking ${booking.number} sent to ${s.provider.name}`)
        router.push(`/account/book/${encodeURIComponent(s.id)}?booking=${encodeURIComponent(booking.id)}`)
      },
      onError: (error) => {
        applyApiErrors(error, setError, ALL_FIELDS)
        // Jump back to the first step that has a server error (e.g. the slot was just taken).
        const failed = STEP_FIELDS.findIndex((fields) => fields.some((f) => form.getFieldState(f).error))
        if (failed >= 0) setStep(failed)
      },
    }),
  )

  const noDays = data.days.length === 0
  const noAddress = data.addresses.length === 0

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ms-2" render={<Link href={s.href} onClick={(e) => !confirmLeave() && e.preventDefault()} />}>
        <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
        Back to the service
      </Button>
      <PageHeader title="Book the service" description={`${s.title} with ${s.provider.name}`} />
      <Stepper steps={BOOKING_STEPS} current={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <form id="book-service-form" className="min-w-0 space-y-6" onSubmit={(e) => (step === 3 ? submit(e) : (e.preventDefault(), next()))} noValidate>
          {step === 0 ? (
            <section className="space-y-5" aria-labelledby="step-when">
              <h2 id="step-when" className="text-lg font-semibold">
                When should the provider come?
              </h2>
              {noDays ? (
                <Alert>
                  <CalendarClock aria-hidden />
                  <AlertTitle>No free times right now</AlertTitle>
                  <AlertDescription>
                    {s.provider.name} is fully booked for the next few weeks. Try another provider from the{" "}
                    <Link href={s.href} className="underline underline-offset-4">
                      service page
                    </Link>
                    .
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <FormField id="book-date" label="Day" error={errors.date?.message}>
                    <div id="book-date" role="radiogroup" aria-label="Day" aria-describedby="book-date-msg" className="flex gap-2 overflow-x-auto pb-1">
                      {data.days.map((d) => (
                        <ChoiceButton
                          key={d.date}
                          selected={date === d.date}
                          className="shrink-0 whitespace-nowrap"
                          onClick={() => {
                            setValue("date", d.date, { shouldDirty: true, shouldValidate: true })
                            if (!d.times.includes(time)) setValue("time", "", { shouldDirty: true })
                          }}
                        >
                          {dayLabel(d.date)}
                        </ChoiceButton>
                      ))}
                    </div>
                  </FormField>
                  <FormField id="book-time" label="Start time" error={errors.time?.message} helper="Times in Cairo time. The provider confirms after you book.">
                    <div id="book-time" role="radiogroup" aria-label="Start time" aria-describedby="book-time-msg" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {times.map((t) => (
                        <ChoiceButton key={t} selected={time === t} className="tabular-nums" onClick={() => setValue("time", t, { shouldDirty: true, shouldValidate: true })}>
                          <bdi dir="ltr">{timeLabel(t)}</bdi>
                        </ChoiceButton>
                      ))}
                    </div>
                  </FormField>
                </>
              )}
            </section>
          ) : null}

          {step === 1 ? (
            <section className="space-y-5" aria-labelledby="step-where">
              <h2 id="step-where" className="text-lg font-semibold">
                Where is the job?{data.city ? <span className="font-normal text-muted-foreground"> · {data.city}</span> : null}
              </h2>
              {noAddress ? (
                <Alert>
                  <MapPin aria-hidden />
                  <AlertTitle>Add an address first</AlertTitle>
                  <AlertDescription>
                    The provider needs to know where to go.{" "}
                    <Link href="/account/addresses" className="underline underline-offset-4">
                      Add an address
                    </Link>{" "}
                    in the provider&apos;s city, then come back.
                  </AlertDescription>
                </Alert>
              ) : (
                <FormField id="book-address" label="Address" error={errors.addressId?.message} helper="The provider sees the full address only after accepting.">
                  <Controller
                    control={control}
                    name="addressId"
                    render={({ field }) => (
                      <OptionSelect id="book-address" value={field.value} onChange={field.onChange} options={data.addresses.map((a) => ({ id: a.id, name: a.label }))} placeholder="Choose an address" invalid={!!errors.addressId} />
                    )}
                  />
                </FormField>
              )}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-5" aria-labelledby="step-notes">
              <h2 id="step-notes" className="text-lg font-semibold">
                Anything the provider should know?
              </h2>
              <FormField
                id="book-notes"
                label="Notes"
                optional
                error={errors.notes?.message}
                helper={
                  <span className="flex w-full justify-between gap-3">
                    <span>Access, parking, the exact problem. No phone numbers — you&apos;ll get the provider&apos;s once they accept.</span>
                    <span className="shrink-0 tabular-nums">
                      {(notes ?? "").length}/{BOOKING_NOTES_MAX}
                    </span>
                  </span>
                }
              >
                <Textarea id="book-notes" rows={5} maxLength={BOOKING_NOTES_MAX} aria-invalid={!!errors.notes} aria-describedby="book-notes-msg" {...register("notes")} />
              </FormField>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-5" aria-labelledby="step-pay">
              <h2 id="step-pay" className="text-lg font-semibold">
                How will you pay?
              </h2>
              <FormField id="book-payment" label="Payment" error={errors.paymentMethod?.message}>
                <div id="book-payment" role="radiogroup" aria-label="Payment" aria-describedby="book-payment-msg" className="grid gap-3 sm:grid-cols-2">
                  {data.paymentMethods.map((m) => {
                    const copy = PAYMENT_COPY[m.id]
                    const Icon = copy.icon
                    const selected = paymentMethod === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!m.available}
                        onClick={() => setValue("paymentMethod", m.id, { shouldDirty: true, shouldValidate: true })}
                        className={cn(
                          "flex gap-3 rounded-xl border p-4 text-start transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                          selected ? "border-primary ring-1 ring-primary" : "hover:bg-muted",
                        )}
                      >
                        <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                        <span>
                          <span className="block font-medium">{copy.title}</span>
                          <span className="text-sm text-muted-foreground">{m.available ? copy.body : "Not available right now."}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </FormField>
              <dl className="grid gap-2 rounded-xl border p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">When</dt>
                  <dd className="text-end">
                    {date ? dayLabel(date) : "—"}
                    {time ? (
                      <>
                        {" · "}
                        <bdi dir="ltr">{timeLabel(time)}</bdi>
                      </>
                    ) : null}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Where</dt>
                  <dd className="text-end">{address?.label ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t pt-2 font-medium">
                  <dt>Total</dt>
                  <dd>
                    <PriceTag amount={s.price} size="sm" />
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((n) => n - 1)} disabled={create.isPending}>
                <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
                Back
              </Button>
            ) : null}
            {step < 3 ? (
              <Button type="submit" disabled={(step === 0 && noDays) || (step === 1 && noAddress)}>
                Next
                <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
              </Button>
            ) : (
              <Button type="submit" size="lg" variant="commit" disabled={create.isPending || leaving}>
                {create.isPending || leaving ? <Spinner data-icon="inline-start" /> : null}
                {paymentMethod === "ONLINE" ? "Book and pay" : "Book now"}
              </Button>
            )}
          </div>
        </form>

        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">{s.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {s.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- streamed by /api/images/services (docs/catalog-feature.md)
              <img src={s.imageUrl} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
            ) : null}
            <p className="text-muted-foreground">
              {s.category} · {s.provider.name}
              {s.durationMinutes ? ` · about ${durationLabel(s.durationMinutes)}` : ""}
            </p>
            <PriceTag amount={s.price} kind="fixed" size="md" />
            <p className="flex gap-2 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>Paid online? Livo holds the money and only pays the provider after you confirm the job is done.</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
