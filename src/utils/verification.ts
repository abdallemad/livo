import type { VerificationStatus } from "@prisma/client"

/**
 * What a provider may do on `/provider/verification` for each account status (PR-02, PR-03;
 * docs/provider-verification-settings-feature.md) — pure, used by the page (which controls to show)
 * and the service (what to refuse), and tested.
 *
 *   DRAFT ──(onboarding submit)──▶ PENDING ──approve──▶ APPROVED ──suspend──▶ SUSPENDED
 *                                     │  ▲                  ▲                     │
 *                                  reject│  └──resubmit──┐   └─────reinstate───────┘
 *                                     ▼                  │
 *                                  REJECTED ─────────────┘
 *
 * The only provider-driven transition here is **resubmit** (REJECTED → PENDING); every other one is an
 * admin decision (docs/admin-providers-users-feature.md) or the onboarding wizard.
 */

export interface VerificationAccess {
  /** Replace the national ID / selfie. Changing identity on an active account would skip review, so only while REJECTED. */
  canEditIdentity: boolean
  /** Add / remove certificates (they add trust but don't change the status). */
  canEditCertificates: boolean
  canResubmit: boolean
  /** Where to send a DRAFT provider (they never finished the wizard). */
  continueOnboarding: boolean
}

export function verificationAccess(status: VerificationStatus): VerificationAccess {
  return {
    canEditIdentity: status === "REJECTED",
    canEditCertificates: status === "REJECTED" || status === "APPROVED",
    canResubmit: status === "REJECTED",
    continueOnboarding: status === "DRAFT",
  }
}

/** `null` when the provider may send the account for review again, otherwise why not. */
export function resubmitBlockedReason(status: VerificationStatus, docs: { nationalId: number; selfie: number }): string | null {
  if (status !== "REJECTED") return status === "PENDING" ? "Your account is already being reviewed." : "Only a rejected application can be sent again."
  if (docs.nationalId < 1 || docs.selfie < 1) return "Upload your national ID and a selfie first."
  return null
}

/** One sentence per status, in the provider's words (the badge says the status itself). */
export const VERIFICATION_STATUS_TEXT: Record<VerificationStatus, string> = {
  DRAFT: "You haven't finished signing up. Complete your profile and send your documents.",
  PENDING: "We're checking your details and documents. You'll get a notification with the result.",
  APPROVED: "Your account is verified. Customers can find and book you.",
  REJECTED: "Your application wasn't approved. Fix what we asked for below, then send it again.",
  SUSPENDED: "Your account is suspended, so customers can't find or book you. Contact support to find out more.",
}

export const DOCUMENT_LABEL = { NATIONAL_ID: "National ID", SELFIE: "Selfie", CERTIFICATE: "Certificate", OTHER: "Other document" } as const
