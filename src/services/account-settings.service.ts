import "server-only"
import { onboardingRepository as users } from "@/repositories/onboarding.repository"
import type { PersonalSettingsValues } from "@/schemas/provider-account.schema"
import { syncNameToClerk } from "@/services/clerk-profile.service"

/**
 * Personal details for ANY signed-in user (AU-06): name mirrored to Clerk, optional email, and Clerk's
 * current photo URL copied into `User.avatarUrl`. Shared by `/provider/settings` and `/account/settings`
 * (docs/customer-account-feature.md). The user id comes from the session.
 */
export async function savePersonalDetails(userId: string, values: PersonalSettingsValues): Promise<{ name: string }> {
  const avatarUrl = await syncNameToClerk(userId, values.name)
  await users.updateUser(userId, { name: values.name, email: values.email, ...(avatarUrl ? { avatarUrl } : {}) })
  return { name: values.name }
}
