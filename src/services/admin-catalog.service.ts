import "server-only"
import type { Prisma } from "@prisma/client"
import { ConflictError, NotFoundError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { serviceRepository as repo, type AdminServiceRow } from "@/repositories/service.repository"
import type { ServiceListQuery, ServiceModerationValues, ServiceVisibility } from "@/schemas/admin.schema"
import type { AdminServiceListItem, ServiceModerationDto } from "@/types/admin"
import type { Paginated } from "@/types/api"
import { serviceVisibility } from "@/utils/service-visibility"

/**
 * `/admin/services` (AD-02, docs/admin-catalog-feature.md): every fixed-price
 * service, why it is or isn't public, and admin moderation (hide / restore).
 * Hiding is separate from the provider's own `isActive` switch, so a provider
 * can't undo it. Routes revalidate the storefront after a change.
 */

const providerOk: Prisma.ServiceWhereInput = {
  provider: { verificationStatus: "APPROVED", user: { status: "ACTIVE" } },
}
const categoryOk: Prisma.ServiceWhereInput = {
  category: { isActive: true, OR: [{ parentId: null }, { parent: { isActive: true } }] },
}

/**
 * The SAME rule as `utils/service-visibility.ts`, as Prisma filters. `LIVE` is
 * what the public catalog must use for every service read (CLAUDE.md §6:
 * visibility is enforced in the service).
 */
export const SERVICE_VISIBILITY_WHERE: Record<ServiceVisibility, Prisma.ServiceWhereInput> = {
  HIDDEN_BY_ADMIN: { hiddenByAdminAt: { not: null } },
  PROVIDER_INACTIVE: {
    hiddenByAdminAt: null,
    OR: [{ provider: { verificationStatus: { not: "APPROVED" } } }, { provider: { user: { status: { not: "ACTIVE" } } } }],
  },
  CATEGORY_OFF: {
    hiddenByAdminAt: null,
    ...providerOk,
    category: { OR: [{ isActive: false }, { parent: { isActive: false } }] },
  },
  PROVIDER_OFF: { hiddenByAdminAt: null, isActive: false, AND: [providerOk, categoryOk] },
  LIVE: { hiddenByAdminAt: null, isActive: true, AND: [providerOk, categoryOk] },
}
export const VISIBLE_SERVICE = SERVICE_VISIBILITY_WHERE.LIVE

const label = (row: { nameEn: string | null; nameAr: string }) => row.nameEn ?? row.nameAr

const toListItem = (s: AdminServiceRow): AdminServiceListItem => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  description: s.description,
  price: Number(s.price.toString()),
  durationMinutes: s.durationMinutes,
  category: s.category.parent ? `${label(s.category.parent)} · ${label(s.category)}` : label(s.category),
  categoryActive: s.category.isActive && (s.category.parent?.isActive ?? true),
  providerId: s.providerId,
  providerName: s.provider.user.name || "Unnamed provider",
  providerStatus: s.provider.verificationStatus,
  isActive: s.isActive,
  hiddenByAdminAt: s.hiddenByAdminAt?.toISOString() ?? null,
  hiddenByAdminReason: s.hiddenByAdminReason,
  imageCount: s._count.images,
  bookingCount: s._count.bookings,
  visibility: serviceVisibility({
    isActive: s.isActive,
    hiddenByAdmin: s.hiddenByAdminAt !== null,
    providerApproved: s.provider.verificationStatus === "APPROVED",
    providerAccountActive: s.provider.user.status === "ACTIVE",
    categoryActive: s.category.isActive,
    parentCategoryActive: s.category.parent ? s.category.parent.isActive : null,
  }),
  createdAt: s.createdAt.toISOString(),
})

export async function listServicesForAdmin(query: ServiceListQuery): Promise<Paginated<AdminServiceListItem>> {
  const and: Prisma.ServiceWhereInput[] = []
  if (query.q) {
    and.push({
      OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { slug: { contains: query.q, mode: "insensitive" } },
        { provider: { user: { name: { contains: query.q, mode: "insensitive" } } } },
      ],
    })
  }
  // A parent category includes its sub-categories.
  if (query.categoryId) and.push({ OR: [{ categoryId: query.categoryId }, { category: { parentId: query.categoryId } }] })
  if (query.visibility) and.push(SERVICE_VISIBILITY_WHERE[query.visibility])

  const [rows, total] = await repo.findAdminPage({ AND: and }, (query.page - 1) * query.perPage, query.perPage)
  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
  }
}

/** Hide (with a reason the provider sees) or restore one listing; audited and notified in one transaction. */
export async function moderateService(adminId: string, id: string, input: ServiceModerationValues): Promise<ServiceModerationDto> {
  const hide = input.action === "HIDE"
  const at = new Date()

  return repo.transaction(async (tx) => {
    const service = await repo.findForModeration(id, tx)
    if (!service) throw new NotFoundError("That service no longer exists.")
    const changed = await repo.setHidden(id, hide ? { at, reason: input.reason } : null, tx)
    if (changed === 0) throw new ConflictError(hide ? "This service is already hidden." : "This service isn't hidden.")

    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: hide ? "service.hide" : "service.restore",
        entityType: "Service",
        entityId: id,
        metadata: hide ? { reason: input.reason } : undefined,
      },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId: service.providerId,
        type: "SYSTEM",
        title: hide ? `Your service "${service.title}" was hidden by our team` : `Your service "${service.title}" is visible again`,
        body: hide ? input.reason : null,
        payload: { serviceId: id },
      },
      tx,
    )
    return { id, hiddenByAdminAt: hide ? at.toISOString() : null }
  })
}
