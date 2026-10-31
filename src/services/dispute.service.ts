import "server-only"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { disputeRepository as repo } from "@/repositories/dispute.repository"
import type { DisputeStatusDto } from "@/types/admin"

/**
 * AD-05 dispute handling. The dashboard only moves a dispute OPEN →
 * UNDER_REVIEW ("I'm on it"); resolution (refund / release) is a money
 * operation and lives on the dispute detail page.
 */
export async function startDisputeReview(adminId: string, disputeId: string): Promise<DisputeStatusDto> {
  return repo.transaction(async (tx) => {
    const dispute = await repo.findById(disputeId, tx)
    if (!dispute) throw new NotFoundError("That dispute no longer exists.")
    if ((await repo.setStatus(disputeId, "OPEN", "UNDER_REVIEW", tx)) === 0) {
      throw new ConflictError("This dispute is already being reviewed or has been resolved.")
    }

    await auditRepository.createAuditLog(
      { actorId: adminId, action: "dispute.start_review", entityType: "Dispute", entityId: disputeId },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId: dispute.openedById,
        type: "DISPUTE_UPDATE",
        title: `We're reviewing your dispute on booking ${dispute.booking.number}`,
        body: "Our team will contact both sides and post the outcome here.",
        payload: { disputeId, bookingId: dispute.booking.id },
      },
      tx,
    )

    return { id: disputeId, status: "UNDER_REVIEW" }
  })
}
