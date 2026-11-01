import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { ProviderSettingsForm } from "@/components/provider/account/ProviderSettingsForm"
import { getSettings } from "@/services/provider-settings.service"

/**
 * /provider/settings — profile, work areas, account (docs/SITEMAP.md §4, AU-06,
 * docs/provider-verification-settings-feature.md). First snapshot read on the server (service called
 * directly for the session's own user id — CLAUDE.md §2 exception); saves go through
 * `/api/provider/settings/*`. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "Settings" }

export default async function ProviderSettingsPage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Fprovider%2Fsettings")
  const data = await getSettings(userId)
  if (!data) notFound() // an admin browsing the zone has no provider profile
  return <ProviderSettingsForm initialData={data} />
}
