import type { Metadata } from "next"
import { DEFAULT_OPEN_GRAPH } from "@/constants/site"

/**
 * Pure metadata builders. They take an already-loaded DTO, never touch the DB,
 * and use RELATIVE urls (the root `metadataBase` makes them absolute).
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...DEFAULT_OPEN_GRAPH, title, description, url: path },
  }
}

export function notFoundMetadata(): Metadata {
  return { title: "Not found", robots: { index: false, follow: true } }
}

/**
 * The landing page `/` (docs/landing-page.md): the root layout's default title (no "| Livo" template suffix), the site
 * description, canonical `/`. Relative URL only — `metadataBase` makes it absolute.
 */
export function landingMetadata({ title, description }: { title: string; description: string }): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { ...DEFAULT_OPEN_GRAPH, title, description, url: "/" },
  }
}
