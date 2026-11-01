import "server-only"
import { randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"
import { API_ROUTES } from "@/constants/api-routes"
import { SERVICE_MAX_IMAGES } from "@/constants/onboarding"
import { SERVICES_MAX_PER_PROVIDER } from "@/constants/provider-catalog"
import { ConflictError, DependencyError, NotFoundError, ValidationError } from "@/lib/errors"
import { providerCatalogRepository as repo, type ProviderServiceRow } from "@/repositories/provider-catalog.repository"
import type { ServiceFormValues } from "@/schemas/provider-catalog.schema"
import {
  PORTFOLIO_IMAGE_PREFIX,
  removeObject,
  SERVICE_IMAGE_PREFIX,
  signedPreview,
  storePrivate,
  validateUpload,
} from "@/services/file-upload.service"
import type {
  ProviderServiceCategoryOption,
  ProviderServiceDetail,
  ProviderServiceFormData,
  ProviderServiceList,
  ProviderServiceListItem,
  UploadedFileDto,
} from "@/types/provider-catalog"
import { EXTENSION_BY_TYPE } from "@/utils/file-signature"
import { CatalogRuleError, planImageChanges, serviceDeleteBlockedReason, serviceStatusText } from "@/utils/provider-catalog"
import { serviceVisibility } from "@/utils/service-visibility"
import { uniqueSlug } from "@/utils/slug"

/**
 * The provider's fixed-price services (PR-05, docs/provider-services-portfolio-feature.md) and the
 * photo uploads shared with the portfolio. Same field rules as onboarding step 5. The provider id
 * always comes from the session; another provider's service is a 404. Every write that changes
 * what visitors can see calls `revalidateStorefront()` in the route.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (c: { nameEn: string | null; nameAr: string }) => c.nameEn ?? c.nameAr

export const toFileDto = (f: { id: string; mimeType: string; sizeBytes: number }): UploadedFileDto => ({
  id: f.id,
  mimeType: f.mimeType,
  sizeBytes: f.sizeBytes,
  previewUrl: API_ROUTES.provider.file(f.id),
})

type Profile = NonNullable<Awaited<ReturnType<typeof repo.findProfile>>>

async function loadProfile(providerId: string): Promise<Profile> {
  const profile = await repo.findProfile(providerId)
  if (!profile) throw new NotFoundError("This account has no provider profile.")
  return profile
}

/** The provider's own categories that allow fixed prices and are switched on (parent too). */
function serviceCategories(profile: Profile): ProviderServiceCategoryOption[] {
  return profile.categories
    .map((c) => c.category)
    .filter((c) => c.type !== "QUOTE" && c.isActive && c.parent?.isActive !== false)
    .map((c) => ({ id: c.id, name: label(c), parentName: c.parent ? label(c.parent) : null }))
}

function toListItem(s: ProviderServiceRow, profile: Profile): ProviderServiceListItem {
  const visibility = serviceVisibility({
    isActive: s.isActive,
    hiddenByAdmin: s.hiddenByAdminAt !== null,
    providerApproved: profile.verificationStatus === "APPROVED",
    providerAccountActive: profile.user.status === "ACTIVE",
    categoryActive: s.category.isActive,
    parentCategoryActive: s.category.parent ? s.category.parent.isActive : null,
  })
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    category: label(s.category),
    price: num(s.price),
    durationMinutes: s.durationMinutes,
    isActive: s.isActive,
    visibility,
    statusText: serviceStatusText(visibility, s.hiddenByAdminReason),
    coverUrl: s.images[0] ? API_ROUTES.provider.file(s.images[0].id) : null,
    imageCount: s.images.length,
    bookingCount: s._count.bookings,
    deleteBlockedReason: serviceDeleteBlockedReason(s._count.bookings),
    updatedAt: s.updatedAt.toISOString(),
  }
}

const toDetail = (s: ProviderServiceRow, profile: Profile): ProviderServiceDetail => ({
  ...toListItem(s, profile),
  categoryId: s.categoryId,
  description: s.description,
  images: s.images.map(toFileDto),
  hiddenByAdminReason: s.hiddenByAdminReason,
})

export async function listServicesForProvider(providerId: string): Promise<ProviderServiceList> {
  const profile = await repo.findProfile(providerId)
  if (!profile) return { items: [], verificationStatus: null, max: SERVICES_MAX_PER_PROVIDER, categories: [] }
  const rows = await repo.findServices(providerId)
  return {
    items: rows.map((s) => toListItem(s, profile)),
    verificationStatus: profile.verificationStatus,
    max: SERVICES_MAX_PER_PROVIDER,
    categories: serviceCategories(profile),
  }
}

/** Data for `/provider/services/new` (no id) or `/[id]/edit`; `null` when the service isn't theirs → 404. */
export async function getServiceFormData(providerId: string, serviceId?: string): Promise<ProviderServiceFormData | null> {
  const profile = await repo.findProfile(providerId)
  if (!profile) return null
  const [row, pending] = await Promise.all([
    serviceId ? repo.findService(serviceId, providerId) : Promise.resolve(null),
    repo.findPendingFiles(providerId, SERVICE_IMAGE_PREFIX(providerId)),
  ])
  if (serviceId && !row) return null
  return {
    providerName: profile.user.name || "Your name",
    categories: serviceCategories(profile),
    pendingImages: pending.map(toFileDto),
    service: row ? toDetail(row, profile) : null,
  }
}

function checkCategory(profile: Profile, categoryId: string, current?: string) {
  // Keeping the current category is fine even if it was later switched off; choosing a new one isn't.
  if (categoryId === current) return
  if (!serviceCategories(profile).some((c) => c.id === categoryId)) {
    throw new ValidationError("Please check your details.", { categoryId: ["Choose one of your specialties that allows fixed prices."] })
  }
}

function planImages(current: string[], next: string[], pending: string[]) {
  try {
    return planImageChanges(current, next, pending, SERVICE_MAX_IMAGES)
  } catch (error) {
    if (error instanceof CatalogRuleError) throw new ValidationError("Please check the photos.", { imageIds: [error.message] })
    throw error
  }
}

const serviceData = (v: ServiceFormValues) => ({
  title: v.title,
  categoryId: v.categoryId,
  description: v.description,
  price: new Prisma.Decimal(v.price.toFixed(2)),
  durationMinutes: v.durationMinutes,
})

/** Deletes rows inside the transaction, then the objects (best effort) after it committed. */
async function dropFiles(ids: string[], tx: Prisma.TransactionClient) {
  const rows = await repo.findFilesByIds(ids, tx)
  await repo.deleteFiles(ids, tx)
  return rows.map((r) => r.key)
}

export async function createService(providerId: string, values: ServiceFormValues): Promise<{ id: string }> {
  const profile = await loadProfile(providerId)
  checkCategory(profile, values.categoryId)
  return repo.transaction(async (tx) => {
    if ((await repo.countServices(providerId, tx)) >= SERVICES_MAX_PER_PROVIDER) {
      throw new ConflictError(`You can list up to ${SERVICES_MAX_PER_PROVIDER} services. Delete or reuse an old one.`)
    }
    const pending = (await repo.findPendingFiles(providerId, SERVICE_IMAGE_PREFIX(providerId), tx)).map((f) => f.id)
    const plan = planImages([], values.imageIds, pending)
    const slug = await uniqueSlug(values.title, (s) => repo.slugExists(s, tx))
    const service = await repo.createService({ ...serviceData(values), providerId, slug }, tx)
    await repo.attachFiles({ serviceId: service.id }, providerId, plan.attach, tx)
    return service
  })
}

/** Edits everything but the slug: it's the public URL, and services have no redirect table (CLAUDE.md §4.1 rule 11). */
export async function updateService(providerId: string, id: string, values: ServiceFormValues): Promise<{ id: string }> {
  const profile = await loadProfile(providerId)
  const removed = await repo.transaction(async (tx) => {
    const current = await repo.findService(id, providerId, tx)
    if (!current) throw new NotFoundError("That service doesn't exist.")
    checkCategory(profile, values.categoryId, current.categoryId)
    const pending = (await repo.findPendingFiles(providerId, SERVICE_IMAGE_PREFIX(providerId), tx)).map((f) => f.id)
    const plan = planImages(current.images.map((i) => i.id), values.imageIds, pending)
    await repo.updateService(id, providerId, serviceData(values), tx)
    const keys = await dropFiles(plan.remove, tx)
    await repo.attachFiles({ serviceId: id }, providerId, plan.attach, tx)
    return keys
  })
  await Promise.all(removed.map(removeObject))
  return { id }
}

/** The provider's own switch. An admin-hidden service stays hidden either way (AD-02). */
export async function setServiceActive(providerId: string, id: string, isActive: boolean): Promise<{ id: string; isActive: boolean }> {
  const count = await repo.transaction((tx) => repo.updateService(id, providerId, { isActive }, tx))
  if (count === 0) throw new NotFoundError("That service doesn't exist.")
  return { id, isActive }
}

export async function deleteService(providerId: string, id: string): Promise<void> {
  const keys = await repo.transaction(async (tx) => {
    const current = await repo.findService(id, providerId, tx)
    if (!current) throw new NotFoundError("That service doesn't exist.")
    const blocked = serviceDeleteBlockedReason(current._count.bookings)
    if (blocked) throw new DependencyError(blocked)
    const fileKeys = current.images.map((i) => i.key)
    // Conditional on "still no bookings", so a booking made a moment ago wins.
    if ((await repo.deleteServiceWithoutBookings(id, providerId, tx)) === 0) {
      throw new DependencyError("This service just got a booking, so it can't be deleted. Switch it off instead.")
    }
    return fileKeys // File rows cascade with the service
  })
  await Promise.all(keys.map(removeObject))
}

// ----------------------------------------------------------------------------
// Photos (services + portfolio)
// ----------------------------------------------------------------------------

export type UploadKind = "service" | "portfolio"
const PREFIX: Record<UploadKind, (userId: string) => string> = { service: SERVICE_IMAGE_PREFIX, portfolio: PORTFOLIO_IMAGE_PREFIX }

/**
 * Upload a photo before the service / portfolio item is saved; it's attached on save. Pending +
 * attached photos are capped per prefix so nobody can park unlimited files.
 */
export async function uploadProviderImage(providerId: string, kind: UploadKind, file: Blob, cap: number): Promise<UploadedFileDto> {
  await loadProfile(providerId)
  const upload = await validateUpload(file, false)
  const prefix = PREFIX[kind](providerId)
  if ((await repo.countFiles(providerId, prefix)) >= cap) {
    throw new ValidationError("Limit reached.", { file: ["You have too many photos. Delete some old ones first."] })
  }
  const key = `${prefix}${randomUUID()}.${EXTENSION_BY_TYPE[upload.type]}`
  await storePrivate(key, upload)
  return toFileDto(await repo.createFile({ key, mimeType: upload.type, sizeBytes: upload.bytes.byteLength, sha256: upload.sha256, uploadedById: providerId }))
}

/** Delete a photo that isn't attached yet. Attached photos are removed by saving the form without them. */
export async function deletePendingImage(providerId: string, kind: UploadKind, fileId: string): Promise<void> {
  const file = await repo.findOwnFile(fileId, providerId)
  if (!file || !file.key.startsWith(PREFIX[kind](providerId))) throw new NotFoundError("Photo not found.")
  if (file.serviceId || file.portfolioItemId) throw new ConflictError("Remove the photo in the form and save instead.")
  await repo.deleteFiles([file.id])
  await removeObject(file.key)
}

/** Owner-only preview of a service or portfolio photo: a 5-minute signed link. Documents are never served here. */
export async function getProviderFilePreviewUrl(providerId: string, fileId: string): Promise<string> {
  const file = await repo.findOwnFile(fileId, providerId)
  const allowed = file && (file.key.startsWith(SERVICE_IMAGE_PREFIX(providerId)) || file.key.startsWith(PORTFOLIO_IMAGE_PREFIX(providerId)))
  if (!file || !allowed) throw new NotFoundError("File not found.")
  return signedPreview(file.key, file.mimeType)
}
