import "server-only"
import { NotFoundError, ServiceUnavailableError } from "@/lib/errors"
import { isR2Configured, presignInline } from "@/lib/r2.provider"
import { fileRepository } from "@/repositories/file.repository"

/**
 * Admin-only previews of private uploads: provider verification documents
 * (PR-02), dispute evidence (AD-05) and chat attachments. A 5-minute signed
 * inline link; only those three kinds of `File` resolve, so the route can't be
 * used to read any other object. Callers must have passed `requireAdmin()`.
 */
export async function getAdminFileUrl(fileId: string): Promise<string> {
  const file = await fileRepository.findAdminViewable(fileId)
  if (!file) throw new NotFoundError("File not found.")
  if (!isR2Configured()) throw new ServiceUnavailableError("File previews aren't available right now.")
  return presignInline(file.key, file.mimeType)
}
