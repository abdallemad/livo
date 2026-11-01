/**
 * Which commission rate applies to a category (AD-06, BR-01) — pure and tested
 * (docs/admin-commission-payouts-feature.md).
 *
 *  1. the category's own active override,
 *  2. else its parent's active override (a sub-category inherits),
 *  3. else the platform-wide (global) rate.
 *
 * The rate is frozen onto each booking at confirmation (`Booking.commissionRate`), so changing a
 * setting only affects bookings confirmed afterwards — never history.
 */

export const COMMISSION_MIN = 0
export const COMMISSION_MAX = 50

export type CommissionSource = "CATEGORY" | "PARENT" | "GLOBAL"

export interface CommissionOverride {
  categoryId: string
  ratePercent: number
  isActive: boolean
}

export interface ResolvedCommission {
  rate: number
  source: CommissionSource
}

export function resolveCommissionRate(
  category: { id: string; parentId: string | null },
  overrides: CommissionOverride[],
  globalRate: number,
): ResolvedCommission {
  const active = new Map(overrides.filter((o) => o.isActive).map((o) => [o.categoryId, o.ratePercent]))
  const own = active.get(category.id)
  if (own !== undefined) return { rate: own, source: "CATEGORY" }
  const parent = category.parentId ? active.get(category.parentId) : undefined
  if (parent !== undefined) return { rate: parent, source: "PARENT" }
  return { rate: globalRate, source: "GLOBAL" }
}

/** Commission and provider net for an amount at a rate, rounded to piastres (the booking snapshot, BR-01). */
export function splitAmount(amount: number, ratePercent: number) {
  const commission = Math.round(amount * ratePercent) / 100
  return { commission, providerNet: Math.round((amount - commission) * 100) / 100 }
}
