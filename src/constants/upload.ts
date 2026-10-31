import { UPLOAD_BODY_LIMIT_BYTES } from "./upload-limit.mjs"

/**
 * Upload limits. The request body ceiling comes from `upload-limit.mjs`, which
 * `next.config.mjs` also reads, so the proxy limit and the validators agree.
 */
export const MAX_REQUEST_BODY_BYTES = UPLOAD_BODY_LIMIT_BYTES
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_PDF_BYTES = 10 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
