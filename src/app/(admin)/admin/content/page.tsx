import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /admin/content — docs/SITEMAP.md (AD-10). Private: `noindex` comes from the zone layout. */
export const metadata: Metadata = { title: "محتوى الصفحات" }

export default function AdminContentPage() {
  return <PagePlaceholder title={"محتوى الصفحات"} description={"الأسئلة الشائعة، الشروط، وباقي الصفحات الثابتة."} route="/admin/content" reqs={["AD-10"]} />
}
