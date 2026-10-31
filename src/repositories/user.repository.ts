import "server-only"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

/** The only place `User` rows are read or written. No business rules here. */
class UserRepository {
  findById(id: string) {
    return db.user.findUnique({ where: { id } })
  }

  findRoleById(id: string) {
    return db.user.findUnique({ where: { id }, select: { role: true } })
  }

  create(data: Prisma.UserCreateInput) {
    return db.user.create({ data })
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return db.user.update({ where: { id }, data })
  }
}

export const userRepository = new UserRepository()
