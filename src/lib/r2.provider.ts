import "server-only"
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
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
