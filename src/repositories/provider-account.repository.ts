import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

/**
 * Reads and the status change behind `/provider/verification` and `/provider/settings` (PR-02, PR-03,
 * AU-06). Document rows and profile writes reuse `onboarding.repository.ts` (same tables, same shapes).
 * Every query is scoped by `providerId` from the session. Dumb queries.
 */
class ProviderAccountRepository {
  /** For the zone banner: just the status (null for an admin with no provider profile). */
  findVerificationStatus(providerId: string) {
    return db.providerProfile.findUnique({ where: { userId: providerId }, select: { verificationStatus: true } })
  }

  findVerification(providerId: string, client: Client = db) {
    return client.providerProfile.findUnique({
      where: { userId: providerId },
      select: {
        verificationStatus: true,
        rejectionReason: true,
        reviewedAt: true,
        documents: { orderBy: { createdAt: "asc" }, select: { id: true, type: true, createdAt: true, file: { select: { id: true, mimeType: true, sizeBytes: true } } } },
        user: { select: { name: true } },
      },
    })
  }

  findSettings(providerId: string) {
    return db.providerProfile.findUnique({
      where: { userId: providerId },
      select: {
        verificationStatus: true,
        bio: true,
        yearsExperience: true,
        cityId: true,
        categories: { select: { categoryId: true } },
        areas: { select: { areaId: true } },
        user: { select: { name: true, email: true, phone: true, avatarUrl: true, city: { select: { nameEn: true, nameAr: true } } } },
      },
    })
  }

  findActiveCategories() {
    return db.category.findMany({
      where: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      select: { id: true, nameEn: true, nameAr: true, parentId: true, parent: { select: { nameEn: true, nameAr: true } } },
    })
  }

  findActiveAreas(cityId: string) {
    return db.area.findMany({ where: { cityId, isActive: true }, orderBy: [{ nameEn: "asc" }], select: { id: true, nameEn: true, nameAr: true } })
  }

  /** Conditional REJECTED → PENDING; clears the reason the provider was shown. Returns the row count. */
  async resubmit(providerId: string, client: Client) {
    const { count } = await client.providerProfile.updateMany({
      where: { userId: providerId, verificationStatus: "REJECTED" },
      data: { verificationStatus: "PENDING", rejectionReason: null },
    })
    return count
  }
}

export const providerAccountRepository = new ProviderAccountRepository()
