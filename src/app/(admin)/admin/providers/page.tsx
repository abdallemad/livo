import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/providers — docs/SITEMAP.md (AD-01). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Provider applications" }

export default function AdminProvidersPage() {
  return <PagePlaceholder title={"Provider applications"} description={"Review queue by status."} route="/admin/providers" reqs={["AD-01"]} />
}
