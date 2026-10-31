import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/users/[id] — docs/SITEMAP.md (AD-03). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "تفاصيل المستخدم" }

export default function AdminUsersIdPage() {
  return <PagePlaceholder title={"تفاصيل المستخدم"} description={"بيانات الحساب ونشاطه."} route="/admin/users/[id]" reqs={["AD-03"]} />
}
