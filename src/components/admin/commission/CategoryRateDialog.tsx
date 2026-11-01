"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
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
import { applyApiErrors } from "@/lib/form-errors"
import { commissionRateBodySchema, type CommissionRateInput, type CommissionRateValues } from "@/schemas/admin.schema"
import type { AdminCommissionCategory } from "@/types/admin"
import { COMMISSION_MAX, splitAmount } from "@/utils/commission"
import { formatPrice } from "@/utils/format"
import { RateInput } from "./RateInput"

const EXAMPLE_AMOUNT = 1000

/** Sets one category's own rate (AD-06). Sub-categories without their own rate inherit it. */
export function CategoryRateDialog({
  category,
  trigger,
  pending,
  onSubmit,
}: {
  category: AdminCommissionCategory
  trigger: React.ReactElement
  pending: boolean
  onSubmit: (values: CommissionRateValues) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const form = useForm<CommissionRateInput, unknown, CommissionRateValues>({
    resolver: zodResolver(commissionRateBodySchema),
    defaultValues: { ratePercent: String(category.overrideRate ?? category.effectiveRate) },
  })
  const raw = Number(useWatch({ control: form.control, name: "ratePercent" }))
  const preview = Number.isFinite(raw) && raw >= 0 && raw <= COMMISSION_MAX ? splitAmount(EXAMPLE_AMOUNT, raw) : null
  const error = form.formState.errors.ratePercent?.message

  const submit = form.handleSubmit((values) =>
    onSubmit(values).then(
      () => setOpen(false),
      (e) => applyApiErrors(e, form.setError, ["ratePercent"]),
    ),
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) form.reset({ ratePercent: String(category.overrideRate ?? category.effectiveRate) })
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Commission for {category.name}</DialogTitle>
            <DialogDescription>
              {category.parentId
                ? "Overrides the parent category and platform rate for this sub-category."
                : "Applies to this category and to its sub-categories that have no rate of their own."}{" "}
              Only bookings confirmed from now on use it.
            </DialogDescription>
          </DialogHeader>
          <FormField
            id="category-rate"
            label="Rate"
            error={error}
            helper={
              preview
                ? `On a ${formatPrice(EXAMPLE_AMOUNT)} booking: Livo ${formatPrice(preview.commission)}, provider ${formatPrice(preview.providerNet)}.`
                : `Between 0 and ${COMMISSION_MAX}%.`
            }
          >
            <RateInput id="category-rate" invalid={!!error} {...form.register("ratePercent")} />
          </FormField>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Save rate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
