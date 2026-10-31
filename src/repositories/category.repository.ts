import "server-only"
import type { Prisma, PrismaClient } from "@prisma/client"
import { db } from "@/lib/db"

type Client = PrismaClient | Prisma.TransactionClient

const adminListInclude = {
  parent: { select: { nameEn: true, nameAr: true } },
  _count: { select: { children: true, services: true, providers: true, requests: true } },
} satisfies Prisma.CategoryInclude

export type AdminCategoryRow = Prisma.CategoryGetPayload<{ include: typeof adminListInclude }>

/** The only place `Category` rows are read or written. Rules live in `category.service.ts`. */
class CategoryRepository {
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return db.$transaction(fn, { timeout: 15_000 })
  }

  findAllForAdmin() {
    return db.category.findMany({ include: adminListInclude, orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }] })
  }

  /** Services per category that are switched on by the provider and not hidden by an admin. */
  countSwitchedOnServices() {
    return db.service.groupBy({
      by: ["categoryId"],
      where: { isActive: true, hiddenByAdminAt: null },
      _count: { _all: true },
    })
  }

  findById(id: string, client: Client = db) {
    return client.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true } }, parent: { select: { isActive: true, parentId: true } } },
    })
  }

  findTopLevel(client: Client = db) {
    return client.category.findMany({
      where: { parentId: null },
      select: { id: true, nameEn: true, nameAr: true, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    })
  }

  async slugExists(slug: string, client: Client = db) {
    return (await client.category.count({ where: { slug } })) > 0
  }

  /** Everything that still points at the category (delete guard). */
  async countDependencies(id: string, client: Client = db) {
    const [children, services, requests, providers] = await Promise.all([
      client.category.count({ where: { parentId: id } }),
      client.service.count({ where: { categoryId: id } }),
      client.serviceRequest.count({ where: { categoryId: id } }),
      client.providerCategory.count({ where: { categoryId: id } }),
    ])
    return { children, services, requests, providers }
  }

  countSwitchedOnServicesIn(id: string, client: Client = db) {
    return client.service.count({ where: { categoryId: id, isActive: true, hiddenByAdminAt: null } })
  }

  create(data: Prisma.CategoryUncheckedCreateInput, client: Client = db) {
    return client.category.create({ data })
  }

  update(id: string, data: Prisma.CategoryUncheckedUpdateInput, client: Client = db) {
    return client.category.update({ where: { id }, data })
  }

  delete(id: string, client: Client = db) {
    return client.category.delete({ where: { id } })
  }
}

export const categoryRepository = new CategoryRepository()
