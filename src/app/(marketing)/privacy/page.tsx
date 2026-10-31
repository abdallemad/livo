import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /privacy — docs/SITEMAP.md §2 (MK-05). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "إزاي بنجمع بياناتك ونحميها.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"سياسة الخصوصية"} description={"إزاي بنجمع بياناتك ونحميها."} route="/privacy" reqs={["MK-05"]} />
    </div>
  )
}
