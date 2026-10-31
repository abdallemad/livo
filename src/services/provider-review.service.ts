import "server-only"
import type { Prisma, VerificationStatus } from "@prisma/client"
import { API_ROUTES } from "@/constants/api-routes"
import { ConflictError, NotFoundError, ServiceUnavailableError } from "@/lib/errors"
import { isR2Configured, presignInline } from "@/lib/r2.provider"
import { auditRepository } from "@/repositories/audit.repository"
import { providerRepository as repo, type ProviderListRow } from "@/repositories/provider.repository"
import type { ProviderDecision, ProviderDecisionValues, ProviderListQuery } from "@/schemas/admin.schema"
import { getEntityHistory } from "@/services/audit.service"
import type { AdminProviderDetail, AdminProviderList, AdminProviderListItem, ProviderDecisionDto } from "@/types/admin"

/**
 * AD-01 provider verification for admins (docs/admin-providers-users-feature.md):
 * the review queue, the review page and every status decision. Callers must
 * already have passed `requireAdmin()` (routes) or the admin layout gate (pages).
 */

/** Each decision is only valid from one status. Anything else is a 409 (someone else got there first). */
const TRANSITIONS: Record<ProviderDecision, { from: VerificationStatus; to: VerificationStatus; action: string }> = {
  APPROVE: { from: "PENDING", to: "APPROVED", action: "provider.approve" },
  REJECT: { from: "PENDING", to: "REJECTED", action: "provider.reject" },
  SUSPEND: { from: "APPROVED", to: "SUSPENDED", action: "provider.suspend" },
  REINSTATE: { from: "SUSPENDED", to: "APPROVED", action: "provider.reinstate" },
}

const NOTIFICATION: Record<ProviderDecision, { title: string; body: string | null }> = {
  APPROVE: { title: "Your provider account is approved", body: "You can now receive requests and bookings." },
  REJECT: { title: "Your provider application was not approved", body: null },
  SUSPEND: { title: "Your provider account is suspended", body: null },
  REINSTATE: { title: "Your provider account is active again", body: "You can receive requests and bookings again." },
}

const label = (row: { nameEn: string | null; nameAr: string }) => row.nameEn ?? row.nameAr
const num = (value: { toString(): string }) => Number(value.toString())

const toListItem = (p: ProviderListRow): AdminProviderListItem => ({
  id: p.userId,
  name: p.user.name || "Unnamed provider",
  phone: p.user.phone,
  email: p.user.email,
  city: label(p.city),
  categories: p.categories.map((c) => label(c.category)),
  verificationStatus: p.verificationStatus,
  documentCount: p._count.documents,
  serviceCount: p._count.services,
  ratingAvg: num(p.ratingAvg),
  ratingCount: p.ratingCount,
  updatedAt: p.updatedAt.toISOString(),
})

export async function listProviders(query: ProviderListQuery): Promise<AdminProviderList> {
  const where: Prisma.ProviderProfileWhereInput = {
    verificationStatus: query.status,
    ...(query.q
      ? {
          user: {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
              { phone: { contains: query.q } },
            ],
          },
        }
      : {}),
  }
  // The review queue is first-come first-served; every other tab shows the latest change first.
  const orderBy: Prisma.ProviderProfileOrderByWithRelationInput = { updatedAt: query.status === "PENDING" ? "asc" : "desc" }

  const [[rows, total], grouped] = await Promise.all([
    repo.findPage(where, orderBy, (query.page - 1) * query.perPage, query.perPage),
    repo.countByStatus(),
  ])
  const counts: Record<VerificationStatus, number> = { DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, SUSPENDED: 0 }
  for (const g of grouped) counts[g.verificationStatus] = g._count._all

  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    counts,
  }
}

export async function getProviderDetail(providerId: string): Promise<AdminProviderDetail | null> {
  const [p, history] = await Promise.all([repo.findDetail(providerId), getEntityHistory("ProviderProfile", providerId)])
  if (!p) return null
  // History is newest first, so the first decision entry is the one `reviewedById` points at.
  const decisions = new Set(Object.values(TRANSITIONS).map((t) => t.action))
  const reviewer = p.reviewedById ? (history.find((h) => decisions.has(h.action))?.actor ?? null) : null

  return {
    id: p.userId,
    name: p.user.name || "Unnamed provider",
    phone: p.user.phone,
    email: p.user.email,
    avatarUrl: p.user.avatarUrl,
    userStatus: p.user.status,
    joinedAt: p.user.createdAt.toISOString(),
    verificationStatus: p.verificationStatus,
    rejectionReason: p.rejectionReason,
    reviewedAt: p.reviewedAt?.toISOString() ?? null,
    reviewedBy: reviewer,
    bio: p.bio,
    yearsExperience: p.yearsExperience,
    city: label(p.city),
    areas: p.areas.map((a) => label(a.area)),
    categories: p.categories.map((c) => label(c.category)),
    ratingAvg: num(p.ratingAvg),
    ratingCount: p.ratingCount,
    completedCount: p.completedCount,
    underReview: p.underReview,
    portfolioCount: p._count.portfolio,
    documents: p.documents.map((d) => ({
      id: d.id,
      type: d.type,
      mimeType: d.file.mimeType,
      sizeBytes: d.file.sizeBytes,
      uploadedAt: d.createdAt.toISOString(),
      url: API_ROUTES.admin.file(d.file.id),
    })),
    services: p.services.map((s) => ({
      id: s.id,
      title: s.title,
      category: label(s.category),
      price: num(s.price),
      isActive: s.isActive,
      imageCount: s._count.images,
    })),
    history,
  }
}

/**
 * Verification documents are private (PR-02): an admin sees them through a
 * 5-minute signed inline link. Only files attached to a ProviderDocument are
 * reachable here, so this route can't be used to read any other upload.
 */
export async function getProviderDocumentUrl(fileId: string): Promise<string> {
  const doc = await repo.findDocumentFile(fileId)
  if (!doc) throw new NotFoundError("Document not found.")
  if (!isR2Configured()) throw new ServiceUnavailableError("Document previews aren't available right now.")
  return presignInline(doc.file.key, doc.file.mimeType)
}

/**
 * One verification decision. The status change is a single conditional
 * UPDATE (`WHERE verificationStatus = from`), so two admins acting at once
 * can't both win; the audit entry (AD-11) and the provider's notification
 * commit in the same transaction. Approve / suspend / reinstate change what
 * the public sees, so the route revalidates the storefront.
 */
export async function decideProvider(
  adminId: string,
  providerId: string,
  input: ProviderDecisionValues,
): Promise<ProviderDecisionDto> {
  const { from, to, action } = TRANSITIONS[input.decision]
  const reason = "reason" in input ? input.reason : null
  const notice = NOTIFICATION[input.decision]

  return repo.transaction(async (tx) => {
    const changed = await repo.setVerificationStatus(
      providerId,
      from,
      // `rejectionReason` holds whatever reason the provider is shown now (rejection or suspension).
      { to, reviewedById: adminId, reviewedAt: new Date(), rejectionReason: reason },
      tx,
    )
    if (changed === 0) {
      const current = await repo.findVerificationStatus(providerId, tx)
      if (!current) throw new NotFoundError("That provider no longer exists.")
      throw new ConflictError("This provider's status has already changed. Reload to see the latest.")
    }

    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action,
        entityType: "ProviderProfile",
        entityId: providerId,
        metadata: { from, to, ...(reason ? { reason } : {}) },
      },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId: providerId,
        type: "PROVIDER_DECISION",
        title: notice.title,
        body: notice.body ?? reason,
        payload: { verificationStatus: to },
      },
      tx,
    )

    return { id: providerId, verificationStatus: to }
  })
}
