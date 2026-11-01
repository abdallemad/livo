import "server-only"
import { randomUUID } from "node:crypto"
import { API_ROUTES } from "@/constants/api-routes"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { newRequestRepository as repo } from "@/repositories/new-request.repository"
import type { NewRequestValues } from "@/schemas/customer.schema"
import { REQUEST_IMAGE_PREFIX, removeObject, signedPreview, storePrivate, validateUpload } from "@/services/file-upload.service"
import type { NewRequestFormData, RequestPhotoDto } from "@/types/customer"
import { EXTENSION_BY_TYPE } from "@/utils/file-signature"
import {
  composeDescription,
  contactProblem,
  expiryDays,
  PREFERRED_DATE_MAX_DAYS,
  preferredDateProblem,
  REQUEST_MAX_PHOTOS,
  requestExpiresAt,
  takesQuotes,
} from "@/utils/new-request"
import { zonedDayStart, zonedIsoDay } from "@/utils/zoned-time"

/**
 * Creating a quote request (CU-03, Flow 2, BR-05, SY-01, SY-04) — docs/customer-new-request-feature.md.
 *
 * The customer id always comes from the session. A request goes straight to OPEN (there is no draft step in the form),
 * expires after `SiteSetting["request.expiryDays"]`, and every matching provider gets a NEW_REQUEST_MATCH notification in
 * the same transaction. Photos are uploaded first (private, under `uploads/requests/<userId>/`) and attached on submit.
 */

const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr
/** Upper bound on notifications per request — the provider inbox (`/provider/requests`) still lists every match. */
const NOTIFY_LIMIT = 200
/** Unattached + attached request photos one customer may keep (abuse cap; attached ones belong to past requests). */
const PHOTO_STORAGE_CAP = 200

const toPhotoDto = (f: { id: string; mimeType: string; sizeBytes: number }): RequestPhotoDto => ({
  id: f.id,
  mimeType: f.mimeType,
  sizeBytes: f.sizeBytes,
  previewUrl: API_ROUTES.customer.file(f.id),
})

export async function getNewRequestFormData(userId: string, categorySlug: string | null, now = new Date()): Promise<NewRequestFormData> {
  const [customer, categories, pending, setting] = await Promise.all([
    repo.findCustomer(userId),
    repo.findActiveCategories(),
    repo.findPendingFiles(userId, REQUEST_IMAGE_PREFIX(userId)),
    repo.findSetting("request.expiryDays"),
  ])
  if (!customer) throw new NotFoundError("Your account wasn't found.")
  const areas = customer.cityId ? await repo.findActiveAreas(customer.cityId) : []
  const quoteCategories = categories.filter((c) => takesQuotes(c.type))
  const today = zonedIsoDay(now)

  return {
    city: customer.city ? label(customer.city) : null,
    categories: quoteCategories.map((c) => ({ id: c.id, name: label(c), parentName: c.parent ? label(c.parent) : null })),
    addresses: customer.addresses
      .filter((a) => !customer.cityId || a.cityId === customer.cityId)
      .map((a) => ({
        id: a.id,
        label: [a.label, a.area ? label(a.area) : null, a.street].filter(Boolean).join(" · "),
        areaId: a.areaId,
        isDefault: a.isDefault,
      })),
    areas: areas.map((a) => ({ id: a.id, name: label(a) })),
    pendingPhotos: pending.slice(0, REQUEST_MAX_PHOTOS).map(toPhotoDto),
    preselectedCategoryId: categorySlug ? (quoteCategories.find((c) => c.slug === categorySlug)?.id ?? null) : null,
    today,
    maxDate: zonedIsoDay(new Date(zonedDayStart(today).getTime() + PREFERRED_DATE_MAX_DAYS * 86_400_000 + 12 * 3_600_000)),
    expiryDays: expiryDays(setting),
  }
}

export async function createRequest(userId: string, values: NewRequestValues, now = new Date()): Promise<{ id: string; notified: number }> {
  const [customer, category, setting] = await Promise.all([repo.findCustomer(userId), repo.findCategory(values.categoryId), repo.findSetting("request.expiryDays")])
  if (!customer) throw new NotFoundError("Your account wasn't found.")
  // The schema already refuses contact details; checked again here so no caller can skip SY-04.
  const titleProblem = contactProblem(values.title)
  const descriptionProblem = contactProblem(values.description)
  if (titleProblem || descriptionProblem) {
    throw new ValidationError(titleProblem ?? descriptionProblem!, {
      ...(titleProblem ? { title: [titleProblem] } : {}),
      ...(descriptionProblem ? { description: [descriptionProblem] } : {}),
    })
  }
  if (!category || !takesQuotes(category.type)) {
    throw new ValidationError("Choose another category.", { categoryId: ["This category takes direct bookings only — pick a fixed-price service instead."] })
  }

  // Where: a saved address of this customer, or an area of their city.
  let cityId = customer.cityId
  let areaId: string | null = null
  let addressId: string | null = null
  if (values.addressId) {
    const address = customer.addresses.find((a) => a.id === values.addressId)
    if (!address) throw new ValidationError("Choose one of your addresses.", { addressId: ["That address isn't in your account."] })
    if (customer.cityId && address.cityId !== customer.cityId) {
      throw new ValidationError("Choose an address in your city.", { addressId: ["Livo works in one city for now."] })
    }
    cityId = address.cityId
    addressId = address.id
    areaId = address.areaId
  } else if (values.areaId) {
    if (!cityId) throw new ValidationError("Add an address first.", { addressId: ["Add an address so providers know where the job is."] })
    const area = await repo.findArea(values.areaId, cityId)
    if (!area) throw new ValidationError("Choose an area.", { areaId: ["That area isn't available."] })
    areaId = area.id
  } else {
    throw new ValidationError("Where is the job?", { addressId: ["Choose one of your addresses or an area."] })
  }
  if (!cityId) throw new ValidationError("Where is the job?", { addressId: ["Choose one of your addresses or an area."] })

  let preferredDate: Date | null = null
  if (values.preferredDate) {
    const problem = preferredDateProblem(values.preferredDate, zonedIsoDay(now))
    if (problem) throw new ValidationError(problem, { preferredDate: [problem] })
    preferredDate = zonedDayStart(values.preferredDate)
  }

  // Photos must be this customer's own unattached request uploads.
  const imageIds = [...new Set(values.imageIds)]
  if (imageIds.length) {
    const pending = new Set((await repo.findPendingFiles(userId, REQUEST_IMAGE_PREFIX(userId))).map((f) => f.id))
    if (imageIds.some((id) => !pending.has(id))) {
      throw new ValidationError("Some photos are no longer available.", { imageIds: ["Remove the missing photos and upload them again."] })
    }
  }

  const categoryIds = [category.id, ...(category.parentId ? [category.parentId] : [])]
  const matches = await repo.findMatchingProviderIds({ cityId, categoryIds, areaId }, NOTIFY_LIMIT)
  const providerIds = matches.map((m) => m.userId).filter((id) => id !== userId)
  const title = values.title.trim()

  return repo.transaction(async (tx) => {
    const request = await repo.createRequest(
      {
        customerId: userId,
        categoryId: category.id,
        cityId,
        areaId,
        addressId,
        title,
        description: composeDescription(values.description, values.sizeM2),
        budget: values.budget ?? null,
        preferredDate,
        status: "OPEN",
        expiresAt: requestExpiresAt(now, expiryDays(setting)),
      },
      tx,
    )
    const attached = await repo.attachImages(request.id, userId, imageIds, tx)
    if (attached.count !== imageIds.length) throw new ConflictError("A photo changed while sending. Try again.")
    await repo.createNotifications(
      providerIds.map((id) => ({
        userId: id,
        type: "NEW_REQUEST_MATCH" as const,
        title: `New request: ${title}`,
        body: `${label(category)} — send a quote before it expires.`,
        payload: { requestId: request.id },
      })),
      tx,
    )
    return { id: request.id, notified: providerIds.length }
  })
}

// --- photos -------------------------------------------------------------------

export async function uploadRequestPhoto(userId: string, file: Blob): Promise<RequestPhotoDto> {
  const upload = await validateUpload(file, false)
  const prefix = REQUEST_IMAGE_PREFIX(userId)
  const [pending, stored] = await Promise.all([repo.findPendingFiles(userId, prefix), repo.countFiles(userId, prefix)])
  if (pending.length >= REQUEST_MAX_PHOTOS) {
    throw new ValidationError("Limit reached.", { file: [`A request can have up to ${REQUEST_MAX_PHOTOS} photos.`] })
  }
  if (stored >= PHOTO_STORAGE_CAP) throw new ValidationError("Limit reached.", { file: ["You've uploaded too many photos. Contact support."] })
  const key = `${prefix}${randomUUID()}.${EXTENSION_BY_TYPE[upload.type]}`
  await storePrivate(key, upload)
  return toPhotoDto(await repo.createFile({ key, mimeType: upload.type, sizeBytes: upload.bytes.byteLength, sha256: upload.sha256, uploadedById: userId }))
}

/** Delete a photo not yet sent with a request. Photos on a sent request stay with it. */
export async function deleteRequestPhoto(userId: string, fileId: string): Promise<void> {
  const file = await repo.findOwnFile(fileId, userId)
  if (!file || !file.key.startsWith(REQUEST_IMAGE_PREFIX(userId))) throw new NotFoundError("Photo not found.")
  if (file.requestId) throw new ConflictError("This photo is part of a sent request.")
  await repo.deleteFile(file.id)
  await removeObject(file.key)
}

/** Owner-only preview of the customer's own request photo: a 5-minute signed link. */
export async function getCustomerFilePreviewUrl(userId: string, fileId: string): Promise<string> {
  const file = await repo.findOwnFile(fileId, userId)
  if (!file || !file.key.startsWith(REQUEST_IMAGE_PREFIX(userId))) throw new NotFoundError("File not found.")
  return signedPreview(file.key, file.mimeType)
}
