import "server-only"
import type { Prisma, PrismaClient, VerificationStatus } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const listSelect = {
  userId: true,
  verificationStatus: true,
  ratingAvg: true,
  ratingCount: true,
  updatedAt: true,
  user: { select: { name: true, phone: true, email: true } },
  city: { select: { nameEn: true, nameAr: true } },
  categories: { select: { category: { select: { nameEn: true, nameAr: true } } } },
  _count: { select: { documents: true, services: true } },
} satisfies Prisma.ProviderProfileSelect

const detailInclude = {
  user: { select: { name: true, phone: true, email: true, avatarUrl: true, status: true, createdAt: true } },
  city: { select: { nameEn: true, nameAr: true } },
  areas: { select: { area: { select: { nameEn: true, nameAr: true } } } },
  categories: { select: { category: { select: { nameEn: true, nameAr: true } } } },
  documents: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      createdAt: true,
      file: { select: { id: true, mimeType: true, sizeBytes: true } },
    },
  },
  services: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      price: true,
      isActive: true,
      category: { select: { nameEn: true, nameAr: true } },
      _count: { select: { images: true } },
    },
  },
  _count: { select: { portfolio: true } },
} satisfies Prisma.ProviderProfileInclude

export type ProviderListRow = Prisma.ProviderProfileGetPayload<{ select: typeof listSelect }>
export type ProviderDetailRow = Prisma.ProviderProfileGetPayload<{ include: typeof detailInclude }>

/** Provider profile reads/writes outside onboarding. Dumb queries; rules live in the services. */
class ProviderRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  /** Paginated admin list: rows + total in one transaction. */
  findPage(where: Prisma.ProviderProfileWhereInput, orderBy: Prisma.ProviderProfileOrderByWithRelationInput, skip: number, take: number) {
    return db.$transaction([
      db.providerProfile.findMany({ where, orderBy, skip, take, select: listSelect }),
      db.providerProfile.count({ where }),
    ])
  }

  countByStatus() {
    return db.providerProfile.groupBy({ by: ["verificationStatus"], _count: { _all: true } })
  }

  findDetail(providerId: string) {
    return db.providerProfile.findUnique({ where: { userId: providerId }, include: detailInclude })
  }

  /** A verification document's file, only if it belongs to that provider (admin preview). */
  findDocumentFile(fileId: string) {
    return db.providerDocument.findUnique({
      where: { fileId },
      select: { file: { select: { key: true, mimeType: true } } },
    })
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
