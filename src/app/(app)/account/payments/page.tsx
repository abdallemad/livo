import { Suspense } from "react"
import type { Metadata } from "next"
import { PaymentsHistory } from "@/components/customer/account/PaymentsHistory"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * /account/payments — payments and invoices (docs/SITEMAP.md §3, CU-13, SY-07, docs/customer-account-feature.md).
 * View and page in the URL (`useSearchParams` → Suspense); data from `GET /api/me/payments`. Private: `noindex`.
 */
export const metadata: Metadata = { title: "Payments and invoices" }

export default function AccountPaymentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <PaymentsHistory />
    </Suspense>
  )
}
