import type { ServiceVisibilityState } from "./service-visibility"

/**
 * Pure rules for the provider's services (PR-05) and portfolio (PR-04) — unit tested,
 * used by the services and the pages (docs/provider-services-portfolio-feature.md).
 */

export class CatalogRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CatalogRuleError"
  }
}

/**
 * What saving a service / portfolio item does to its photos.
 * `next` (in order) may only contain photos already on this item or the provider's own pending
 * uploads. Photos dropped from the item are deleted (row + object) — the form removes attached
 * photos only from its own state, so cancelling an edit never loses a photo.
 */
export function planImageChanges(current: string[], next: string[], pending: string[], max: number) {
  const ids = [...new Set(next)]
  if (ids.length > max) throw new CatalogRuleError(`At most ${max} photos.`)
  const allowed = new Set([...current, ...pending])
  if (ids.some((id) => !allowed.has(id))) throw new CatalogRuleError("One of the photos is missing. Upload it again.")
  const keep = new Set(ids)
  return { attach: ids, remove: current.filter((id) => !keep.has(id)) }
}

/** A new order must be exactly the provider's current items, each once. */
export function validateOrder(currentIds: string[], requested: string[]): string[] {
  const unique = [...new Set(requested)]
  if (unique.length !== requested.length || unique.length !== currentIds.length || unique.some((id) => !currentIds.includes(id))) {
    throw new CatalogRuleError("The list changed. Reload and try again.")
  }
  return unique
}

/** A service with bookings is part of their history (title, price); switch it off instead. */
export function serviceDeleteBlockedReason(bookingCount: number): string | null {
  return bookingCount > 0
    ? `This service has ${bookingCount} ${bookingCount === 1 ? "booking" : "bookings"}, so it can't be deleted. Switch it off instead.`
    : null
}

/** What each visibility state means for the provider, in their words. */
export function serviceStatusText(state: ServiceVisibilityState, hiddenReason: string | null): string {
  switch (state) {
    case "LIVE":
      return "Customers can see and book it."
    case "PROVIDER_OFF":
      return "Switched off. Customers can't see it."
    case "HIDDEN_BY_ADMIN":
      return `Hidden by Livo${hiddenReason ? `: ${hiddenReason}` : ""}. Contact support to have it reviewed.`
    case "PROVIDER_INACTIVE":
      return "Customers will see it once your account is active."
    case "CATEGORY_OFF":
      return "Its category is paused on Livo, so customers can't see it for now."
  }
}
