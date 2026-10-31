import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/audit-log — docs/SITEMAP.md (AD-11, NF-12). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Audit log" }

export default function AdminAuditLogPage() {
  return <PagePlaceholder title={"Audit log"} description={"Every financial operation and admin decision."} route="/admin/audit-log" reqs={["AD-11", "NF-12"]} />
}
