/**
 * Body-size limit shared by `next.config.mjs` (plain ESM, can't import TS) and
 * `src/constants/upload.ts`. Change it here only so the two never drift.
 */
export const UPLOAD_BODY_LIMIT = "12mb"
export const UPLOAD_BODY_LIMIT_BYTES = 12 * 1024 * 1024
