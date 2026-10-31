import Link from "next/link"
import { VERIFICATION_STATUS, type VerificationStatus } from "@/constants/status"
import { cn } from "@/lib/utils"

const COPY: Record<Exclude<VerificationStatus, "ACTIVE">, string> = {
  PENDING: "Your account is under review. You'll be able to receive requests once we verify your details.",
  REJECTED: "Your verification request was rejected. See the reason and upload your documents again.",
  SUSPENDED: "Your account is temporarily suspended. Contact support to find out why.",
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
        Verification page
      </Link>
    </div>
  )
}
