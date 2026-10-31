import Link from "next/link"
import { MapPin } from "lucide-react"
import { RatingStars, VerifiedBadge } from "@/components/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatNumber } from "@/utils/format"

export interface ProviderCardData {
  href: string
  name: string
  imageUrl?: string
  specialties: string[]
  rating: number
  reviewsCount: number
  jobsCount: number
  areas: string[]
  verified?: boolean
}

/** Provider summary (§8). Never shows phone/email — contact masking SY-04 / BR-02. */
export function ProviderCard({ provider }: { provider: ProviderCardData }) {
  return (
    <Card className="gap-3 px-4 md:px-5">
      <div className="flex items-start gap-3">
        <Avatar className="size-14">
          {provider.imageUrl ? <AvatarImage src={provider.imageUrl} alt="" /> : null}
          <AvatarFallback className="text-lg">{provider.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <Link href={provider.href} className="text-lg font-semibold hover:text-primary">
            {provider.name}
          </Link>
          {provider.verified ? <VerifiedBadge /> : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {provider.specialties.map((s) => (
          <Badge key={s} variant="secondary">
            {s}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <RatingStars value={provider.rating} count={provider.reviewsCount} />
        <span>
          <span className="tabular-nums">{formatNumber(provider.jobsCount)}</span> completed job
        </span>
      </div>
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0" aria-hidden />
        {provider.areas.join(", ")}
      </p>
    </Card>
  )
}
