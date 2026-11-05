/**
 * Which picture a fixed-price service shows (docs/service-images-feature.md). Pure — no DB, no env.
 *
 * Order: the provider's own uploads (served by `/api/images/services/[id]`) → the external stock cover in
 * `Service.imageUrl` (Unsplash / Lorem Picsum, written by `npm run db:seed:images`) → nothing (the card shows its
 * icon-only navy design). Only absolute `https:` URLs are accepted from the column, so a bad row can never inject a
 * `javascript:` / relative URL into an `<img src>`.
 */

export const uploadedServiceImageUrl = (fileId: string) => `/api/images/services/${fileId}`

/** A usable external cover URL, or null. */
export function externalCoverUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw.trim())
    return url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

/** The card picture: the first upload, else the stock cover. */
export function serviceCoverUrl(uploadIds: readonly string[], external: string | null | undefined): string | null {
  return uploadIds[0] ? uploadedServiceImageUrl(uploadIds[0]) : externalCoverUrl(external)
}

/** Every picture on the service page: all uploads, or the stock cover alone. */
export function serviceGalleryUrls(uploadIds: readonly string[], external: string | null | undefined): string[] {
  if (uploadIds.length) return uploadIds.map(uploadedServiceImageUrl)
  const cover = externalCoverUrl(external)
  return cover ? [cover] : []
}

/** First sentence-ish of a description for a card, capped at `max` characters on a word boundary. */
export function cardSummary(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const space = cut.lastIndexOf(" ")
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`
}
