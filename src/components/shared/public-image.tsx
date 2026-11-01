"use client"

import { useState } from "react"
import { getImageProps } from "next/image"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface PublicImageProps {
  src: string
  alt: string
  /** Intrinsic size (sets the aspect ratio and the srcSet widths). */
  width: number
  height: number
  /** Required for responsive images — e.g. "(min-width: 1024px) 25vw, 50vw". */
  sizes: string
  /** Only the main above-the-fold image; everything else lazy-loads. */
  priority?: boolean
  className?: string
}

/**
 * The image wrapper for public pages (CLAUDE.md §9): `getImageProps` → optimized `srcSet` + `sizes`, `loading="lazy"`
 * unless `priority`, and layered fallbacks — optimized → the raw route → a neutral placeholder — so a photo that
 * can't be served (storage down, provider suspended since the page was cached) never shows a broken image.
 */
export function PublicImage({ src, alt, width, height, sizes, priority, className }: PublicImageProps) {
  const [stage, setStage] = useState<"optimized" | "raw" | "failed">("optimized")
  const { props } = getImageProps({ src, alt, width, height, sizes, priority, quality: 70 })

  if (stage === "failed") {
    return (
      <span role="img" aria-label={alt} className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageOff className="size-6" aria-hidden />
      </span>
    )
  }
  const imgProps = stage === "optimized" ? props : { ...props, src, srcSet: undefined }
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- props come from getImageProps (alt included)
    <img {...imgProps} className={className} onError={() => setStage(stage === "optimized" ? "raw" : "failed")} />
  )
}
