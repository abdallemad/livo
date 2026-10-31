"use client"

import type { VerificationStatus } from "@prisma/client"
import { Ban, Check, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import { ReasonDialog } from "@/components/admin/shared/ReasonDialog"
import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useProviderDecision } from "@/hooks/use-admin-providers"
import type { ProviderDecision } from "@/schemas/admin.schema"

interface ProviderDecisionActionsProps {
  id: string
  name: string
  status: VerificationStatus
  /** `sm` in dense tables, `default` on the review page. */
  size?: "sm" | "default"
}

/**
 * The verification actions that make sense for the provider's current status
 * (AD-01): PENDING → Approve / Reject, APPROVED → Suspend, SUSPENDED →
 * Reinstate. DRAFT and REJECTED have none (the provider acts next). The
 * server re-checks the `from` status, so a stale button just gets a 409 toast.
 */
export function ProviderDecisionActions({ id, name, status, size = "sm" }: ProviderDecisionActionsProps) {
  const decision = useProviderDecision()
  const busy = decision.isPending
  const spinning = (d: ProviderDecision) => busy && decision.variables?.decision === d

  function run(d: "APPROVE" | "REINSTATE", success: string) {
    decision.mutate({ id, decision: d }, { onSuccess: () => toast.success(success), onError: (e) => toast.error(e.message) })
  }

  const withReason = (d: "REJECT" | "SUSPEND", success: string) => (reason: string) =>
    decision.mutateAsync({ id, decision: d, reason }).then(() => toast.success(success))

  if (status === "PENDING") {
    return (
      <div className="flex justify-end gap-1.5">
        <ConfirmDialog
          trigger={
            <Button size={size} disabled={busy}>
              {spinning("APPROVE") ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" aria-hidden />}
              Approve
            </Button>
          }
          title={`Approve ${name}?`}
          description="Their profile and services go live on the site, and they can start receiving requests."
          confirmLabel="Approve provider"
          cancelLabel="Cancel"
          destructive={false}
          onConfirm={() => run("APPROVE", `${name} is approved`)}
        />
        <ReasonDialog
          trigger={
            <Button size={size} variant="destructive" disabled={busy}>
              <X data-icon="inline-start" aria-hidden />
              Reject
            </Button>
          }
          title={`Reject ${name}'s application?`}
          description="The provider sees this reason and can fix their profile and apply again."
          confirmLabel="Reject application"
          pending={busy}
          onSubmit={withReason("REJECT", `${name}'s application was rejected`)}
        />
      </div>
    )
  }

  if (status === "APPROVED") {
    return (
      <div className="flex justify-end">
        <ReasonDialog
          trigger={
            <Button size={size} variant="destructive" disabled={busy}>
              <Ban data-icon="inline-start" aria-hidden />
              Suspend provider
            </Button>
          }
          title={`Suspend ${name} as a provider?`}
          description="Their profile and services are hidden from the site and they can't receive new requests until reinstated. Their customer account is not affected."
          confirmLabel="Suspend provider"
          pending={busy}
          onSubmit={withReason("SUSPEND", `${name} is suspended`)}
        />
      </div>
    )
  }

  if (status === "SUSPENDED") {
    return (
      <div className="flex justify-end">
        <ConfirmDialog
          trigger={
            <Button size={size} variant="outline" disabled={busy}>
              {spinning("REINSTATE") ? <Spinner data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" aria-hidden />}
              Reinstate
            </Button>
          }
          title={`Reinstate ${name}?`}
          description="Their profile and services go live again and they can receive requests."
          confirmLabel="Reinstate provider"
          cancelLabel="Cancel"
          destructive={false}
          onConfirm={() => run("REINSTATE", `${name} is active again`)}
        />
      </div>
    )
  }

  return null
}
