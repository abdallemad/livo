import "server-only"
import { ConflictError, DependencyError, NotFoundError, ValidationError } from "@/lib/errors"
import { auditRepository } from "@/repositories/audit.repository"
import { categoryRepository as repo } from "@/repositories/category.repository"
import type { CreateCategoryValues, UpdateCategoryValues } from "@/schemas/category.schema"
import type { AdminCategoryDetail, AdminCategoryListItem, CategoryOptionDto } from "@/types/admin"
import { slugify, uniqueSlug } from "@/utils/slug"

/**
 * Category management for admins (AD-02, NF-09, docs/admin-catalog-feature.md).
 * Rules:
 *  - Two levels only: a parent must be top-level, and a category that has
 *    children can't become a child itself.
 *  - The slug is set once (it is the public URL) and is unique.
 *  - A category can't become quote-only while it still has switched-on
 *    fixed-price services, and a child can't be active under an inactive parent.
 *  - Delete only when nothing references it; otherwise deactivate.
 * Every write is audited (AD-11); the routes revalidate the storefront.
 */

const label = (row: { nameEn: string | null; nameAr: string }) => row.nameEn ?? row.nameAr

export async function listCategoriesForAdmin(): Promise<AdminCategoryListItem[]> {
  const [rows, switchedOn] = await Promise.all([repo.findAllForAdmin(), repo.countSwitchedOnServices()])
  const live = new Map(switchedOn.map((g) => [g.categoryId, g._count._all]))
  const items = rows.map(
    (c): AdminCategoryListItem => ({
      id: c.id,
      slug: c.slug,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      type: c.type,
      iconKey: c.iconKey,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      parentId: c.parentId,
      parentName: c.parent ? label(c.parent) : null,
      counts: {
        children: c._count.children,
        services: c._count.services,
        liveServices: live.get(c.id) ?? 0,
        providers: c._count.providers,
        requests: c._count.requests,
      },
    }),
  )
  // Tree order: each parent (by sortOrder) followed by its children.
  const parents = items.filter((c) => !c.parentId)
  return parents.flatMap((p) => [p, ...items.filter((c) => c.parentId === p.id)])
}

export async function getCategoryForAdmin(id: string): Promise<AdminCategoryDetail | null> {
  const c = await repo.findById(id)
  if (!c) return null
  return {
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn ?? "",
    nameAr: c.nameAr,
    description: c.description,
    type: c.type,
    iconKey: c.iconKey,
    parentId: c.parentId,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    hasChildren: c._count.children > 0,
  }
}

/** Top-level categories a category may sit under (never itself). */
export async function getParentOptions(excludeId?: string): Promise<CategoryOptionDto[]> {
  const rows = await repo.findTopLevel()
  return rows
    .filter((c) => c.id !== excludeId)
    .map((c) => ({ id: c.id, name: c.isActive ? label(c) : `${label(c)} (inactive)` }))
}

type Tx = Parameters<Parameters<typeof repo.transaction>[0]>[0]

async function assertValidParent(parentId: string | null, self: { id?: string; hasChildren: boolean }, isActive: boolean, tx: Tx) {
  if (!parentId) return
  if (parentId === self.id) throw new ValidationError("A category can't be its own parent.", { parentId: ["Choose another parent."] })
  if (self.hasChildren) {
    throw new ValidationError("This category has sub-categories, so it must stay top-level.", {
      parentId: ["Move or delete its sub-categories first."],
    })
  }
  const parent = await repo.findById(parentId, tx)
  if (!parent) throw new ValidationError("That parent category no longer exists.", { parentId: ["Choose another parent."] })
  if (parent.parentId) {
    throw new ValidationError("Only two levels are allowed.", { parentId: ["Choose a top-level category."] })
  }
  if (isActive && !parent.isActive) {
    throw new ValidationError("The parent is inactive.", { isActive: ["Activate the parent first, or save this one as inactive."] })
  }
}

export async function createCategory(adminId: string, input: CreateCategoryValues): Promise<{ id: string }> {
  return repo.transaction(async (tx) => {
    await assertValidParent(input.parentId, { hasChildren: false }, input.isActive, tx)

    let slug: string
    if (input.slug) {
      if (await repo.slugExists(input.slug, tx)) {
        throw new ConflictError("That URL name is taken.", { slug: ["Another category already uses this URL name."] })
      }
      slug = input.slug
    } else {
      if (!slugify(input.nameEn)) throw new ValidationError("Enter a URL name.", { slug: ["Use latin letters or numbers."] })
      slug = await uniqueSlug(input.nameEn, (s) => repo.slugExists(s, tx))
    }

    const created = await repo.create(
      {
        slug,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        description: input.description,
        type: input.type,
        parentId: input.parentId,
        iconKey: input.iconKey,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      tx,
    )
    await auditRepository.createAuditLog(
      { actorId: adminId, action: "category.create", entityType: "Category", entityId: created.id, metadata: { slug } },
      tx,
    )
    return { id: created.id }
  })
}

export async function updateCategory(adminId: string, id: string, input: UpdateCategoryValues): Promise<{ id: string }> {
  return repo.transaction(async (tx) => {
    const current = await repo.findById(id, tx)
    if (!current) throw new NotFoundError("That category no longer exists.")
    await assertValidParent(input.parentId, { id, hasChildren: current._count.children > 0 }, input.isActive, tx)

    if (input.type === "QUOTE" && current.type !== "QUOTE") {
      const live = await repo.countSwitchedOnServicesIn(id, tx)
      if (live > 0) {
        throw new ConflictError(`${live} fixed-price ${live === 1 ? "service is" : "services are"} still live in this category.`, {
          type: ["Hide or move those services first, or keep fixed prices allowed."],
        })
      }
    }

    await repo.update(
      id,
      {
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        description: input.description,
        type: input.type,
        parentId: input.parentId,
        iconKey: input.iconKey,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      tx,
    )
    const changed = (["nameEn", "nameAr", "description", "type", "parentId", "iconKey", "sortOrder", "isActive"] as const).filter(
      (k) => current[k] !== input[k],
    )
    await auditRepository.createAuditLog(
      { actorId: adminId, action: "category.update", entityType: "Category", entityId: id, metadata: { changed } },
      tx,
    )
    return { id }
  })
}

export async function setCategoryActive(adminId: string, id: string, isActive: boolean): Promise<{ id: string; isActive: boolean }> {
  return repo.transaction(async (tx) => {
    const current = await repo.findById(id, tx)
    if (!current) throw new NotFoundError("That category no longer exists.")
    if (current.isActive === isActive) return { id, isActive }
    if (isActive && current.parent && !current.parent.isActive) {
      throw new ConflictError("Activate the parent category first.")
    }
    await repo.update(id, { isActive }, tx)
    await auditRepository.createAuditLog(
      { actorId: adminId, action: isActive ? "category.activate" : "category.deactivate", entityType: "Category", entityId: id },
      tx,
    )
    return { id, isActive }
  })
}

export async function deleteCategory(adminId: string, id: string): Promise<void> {
  await repo.transaction(async (tx) => {
    const current = await repo.findById(id, tx)
    if (!current) throw new NotFoundError("That category no longer exists.")
    const deps = await repo.countDependencies(id, tx)
    const count = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : null)
    const blockers = [
      count(deps.children, "sub-category", "sub-categories"),
      count(deps.services, "service", "services"),
      count(deps.requests, "request", "requests"),
      count(deps.providers, "provider", "providers"),
    ].filter(Boolean)
    if (blockers.length) {
      throw new DependencyError(`It's still used by ${blockers.join(", ")}. Deactivate it instead.`)
    }
    await repo.delete(id, tx)
    await auditRepository.createAuditLog(
      { actorId: adminId, action: "category.delete", entityType: "Category", entityId: id, metadata: { slug: current.slug } },
      tx,
    )
  })
}
