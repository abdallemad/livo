import "server-only"
import type { Prisma, PrismaClient, VerificationStatus } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

/** Provider profile reads/writes outside onboarding. Dumb queries; rules live in the services. */
class ProviderRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findVerificationStatus(providerId: string, client: Client = db) {
    return client.providerProfile.findUnique({
      where: { userId: providerId },
      select: { verificationStatus: true },
    })
  }

  /**
   * Conditional `from → to` in a single UPDATE, so two admins clicking at once
   * can't both decide (and write two audit entries). Returns the row count.
   */
  async setVerificationStatus(
    providerId: string,
    from: VerificationStatus,
    data: { to: VerificationStatus; reviewedById: string; reviewedAt: Date; rejectionReason: string | null },
    client: Client,
  ) {
    const { count } = await client.providerProfile.updateMany({
      where: { userId: providerId, verificationStatus: from },
      data: {
        verificationStatus: data.to,
        reviewedById: data.reviewedById,
        reviewedAt: data.reviewedAt,
        rejectionReason: data.rejectionReason,
      },
    })
    return count
  }
}

export const providerRepository = new ProviderRepository()
