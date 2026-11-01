import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AddressBook } from "@/components/customer/account/AddressBook"
import { getAddresses } from "@/services/customer-account.service"

/**
 * /account/addresses — saved addresses (docs/SITEMAP.md §3, CU-14, docs/customer-account-feature.md). First
 * snapshot read on the server (service called directly for the session's own user id — CLAUDE.md §2 exception);
 * changes go through `/api/me/addresses*`. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "Addresses" }

export default async function AccountAddressesPage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Faccount%2Faddresses")
  return <AddressBook initialData={await getAddresses(userId)} />
}
