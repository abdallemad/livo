import "server-only"
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * Cloudflare R2 (private bucket) through the S3 API. Created lazily so builds
 * and tests that never touch storage don't need R2 credentials.
 */
let client: S3Client | undefined

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing environment variable ${name}`)
  return value
}

export function getR2Client(): S3Client {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  })
  return client
}

export function getR2Bucket(): string {
  return requireEnv("R2_BUCKET_NAME")
}

/** Short-lived download link. Private files: 5 minutes, forced attachment. */
export function presignDownload(key: string, expiresIn = 300) {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ResponseContentDisposition: "attachment",
      ResponseContentType: "application/octet-stream",
    }),
    { expiresIn },
  )
}

/** True when R2 credentials are set; uploads answer a clear 503 instead of crashing when not. */
export function isR2Configured(): boolean {
  return ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"].every((name) =>
    Boolean(process.env[name]?.trim()),
  )
}

/** Stores bytes in the PRIVATE bucket. Callers validate type/size first (magic bytes). */
export async function putPrivateObject(key: string, body: Uint8Array, contentType: string) {
  await getR2Client().send(
    new PutObjectCommand({ Bucket: getR2Bucket(), Key: key, Body: body, ContentType: contentType }),
  )
}

export async function deleteObject(key: string) {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }))
}

/**
 * Short-lived INLINE link so the owner can see their own upload (image
 * thumbnails in the wizard). Same 5-minute lifetime as downloads; never cached.
 */
export function presignInline(key: string, contentType: string, expiresIn = 300) {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ResponseContentDisposition: "inline",
      ResponseContentType: contentType,
      ResponseCacheControl: "private, no-store",
    }),
    { expiresIn },
  )
}

/**
 * Read an object's bytes for an app route that streams PUBLIC artwork (service photos on catalog pages,
 * CLAUDE.md §7). The route decides what may be public; this just reads. `null` when the key is missing.
 */
export async function getPrivateObject(key: string): Promise<{ body: Uint8Array; contentType: string | null } | null> {
  try {
    const res = await getR2Client().send(new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }))
    if (!res.Body) return null
    return { body: await res.Body.transformToByteArray(), contentType: res.ContentType ?? null }
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") return null
    throw error
  }
}
