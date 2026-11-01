import type { Metadata } from "next"
import { CommissionSettings } from "@/components/admin/commission/CommissionSettings"
import { getCommissionSettings } from "@/services/commission.service"

/**
 * /admin/settings/commission — platform and per-category commission (docs/SITEMAP.md §5, AD-06,
 * docs/admin-commission-payouts-feature.md). First snapshot read on the server (service called
 * directly — CLAUDE.md §2 exception; the admin layout enforced the role) and handed to the client as
 * `initialData`; changes go through `/api/admin/commission*`. Private: `noindex` from the admin layout.
 */
export const metadata: Metadata = { title: "Commission" }

export default async function AdminCommissionPage() {
  return <CommissionSettings initialData={await getCommissionSettings()} />
}
