import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /account/settings — docs/SITEMAP.md (AU-06, AU-07). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "الإعدادات" }

export default function AccountSettingsPage() {
  return <PagePlaceholder title={"الإعدادات"} description={"الاسم، الصورة، وحذف الحساب."} route="/account/settings" reqs={["AU-06", "AU-07"]} />
}
