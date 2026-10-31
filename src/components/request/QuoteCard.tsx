import { Clock } from "lucide-react"
import { PriceTag, RatingStars, VerifiedBadge } from "@/components/shared"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface QuoteCardData {
  providerName: string
  price: number
  /** Pre-formatted duration, e.g. "3 days". */
  duration: string
  rating: number
  reviewsCount: number
  message: string
  verified?: boolean
}

interface QuoteCardProps {
  quote: QuoteCardData
  /** The accept button (`variant="commit"`) — only on the customer's request page, max one per screen. */
  action?: React.ReactNode
  selected?: boolean
  className?: string
}

/** A provider's quote on `/account/requests/[id]` (CU-04, CU-05). */
export function QuoteCard({ quote, action, selected, className }: QuoteCardProps) {
  return (
    <Card className={cn("gap-3 px-4 md:px-5", selected && "border-primary ring-2 ring-primary/15", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-lg font-semibold">{quote.providerName}</p>
          <div className="flex flex-wrap items-center gap-3">
            <RatingStars value={quote.rating} count={quote.reviewsCount} />
            {quote.verified ? <VerifiedBadge /> : null}
          </div>
        </div>
        <PriceTag amount={quote.price} size="lg" />
      </div>
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock className="size-4" aria-hidden />
        Duration: {quote.duration}
      </p>
      <p className="max-w-prose">{quote.message}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </Card>
  )
}
