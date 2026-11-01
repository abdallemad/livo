import "server-only"
import { randomUUID } from "node:crypto"
import { API_ROUTES } from "@/constants/api-routes"
import { MAX_CERTIFICATES } from "@/constants/onboarding"
import type { VerificationStatus as BannerStatus } from "@/constants/status"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { sendOpsAlert } from "@/lib/ops-alerts"
import { onboardingRepository as docs } from "@/repositories/onboarding.repository"
import { providerAccountRepository as repo } from "@/repositories/provider-account.repository"
import type { DocumentType } from "@/schemas/onboarding.schema"
import { getEntityHistory } from "@/services/audit.service"
import { DOCUMENT_PREFIX, removeObject, storePrivate, validateUpload } from "@/services/file-upload.service"
import type { ProviderVerification, VerificationDocumentDto } from "@/types/provider-account"
import { EXTENSION_BY_TYPE } from "@/utils/file-signature"
import { resubmitBlockedReason, VERIFICATION_STATUS_TEXT, verificationAccess } from "@/utils/verification"

/**
 * `/provider/verification` (PR-02, PR-03; docs/provider-verification-settings-feature.md): the account's
 * status and reason, its documents, and what the provider may change for that status
 * (`utils/verification.ts`). The one provider-driven transition is **resubmit** (REJECTED → PENDING).
 * Documents use the same private storage, validation and owner-only previews as onboarding.
 */

const toDocDto = (d: { id: string; type: VerificationDocumentDto["type"]; createdAt: Date; file: { id: string; mimeType: string; sizeBytes: number } }): VerificationDocumentDto => ({
  id: d.id,
  type: d.type,
  mimeType: d.file.mimeType,
  sizeBytes: d.file.sizeBytes,
  previewUrl: API_ROUTES.onboarding.file(d.file.id),
  uploadedAt: d.createdAt.toISOString(),
})

const docCounts = (list: { type: string }[]) => ({
  nationalId: list.filter((d) => d.type === "NATIONAL_ID").length,
  selfie: list.filter((d) => d.type === "SELFIE").length,
})

async function load(providerId: string) {
  const profile = await repo.findVerification(providerId)
  if (!profile) throw new NotFoundError("This account has no provider profile.")
  return profile
}

export async function getVerification(providerId: string): Promise<ProviderVerification | null> {
  const [profile, history] = await Promise.all([repo.findVerification(providerId), getEntityHistory("ProviderProfile", providerId)])
  if (!profile) return null
  const status = profile.verificationStatus
  return {
    status,
    statusText: VERIFICATION_STATUS_TEXT[status],
    reason: status === "REJECTED" || status === "SUSPENDED" ? profile.rejectionReason : null,
    reviewedAt: profile.reviewedAt?.toISOString() ?? null,
    documents: profile.documents.map(toDocDto),
    access: verificationAccess(status),
    resubmitBlockedReason: resubmitBlockedReason(status, docCounts(profile.documents)),
    maxCertificates: MAX_CERTIFICATES,
    history,
  }
}

function assertCanEdit(status: Parameters<typeof verificationAccess>[0], type: DocumentType) {
  const access = verificationAccess(status)
  const allowed = type === "CERTIFICATE" ? access.canEditCertificates : access.canEditIdentity
  if (!allowed) {
    throw new ConflictError(
      type === "CERTIFICATE"
        ? "Certificates can't be changed while your account is under review or suspended."
        : "Your ID and selfie can only be changed when your application needs fixing.",
    )
  }
}

/** NATIONAL_ID / SELFIE replace the previous one; certificates add up to MAX_CERTIFICATES. Audited. */
export async function uploadVerificationDocument(providerId: string, type: DocumentType, file: Blob): Promise<VerificationDocumentDto> {
  const profile = await load(providerId)
  assertCanEdit(profile.verificationStatus, type)
  const upload = await validateUpload(file, type === "CERTIFICATE")
  const existing = await docs.findDocuments(providerId, type)
  if (type === "CERTIFICATE" && existing.length >= MAX_CERTIFICATES) {
    throw new ValidationError("Limit reached.", { file: [`You can upload at most ${MAX_CERTIFICATES} certificates.`] })
  }
  const key = `${DOCUMENT_PREFIX(providerId)}${randomUUID()}.${EXTENSION_BY_TYPE[upload.type]}`
  await storePrivate(key, upload)

  const doc = await docs.transaction(async (tx) => {
    if (type !== "CERTIFICATE") for (const old of existing) await docs.deleteDocument(old.id, old.fileId, tx)
    const created = await docs.createDocument(providerId, type, { key, mimeType: upload.type, sizeBytes: upload.bytes.byteLength, sha256: upload.sha256 }, tx)
    await docs.createAuditLog(
      { actorId: providerId, action: "provider.document_upload", entityType: "ProviderProfile", entityId: providerId, metadata: { type, replaced: type !== "CERTIFICATE" && existing.length > 0 } },
      tx,
    )
    return created
  })
  if (type !== "CERTIFICATE") for (const old of existing) await removeObject(old.file.key)
  return toDocDto({ id: doc.id, type: doc.type, createdAt: doc.createdAt, file: doc.file })
}

export async function deleteVerificationDocument(providerId: string, documentId: string): Promise<void> {
  const profile = await load(providerId)
  const doc = await docs.findDocumentById(documentId)
  // Same answer for "not yours" and "doesn't exist": never confirm other users' ids.
  if (!doc || doc.providerId !== providerId) throw new NotFoundError("Document not found.")
  assertCanEdit(profile.verificationStatus, doc.type as DocumentType)
  await docs.transaction(async (tx) => {
    await docs.deleteDocument(doc.id, doc.fileId, tx)
    await docs.createAuditLog({ actorId: providerId, action: "provider.document_delete", entityType: "ProviderProfile", entityId: providerId, metadata: { type: doc.type } }, tx)
  })
  await removeObject(doc.file.key)
}

/** REJECTED → PENDING after fixing the documents. Conditional, audited; admins and the provider are notified. */
export async function resubmitVerification(providerId: string): Promise<{ status: "PENDING" }> {
  await docs.transaction(async (tx) => {
    const profile = await repo.findVerification(providerId, tx)
    if (!profile) throw new NotFoundError("This account has no provider profile.")
    const blocked = resubmitBlockedReason(profile.verificationStatus, docCounts(profile.documents))
    if (blocked) throw new ConflictError(blocked)
    if ((await repo.resubmit(providerId, tx)) === 0) throw new ConflictError("Your application just changed. Reload to see the latest.")

    const admins = await docs.findAdminIds(tx)
    await docs.createNotifications(
      [
        ...admins.map((a) => ({
          userId: a.id,
          type: "PROVIDER_DECISION" as const,
          title: "A provider sent their application again",
          body: profile.user.name,
          payload: { providerId },
        })),
        { userId: providerId, type: "PROVIDER_DECISION" as const, title: "We've received your updated application", body: "We'll review it again and let you know the result." },
      ],
      tx,
    )
    await docs.createAuditLog(
      { actorId: providerId, action: "provider.resubmit", entityType: "ProviderProfile", entityId: providerId, metadata: { from: "REJECTED", to: "PENDING", previousReason: profile.rejectionReason } },
      tx,
    )
  })
  await sendOpsAlert({ kind: "provider.resubmitted_for_review", providerId })
  return { status: "PENDING" }
}

/**
 * The status for the provider zone's banner (`VerificationBanner` speaks the UI vocabulary:
 * APPROVED = "ACTIVE", which renders nothing). `null` for an admin with no provider profile.
 */
export async function getBannerStatus(providerId: string): Promise<BannerStatus | null> {
  const row = await repo.findVerificationStatus(providerId)
  if (!row) return null
  const map: Record<string, BannerStatus> = { APPROVED: "ACTIVE", PENDING: "PENDING", DRAFT: "PENDING", REJECTED: "REJECTED", SUSPENDED: "SUSPENDED" }
  return map[row.verificationStatus]
}
