import type { Metadata } from "next"
import { NewRequestForm } from "@/components/customer/requests/NewRequestForm"
import { getCurrentUser } from "@/services/auth.service"
import { getNewRequestFormData } from "@/services/new-request.service"
import { notFound } from "next/navigation"

/**
 * /account/requests/new — send a quote request (docs/SITEMAP.md §3, CU-03, docs/customer-new-request-feature.md).
 * The options (quote categories, the customer's addresses and city areas, unsent photos) are loaded on the server;
 * `?category=<slug>` preselects a category (links from category pages). Private and per-user: dynamic, `noindex` from the
 * zone layout, which also gates the zone to signed-in customers.
 */
export const metadata: Metadata = { title: "Request a quote" }

export default async function AccountRequestsNewPage({ searchParams }: PageProps<"/account/requests/new">) {
  const user = await getCurrentUser()
  if (!user) notFound()
  const { category } = await searchParams
  const data = await getNewRequestFormData(user.id, typeof category === "string" ? category.slice(0, 120) : null)
  return <NewRequestForm data={data} />
}
