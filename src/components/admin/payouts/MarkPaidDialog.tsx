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
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { applyApiErrors } from "@/lib/form-errors"
import { markPaidFormSchema, PAYOUT_REFERENCE_MAX, type MarkPaidFormInput, type MarkPaidFormValues } from "@/schemas/admin.schema"

interface MarkPaidDialogProps {
  trigger: React.ReactElement
  /** "Mark 5,000 EGP to CIB ••••4421 as sent?" */
  title: string
  description: string
  pending: boolean
  /** Resolve to close; reject with the `ApiError` to show it in the form. */
  onSubmit: (values: MarkPaidFormValues) => Promise<unknown>
}

/**
 * Records that the admin sent a payout (AD-07). Livo makes no transfer itself: the admin pays by
 * bank / wallet, then confirms here with an optional transfer reference (kept in the ledger
 * note and the audit log).
 */
export function MarkPaidDialog({ trigger, title, description, pending, onSubmit }: MarkPaidDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useForm<MarkPaidFormInput, unknown, MarkPaidFormValues>({
    resolver: zodResolver(markPaidFormSchema),
    defaultValues: { reference: "" },
  })
  const error = form.formState.errors.reference?.message

  const submit = form.handleSubmit((values) =>
    onSubmit(values).then(
      () => {
        setOpen(false)
        form.reset()
      },
      (e) => applyApiErrors(e, form.setError, ["reference"]),
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
            id="payout-reference"
            label="Transfer reference"
            optional
            error={error}
            helper={`The bank or wallet transaction number. Up to ${PAYOUT_REFERENCE_MAX} characters.`}
          >
            <Input
              id="payout-reference"
              autoComplete="off"
              aria-invalid={!!error}
              aria-describedby="payout-reference-msg"
              {...form.register("reference")}
            />
          </FormField>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Mark as paid
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
