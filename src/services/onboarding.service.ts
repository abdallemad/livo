import "server-only"
import { createHash, randomUUID } from "node:crypto"
import { clerkClient } from "@clerk/nextjs/server"
import { Prisma, type File as FileRow } from "@prisma/client"
import { MAX_CERTIFICATES, PROVIDER_TERMS_VERSION, SERVICE_MAX_IMAGES, type OnboardingStep } from "@/constants/onboarding"
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "@/constants/upload"
import { AppError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"
import { sendOpsAlert } from "@/lib/ops-alerts"
import { deleteObject, isR2Configured, presignInline, putPrivateObject } from "@/lib/r2.provider"
import { onboardingRepository as repo, type OnboardingUserRow } from "@/repositories/onboarding.repository"
import type {
  AddressStepValues,
  BasicInfoStepValues,
  DocumentType,
  FirstServiceStepValues,
  InterestsStepValues,
  ProviderProfileStepValues,
  RoleStepValues,
} from "@/schemas/onboarding.schema"
import type {
  OnboardingDocumentDto,
  OnboardingFileDto,
  OnboardingFinishDto,
  OnboardingStateDto,
} from "@/types/onboarding"
import { detectFileType, EXTENSION_BY_TYPE, type DetectedType } from "@/utils/file-signature"
import {
  assertStepEditable,
  canFinish,
  deriveOnboardingState,
  homeFor,
  type OnboardingSnapshot,
  type OnboardingState,
} from "@/utils/onboarding-state"
import { uniqueSlug } from "@/utils/slug"

/**
 * Onboarding business rules (docs/onboarding-feature.md). Every public method
 * takes the user id from the caller (the API route reads it from the Clerk
 * session — never from the body), re-derives the state from the DB, checks
 * the step is editable, then writes. Throws AppError subclasses only and
 * returns DTOs, never Prisma rows.
 */

const SERVICE_IMAGE_PREFIX = (userId: string) => `uploads/services/${userId}/`
const DOCUMENT_PREFIX = (userId: string) => `private/verification/${userId}/`

class StorageUnavailableError extends AppError {
  constructor() {
    super("File uploads aren't available right now. Try again in a little while.", "STORAGE_UNAVAILABLE", 503)
  }
}

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

function toSnapshot(user: OnboardingUserRow): OnboardingSnapshot {
  const p = user.providerProfile
  return {
    role: user.role,
    roleSelectedAt: user.roleSelectedAt,
    onboardingCompletedAt: user.onboardingCompletedAt,
    name: user.name,
    cityId: user.cityId,
    hasDefaultAddress: user.addresses.length > 0,
    interestsCount: user.interests.length,
    provider: p
      ? {
          verificationStatus: p.verificationStatus,
          bio: p.bio,
          yearsExperience: p.yearsExperience,
          categoriesCount: p.categories.length,
          areasCount: p.areas.length,
          documentTypes: p.documents.map((d) => d.type),
          servicesCount: p.services.length,
          canOfferFixedPrice: p.categories.some((c) => c.category.isActive && c.category.type !== "QUOTE"),
        }
      : null,
  }
}

async function loadUser(userId: string) {
  const user = await repo.findUserSnapshot(userId)
  if (!user) throw new NotFoundError("Your account isn't registered yet. Go back to the sign-in page.")
  if (user.status !== "ACTIVE") throw new ForbiddenError("Your account is suspended. Contact support.")
  return user
}

async function loadState(userId: string) {
  const user = await loadUser(userId)
  return { user, state: deriveOnboardingState(toSnapshot(user)) }
}

/** Throws the matching AppError when the user may not save `step` now. */
function guardStep(state: OnboardingState, step: OnboardingStep) {
  const check = assertStepEditable(state, step)
  if (check.ok) return
  if (check.reason === "COMPLETED") throw new ConflictError("You've already finished signing up. You can edit your details from the settings page.")
  if (check.reason === "WRONG_ROLE") throw new ForbiddenError("This step isn't for your account type.")
  throw new ConflictError("Complete the previous steps first.")
}

const filePreviewUrl = (fileId: string) => `/api/onboarding/files/${fileId}`

const toFileDto = (f: FileRow): OnboardingFileDto => ({
  id: f.id,
  mimeType: f.mimeType,
  sizeBytes: f.sizeBytes,
  previewUrl: filePreviewUrl(f.id),
})

export async function getOnboardingState(userId: string): Promise<OnboardingStateDto> {
  const { user, state } = await loadState(userId)
  const [cities, categories, pendingImages] = await Promise.all([
    repo.findActiveCities(),
    repo.findActiveCategories(),
    repo.findPendingServiceImages(userId, SERVICE_IMAGE_PREFIX(userId)),
  ])
  const p = user.providerProfile
  const address = user.addresses[0] ?? null
  const service = p?.services[0] ?? null

  return {
    role: state.role,
    completed: state.completed,
    steps: [...state.steps],
    currentStep: state.currentStep,
    doneSteps: state.doneSteps,
    verificationStatus: p?.verificationStatus ?? null,
    phone: user.phone,
    basic: {
      name: user.name,
      email: user.email ?? "",
      cityId: user.cityId ?? "",
      // A provider's primary area is their first coverage area.
      areaId: (state.role === "PROVIDER" ? p?.areas[0]?.areaId : address?.areaId) ?? "",
    },
    address: address
      ? { areaId: address.areaId ?? "", street: address.street, details: address.details ?? "" }
      : null,
    interests: user.interests.map((i) => i.categoryId),
    profile: p
      ? {
          bio: p.bio ?? "",
          yearsExperience: p.yearsExperience,
          categoryIds: p.categories.map((c) => c.categoryId),
          areaIds: p.areas.map((a) => a.areaId),
        }
      : null,
    documents: (p?.documents ?? []).map(
      (d): OnboardingDocumentDto => ({ ...toFileDto(d.file), type: d.type })
    ),
    service: service
      ? {
          id: service.id,
          title: service.title,
          categoryId: service.categoryId,
          description: service.description,
          price: Number(service.price),
          durationMinutes: service.durationMinutes ?? 60,
          images: service.images.map(toFileDto),
        }
      : null,
    pendingServiceImages: pendingImages.map(toFileDto),
    options: {
      cities: cities.map((c) => ({
        id: c.id,
        name: c.nameEn ?? c.nameAr,
        areas: c.areas.map((a) => ({ id: a.id, name: a.nameEn ?? a.nameAr })),
      })),
      // Children of an inactive parent are hidden too.
      categories: categories
        .filter((c) => !c.parent || c.parent.isActive)
        .map((c) => ({
          id: c.id,
          name: c.nameEn ?? c.nameAr,
          parentName: c.parent ? (c.parent.nameEn ?? c.parent.nameAr) : null,
          allowsFixedPrice: c.type !== "QUOTE",
        })),
    },
  }
}

// ----------------------------------------------------------------------------
// Steps
// ----------------------------------------------------------------------------

/** Step 1. Allowed until onboarding is completed; ADMIN can't reach here (schema enum + this guard). */
export async function saveRole(userId: string, values: RoleStepValues) {
  const { user, state } = await loadState(userId)
  if (user.role === "ADMIN") throw new ForbiddenError("Admin accounts don't go through sign-up.")
  guardStep(state, "role")
  // Switching back from PROVIDER keeps the DRAFT profile: nothing of it is public, and
  // switching again restores it. It's never APPROVED without an admin.
  await repo.setRole(userId, values.role, new Date())
  return getOnboardingState(userId)
}

/**
 * Step 2. Saves name/email/city on the user. For providers the area is
 * required and becomes their first coverage area, which needs the DRAFT
 * profile, so the profile is created here rather than in step 3.
 * The name is mirrored to Clerk because the UI reads names from Clerk (CLAUDE.md §5).
 */
export async function saveBasicInfo(userId: string, values: BasicInfoStepValues) {
  const { state } = await loadState(userId)
  guardStep(state, "basic")

  const city = await repo.findActiveCity(values.cityId)
  if (!city) throw new ValidationError("Please check your details.", { cityId: ["Choose a city from the list."] })
  if (state.role === "PROVIDER" && !values.areaId) {
    throw new ValidationError("Please check your details.", { areaId: ["Choose the area you work in most."] })
  }
  if (values.areaId && !(await repo.findActiveArea(values.areaId, city.id))) {
    throw new ValidationError("Please check your details.", { areaId: ["Choose an area from the list."] })
  }

  const avatarUrl = await syncNameToClerk(userId, values.name)

  await withUniqueRetry(() =>
    repo.transaction(async (tx) => {
      await repo.updateUser(
        userId,
        { name: values.name, email: values.email, cityId: city.id, ...(avatarUrl ? { avatarUrl } : {}) },
        tx
      )
      if (state.role === "PROVIDER" && values.areaId) {
        await repo.upsertProviderProfile(userId, city.id, tx)
        await repo.setPrimaryArea(userId, city.id, values.areaId, tx)
      }
    })
  )
  return getOnboardingState(userId)
}

/** Customer step 3 (optional): the default address, in the user's city. */
export async function saveAddress(userId: string, values: AddressStepValues) {
  const { user, state } = await loadState(userId)
  guardStep(state, "address")
  if (!user.cityId) throw new ConflictError("Choose your city in the previous step first.")
  if (!(await repo.findActiveArea(values.areaId, user.cityId))) {
    throw new ValidationError("Please check your details.", { areaId: ["Choose an area from the list."] })
  }
  await repo.transaction((tx) =>
    repo.replaceDefaultAddress(userId, { cityId: user.cityId!, areaId: values.areaId, street: values.street, details: values.details }, tx)
  )
  return getOnboardingState(userId)
}

/**
 * Customer final step: saves interests (may be empty — the step is optional),
 * creates the CustomerProfile and marks onboarding complete, atomically.
 */
export async function finishCustomer(userId: string, values: InterestsStepValues): Promise<OnboardingFinishDto> {
  const { state } = await loadState(userId)
  guardStep(state, "interests")
  if (!canFinish(state)) throw new ConflictError("Complete your basic details first.")
  const categoryIds = [...new Set(values.categoryIds)]
  if (categoryIds.length && (await repo.countActiveCategories(categoryIds)) !== categoryIds.length) {
    throw new ValidationError("Please check your choices.", { categoryIds: ["One of the categories isn't available. Choose from the list."] })
  }

  await withUniqueRetry(() =>
    repo.transaction(async (tx) => {
      await repo.replaceInterests(userId, categoryIds, tx)
      await repo.upsertCustomerProfile(userId, tx)
      if ((await repo.completeOnboarding(userId, new Date(), tx)) === 0) {
        throw new ConflictError("You've already finished signing up.")
      }
    })
  )
  return { role: "CUSTOMER", redirectTo: homeFor({ role: "CUSTOMER", onboardingCompleted: true }) }
}

/** Provider step 3: bio, experience, categories and coverage areas (all inside the user's city). */
export async function saveProviderProfile(userId: string, values: ProviderProfileStepValues) {
  const { user, state } = await loadState(userId)
  guardStep(state, "profile")
  if (!user.cityId || !user.providerProfile) throw new ConflictError("Complete your basic details first.")

  const categoryIds = [...new Set(values.categoryIds)]
  const areaIds = [...new Set(values.areaIds)]
  const fieldErrors: Record<string, string[]> = {}
  if ((await repo.countActiveCategories(categoryIds)) !== categoryIds.length) {
    fieldErrors.categoryIds = ["One of the specialties isn't available. Choose from the list."]
  }
  if ((await repo.countActiveAreas(areaIds, user.cityId)) !== areaIds.length) {
    fieldErrors.areaIds = ["One of the areas isn't in your city. Choose from the list."]
  }
  if (Object.keys(fieldErrors).length) throw new ValidationError("Please check your details.", fieldErrors)

  await repo.transaction(async (tx) => {
    await repo.updateProviderProfile(userId, { bio: values.bio, yearsExperience: values.yearsExperience }, tx)
    await repo.replaceProviderCategories(userId, categoryIds, tx)
    await repo.replaceProviderAreas(userId, areaIds, tx)
  })
  return getOnboardingState(userId)
}

// ----------------------------------------------------------------------------
// Uploads (documents + service images)
// ----------------------------------------------------------------------------

interface ValidatedUpload {
  bytes: Uint8Array
  type: DetectedType
  sha256: string
}

/** Magic-byte + size validation (CLAUDE.md §7). The browser's mime type and file name are ignored. */
async function validateUpload(file: Blob, allowPdf: boolean): Promise<ValidatedUpload> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = detectFileType(bytes)
  const allowed: readonly string[] = allowPdf ? [...ALLOWED_IMAGE_TYPES, "application/pdf"] : ALLOWED_IMAGE_TYPES
  if (!type || !allowed.includes(type)) {
    throw new ValidationError("Unsupported file type.", {
      file: [allowPdf ? "Upload a photo (JPG, PNG, or WebP) or a PDF." : "Upload a JPG, PNG, or WebP photo."],
    })
  }
  const max = type === "application/pdf" ? MAX_PDF_BYTES : MAX_IMAGE_BYTES
  if (bytes.byteLength > max) {
    throw new ValidationError("The file is too large.", { file: [`The maximum size is ${Math.round(max / 1024 / 1024)} MB.`] })
  }
  return { bytes, type, sha256: createHash("sha256").update(bytes).digest("hex") }
}

async function storePrivate(key: string, upload: ValidatedUpload) {
  if (!isR2Configured()) throw new StorageUnavailableError()
  await putPrivateObject(key, upload.bytes, upload.type)
}

/** Removing a stored object is best effort: a leftover private object is harmless, a failed request isn't. */
async function removeObject(key: string) {
  try {
    if (isR2Configured()) await deleteObject(key)
  } catch (error) {
    console.error("[onboarding] could not delete storage object", error)
  }
}

/**
 * Provider step 4 (PR-02). NATIONAL_ID and SELFIE replace the previous one;
 * up to MAX_CERTIFICATES certificates. Stored under a private prefix that no
 * public route serves; only the owner (preview) and admins can get a 5-minute
 * signed link.
 */
export async function uploadDocument(userId: string, type: DocumentType, file: Blob): Promise<OnboardingDocumentDto> {
  const { state } = await loadState(userId)
  guardStep(state, "documents")
  const upload = await validateUpload(file, type === "CERTIFICATE")

  const existing = await repo.findDocuments(userId, type)
  if (type === "CERTIFICATE" && existing.length >= MAX_CERTIFICATES) {
    throw new ValidationError("Limit reached.", { file: [`You can upload at most ${MAX_CERTIFICATES} certificates.`] })
  }

  const key = `${DOCUMENT_PREFIX(userId)}${randomUUID()}.${EXTENSION_BY_TYPE[upload.type]}`
  await storePrivate(key, upload)

  const doc = await repo.transaction(async (tx) => {
    if (type !== "CERTIFICATE") {
      for (const old of existing) await repo.deleteDocument(old.id, old.fileId, tx)
    }
    return repo.createDocument(
      userId,
      type,
      { key, mimeType: upload.type, sizeBytes: upload.bytes.byteLength, sha256: upload.sha256 },
      tx
    )
  })
  if (type !== "CERTIFICATE") for (const old of existing) await removeObject(old.file.key)
  return { ...toFileDto(doc.file), type: doc.type }
}

export async function deleteDocument(userId: string, documentId: string) {
  const { state } = await loadState(userId)
  guardStep(state, "documents")
  const doc = await repo.findDocumentById(documentId)
  // Same answer for "not yours" and "doesn't exist": never confirm other users' ids.
  if (!doc || doc.providerId !== userId) throw new NotFoundError("Document not found.")
  await repo.transaction((tx) => repo.deleteDocument(doc.id, doc.fileId, tx))
  await removeObject(doc.file.key)
}

/** Provider step 5 images. Uploaded before the service exists; attached when the service is saved. */
export async function uploadServiceImage(userId: string, file: Blob): Promise<OnboardingFileDto> {
  const { state } = await loadState(userId)
  guardStep(state, "service")
  const upload = await validateUpload(file, false)
  // Count pending + attached so a user can't park unlimited files.
  if ((await repo.countUserFiles(userId, SERVICE_IMAGE_PREFIX(userId))) >= SERVICE_MAX_IMAGES * 2) {
    throw new ValidationError("Limit reached.", { file: [`Delete some old photos first (${SERVICE_MAX_IMAGES} photos per service).`] })
  }
  const key = `${SERVICE_IMAGE_PREFIX(userId)}${randomUUID()}.${EXTENSION_BY_TYPE[upload.type]}`
  await storePrivate(key, upload)
  const row = await repo.createFile({
    key,
    mimeType: upload.type,
    sizeBytes: upload.bytes.byteLength,
    sha256: upload.sha256,
    uploadedById: userId,
  })
  return toFileDto(row)
}

export async function deleteServiceImage(userId: string, fileId: string) {
  const { state } = await loadState(userId)
  guardStep(state, "service")
  const file = await repo.findFileById(fileId)
  if (!file || file.uploadedById !== userId || !file.key.startsWith(SERVICE_IMAGE_PREFIX(userId))) {
    throw new NotFoundError("Photo not found.")
  }
  await repo.deleteFile(file.id)
  await removeObject(file.key)
}

/**
 * Owner-only preview of an onboarding upload: a 5-minute inline signed URL.
 * Documents are never served by any public route; this is the only door, and
 * it checks ownership.
 */
export async function getFilePreviewUrl(userId: string, fileId: string): Promise<string> {
  const file = await repo.findFileById(fileId)
  const ownPrefix = file && (file.key.startsWith(DOCUMENT_PREFIX(userId)) || file.key.startsWith(SERVICE_IMAGE_PREFIX(userId)))
  if (!file || file.uploadedById !== userId || !ownPrefix) throw new NotFoundError("File not found.")
  if (!isR2Configured()) throw new StorageUnavailableError()
  return presignInline(file.key, file.mimeType)
}

// ----------------------------------------------------------------------------
// First service + submit
// ----------------------------------------------------------------------------

/**
 * Provider step 5 (PR-05). Creates the first service, or updates it on
 * re-save. It stays invisible to the public until the provider is APPROVED —
 * that rule lives in the catalog service, not here.
 */
export async function saveFirstService(userId: string, values: FirstServiceStepValues) {
  const { user, state } = await loadState(userId)
  guardStep(state, "service")
  const profile = user.providerProfile
  if (!profile) throw new ConflictError("Complete your professional profile first.")

  const chosen = profile.categories.find((c) => c.categoryId === values.categoryId)
  if (!chosen || !chosen.category.isActive) {
    throw new ValidationError("Please check your details.", { categoryId: ["Choose a category from your specialties."] })
  }
  if (chosen.category.type === "QUOTE") {
    throw new ValidationError("Please check your details.", { categoryId: ["This category is quote-only. Choose another category."] })
  }

  const imageIds = [...new Set(values.imageIds)]
  const existing = profile.services[0] ?? null
  const allowedImages = new Set([
    ...(await repo.findPendingServiceImages(userId, SERVICE_IMAGE_PREFIX(userId))).map((f) => f.id),
    ...(existing?.images.map((f) => f.id) ?? []),
  ])
  if (imageIds.some((id) => !allowedImages.has(id))) {
    throw new ValidationError("Please check the photos.", { imageIds: ["One of the photos is missing. Upload it again."] })
  }

  const data = {
    title: values.title,
    categoryId: values.categoryId,
    description: values.description,
    price: new Prisma.Decimal(values.price.toFixed(2)),
    durationMinutes: values.durationMinutes,
  }

  await withUniqueRetry(() =>
    repo.transaction(async (tx) => {
      const service = existing
        ? await repo.updateService(existing.id, data, tx)
        : await repo.createService(
            { ...data, providerId: userId, slug: await uniqueSlug(values.title, (s) => repo.slugExists(s, tx)) },
            tx
          )
      await repo.setServiceImages(service.id, userId, imageIds, tx)
    })
  )
  return getOnboardingState(userId)
}

/**
 * Provider step 6: DRAFT → PENDING. Re-checks every required step from the DB
 * (never trusts the wizard), then in one transaction moves the status, marks
 * onboarding complete, notifies admins in-app and writes the audit entry.
 */
export async function submitProvider(userId: string): Promise<OnboardingFinishDto> {
  const { user, state } = await loadState(userId)
  guardStep(state, "review")
  if (!canFinish(state)) throw new ConflictError("Some steps are still incomplete. Review them first.")
  const submittedAt = new Date()

  await repo.transaction(async (tx) => {
    if ((await repo.submitProviderForReview(userId, tx)) === 0) {
      throw new ConflictError("Your profile has already been sent for review.")
    }
    await repo.completeOnboarding(userId, submittedAt, tx)
    const admins = await repo.findAdminIds(tx)
    await repo.createNotifications(
      [
        ...admins.map((a) => ({
          userId: a.id,
          type: "PROVIDER_DECISION" as const,
          title: "New provider waiting for review",
          body: user.name,
          payload: { providerId: userId },
        })),
        {
          userId,
          type: "PROVIDER_DECISION" as const,
          title: "We've received your profile",
          body: "We'll review your details and documents and let you know the result.",
        },
      ],
      tx
    )
    await repo.createAuditLog(
      {
        actorId: userId,
        action: "provider.submit_for_review",
        entityType: "ProviderProfile",
        entityId: userId,
        // Terms acceptance is recorded here rather than in a column (docs/onboarding-feature.md).
        metadata: { termsVersion: PROVIDER_TERMS_VERSION, acceptedAt: submittedAt.toISOString() },
      },
      tx
    )
  })

  await sendOpsAlert({ kind: "provider.submitted_for_review", providerId: userId })
  return { role: "PROVIDER", redirectTo: homeFor({ role: "PROVIDER", onboardingCompleted: true }) }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/**
 * Two tabs saving the same step can race on a unique index (profile upsert,
 * service slug). One retry re-reads the now-existing row, which is enough.
 */
async function withUniqueRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return fn()
    throw error
  }
}

/**
 * Mirrors the name into Clerk (UI reads identity from Clerk) and returns the
 * Clerk profile image, which the user may have just changed in step 2.
 * Best effort: a Clerk hiccup must not lose the user's step.
 */
async function syncNameToClerk(userId: string, name: string): Promise<string | null> {
  const [firstName, ...rest] = name.split(/\s+/)
  try {
    const client = await clerkClient()
    const updated = await client.users.updateUser(userId, { firstName, lastName: rest.join(" ") || undefined })
    return updated.hasImage ? updated.imageUrl : null
  } catch (error) {
    console.error("[onboarding] could not sync name to Clerk", error)
    return null
  }
}
