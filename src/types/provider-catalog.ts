import type { VerificationStatus } from "@prisma/client"
import type { ServiceVisibilityState } from "@/utils/service-visibility"

/**
 * The provider's services (PR-05) and portfolio (PR-04) — docs/provider-services-portfolio-feature.md.
 * Photos are private objects: `previewUrl` is the owner-only `/api/provider/files/[id]` route (a
 * short-lived signed redirect), never a public URL.
 */

export interface UploadedFileDto {
  id: string
  mimeType: string
  sizeBytes: number
  previewUrl: string
}

export interface ProviderServiceCategoryOption {
  id: string
  name: string
  parentName: string | null
}

export interface ProviderServiceListItem {
  id: string
  slug: string
  title: string
  category: string
  price: number
  durationMinutes: number | null
  isActive: boolean
  visibility: ServiceVisibilityState
  /** One sentence for the provider (`serviceStatusText`). */
  statusText: string
  coverUrl: string | null
  imageCount: number
  bookingCount: number
  /** `null` = can be deleted. */
  deleteBlockedReason: string | null
  updatedAt: string
}

export interface ProviderServiceList {
  items: ProviderServiceListItem[]
  verificationStatus: VerificationStatus | null
  max: number
  /** Categories the provider may list fixed-price services in; empty = quote-only trades. */
  categories: ProviderServiceCategoryOption[]
}

export interface ProviderServiceDetail extends ProviderServiceListItem {
  categoryId: string
  description: string
  images: UploadedFileDto[]
  hiddenByAdminReason: string | null
}

/** Everything the new / edit form needs. */
export interface ProviderServiceFormData {
  providerName: string
  categories: ProviderServiceCategoryOption[]
  /** Uploaded but not yet attached to any service (e.g. from an abandoned form). */
  pendingImages: UploadedFileDto[]
  service: ProviderServiceDetail | null
}

export interface PortfolioItemDto {
  id: string
  title: string
  description: string | null
  sortOrder: number
  images: UploadedFileDto[]
  createdAt: string
}

export interface ProviderPortfolio {
  items: PortfolioItemDto[]
  pendingImages: UploadedFileDto[]
  max: number
  maxImages: number
}
