import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { VerificationCenter } from "@/components/provider/account/VerificationCenter"
import { getVerification } from "@/services/provider-verification.service"

/**
 * /provider/verification — status, reason, documents, resubmit (docs/SITEMAP.md §4, PR-02, PR-03,
 * docs/provider-verification-settings-feature.md). First snapshot read on the server (service called
 * directly for the session's own user id — CLAUDE.md §2 exception); changes go through
 * `/api/provider/verification*`. Private: `noindex` from the zone layout.
 */
export const metadata: Metadata = { title: "Account verification" }

export default async function ProviderVerificationPage() {
  const { userId } = await auth()
  // Layout and page render in parallel, so don't rely on the layout's gate having run first.
  if (!userId) redirect("/sign-in?redirect_url=%2Fprovider%2Fverification")
  const data = await getVerification(userId)
  if (!data) notFound() // an admin browsing the zone has no provider profile
  return <VerificationCenter initialData={data} />
}
