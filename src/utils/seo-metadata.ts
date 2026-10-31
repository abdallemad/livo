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
  return { title: "غير موجود", robots: { index: false, follow: true } }
}
