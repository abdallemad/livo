import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/providers — docs/SITEMAP.md (AD-01). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "طلبات المزودين" }

export default function AdminProvidersPage() {
  return <PagePlaceholder title={"طلبات المزودين"} description={"قائمة المراجعة حسب الحالة."} route="/admin/providers" reqs={["AD-01"]} />
}
