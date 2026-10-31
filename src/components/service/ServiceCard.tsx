import Link from "next/link"
import { Clock, Wrench } from "lucide-react"
import { PriceTag, RatingStars } from "@/components/shared"
import { Card } from "@/components/ui/card"

export interface ServiceCardData {
  href: string
  title: string
  providerName: string
  price: number
  priceKind?: "fixed" | "from"
  rating?: number
  reviewsCount?: number
  /** Pre-formatted duration, e.g. "2 hours". */
  duration?: string
  imageUrl?: string
}

/** Fixed-price service tile on `/services/*` (§8). The whole card is one real link (crawlable). */
export function ServiceCard({ service }: { service: ServiceCardData }) {
  return (
    <Card className="group gap-0 py-0 transition-colors hover:border-primary/40">
      <Link href={service.href} className="flex h-full flex-col focus-visible:outline-none">
        <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
          {service.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- replaced by the next/image wrapper with real data
            <img src={service.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <Wrench className="size-10" aria-hidden />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="text-lg font-semibold group-hover:text-primary">{service.title}</h3>
          <p className="text-sm text-muted-foreground">{service.providerName}</p>
          {service.rating !== undefined ? <RatingStars value={service.rating} count={service.reviewsCount} /> : null}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <PriceTag amount={service.price} kind={service.priceKind ?? "fixed"} />
            {service.duration ? (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="size-4" aria-hidden />
                {service.duration}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </Card>
  )
}
