import "server-only"
import { db } from "@/lib/db"

/** `File` rows (R2 objects). Dumb queries; access rules live in the services. */
class FileRepository {
  /**
   * A file an admin may open: a provider verification document, dispute
   * evidence or a chat attachment. Anything else (e.g. a public service image,
   * an unattached upload) is not reachable through the admin preview route.
   */
  findAdminViewable(id: string) {
    return db.file.findFirst({
      where: { id, OR: [{ providerDocument: { isNot: null } }, { disputeId: { not: null } }, { messageId: { not: null } }] },
      select: { key: true, mimeType: true },
    })
  }
}

export const fileRepository = new FileRepository()
