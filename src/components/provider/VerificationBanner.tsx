import Link from "next/link"
import { VERIFICATION_STATUS, type VerificationStatus } from "@/constants/status"
import { cn } from "@/lib/utils"

const COPY: Record<Exclude<VerificationStatus, "ACTIVE">, string> = {
  PENDING: "حسابك قيد المراجعة. هتقدر تستقبل طلبات بعد ما نوثّق بياناتك.",
  REJECTED: "طلب التوثيق اترفض. شوف السبب وارفع المستندات تاني.",
  SUSPENDED: "حسابك موقوف مؤقتًا. تواصل مع الدعم لمعرفة السبب.",
}

const TONE = {
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
} as const

/** Pinned under the provider top bar until verification is ACTIVE (DESIGN-SYSTEM.md §7). */
export function VerificationBanner({ status }: { status: VerificationStatus }) {
  if (status === "ACTIVE") return null
  const meta = VERIFICATION_STATUS[status]
  const Icon = meta.icon
  const tone = meta.variant === "warning" ? TONE.warning : TONE.destructive
  return (
    <div role="status" className={cn("flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3", tone)}>
      <Icon className="size-5 shrink-0" aria-hidden />
      <p className="flex-1 font-medium">{COPY[status]}</p>
      <Link href="/provider/verification" className="font-semibold underline underline-offset-4">
        صفحة التوثيق
      </Link>
    </div>
  )
}
