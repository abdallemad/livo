import { createElement } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Star, Wrench } from "lucide-react"
import { categoryIcon } from "@/constants/category-icons"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/utils/format"

export interface ServiceCardData {
  href: string
  title: string
  /** Short blurb under the title (`CatalogServiceCard.summary`, a category description…). */
  description?: string
  /** Category icon key (`constants/category-icons.ts`); falls back to a wrench. */
  iconKey?: string | null
  providerName?: string
  /** Omit for a card without a price (e.g. a quote-only category). */
  price?: number
  priceKind?: "fixed" | "from"
  rating?: number
  reviewsCount?: number
  /** Pre-formatted duration, e.g. "2 hours". */
  duration?: string
  /** Cover photo (upload or stock cover); without one the card is the plain navy → violet design. */
  imageUrl?: string
}

/**
 * The spotlight service card (docs/service-images-feature.md "Card design"), in the marketing website's style:
 * a tall navy → violet card, a white icon tile top-start, an optional gradient badge top-end ("Most requested"), the
 * title and blurb at the bottom. On hover / keyboard focus the text block slides up and a gradient
 * "Book this service" pill appears; on touch screens (no hover) the pill is always shown.
 *
 * The whole card is ONE real `<a>` (crawlable, one tab stop) — the "button" is a styled span, never a nested control.
 * Pure CSS (`group-hover`, `grid-rows` 0fr → 1fr), so it stays a Server Component and needs no JS.
 */
export function ServiceCard({
  service,
  badge,
  cta = "Book this service",
  className,
}: {
  service: ServiceCardData
  /** Gradient pill top-end, e.g. "Most requested". */
  badge?: string
  /** Label of the hover pill. */
  cta?: string
  className?: string
}) {
  const Icon = categoryIcon(service.iconKey ?? null) ?? Wrench
  const meta = [
    service.price !== undefined ? (
      <span key="price" className="font-semibold text-white tabular-nums">
        {service.priceKind === "from" ? "From " : null}
        <bdi dir="ltr">{formatPrice(service.price)}</bdi>
      </span>
    ) : null,
    service.duration ? (
      <span key="duration" className="inline-flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden />
        {service.duration}
      </span>
    ) : null,
    service.rating !== undefined ? (
      <span key="rating" className="inline-flex items-center gap-1">
        <Star className="size-3.5 fill-commit text-commit" aria-hidden />
        <span className="tabular-nums">{service.rating.toFixed(1)}</span>
        {service.reviewsCount ? <span className="text-white/60">({service.reviewsCount})</span> : null}
        <span className="sr-only">out of 5</span>
      </span>
    ) : null,
  ].filter(Boolean)

  return (
    <Link
      href={service.href}
      className={cn(
        "group/card relative isolate flex h-full min-h-88 flex-col overflow-hidden rounded-[28px] bg-[#0d0f45] p-5 text-white shadow-card outline-none",
        "transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-pop focus-visible:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-violet/50",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {/* Background: the cover photo (if any) under a navy → violet wash, so white text always reads (AA). */}
      {service.imageUrl ? (
        // A CSS background, not <img>: if the stock host is down the card simply shows its navy design — no broken-image
        // icon. The URL is JSON-quoted so it can't break out of `url()`.
        <span
          aria-hidden
          className="absolute inset-0 -z-20 bg-cover bg-center transition-transform duration-700 ease-out group-hover/card:scale-105 motion-reduce:transition-none"
          style={{ backgroundImage: `url(${JSON.stringify(service.imageUrl)})` }}
        />
      ) : null}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10",
          service.imageUrl
            ? "bg-[linear-gradient(180deg,rgb(13_15_69/0.25)_0%,rgb(13_15_69/0.55)_40%,rgb(13_15_69/0.94)_72%,#0d0f45_100%)]"
            : "bg-[radial-gradient(120%_90%_at_100%_35%,#3b1f94_0%,rgb(59_31_148/0.55)_35%,transparent_70%),linear-gradient(160deg,#0b1150_0%,#1b1466_55%,#2c1a83_100%)]",
        )}
      />
      {/* Soft violet glow that brightens on hover. */}
      <span
        aria-hidden
        className="absolute -end-16 top-1/3 -z-10 size-56 rounded-full bg-violet/30 opacity-60 blur-3xl transition-opacity duration-500 group-hover/card:opacity-100"
      />

      <div className="flex items-start justify-between gap-3">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_14px_24px_-14px_rgb(0_0_0/0.6)] ring-1 ring-white/60">
          {createElement(Icon, { className: "size-7 text-violet/70", strokeWidth: 1.75, "aria-hidden": true })}
        </span>
        {badge ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-1.5 font-heading text-sm font-semibold whitespace-nowrap shadow-glow">
            <Star className="size-3.5 fill-commit text-commit" aria-hidden />
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-auto pt-10">
        <h3 className="font-heading text-xl leading-snug font-bold text-balance md:text-[22px]">{service.title}</h3>
        {service.description ? <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-white/75">{service.description}</p> : null}
        {meta.length || service.providerName ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
            {meta}
            {service.providerName ? <span className="truncate text-white/60">by {service.providerName}</span> : null}
          </p>
        ) : null}

        {/* The reveal: 0fr → 1fr rows animate the pill's height, so the text above slides up smoothly. */}
        <div
          className={cn(
            "grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            "group-hover/card:grid-rows-[1fr] group-focus-visible/card:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr]",
          )}
        >
          <div className="overflow-hidden">
            <span
              className={cn(
                "btn-shine mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient font-heading text-base font-semibold shadow-glow",
                "translate-y-3 opacity-0 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
                "group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100",
                "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
              )}
            >
              {cta}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover/card:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
