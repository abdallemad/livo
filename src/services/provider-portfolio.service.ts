import "server-only"
import { PORTFOLIO_MAX_IMAGES, PORTFOLIO_MAX_ITEMS } from "@/constants/provider-catalog"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { providerCatalogRepository as repo, type PortfolioRow } from "@/repositories/provider-catalog.repository"
import type { PortfolioItemValues } from "@/schemas/provider-catalog.schema"
import { PORTFOLIO_IMAGE_PREFIX, removeObject } from "@/services/file-upload.service"
import type { PortfolioItemDto, ProviderPortfolio } from "@/types/provider-catalog"
import { CatalogRuleError, planImageChanges, validateOrder } from "@/utils/provider-catalog"
import { toFileDto } from "./provider-catalog.service"

/**
 * The provider's portfolio (PR-04, docs/provider-services-portfolio-feature.md): items of past work,
 * each a title, an optional description and 1–6 photos, in the provider's chosen order. Shown on
 * the public provider profile once that page exists. Provider id from the session only.
 */

const toDto = (p: PortfolioRow): PortfolioItemDto => ({
  id: p.id,
  title: p.title,
  description: p.description,
  sortOrder: p.sortOrder,
  images: p.images.map(toFileDto),
  createdAt: p.createdAt.toISOString(),
})

export async function getPortfolio(providerId: string): Promise<ProviderPortfolio> {
  const [items, pending] = await Promise.all([repo.findPortfolio(providerId), repo.findPendingFiles(providerId, PORTFOLIO_IMAGE_PREFIX(providerId))])
  return { items: items.map(toDto), pendingImages: pending.map(toFileDto), max: PORTFOLIO_MAX_ITEMS, maxImages: PORTFOLIO_MAX_IMAGES }
}

function plan(current: string[], next: string[], pending: string[]) {
  try {
    return planImageChanges(current, next, pending, PORTFOLIO_MAX_IMAGES)
  } catch (error) {
    if (error instanceof CatalogRuleError) throw new ValidationError("Please check the photos.", { imageIds: [error.message] })
    throw error
  }
}

export async function createPortfolioItem(providerId: string, values: PortfolioItemValues): Promise<{ id: string }> {
  if (!(await repo.findProfile(providerId))) throw new NotFoundError("This account has no provider profile.")
  return repo.transaction(async (tx) => {
    const { next, count } = await repo.nextSortOrder(providerId, tx)
    if (count >= PORTFOLIO_MAX_ITEMS) throw new ConflictError(`Your portfolio can hold ${PORTFOLIO_MAX_ITEMS} items. Delete an old one first.`)
    const pending = (await repo.findPendingFiles(providerId, PORTFOLIO_IMAGE_PREFIX(providerId), tx)).map((f) => f.id)
    const p = plan([], values.imageIds, pending)
    const item = await repo.createPortfolioItem({ providerId, title: values.title, description: values.description, sortOrder: next }, tx)
    await repo.attachFiles({ portfolioItemId: item.id }, providerId, p.attach, tx)
    return item
  })
}

export async function updatePortfolioItem(providerId: string, id: string, values: PortfolioItemValues): Promise<{ id: string }> {
  const keys = await repo.transaction(async (tx) => {
    const current = await repo.findPortfolioItem(id, providerId, tx)
    if (!current) throw new NotFoundError("That portfolio item doesn't exist.")
    const pending = (await repo.findPendingFiles(providerId, PORTFOLIO_IMAGE_PREFIX(providerId), tx)).map((f) => f.id)
    const p = plan(current.images.map((i) => i.id), values.imageIds, pending)
    await repo.updatePortfolioItem(id, providerId, { title: values.title, description: values.description }, tx)
    const dropped = current.images.filter((i) => p.remove.includes(i.id)).map((i) => i.key)
    await repo.deleteFiles(p.remove, tx)
    await repo.attachFiles({ portfolioItemId: id }, providerId, p.attach, tx)
    return dropped
  })
  await Promise.all(keys.map(removeObject))
  return { id }
}

export async function deletePortfolioItem(providerId: string, id: string): Promise<void> {
  const keys = await repo.transaction(async (tx) => {
    const current = await repo.findPortfolioItem(id, providerId, tx)
    if (!current) throw new NotFoundError("That portfolio item doesn't exist.")
    await repo.deletePortfolioItem(id, providerId, tx) // File rows cascade
    return current.images.map((i) => i.key)
  })
  await Promise.all(keys.map(removeObject))
}

/** Set the display order: `ids` must be exactly the provider's items. */
export async function reorderPortfolio(providerId: string, ids: string[]): Promise<void> {
  await repo.transaction(async (tx) => {
    const current = (await repo.findPortfolio(providerId, tx)).map((i) => i.id)
    let order: string[]
    try {
      order = validateOrder(current, ids)
    } catch (error) {
      if (error instanceof CatalogRuleError) throw new ConflictError(error.message)
      throw error
    }
    for (const [i, itemId] of order.entries()) await repo.updatePortfolioItem(itemId, providerId, { sortOrder: i }, tx)
  })
}
