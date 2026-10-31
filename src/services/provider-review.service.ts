import "server-only"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { providerRepository as repo } from "@/repositories/provider.repository"
import type { ProviderDecisionValues } from "@/schemas/admin.schema"
import type { ProviderDecisionDto } from "@/types/admin"

/**
 * AD-01: an admin approves or rejects a provider application. Only a PENDING
 * application can be decided; the status change, the audit entry (AD-11) and
 * the provider's notification commit together. Approving makes the provider
 * (and their services) publicly visible, so the route revalidates the storefront.
 */
export async function decideProvider(
  adminId: string,
  providerId: string,
  input: ProviderDecisionValues,
): Promise<ProviderDecisionDto> {
  const approve = input.decision === "APPROVE"
  const to = approve ? "APPROVED" : "REJECTED"
  const reason = approve ? null : input.reason
  const now = new Date()

  return repo.transaction(async (tx) => {
    const changed = await repo.setVerificationStatus(
      providerId,
      "PENDING",
      { to, reviewedById: adminId, reviewedAt: now, rejectionReason: reason },
      tx,
    )
    if (changed === 0) {
      const current = await repo.findVerificationStatus(providerId, tx)
      if (!current) throw new NotFoundError("That provider application no longer exists.")
      throw new ConflictError("This application has already been reviewed.")
    }

    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: approve ? "provider.approve" : "provider.reject",
        entityType: "ProviderProfile",
        entityId: providerId,
        metadata: reason ? { reason } : undefined,
      },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId: providerId,
        type: "PROVIDER_DECISION",
        title: approve ? "Your provider account is approved" : "Your provider application was not approved",
        body: approve ? "You can now receive requests and bookings." : reason,
        payload: { verificationStatus: to },
      },
      tx,
    )

    return { id: providerId, verificationStatus: to }
  })
}
