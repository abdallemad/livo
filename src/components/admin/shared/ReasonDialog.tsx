"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormField } from "@/components/forms/FormField"
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
import { applyApiErrors } from "@/lib/form-errors"
import { REASON_MAX, reasonFormSchema, type ReasonFormValues } from "@/schemas/admin.schema"

interface ReasonDialogProps {
  /** The element that opens the dialog (a Button). */
  trigger: React.ReactElement
  /** Restates the consequence: "Suspend Ahmed's account?" */
  title: string
  description: string
  confirmLabel: string
  pending: boolean
  /** Resolve to close the dialog; reject with the `ApiError` to show it in the form. */
  onSubmit: (reason: string) => Promise<unknown>
}

/**
 * A destructive admin decision that needs a reason the affected user will see
 * (reject / suspend a provider, suspend a user). Server `fieldErrors` replay
 * into the textarea; anything else becomes a toast.
 */
export function ReasonDialog({ trigger, title, description, confirmLabel, pending, onSubmit }: ReasonDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useForm<ReasonFormValues>({ resolver: zodResolver(reasonFormSchema), defaultValues: { reason: "" } })
  const error = form.formState.errors.reason?.message

  const submit = form.handleSubmit((values) =>
    onSubmit(values.reason).then(
      () => {
        setOpen(false)
        form.reset()
      },
      (e) => applyApiErrors(e, form.setError, ["reason"]),
    ),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FormField
            id="decision-reason"
            label="Reason"
            error={error}
            helper={`The user sees this. Be specific. Up to ${REASON_MAX} characters.`}
          >
            <Textarea
              id="decision-reason"
              rows={4}
              aria-invalid={!!error}
              aria-describedby="decision-reason-msg"
              {...form.register("reason")}
            />
          </FormField>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
