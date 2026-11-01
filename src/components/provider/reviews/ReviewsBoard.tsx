"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, AlertTriangle, EyeOff, MessageSquareReply, Pencil, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { ConfirmDialog, EmptyState, PageHeader, RatingStars } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useProviderReviews, useReplyToReview } from "@/hooks/use-provider-schedule"
import { useUrlQuery } from "@/hooks/use-url-query"
import { applyApiErrors } from "@/lib/form-errors"
import { cn } from "@/lib/utils"
import { providerReviewListQuerySchema, reviewReplySchema, type ReviewReplyValues } from "@/schemas/provider-schedule.schema"
import type { ProviderReviewItem, ProviderReviewList } from "@/types/provider-schedule"
import { formatDate, formatNumber } from "@/utils/format"
import { REPLY_MAX } from "@/utils/review-summary"

const ALL = "ALL"
const RATING_OPTIONS = [{ id: ALL, name: "Any rating" }, ...[5, 4, 3, 2, 1].map((r) => ({ id: String(r), name: `${r} ${r === 1 ? "star" : "stars"}` }))]

function ReplyForm({ review, onDone }: { review: ProviderReviewItem; onDone: () => void }) {
  const reply = useReplyToReview()
  const form = useForm<ReviewReplyValues>({ resolver: zodResolver(reviewReplySchema), defaultValues: { reply: review.reply ?? "" } })
  const error = form.formState.errors.reply?.message
  const id = `reply-${review.id}`
  const submit = form.handleSubmit((values) =>
    reply.mutate(
      { id: review.id, reply: values.reply },
      {
        onSuccess: () => {
          toast.success(review.reply ? "Reply updated" : "Reply posted")
          onDone()
        },
        onError: (e) => applyApiErrors(e, form.setError, ["reply"]),
      },
    ),
  )
  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <FormField id={id} label="Your public reply" error={error} helper={`Everyone who visits your profile sees it. No phone numbers or emails. Up to ${REPLY_MAX} characters.`}>
        <Textarea id={id} rows={3} maxLength={REPLY_MAX} aria-invalid={!!error} aria-describedby={`${id}-msg`} {...form.register("reply")} />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" disabled={reply.isPending}>
          {reply.isPending ? <Spinner data-icon="inline-start" /> : null}
          {review.reply ? "Save reply" : "Post reply"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ReviewCard({ r }: { r: ProviderReviewItem }) {
  const [editing, setEditing] = useState(false)
  const remove = useReplyToReview()
  return (
    <Card className={cn("gap-3", r.isHidden && "opacity-80")}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RatingStars value={r.rating} size="md" />
          <span className="font-medium">{r.customerFirstName ?? "A customer"}</span>
          <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span>
          {r.isHidden ? (
            <Badge variant="neutral">
              <EyeOff data-icon="inline-start" aria-hidden />
              Hidden by Livo
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          For{" "}
          <Link href={`/provider/bookings/${r.booking.id}`} className="font-medium text-foreground hover:underline">
            {r.booking.title}
          </Link>{" "}
          · <span className="tabular-nums">{r.booking.number}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {r.comment ? <p className="whitespace-pre-line">{r.comment}</p> : <p className="text-muted-foreground italic">No comment, just stars.</p>}
        {r.isHidden ? (
          <p className="text-sm text-muted-foreground">{r.replyBlockedReason} It doesn&apos;t count towards your rating.</p>
        ) : editing ? (
          <ReplyForm review={r} onDone={() => setEditing(false)} />
        ) : r.reply ? (
          <div className="rounded-lg border-s-4 border-primary/40 bg-muted/50 p-3">
            <p className="mb-1 text-sm font-medium">Your reply</p>
            <p className="text-sm whitespace-pre-line">{r.reply}</p>
            <div className="mt-2 flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil data-icon="inline-start" aria-hidden />
                Edit
              </Button>
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={remove.isPending}>
                    <Trash2 data-icon="inline-start" aria-hidden />
                    Remove
                  </Button>
                }
                title="Remove your reply?"
                description="The review stays; only your reply disappears from your profile."
                confirmLabel="Remove reply"
                cancelLabel="Keep it"
                onConfirm={() => remove.mutate({ id: r.id, reply: null }, { onSuccess: () => toast.success("Reply removed"), onError: (e) => toast.error(e.message) })}
              />
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <MessageSquareReply data-icon="inline-start" aria-hidden />
            Reply
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function Summary({ s }: { s: ProviderReviewList["summary"] }) {
  return (
    <Card>
      <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-start gap-1 sm:items-center sm:px-4">
          <p className="font-heading text-5xl font-semibold tabular-nums">{s.count ? formatNumber(s.average) : "—"}</p>
          <RatingStars value={s.average} size="md" />
          <p className="text-sm text-muted-foreground">{s.count ? `${formatNumber(s.count)} ${s.count === 1 ? "review" : "reviews"}` : "No reviews yet"}</p>
        </div>
        <div className="space-y-1.5">
          {s.distribution.map((d) => (
            <div key={d.rating} className="flex items-center gap-2 text-sm">
              <span className="flex w-8 items-center gap-0.5 tabular-nums">
                {d.rating}
                <Star className="size-3.5 fill-commit text-commit" aria-hidden />
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span className="block h-full rounded-full bg-primary" style={{ width: `${d.percent}%` }} />
              </span>
              <span className="w-16 text-end text-muted-foreground tabular-nums">
                {formatNumber(d.count)} · {d.percent}%
              </span>
            </div>
          ))}
          <p className="pt-1 text-sm text-muted-foreground">
            {formatNumber(s.replied)} replied · {formatNumber(s.unreplied)} waiting for a reply
            {s.hidden ? ` · ${formatNumber(s.hidden)} hidden by Livo (not counted)` : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * `/provider/reviews` (PR-13, SY-05, BR-04; docs/provider-schedule-reviews-feature.md): what customers
 * said, the rating summary (visible reviews only), and a public reply per review. Filters in the URL.
 */
export function ReviewsBoard() {
  const { query, hrefWith, setQuery } = useUrlQuery(providerReviewListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useProviderReviews(query)
  const tabs = [
    { filter: undefined, key: "all", label: "All", count: undefined as number | undefined },
    { filter: "unreplied", key: "unreplied", label: "Needs a reply", count: data?.summary.unreplied },
    { filter: "replied", key: "replied", label: "Replied", count: data?.summary.replied },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="What customers said about your work. A short, polite reply shows other customers you care."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      {isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load your reviews" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {data.summary.underReview ? (
            <Alert variant="warning">
              <AlertTriangle aria-hidden />
              <AlertTitle>Your profile is under review because of low ratings</AlertTitle>
              <AlertDescription>Our team is looking at your recent reviews. Replying calmly and fixing problems with customers helps.</AlertDescription>
            </Alert>
          ) : null}

          <Summary s={data.summary} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <nav aria-label="Filter reviews" className="flex gap-1 overflow-x-auto border-b">
              {tabs.map((t) => {
                const active = query.filter === t.key
                return (
                  <Link
                    key={t.key}
                    href={hrefWith({ filter: t.filter })}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "-mb-px flex h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-base",
                      active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                    {t.count !== undefined ? (
                      <span className={cn("rounded-full px-2 text-sm tabular-nums", active || (t.key === "unreplied" && t.count > 0) ? "bg-primary/12 text-primary" : "bg-muted")}>
                        {formatNumber(t.count)}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </nav>
            <div className="sm:w-44 [&_[data-slot=select-trigger]]:h-11">
              <OptionSelect
                id="filter-rating"
                value={query.rating ? String(query.rating) : ALL}
                onChange={(v) => setQuery({ rating: v === ALL ? undefined : v })}
                options={RATING_OPTIONS}
                placeholder="Rating"
              />
            </div>
          </div>

          {data.items.length === 0 ? (
            query.rating || query.filter !== "all" ? (
              <EmptyState
                icon={Star}
                title={query.filter === "unreplied" && !query.rating ? "You've replied to every review" : "No reviews match"}
                action={<Button variant="outline" render={<Link href={hrefWith({ filter: undefined, rating: undefined })} />}>Show all reviews</Button>}
              />
            ) : (
              <EmptyState icon={Star} title="No reviews yet" description="Customers can review you after a job is completed. Great work gets great reviews." />
            )
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {data.items.map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </div>
          )}

          {data.total > 0 ? <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} /> : null}
        </>
      )}
    </div>
  )
}
