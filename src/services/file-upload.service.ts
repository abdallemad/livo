import "server-only"
import { createHash } from "node:crypto"
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "@/constants/upload"
import { AppError, ValidationError } from "@/lib/errors"
import { deleteObject, isR2Configured, presignInline, putPrivateObject } from "@/lib/r2.provider"
import { detectFileType, type DetectedType } from "@/utils/file-signature"

/**
 * Shared upload plumbing for every user upload (CLAUDE.md §7): magic-byte + size validation,
 * private R2 storage, best-effort removal and owner-only preview links. Used by onboarding
 * (documents, first service), provider services (PR-05) and the portfolio (PR-04).
 * Each feature keeps its files under its own key prefix, so a route can never reach another
 * prefix's objects.
 */

export const SERVICE_IMAGE_PREFIX = (userId: string) => `uploads/services/${userId}/`
export const PORTFOLIO_IMAGE_PREFIX = (userId: string) => `uploads/portfolio/${userId}/`
export const DOCUMENT_PREFIX = (userId: string) => `private/verification/${userId}/`

export class StorageUnavailableError extends AppError {
  constructor() {
    super("File uploads aren't available right now. Try again in a little while.", "STORAGE_UNAVAILABLE", 503)
  }
}

export interface ValidatedUpload {
  bytes: Uint8Array
  type: DetectedType
  sha256: string
}

/** Magic-byte + size validation. The browser's mime type and file name are ignored. */
export async function validateUpload(file: Blob, allowPdf: boolean): Promise<ValidatedUpload> {
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

export async function storePrivate(key: string, upload: ValidatedUpload) {
  if (!isR2Configured()) throw new StorageUnavailableError()
  await putPrivateObject(key, upload.bytes, upload.type)
}

/** Removing a stored object is best effort: a leftover private object is harmless, a failed request isn't. */
export async function removeObject(key: string) {
  try {
    if (isR2Configured()) await deleteObject(key)
  } catch (error) {
    console.error("[uploads] could not delete storage object", error)
  }
}

/** A 5-minute inline signed link for an object the caller has already been checked to own. */
export function signedPreview(key: string, mimeType: string) {
  if (!isR2Configured()) throw new StorageUnavailableError()
  return presignInline(key, mimeType)
}
