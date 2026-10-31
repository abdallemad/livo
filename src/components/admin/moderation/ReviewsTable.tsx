"use client"

import Link from "next/link"
import { AlertCircle, Eye, EyeOff, MessageSquareReply, Star } from "lucide-react"
import { toast } from "sonner"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { ReasonDialog } from "@/components/admin/shared/ReasonDialog"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useAdminReviews, useModerateReview } from "@/hooks/use-admin-moderation"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { reviewListQuerySchema } from "@/schemas/admin.schema"
import type { AdminReviewListItem } from "@/types/admin"
import { formatDate, formatNumber } from "@/utils/format"

const ALL = "ALL"
const VISIBILITY_OPTIONS = [
  { id: ALL, name: "Visible + hidden" },
  { id: "VISIBLE", name: "Visible" },
  { id: "HIDDEN", name: "Hidden" },
]
const RATING_OPTIONS = [{ id: ALL, name: "Any rating" }, ...[5, 4, 3, 2, 1].map((n) => ({ id: String(n), name: `${n} star${n === 1 ? "" : "s"}` }))]
const DIRECTION_OPTIONS = [
  { id: ALL, name: "Both directions" },
  { id: "OF_PROVIDER", name: "Customers → providers" },
  { id: "OF_CUSTOMER", name: "Providers → customers" },
]

/**
 * `/admin/reviews` (AD-08): every review, both directions (SY-05), with
 * filters and hide / show. Hiding takes the review out of the provider's
 * public rating (recomputed server-side, incl. the BR-04 flag). Filters live in the URL.
 */
export function ReviewsTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(reviewListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminReviews(query)
  const filtered = !!(query.q || query.visibility || query.rating || query.direction)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description={`Hide reviews that break the rules (abuse, personal details, spam). Hidden reviews don't count toward a provider's rating.${
          data?.hiddenCount ? ` ${formatNumber(data.hiddenCount)} hidden now.` : ""
        }`}
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Text, name or booking" label="Search reviews" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
              <div className="lg:w-40 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-visibility"
                  value={query.visibility ?? ALL}
                  onChange={(v) => setQuery({ visibility: v === ALL ? undefined : v })}
                  options={VISIBILITY_OPTIONS}
                  placeholder="Visibility"
                />
              </div>
              <div className="lg:w-36 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-rating"
                  value={query.rating ? String(query.rating) : ALL}
                  onChange={(v) => setQuery({ rating: v === ALL ? undefined : v })}
                  options={RATING_OPTIONS}
                  placeholder="Rating"
                />
              </div>
              <div className="lg:w-52 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-direction"
                  value={query.direction ?? ALL}
                  onChange={(v) => setQuery({ direction: v === ALL ? undefined : v })}
                  options={DIRECTION_OPTIONS}
                  placeholder="Direction"
                />
              </div>
            </div>
            {filtered ? (
              <Button
                size="sm"
                variant="ghost"
                render={<Link href={hrefWith({ q: undefined, visibility: undefined, rating: undefined, direction: undefined })} />}
              >
                Clear filters
              </Button>
            ) : null}
          </div>

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load reviews"
              description={error.message}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState icon={Star} title="No reviews" description={filtered ? "No reviews match these filters." : "Reviews appear after completed bookings."} />
          ) : (
            <ul className="divide-y">
              {data.items.map((r) => (
                <ReviewRow key={r.id} review={r} />
              ))}
            </ul>
          )}

          {data && data.total > 0 ? (
            <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewRow({ review: r }: { review: AdminReviewListItem }) {
  const moderate = useModerateReview()
  const reviewerHref = r.ofProvider ? `/admin/users/${r.reviewerId}` : `/admin/providers/${r.reviewerId}`
  const revieweeHref = r.ofProvider ? `/admin/providers/${r.revieweeId}` : `/admin/users/${r.revieweeId}`

  return (
    <li className={cn("flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start", r.isHidden && "opacity-70")}>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn("size-4", i < r.rating ? "fill-commit text-commit" : "text-muted-foreground")} aria-hidden />
            ))}
          </span>
          <span>
            <Link href={reviewerHref} className="font-medium hover:underline">
              {r.reviewerName}
            </Link>{" "}
            <span className="text-muted-foreground">reviewed</span>{" "}
            <Link href={revieweeHref} className="font-medium hover:underline">
              {r.revieweeName}
            </Link>
          </span>
          <Badge variant="secondary">{r.ofProvider ? "of provider" : "of customer"}</Badge>
          {r.isHidden ? (
            <Badge variant="neutral">
              <EyeOff data-icon="inline-start" aria-hidden />
              Hidden
            </Badge>
          ) : null}
        </div>
        {r.comment ? (
          <p className="whitespace-pre-line" dir="auto">
            {r.comment}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No comment, rating only.</p>
        )}
        {r.providerReply ? (
          <p className="flex gap-1.5 border-s-2 ps-3 text-sm text-muted-foreground" dir="auto">
            <MessageSquareReply className="mt-0.5 size-4 shrink-0" aria-hidden />
            {r.providerReply}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          <Link href={`/admin/bookings/${r.bookingId}`} className="tabular-nums hover:underline">
            {r.bookingNumber}
          </Link>{" "}
          · {formatDate(r.createdAt)}
        </p>
      </div>
      <div className="shrink-0">
        {r.isHidden ? (
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="outline" disabled={moderate.isPending}>
                {moderate.isPending ? <Spinner data-icon="inline-start" /> : <Eye data-icon="inline-start" aria-hidden />}
                Show again
              </Button>
            }
            title="Show this review again?"
            description="It becomes public again and counts toward the rating."
            confirmLabel="Show review"
            cancelLabel="Cancel"
            destructive={false}
            onConfirm={() =>
              moderate.mutate(
                { id: r.id, action: "SHOW" },
                { onSuccess: () => toast.success("The review is visible again"), onError: (e) => toast.error(e.message) },
              )
            }
          />
        ) : (
          <ReasonDialog
            trigger={
              <Button size="sm" variant="destructive" disabled={moderate.isPending}>
                <EyeOff data-icon="inline-start" aria-hidden />
                Hide
              </Button>
            }
            title={`Hide ${r.reviewerName}'s review?`}
            description={`It disappears from the site${r.ofProvider ? " and no longer counts toward the provider's rating" : ""}. The reviewer sees your reason.`}
            confirmLabel="Hide review"
            pending={moderate.isPending}
            onSubmit={(reason) => moderate.mutateAsync({ id: r.id, action: "HIDE", reason }).then(() => toast.success("The review is hidden"))}
          />
        )}
      </div>
    </li>
  )
}
