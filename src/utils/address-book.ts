/**
 * Saved addresses (CU-14; docs/customer-account-feature.md) — pure and tested. A customer with
 * addresses always has exactly one default, which booking and request forms preselect.
 */
export const MAX_ADDRESSES = 10
export const ADDRESS_LABEL_MAX = 30
export const ADDRESS_LABEL_SUGGESTIONS = ["Home", "Work", "Family"] as const

/** After deleting `deletedId`: which address becomes the default, if the deleted one was it. Newest remaining wins. */
export function nextDefaultAfterDelete(addresses: { id: string; isDefault: boolean; createdAt: Date }[], deletedId: string): string | null {
  const deleted = addresses.find((a) => a.id === deletedId)
  if (!deleted?.isDefault) return null
  const rest = addresses.filter((a) => a.id !== deletedId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return rest[0]?.id ?? null
}

/** Should a new address be the default? The first one always is; otherwise only if asked. */
export const newAddressIsDefault = (existingCount: number, requested: boolean) => existingCount === 0 || requested

/** One line for lists: "Street, details, Area". */
export function addressLine(a: { street: string; details: string | null; area: string | null }) {
  return [a.street, a.details, a.area].filter((p): p is string => !!p && p.trim() !== "").join(", ")
}
