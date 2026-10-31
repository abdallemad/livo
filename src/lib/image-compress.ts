/**
 * Client-side image compression before upload (NF-08: weak 4G, mid-range
 * phones). Downscales to `maxSide` and re-encodes as WebP (JPEG fallback).
 * PDFs and anything the browser can't decode pass through untouched — the
 * server re-validates by magic bytes either way.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap === "undefined") return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
    const blob = (await encode("image/webp")) ?? (await encode("image/jpeg"))
    // Keep the original if re-encoding didn't help (already small PNG/WebP).
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}
