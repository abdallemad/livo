import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { CustomerSettingsForm } from "@/components/customer/account/CustomerSettingsForm"
import { getCustomerSettings } from "@/services/customer-account.service"

/**
 * /account/settings — profile and account (docs/SITEMAP.md §3, AU-06, docs/customer-account-feature.md).
 * First snapshot read on the server (service called directly for the session's own user id — CLAUDE.md §2
 * exception); saves go through `/api/me/settings/*`. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "Settings" }

export default async function AccountSettingsPage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Faccount%2Fsettings")
  const data = await getCustomerSettings(userId)
  if (!data) notFound()
  return <CustomerSettingsForm initialData={data} />
}
