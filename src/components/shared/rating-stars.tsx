"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils/format"

interface RatingStarsProps {
  value: number
  /** Total reviews, shown after the stars. */
  count?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const ICON = { sm: "size-4", md: "size-5", lg: "size-7" } as const

/** Display-only rating. Filled stars use the `commit` amber — its only non-button use (§2). */
export function RatingStars({ value, count, size = "sm", className }: RatingStarsProps) {
  const rounded = Math.round(value)
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex gap-0.5" role="img" aria-label={`التقييم ${formatNumber(value)} من 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            className={cn(ICON[size], n <= rounded ? "fill-commit text-commit" : "fill-muted text-muted")}
          />
        ))}
      </span>
      <span className="text-sm font-medium tabular-nums">{formatNumber(value)}</span>
      {count !== undefined ? (
        <span className="text-sm text-muted-foreground tabular-nums">({formatNumber(count)})</span>
      ) : null}
    </span>
  )
}

interface RatingInputProps {
  value: number
  onChange: (value: number) => void
  name?: string
  className?: string
}

const LABELS = ["سيئ", "مقبول", "كويس", "كويس جدًا", "ممتاز"]

/** Star input for review forms: radio semantics, 44px targets, keyboard friendly. */
export function RatingInput({ value, onChange, name = "rating", className }: RatingInputProps) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <fieldset className={cn("flex flex-col gap-1", className)}>
      <legend className="sr-only">التقييم</legend>
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="flex size-11 cursor-pointer items-center justify-center rounded-md has-focus-visible:ring-2 has-focus-visible:ring-ring"
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={`${n} — ${LABELS[n - 1]}`}
            />
            <Star aria-hidden className={cn("size-7", n <= shown ? "fill-commit text-commit" : "fill-muted text-muted")} />
          </label>
        ))}
      </div>
      <span className="min-h-6 text-sm text-muted-foreground" aria-live="polite">
        {shown ? LABELS[shown - 1] : "اختار عدد النجوم"}
      </span>
    </fieldset>
  )
}
