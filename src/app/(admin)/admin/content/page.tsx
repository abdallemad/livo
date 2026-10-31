import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/content — docs/SITEMAP.md (AD-10). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Page content" }

export default function AdminContentPage() {
  return <PagePlaceholder title={"Page content"} description={"FAQ, terms, and the other static pages."} route="/admin/content" reqs={["AD-10"]} />
}
