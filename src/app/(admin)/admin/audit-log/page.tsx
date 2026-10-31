import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/audit-log — docs/SITEMAP.md (AD-11, NF-12). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "سجل العمليات" }

export default function AdminAuditLogPage() {
  return <PagePlaceholder title={"سجل العمليات"} description={"كل العمليات المالية وقرارات الإدارة."} route="/admin/audit-log" reqs={["AD-11", "NF-12"]} />
}
