import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /how-it-works — docs/SITEMAP.md §2 (MK-03). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "كيف تعمل المنصة",
  description: "خطوات واضحة للعميل ولمزود الخدمة: من الطلب لحد إتمام الشغل والدفع.",
  alternates: { canonical: "/how-it-works" },
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"كيف تعمل المنصة"} description={"خطوات واضحة للعميل ولمزود الخدمة: من الطلب لحد إتمام الشغل والدفع."} route="/how-it-works" reqs={["MK-03"]} />
    </div>
  )
}
