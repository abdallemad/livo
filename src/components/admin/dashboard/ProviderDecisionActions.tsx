"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useProviderDecision } from "@/hooks/use-admin-dashboard"
import { applyApiErrors } from "@/lib/form-errors"
import {
  REJECTION_REASON_MAX,
  rejectProviderFormSchema,
  type RejectProviderFormValues,
} from "@/schemas/admin.schema"

/** Approve (confirm) / Reject (with a reason the provider sees) for one pending application — AD-01. */
export function ProviderDecisionActions({ id, name }: { id: string; name: string }) {
  const decision = useProviderDecision()
  const [rejectOpen, setRejectOpen] = useState(false)
  const form = useForm<RejectProviderFormValues>({
    resolver: zodResolver(rejectProviderFormSchema),
    defaultValues: { reason: "" },
  })

  function approve() {
    decision.mutate(
      { id, decision: "APPROVE" },
      {
        onSuccess: () => toast.success(`${name} is approved`, { description: "They can now receive requests and bookings." }),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  const reject = form.handleSubmit((values) =>
    decision.mutateAsync({ id, decision: "REJECT", reason: values.reason }).then(
      () => {
        toast.success(`${name}'s application was rejected`, { description: "We've sent them your reason." })
        setRejectOpen(false)
        form.reset()
      },
      (error) => applyApiErrors(error, form.setError, ["reason"]),
    ),
  )

  const busy = decision.isPending
  const reasonError = form.formState.errors.reason?.message

  return (
    <div className="flex justify-end gap-1.5">
      <ConfirmDialog
        trigger={
          <Button size="sm" disabled={busy}>
            {busy && decision.variables?.decision === "APPROVE" ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" aria-hidden />}
            Approve
          </Button>
        }
        title={`Approve ${name}?`}
        description="Their profile and services go live on the site, and they can start receiving requests."
        confirmLabel="Approve provider"
        cancelLabel="Cancel"
        destructive={false}
        onConfirm={approve}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger render={<Button size="sm" variant="destructive" disabled={busy} />}>
          <X data-icon="inline-start" aria-hidden />
          Reject
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={reject} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Reject {name}&apos;s application?</DialogTitle>
              <DialogDescription>The provider sees this reason and can fix their profile and apply again.</DialogDescription>
            </DialogHeader>
            <FormField
              id={`reject-reason-${id}`}
              label="Reason"
              error={reasonError}
              helper={`Be specific, e.g. which document is missing or unreadable. Up to ${REJECTION_REASON_MAX} characters.`}
            >
              <Textarea
                id={`reject-reason-${id}`}
                rows={4}
                aria-invalid={!!reasonError}
                aria-describedby={`reject-reason-${id}-msg`}
                {...form.register("reason")}
              />
            </FormField>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" variant="destructive" disabled={busy}>
                {busy ? <Spinner data-icon="inline-start" /> : null}
                Reject application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
