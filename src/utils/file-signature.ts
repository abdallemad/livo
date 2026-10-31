/**
 * Detects a file's real type from its first bytes (CLAUDE.md §7: validate by
 * magic bytes, never by the extension or the browser's mime claim). Pure.
 */
export type DetectedType = "image/jpeg" | "image/png" | "image/webp" | "application/pdf"

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b)

export function detectFileType(bytes: Uint8Array): DetectedType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png"
  // "RIFF" .... "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp"
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf" // "%PDF-"
  return null
}

export const EXTENSION_BY_TYPE: Record<DetectedType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}
