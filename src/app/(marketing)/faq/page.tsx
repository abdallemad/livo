import type { Metadata } from "next"
import { PagePlaceholder } from "@/components/shared"

/** /faq — docs/SITEMAP.md §2 (MK-05). Placeholder until the feature lands. */
export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description: "إجابات عن الحجز، الدفع، المبلغ المحجوز، والنزاعات.",
  alternates: { canonical: "/faq" },
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <PagePlaceholder title={"الأسئلة الشائعة"} description={"إجابات عن الحجز، الدفع، المبلغ المحجوز، والنزاعات."} route="/faq" reqs={["MK-05"]} />
    </div>
  )
}
