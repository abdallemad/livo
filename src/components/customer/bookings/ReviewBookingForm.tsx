"use client"

import { useState } from "react"
import Link from "next/link"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, EyeOff, MessageSquareReply, Pencil, Star } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { PageHeader, RatingInput, RatingStars } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { customerKeys } from "@/constants/query-keys"
import { useMyBookingReview, useSaveMyBookingReview } from "@/hooks/use-customer-account"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { applyApiErrors } from "@/lib/form-errors"
import { customerReviewSchema, type CustomerReviewInput, type CustomerReviewValues } from "@/schemas/customer-review.schema"
import type { CustomerBookingReview } from "@/types/customer-review"
import { RATING_LABELS, REVIEW_COMMENT_MAX } from "@/utils/customer-review"
import { formatZonedDateTime, formatZonedDay } from "@/utils/zoned-time"

const FIELDS = ["rating", "comment"] as const
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"

/**
 * `/account/bookings/[id]/review` (CU-10, BR-03, SY-05; docs/customer-review-feature.md): rate a finished booking with
 * stars and an optional public comment, then see the review as the provider and visitors do — with the provider's reply,
 * or Livo's "hidden" notice. The review can be edited for a few days until the provider replies. First snapshot from
 * the server; the API re-checks every rule (409 / 422 come back into the form).
 */
export function ReviewBookingForm({ initialData }: { initialData: CustomerBookingReview }) {
  const { data } = useMyBookingReview(initialData.booking.id, initialData)
  const { booking, provider, review, blockedReason } = data
  const [editing, setEditing] = useState(false)
  const showForm = !blockedReason && (!review || editing)
  const bookingHref = `/account/bookings/${booking.id}`

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ms-2" render={<Link href={bookingHref} />}>
        <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
        Booking {booking.number}
      </Button>

      <PageHeader title={review && !editing ? "Your review" : "Rate the service"} description={`${booking.title} · Booking ${booking.number}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-6">
          {blockedReason ? (
            <Alert>
              <Star aria-hidden />
              <AlertTitle>You can&apos;t rate this booking yet</AlertTitle>
              <AlertDescription>
                <p>{blockedReason}</p>
                <Button variant="outline" size="sm" className="mt-3" render={<Link href={bookingHref} />}>
                  Back to the booking
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {showForm ? (
            <ReviewForm
              data={data}
              onDone={() => setEditing(false)}
              onCancel={review ? () => setEditing(false) : undefined}
            />
          ) : null}

          {review && !editing ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <RatingStars value={review.rating} size="md" />
                </CardTitle>
                <CardDescription>
                  Posted {formatZonedDay(review.createdAt)}
                  {review.edited ? ` · edited ${formatZonedDay(review.updatedAt)}` : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.isHidden ? (
                  <Alert variant="destructive">
                    <EyeOff aria-hidden />
                    <AlertTitle>Hidden by Livo</AlertTitle>
                    <AlertDescription>This review broke the review rules, so it isn&apos;t shown to anyone and doesn&apos;t count in the provider&apos;s rating.</AlertDescription>
                  </Alert>
                ) : null}
                {review.comment ? <p className="whitespace-pre-line text-pretty">{review.comment}</p> : <p className="text-muted-foreground">No comment — stars only.</p>}
                {review.providerReply ? (
                  <div className="rounded-lg border-s-4 border-primary bg-muted/50 p-4">
                    <p className="mb-1 flex items-center gap-2 text-sm font-medium">
                      <MessageSquareReply className="size-4" aria-hidden />
                      Reply from {provider.name}
                    </p>
                    <p className="whitespace-pre-line text-sm text-pretty">{review.providerReply}</p>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                {review.editBlockedReason ? (
                  <p className="text-sm text-muted-foreground">{review.editBlockedReason}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">You can change it until {formatZonedDateTime(review.editableUntil)}.</p>
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Pencil data-icon="inline-start" aria-hidden />
                      Edit review
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  {provider.avatarUrl ? <AvatarImage src={provider.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initials(provider.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{provider.name}</p>
                  {booking.completedAt ? <p className="text-sm text-muted-foreground">Job confirmed {formatZonedDay(booking.completedAt)}</p> : null}
                </div>
              </div>
              <Button variant="link" className="h-auto p-0" render={<Link href={`/providers/${provider.id}`} />}>
                View public profile
              </Button>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">
            Reviews are public: they appear on the provider&apos;s profile with your first name, and help other customers choose.
          </p>
        </aside>
      </div>
    </div>
  )
}

function ReviewForm({ data, onDone, onCancel }: { data: CustomerBookingReview; onDone: () => void; onCancel?: () => void }) {
  const { booking, provider, review } = data
  const save = useSaveMyBookingReview(booking.id)
  const queryClient = useQueryClient()
  const form = useForm<CustomerReviewInput, unknown, CustomerReviewValues>({
    resolver: zodResolver(customerReviewSchema),
    defaultValues: { rating: review?.rating ?? 0, comment: review?.comment ?? "" },
  })
  const { register, control, handleSubmit, setError, formState } = form
  const comment = useWatch({ control, name: "comment" }) ?? ""
  const confirmLeave = useUnsavedChanges(formState.isDirty && !save.isSuccess)
  const errors = formState.errors

  const submit = handleSubmit((values) =>
    save.mutate(values, {
      onSuccess: (saved) => {
        // Show the saved review at once; the invalidation in the hook refetches it (and the booking pages) anyway.
        queryClient.setQueryData<CustomerBookingReview>(customerKeys.bookingReview(booking.id), (old) => (old ? { ...old, blockedReason: null, review: saved.review } : old))
        toast.success(saved.created ? "Thanks for your review" : "Review updated", {
          description: saved.created ? `${provider.name} has been notified.` : undefined,
        })
        form.reset({ rating: saved.review.rating, comment: saved.review.comment ?? "" })
        onDone()
      },
      onError: (error) => applyApiErrors(error, setError, FIELDS),
    }),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{review ? "Edit your review" : `How did ${provider.name} do?`}</CardTitle>
        <CardDescription>Your honest rating helps other customers and helps good providers stand out.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="review-form" className="grid gap-5" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium" aria-hidden>
              Your rating
            </span>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => <RatingInput value={field.value ?? 0} onChange={field.onChange} name="rating" />}
            />
            {errors.rating?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.rating.message}
              </p>
            ) : null}
          </div>

          <FormField
            id="review-comment"
            label="Tell others about the job"
            optional
            error={errors.comment?.message}
            helper={
              <span className="flex w-full justify-between gap-3">
                <span>Was it on time, tidy, as agreed? Shown publicly — no phone numbers or emails.</span>
                <span className="shrink-0 tabular-nums">
                  {comment.length}/{REVIEW_COMMENT_MAX}
                </span>
              </span>
            }
          >
            <Textarea
              id="review-comment"
              rows={5}
              maxLength={REVIEW_COMMENT_MAX}
              placeholder={`e.g. ${RATING_LABELS[4]} work, arrived on time and cleaned up afterwards.`}
              aria-invalid={!!errors.comment}
              aria-describedby="review-comment-msg"
              {...register("comment")}
            />
          </FormField>
        </form>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button type="submit" form="review-form" size="lg" disabled={save.isPending}>
          {save.isPending ? <Spinner data-icon="inline-start" /> : <Star data-icon="inline-start" aria-hidden />}
          {review ? "Save changes" : "Post review"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              if (!confirmLeave()) return
              form.reset()
              onCancel()
            }}
          >
            Cancel
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
