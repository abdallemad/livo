import "server-only"
import { NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { commissionRepository as repo } from "@/repositories/commission.repository"
import type { AdminCommissionCategory, AdminCommissionChange, AdminCommissionSettings } from "@/types/admin"
import { resolveCommissionRate } from "@/utils/commission"

/**
 * Commission settings for admins (AD-06, BR-01, docs/admin-commission-payouts-feature.md):
 * one platform-wide rate plus optional per-category overrides (a sub-category inherits its
 * parent's). Every change is audited with `from` / `to`. Bookings freeze their rate at
 * confirmation, so a change never rewrites history — only bookings confirmed afterwards use it.
 * Callers must already have passed `requireAdmin()` or the admin layout gate.
 */

const num = (value: { toString(): string }) => Number(value.toString())
const label = (c: { nameEn: string | null; nameAr: string }) => c.nameEn ?? c.nameAr
const HISTORY_SIZE = 15

/** Used when the seed / migration hasn't created the global row yet. Matches `prisma/seed.ts`. */
export const DEFAULT_GLOBAL_RATE = 10

const numOrNull = (v: unknown) => (typeof v === "number" ? v : null)

export async function getCommissionSettings(): Promise<AdminCommissionSettings> {
  const [global, overrides, categories, history] = await Promise.all([
    repo.findGlobal(),
    repo.findOverrides(),
    repo.findCategories(),
    repo.findHistory(HISTORY_SIZE),
  ])
  const globalRate = global ? num(global.ratePercent) : DEFAULT_GLOBAL_RATE
  const rules = overrides.map((o) => ({ categoryId: o.categoryId!, ratePercent: num(o.ratePercent), isActive: o.isActive }))
  const ownRate = new Map(rules.filter((r) => r.isActive).map((r) => [r.categoryId, r.ratePercent]))
  const names = new Map(categories.map((c) => [c.id, label(c)]))

  const toDto = (c: (typeof categories)[number]): AdminCommissionCategory => {
    const resolved = resolveCommissionRate(c, rules, globalRate)
    return {
      id: c.id,
      name: label(c),
      parentId: c.parentId,
      parentName: c.parentId ? (names.get(c.parentId) ?? null) : null,
      isActive: c.isActive,
      overrideRate: ownRate.get(c.id) ?? null,
      effectiveRate: resolved.rate,
      source: resolved.source,
    }
  }
  // Parents first, each followed by its children (orphans, if any, at the end).
  const parents = categories.filter((c) => !c.parentId)
  const ordered = parents.flatMap((p) => [p, ...categories.filter((c) => c.parentId === p.id)])
  const rest = categories.filter((c) => !ordered.includes(c))

  return {
    globalRate,
    globalUpdatedAt: global?.updatedAt.toISOString() ?? null,
    categories: [...ordered, ...rest].map(toDto),
    history: history.map((h): AdminCommissionChange => {
      const m = (h.metadata ?? {}) as Record<string, unknown>
      return {
        id: h.id,
        action: h.action,
        actor: h.actor?.name || null,
        categoryName: typeof m.categoryName === "string" ? m.categoryName : null,
        from: numOrNull(m.from),
        to: numOrNull(m.to),
        createdAt: h.createdAt.toISOString(),
      }
    }),
  }
}

export async function updateGlobalRate(adminId: string, ratePercent: number): Promise<{ ratePercent: number }> {
  return repo.transaction(async (tx) => {
    const current = await repo.findGlobal(tx)
    const from = current ? num(current.ratePercent) : null
    if (from === ratePercent) return { ratePercent }
    const row = current ? await repo.update(current.id, ratePercent, adminId, tx) : await repo.createGlobal(ratePercent, adminId, tx)
    await auditRepository.createAuditLog(
      { actorId: adminId, action: "commission.update_global", entityType: "CommissionSetting", entityId: row.id, metadata: { from, to: ratePercent } },
      tx,
    )
    return { ratePercent }
  })
}

export async function setCategoryRate(adminId: string, categoryId: string, ratePercent: number): Promise<{ categoryId: string; ratePercent: number }> {
  return repo.transaction(async (tx) => {
    const category = await repo.findCategory(categoryId, tx)
    if (!category) throw new NotFoundError("That category no longer exists.")
    const current = await repo.findOverride(categoryId, tx)
    const from = current?.isActive ? num(current.ratePercent) : null
    if (from === ratePercent) return { categoryId, ratePercent }
    const row = await repo.upsertOverride(categoryId, ratePercent, adminId, tx)
    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: "commission.set_category",
        entityType: "CommissionSetting",
        entityId: row.id,
        metadata: { categoryId, categoryName: label(category), from, to: ratePercent },
      },
      tx,
    )
    return { categoryId, ratePercent }
  })
}

export async function clearCategoryRate(adminId: string, categoryId: string): Promise<{ categoryId: string }> {
  return repo.transaction(async (tx) => {
    const [category, current] = await Promise.all([repo.findCategory(categoryId, tx), repo.findOverride(categoryId, tx)])
    if (!category || !current) throw new NotFoundError("This category has no rate of its own.")
    await repo.deleteOverride(categoryId, tx)
    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: "commission.clear_category",
        entityType: "CommissionSetting",
        entityId: current.id,
        metadata: { categoryId, categoryName: label(category), from: num(current.ratePercent), to: null },
      },
      tx,
    )
    return { categoryId }
  })
}
