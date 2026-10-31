import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/users — docs/SITEMAP.md (AD-03). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "المستخدمون" }

export default function AdminUsersPage() {
  return <PagePlaceholder title={"المستخدمون"} description={"كل العملاء والمزودين — إيقاف أو تفعيل."} route="/admin/users" reqs={["AD-03"]} />
}
