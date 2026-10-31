import "server-only"
import { auditRepository } from "@/repositories/audit.repository"
import type { AuditEntryDto } from "@/types/admin"

/** Reads of the audit trail (AD-11) for admin detail pages. Writes happen inside each feature's transaction. */
const HISTORY_SIZE = 20

export const reasonOf = (metadata: unknown): string | null =>
  metadata && typeof metadata === "object" && "reason" in metadata && typeof metadata.reason === "string"
    ? metadata.reason
    : null

export async function getEntityHistory(entityType: string, entityId: string): Promise<AuditEntryDto[]> {
  const rows = await auditRepository.findForEntity(entityType, entityId, HISTORY_SIZE)
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actor: r.actor?.name || null,
    reason: reasonOf(r.metadata),
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function getLatestReason(entityType: string, entityId: string, action: string): Promise<string | null> {
  const row = await auditRepository.findLatest(entityType, entityId, action)
  return row ? reasonOf(row.metadata) : null
}
