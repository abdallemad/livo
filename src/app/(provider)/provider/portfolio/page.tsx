import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { PortfolioManager } from "@/components/provider/portfolio/PortfolioManager"
import { getPortfolio } from "@/services/provider-portfolio.service"

/**
 * /provider/portfolio — photos of past work (docs/SITEMAP.md §4, PR-04,
 * docs/provider-services-portfolio-feature.md). First snapshot read on the server (service called
 * directly for the session's own user id — CLAUDE.md §2 exception); changes go through
 * `/api/provider/portfolio*`. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "Portfolio" }

export default async function ProviderPortfolioPage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Fprovider%2Fportfolio")
  return <PortfolioManager initialData={await getPortfolio(userId)} />
}
