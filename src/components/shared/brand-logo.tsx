import Image from "next/image"
import { SITE_LOGO, SITE_NAME, SITE_WORDMARK } from "@/constants/site"
import { cn } from "@/lib/utils"

/**
 * The Livo logo (docs/brand-assets.md). Server-safe (no hooks), so static layouts stay static.
 *
 * - `BrandMark`: the square "LV" mark — sidebars and other tight spots, next to the name as text.
 * - `BrandWordmark`: mark + "Livo" lettering. Two images toggled by the `dark` class (next-themes) so the purple lettering
 *   never sits on a dark background; the hidden one is `display: none`, so screen readers announce the name once.
 */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return <Image src={SITE_LOGO} alt="" width={size} height={size} className={cn("shrink-0", className)} />
}

export function BrandWordmark({ height = 36, priority = false, className }: { height?: number; priority?: boolean; className?: string }) {
  const width = Math.round((SITE_WORDMARK.width * height) / SITE_WORDMARK.height)
  const common = { width, height, priority, style: { height, width: "auto" } } as const
  return (
    <span className={cn("inline-flex shrink-0", className)}>
      <Image src={SITE_WORDMARK.light} alt={SITE_NAME} {...common} className="dark:hidden" />
      <Image src={SITE_WORDMARK.dark} alt={SITE_NAME} {...common} className="hidden dark:block" />
    </span>
  )
}
