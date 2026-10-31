import { Clock, Wrench } from "lucide-react"
import { PriceTag } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface ServicePreviewCardProps {
  title: string
  providerName: string
  categoryName: string | null
  price: number | null
  durationMinutes: number | null
  imageUrl: string | null
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`
  const hours = minutes / 60
  if (hours === 1) return "ساعة"
  if (hours === 2) return "ساعتين"
  return Number.isInteger(hours) ? `${hours} ساعات` : `${hours.toFixed(1)} ساعة`
}

/**
 * Live preview of the provider's first service, mirroring the public
 * `ServiceCard` layout, so they see what customers will see. Not a link.
 */
export function ServicePreviewCard({ title, providerName, categoryName, price, durationMinutes, imageUrl }: ServicePreviewCardProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0" aria-label="معاينة الخدمة">
      <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- owner-only signed preview, not optimisable by next/image
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <Wrench className="size-10" aria-hidden />
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
        <h3 className="text-lg font-semibold">{title || "عنوان الخدمة"}</h3>
        <p className="text-sm text-muted-foreground">{providerName}</p>
        <div className="flex items-end justify-between gap-2 pt-2">
          {price && price > 0 ? <PriceTag amount={price} kind="fixed" /> : <span className="text-muted-foreground">السعر</span>}
          {durationMinutes ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-4" aria-hidden />
              {formatDuration(durationMinutes)}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
