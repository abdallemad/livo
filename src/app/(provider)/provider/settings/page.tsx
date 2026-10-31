import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /provider/settings — docs/SITEMAP.md (AU-06). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "الإعدادات" }

export default function ProviderSettingsPage() {
  return <PagePlaceholder title={"الإعدادات"} description={"الملف الشخصي، المناطق، والحساب."} route="/provider/settings" reqs={["AU-06"]} />
}
