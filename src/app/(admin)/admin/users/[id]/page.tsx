import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/users/[id] — docs/SITEMAP.md (AD-03). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "User details" }

export default function AdminUsersIdPage() {
  return <PagePlaceholder title={"User details"} description={"Account details and activity."} route="/admin/users/[id]" reqs={["AD-03"]} />
}
