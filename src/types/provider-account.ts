import type { VerificationStatus } from "@prisma/client"
import type { AuditEntryDto } from "./admin"
import type { VerificationAccess } from "@/utils/verification"

/** Provider verification (PR-02, PR-03) and settings (AU-06) — docs/provider-verification-settings-feature.md. */

export interface VerificationDocumentDto {
  id: string
  type: "NATIONAL_ID" | "SELFIE" | "CERTIFICATE" | "OTHER"
  mimeType: string
  sizeBytes: number
  /** Owner-only signed preview (`/api/onboarding/files/[id]`). */
  previewUrl: string
  uploadedAt: string
}

export interface ProviderVerification {
  status: VerificationStatus
  statusText: string
  /** The reason the provider currently sees (rejection or suspension). */
  reason: string | null
  reviewedAt: string | null
  documents: VerificationDocumentDto[]
  access: VerificationAccess
  /** `null` = "Send for review again" is allowed. */
  resubmitBlockedReason: string | null
  maxCertificates: number
  /** Submissions and decisions, newest first. */
  history: AuditEntryDto[]
}

export interface SettingsOption {
  id: string
  name: string
  /** Categories: the parent's name for a sub-category. */
  group?: string | null
}

export interface ProviderSettings {
  personal: { name: string; email: string | null; phone: string | null; avatarUrl: string | null; city: string | null }
  work: { bio: string; yearsExperience: number | null; categoryIds: string[]; areaIds: string[] }
  options: { categories: SettingsOption[]; areas: SettingsOption[] }
  verificationStatus: VerificationStatus
}
