import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /become-provider — docs/SITEMAP.md §2 (MK-04). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "انضم كمزود خدمة",
  description: "اعرض خدماتك، استقبل طلبات في منطقتك، واستلم فلوسك بأمان.",
  alternates: { canonical: "/become-provider" },
}

export default function BecomeProviderPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"انضم كمزود خدمة"} description={"اعرض خدماتك، استقبل طلبات في منطقتك، واستلم فلوسك بأمان."} route="/become-provider" reqs={["MK-04"]} />
    </div>
  )
}
