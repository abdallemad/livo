import Link from "next/link"
import { CalendarDays, Camera, Clock, MapPin, MessageSquareQuote, Wallet } from "lucide-react"
import { MetaBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QUOTE_STATUS } from "@/constants/status"
import { cn } from "@/lib/utils"
import type { ProviderRequestCard } from "@/types/provider"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"

const posted = (days: number) => (days === 0 ? "Posted today" : days === 1 ? "Posted yesterday" : `Posted ${formatNumber(days)} days ago`)

function closes(days: number | null) {
  if (days === null) return null
  if (days < 0) return "Closed"
  if (days === 0) return "Closes today"
  if (days === 1) return "Closes tomorrow"
  return `Closes in ${formatNumber(days)} days`
}

/**
 * One quote request as a provider sees it (PR-06): what, where (area only — BR-02), budget,
 * timing, competition, and the one next step. Presentational; links to `/provider/requests/[id]`
 * where the quote is sent (PR-07).
 */
export function RequestCard({ r, compact = false }: { r: ProviderRequestCard; compact?: boolean }) {
  const href = `/provider/requests/${r.id}`
  const closing = closes(r.expiresInDays)
  const urgent = r.expiresInDays !== null && r.expiresInDays >= 0 && r.expiresInDays <= 2 && r.status === "OPEN"

  return (
    <Card className="gap-3">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{r.parentCategory ? `${r.parentCategory} › ${r.category}` : r.category}</Badge>
          {r.outsideMyAreas ? <Badge variant="warning">Outside your areas</Badge> : null}
          {r.status !== "OPEN" ? <Badge variant="neutral">{r.status === "ACCEPTED" ? "Customer chose a provider" : r.status === "EXPIRED" ? "Expired" : "Closed"}</Badge> : null}
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link href={href} className="hover:underline">
            {r.title}
          </Link>
        </CardTitle>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-4" aria-hidden />
            {r.area ? `${r.area}, ${r.city}` : `Anywhere in ${r.city}`}
          </span>
          <span>{posted(r.postedDaysAgo)}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {!compact ? <p className="line-clamp-3 text-sm whitespace-pre-line">{r.description}</p> : null}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="size-3.5" aria-hidden />
              Budget
            </dt>
            <dd className="font-medium tabular-nums">{r.budget !== null ? <bdi dir="ltr">{formatPrice(r.budget)}</bdi> : "Not given"}</dd>
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
              <MessageSquareQuote className="size-3.5" aria-hidden />
              Quotes so far
            </dt>
            <dd className="font-medium tabular-nums">{r.quoteCount === 0 ? "None yet" : formatNumber(r.quoteCount)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Camera className="size-3.5" aria-hidden />
              Photos
            </dt>
            <dd className="font-medium tabular-nums">{formatNumber(r.photoCount)}</dd>
          </div>
        </dl>
        {closing ? (
          <p className={cn("flex items-center gap-1 text-sm", urgent ? "font-medium text-warning" : "text-muted-foreground")}>
            <Clock className="size-4" aria-hidden />
            {closing}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        {r.myQuote ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <MetaBadge meta={QUOTE_STATUS[r.myQuote.status]} />
              <span>
                Your quote: <bdi dir="ltr" className="font-medium tabular-nums">{formatPrice(r.myQuote.price)}</bdi>
                {r.myQuote.durationDays ? ` · ${formatNumber(r.myQuote.durationDays)} days` : ""}
              </span>
            </div>
            <Button variant="outline" render={<Link href={href} />}>
              View your quote
            </Button>
          </>
        ) : (
          <Button size="lg" className="w-full sm:ms-auto sm:w-auto" render={<Link href={href} />}>
            View & send a quote
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
