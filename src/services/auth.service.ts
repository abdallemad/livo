import "server-only"
import { auth, currentUser } from "@clerk/nextjs/server"
import { Prisma, type Role, type User } from "@prisma/client"
import { ForbiddenError, UnauthorizedError } from "@/lib/errors"
import { userRepository } from "@/repositories/user.repository"
import type { SignUpRole } from "@/schemas/user.schema"
import type { ViewerDto } from "@/types/user"

/**
 * Identity + authorisation. Every API route calls one of the `require*`
 * guards first — Route Handlers are public HTTP endpoints. The user id always
 * comes from the Clerk session, never from the request body (CLAUDE.md §5).
 */

const toViewer = (user: Pick<User, "id" | "role">): ViewerDto => ({ id: user.id, role: user.role })

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null
  return userRepository.findById(userId)
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  return user
}

export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser()
  if (!roles.includes(user.role)) throw new ForbiddenError()
  return user
}

export const requireAdmin = () => requireRole("ADMIN")
export const requireProvider = () => requireRole("PROVIDER", "ADMIN")

/** Used by `src/proxy.ts` to gate `/admin` before anything renders. */
export async function getRoleById(userId: string): Promise<Role | null> {
  const row = await userRepository.findRoleById(userId)
  return row?.role ?? null
}

export async function getViewer(): Promise<ViewerDto | null> {
  const user = await getCurrentUser()
  return user ? toViewer(user) : null
}

/**
 * First sign-in: create the DB row for the Clerk user. Race-safe — two tabs
 * may call this at once; on a unique violation (P2002) re-read by id. Never
 * merge accounts by email or phone.
 */
export async function syncUserWithDatabase(role?: SignUpRole): Promise<ViewerDto> {
  const clerkUser = await currentUser()
  if (!clerkUser) throw new UnauthorizedError()

  const existing = await userRepository.findById(clerkUser.id)
  if (existing) return toViewer(existing)

  try {
    const created = await userRepository.create({
      id: clerkUser.id,
      role: role ?? "CUSTOMER",
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
      name: clerkUser.fullName ?? null,
      imageUrl: clerkUser.imageUrl ?? null,
    })
    return toViewer(created)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const row = await userRepository.findById(clerkUser.id)
      if (row) return toViewer(row)
    }
    throw error
  }
}
