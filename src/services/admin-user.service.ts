import "server-only"
import type { Prisma, UserStatus } from "@prisma/client"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { userRepository as repo, type AdminUserRow } from "@/repositories/user.repository"
import type { UserListQuery, UserRoleValues, UserStatusValues } from "@/schemas/admin.schema"
import { getEntityHistory, getLatestReason } from "@/services/audit.service"
import type { AdminUserDetail, AdminUserListItem, UserRoleDto, UserStatusDto } from "@/types/admin"
import type { Paginated } from "@/types/api"

/**
 * AD-03: every customer and provider, searchable, with suspend / activate
 * (docs/admin-providers-users-feature.md). Suspension is enforced by
 * `requireUser()` (every API call) and the zone gate (dashboards → /account-suspended).
 * Callers must already have passed `requireAdmin()` or the admin layout gate.
 */
const RECENT_BOOKINGS = 5

const label = (row: { nameEn: string | null; nameAr: string } | null) => (row ? (row.nameEn ?? row.nameAr) : null)

const toListItem = (u: AdminUserRow): AdminUserListItem => ({
  id: u.id,
  name: u.name || "Unnamed user",
  email: u.email,
  phone: u.phone,
  role: u.role,
  status: u.status,
  city: label(u.city),
  onboardingCompleted: u.role === "ADMIN" || u.onboardingCompletedAt !== null,
  joinedAt: u.createdAt.toISOString(),
})

export async function listUsers(query: UserListQuery): Promise<Paginated<AdminUserListItem>> {
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
            { phone: { contains: query.q } },
            { id: query.q },
          ],
        }
      : {}),
  }
  const [rows, total] = await repo.findAdminPage(where, (query.page - 1) * query.perPage, query.perPage)
  return {
    items: rows.map(toListItem),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
  }
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const user = await repo.findAdminDetail(userId)
  if (!user) return null

  const [bookingsAsProvider, recent, history, suspensionReason] = await Promise.all([
    user.providerProfile ? repo.countBookingsAsProvider(userId) : Promise.resolve(0),
    repo.findRecentBookings(userId, RECENT_BOOKINGS),
    getEntityHistory("User", userId),
    user.status === "SUSPENDED" ? getLatestReason("User", userId, "user.suspend") : Promise.resolve(null),
  ])

  return {
    ...toListItem(user),
    avatarUrl: user.avatarUrl,
    deletedAt: user.deletedAt?.toISOString() ?? null,
    suspensionReason,
    provider: user.providerProfile ? { verificationStatus: user.providerProfile.verificationStatus } : null,
    counts: {
      requests: user._count.requests,
      bookingsAsCustomer: user._count.bookingsAsCustomer,
      bookingsAsProvider,
      reviewsWritten: user._count.reviewsWritten,
      disputesOpened: user._count.disputesOpened,
    },
    recentBookings: recent.map((b) => ({
      id: b.id,
      number: b.number,
      customer: b.customer.name || "Unknown customer",
      provider: b.provider.user.name || "Unknown provider",
      amount: Number(b.amount.toString()),
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      side: b.customerId === userId ? "CUSTOMER" : "PROVIDER",
    })),
    history,
  }
}

/**
 * Suspend (ACTIVE → SUSPENDED, with a reason the user sees) or re-activate.
 * Admins can't suspend themselves or another admin (admin roles are managed
 * by hand, CLAUDE.md §5), and deleted accounts are final.
 */
export async function setUserStatus(adminId: string, userId: string, input: UserStatusValues): Promise<UserStatusDto> {
  if (userId === adminId) throw new ValidationError("You can't change the status of your own account.")
  const suspend = input.status === "SUSPENDED"
  const from: UserStatus = suspend ? "ACTIVE" : "SUSPENDED"
  const reason = suspend ? input.reason : null

  return repo.transaction(async (tx) => {
    const current = await repo.findStatus(userId, tx)
    if (!current) throw new NotFoundError("That user no longer exists.")
    if (current.role === "ADMIN") throw new ConflictError("Admin accounts can't be suspended here.")
    if (current.status === "DELETED") throw new ConflictError("This account is deleted and can't be changed.")
    if ((await repo.setStatus(userId, from, input.status, tx)) === 0) {
      throw new ConflictError(suspend ? "This account is already suspended." : "This account is already active.")
    }

    await auditRepository.createAuditLog(
      {
        actorId: adminId,
        action: suspend ? "user.suspend" : "user.activate",
        entityType: "User",
        entityId: userId,
        metadata: { from, to: input.status, ...(reason ? { reason } : {}) },
      },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId,
        type: "SYSTEM",
        title: suspend ? "Your account is suspended" : "Your account is active again",
        body: suspend ? reason : "You can use every part of the app again.",
        payload: { userStatus: input.status },
      },
      tx,
    )

    return { id: userId, status: input.status }
  })
}

/**
 * Promote a customer or provider to ADMIN (upgrade only — there is no "remove admin" button, so one admin
 * can't lock another out). Only ACTIVE accounts: a suspended account must be re-activated first, and a
 * deleted one is final. `User.role` lives in Postgres, so the proxy, the admin layout and `requireAdmin()`
 * see the new role on the person's very next request. A provider keeps their provider profile and services
 * (`requireProvider()` accepts admins too). Audited `user.make_admin` + a SYSTEM notification, same transaction.
 */
export async function promoteToAdmin(adminId: string, userId: string, input: UserRoleValues): Promise<UserRoleDto> {
  if (userId === adminId) throw new ValidationError("You're already an admin.")

  return repo.transaction(async (tx) => {
    const current = await repo.findStatus(userId, tx)
    if (!current) throw new NotFoundError("That user no longer exists.")
    if (current.role === "ADMIN") throw new ConflictError("This account is already an admin.")
    if (current.status === "DELETED") throw new ConflictError("This account is deleted and can't be changed.")
    if (current.status === "SUSPENDED") throw new ConflictError("Re-activate this account before making it an admin.")
    if ((await repo.promoteToAdmin(userId, tx)) === 0) {
      throw new ConflictError("This account changed while you were looking at it. Reload and try again.")
    }

    await auditRepository.createAuditLog(
      { actorId: adminId, action: "user.make_admin", entityType: "User", entityId: userId, metadata: { from: current.role, to: input.role } },
      tx,
    )
    await auditRepository.createNotification(
      {
        userId,
        type: "SYSTEM",
        title: "You're now a Livo admin",
        body: "You can open the admin dashboard from your account menu.",
        payload: { role: input.role },
      },
      tx,
    )

    return { id: userId, role: input.role }
  })
}
