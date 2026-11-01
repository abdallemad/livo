import "server-only"
import { NotFoundError, ValidationError } from "@/lib/errors"
import { onboardingRepository as profiles } from "@/repositories/onboarding.repository"
import { providerAccountRepository as repo } from "@/repositories/provider-account.repository"
import type { PersonalSettingsValues, WorkSettingsValues } from "@/schemas/provider-account.schema"
import { savePersonalDetails } from "@/services/account-settings.service"
import type { ProviderSettings } from "@/types/provider-account"

/**
 * `/provider/settings` (AU-06; docs/provider-verification-settings-feature.md): personal details and
 * the work profile, with the same rules as the onboarding steps they edit. Sign-in details (phone,
 * security) are Clerk's — the page opens Clerk's own dialog for them. The provider id is the session's.
 */

const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr

export async function getSettings(providerId: string): Promise<ProviderSettings | null> {
  const p = await repo.findSettings(providerId)
  if (!p) return null
  const [categories, areas] = await Promise.all([repo.findActiveCategories(), repo.findActiveAreas(p.cityId)])
  return {
    personal: { name: p.user.name, email: p.user.email, phone: p.user.phone, avatarUrl: p.user.avatarUrl, city: p.user.city ? label(p.user.city) : null },
    work: { bio: p.bio ?? "", yearsExperience: p.yearsExperience, categoryIds: p.categories.map((c) => c.categoryId), areaIds: p.areas.map((a) => a.areaId) },
    options: {
      categories: categories.map((c) => ({ id: c.id, name: label(c), group: c.parent ? label(c.parent) : null })),
      areas: areas.map((a) => ({ id: a.id, name: label(a) })),
    },
    verificationStatus: p.verificationStatus,
  }
}

/** Name (mirrored to Clerk) and optional email; also copies Clerk's current photo URL into `User.avatarUrl`. */
export async function savePersonal(providerId: string, values: PersonalSettingsValues): Promise<{ name: string }> {
  if (!(await repo.findSettings(providerId))) throw new NotFoundError("This account has no provider profile.")
  return savePersonalDetails(providerId, values)
}

/**
 * Bio, experience, specialties and work areas. Specialties must be switched on and areas must be in the
 * provider's city. Changing them doesn't send an approved account back to review (see the feature doc).
 */
export async function saveWork(providerId: string, values: WorkSettingsValues): Promise<{ ok: true }> {
  const p = await repo.findSettings(providerId)
  if (!p) throw new NotFoundError("This account has no provider profile.")
  const categoryIds = [...new Set(values.categoryIds)]
  const areaIds = [...new Set(values.areaIds)]
  const fieldErrors: Record<string, string[]> = {}
  if ((await profiles.countActiveCategories(categoryIds)) !== categoryIds.length) fieldErrors.categoryIds = ["One of the specialties isn't available. Choose from the list."]
  if ((await profiles.countActiveAreas(areaIds, p.cityId)) !== areaIds.length) fieldErrors.areaIds = ["One of the areas isn't in your city. Choose from the list."]
  if (Object.keys(fieldErrors).length) throw new ValidationError("Please check your details.", fieldErrors)

  await profiles.transaction(async (tx) => {
    await profiles.updateProviderProfile(providerId, { bio: values.bio, yearsExperience: values.yearsExperience }, tx)
    await profiles.replaceProviderCategories(providerId, categoryIds, tx)
    await profiles.replaceProviderAreas(providerId, areaIds, tx)
  })
  return { ok: true }
}
