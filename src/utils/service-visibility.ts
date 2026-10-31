/**
 * Why a fixed-price service is (or isn't) visible to visitors — pure, so the
 * admin list and the public catalog explain it the same way, and it is unit
 * tested (docs/admin-catalog-feature.md). The first failing rule wins, in the
 * order an admin would act on it.
 */
export type ServiceVisibilityState = "LIVE" | "PROVIDER_OFF" | "HIDDEN_BY_ADMIN" | "PROVIDER_INACTIVE" | "CATEGORY_OFF"

export interface ServiceVisibilityInput {
  isActive: boolean
  hiddenByAdmin: boolean
  providerApproved: boolean
  providerAccountActive: boolean
  categoryActive: boolean
  /** null for a top-level category. */
  parentCategoryActive: boolean | null
}

export function serviceVisibility(s: ServiceVisibilityInput): ServiceVisibilityState {
  if (s.hiddenByAdmin) return "HIDDEN_BY_ADMIN"
  if (!s.providerApproved || !s.providerAccountActive) return "PROVIDER_INACTIVE"
  if (!s.categoryActive || s.parentCategoryActive === false) return "CATEGORY_OFF"
  if (!s.isActive) return "PROVIDER_OFF"
  return "LIVE"
}

export const SERVICE_VISIBILITY_LABEL: Record<ServiceVisibilityState, string> = {
  LIVE: "Live",
  PROVIDER_OFF: "Off (by provider)",
  HIDDEN_BY_ADMIN: "Hidden by admin",
  PROVIDER_INACTIVE: "Provider not active",
  CATEGORY_OFF: "Category off",
}
