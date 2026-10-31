import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/users — docs/SITEMAP.md (AD-03). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "Users" }

export default function AdminUsersPage() {
  return <PagePlaceholder title={"Users"} description={"All customers and providers — Suspend or activate."} route="/admin/users" reqs={["AD-03"]} />
}
