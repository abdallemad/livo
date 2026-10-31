"use client"

import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Gavel } from "lucide-react"
import { toast } from "sonner"
import type { DisputeResolution } from "@prisma/client"
import { FormField } from "@/components/forms/FormField"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { RESOLUTION_HELP, RESOLUTION_LABEL } from "@/constants/status"
import { useResolveDispute } from "@/hooks/use-admin-moderation"
import { applyApiErrors } from "@/lib/form-errors"
import { cn } from "@/lib/utils"
import {
  RESOLUTION_NOTE_MAX,
  resolveDisputeFormSchema,
  type ResolveDisputeFormInput,
  type ResolveDisputeFormValues,
} from "@/schemas/admin.schema"
import type { AdminDisputeDetail } from "@/types/admin"
import { planDisputeSettlement, SettlementError, type SettlementPlan } from "@/utils/dispute-settlement"
import { formatPrice } from "@/utils/format"

const FIELDS = ["resolution", "refundAmount", "note"] as const

/**
 * The decision form (AD-05). The money preview runs the SAME pure rule as the
 * server (`utils/dispute-settlement.ts`), so what the admin confirms is what
 * gets written. Settling moves money, so it asks for confirmation first.
 */
export function ResolveDisputeForm({ dispute }: { dispute: AdminDisputeDetail }) {
  const resolve = useResolveDispute(dispute.id)
  const [confirming, setConfirming] = useState<ResolveDisputeFormValues | null>(null)
  const options = dispute.availableResolutions
  const form = useForm<ResolveDisputeFormInput, unknown, ResolveDisputeFormValues>({
    resolver: zodResolver(resolveDisputeFormSchema),
    defaultValues: { resolution: options[0], note: "" },
  })
  const { control, register, handleSubmit, setError, formState } = form
  const [resolution, refundAmount] = useWatch({ control, name: ["resolution", "refundAmount"] })
  const errors = formState.errors

  let plan: SettlementPlan | null = null
  let planError: string | null = null
  if (resolution) {
    try {
      plan = planDisputeSettlement({
        resolution,
        refundAmount: refundAmount === undefined || refundAmount === "" ? null : Number(refundAmount),
        commissionRate: dispute.booking.commissionRate,
        payments: dispute.payments,
        walletCreditedSoFar: dispute.walletCreditedSoFar,
      })
    } catch (e) {
      planError = e instanceof SettlementError ? e.message : null
    }
  }

  const submit = handleSubmit((values) => setConfirming(values))

  function confirm() {
    if (!confirming) return
    resolve.mutate(confirming, {
      onSuccess: () => {
        toast.success(`Dispute on ${dispute.bookingNumber} resolved`)
        setConfirming(null)
      },
      onError: (e) => {
        setConfirming(null)
        applyApiErrors(e, setError, FIELDS)
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Decision</CardTitle>
        <CardDescription>Both sides are notified with your note. This can&apos;t be undone.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="grid gap-5">
          <FormField id="resolution" label="Outcome" error={errors.resolution?.message}>
            <Controller
              control={control}
              name="resolution"
              render={({ field }) => (
                <RadioGroup id="resolution" value={field.value} onValueChange={(v) => field.onChange(v as DisputeResolution)} aria-describedby="resolution-msg">
                  {options.map((r) => (
                    <Label
                      key={r}
                      className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal", field.value === r && "border-primary bg-primary/5")}
                    >
                      <RadioGroupItem value={r} className="mt-0.5" />
                      <span>
                        <span className="block font-medium">{RESOLUTION_LABEL[r]}</span>
                        <span className="block text-sm text-muted-foreground">{RESOLUTION_HELP[r]}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
          </FormField>

          {resolution === "PARTIAL_REFUND" ? (
            <FormField id="refund-amount" label="Refund to the customer (EGP)" error={errors.refundAmount?.message}>
              <Input
                id="refund-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                dir="ltr"
                className="text-start tabular-nums sm:max-w-48"
                aria-invalid={!!errors.refundAmount}
                aria-describedby="refund-amount-msg"
                {...register("refundAmount")}
              />
            </FormField>
          ) : null}

          {plan ? (
            <dl className="grid gap-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
              {resolution === "NO_ACTION" ? (
                <p>No money moves.</p>
              ) : (
                <>
                  <Row label="Customer gets back" value={plan.refundNow} />
                  <Row label="Provider's total for this booking" value={plan.providerNetAfter} />
                  <Row
                    label={plan.walletDelta >= 0 ? "Added to the provider's wallet now" : "Taken back from the provider's wallet"}
                    value={Math.abs(plan.walletDelta)}
                  />
                  <Row label={`Livo commission (${dispute.booking.commissionRate}%)`} value={plan.commissionAfter} />
                </>
              )}
            </dl>
          ) : planError ? (
            <p className="text-sm text-muted-foreground">{planError}</p>
          ) : null}

          <FormField
            id="resolution-note"
            label="Note to both sides"
            error={errors.note?.message}
            helper={`Why you decided this. Up to ${RESOLUTION_NOTE_MAX} characters.`}
          >
            <Textarea id="resolution-note" rows={4} aria-invalid={!!errors.note} aria-describedby="resolution-note-msg" {...register("note")} />
          </FormField>

          <div>
            <Button type="submit" disabled={resolve.isPending}>
              <Gavel data-icon="inline-start" aria-hidden />
              Resolve dispute
            </Button>
          </div>
        </form>
      </CardContent>

      <AlertDialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming ? `${RESOLUTION_LABEL[confirming.resolution]} on ${dispute.bookingNumber}?` : "Resolve dispute?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {plan && confirming?.resolution !== "NO_ACTION"
                ? `The customer gets back ${formatPrice(plan.refundNow)} and the provider's total becomes ${formatPrice(plan.providerNetAfter)}. This is final.`
                : "The dispute is closed without moving money. This is final."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <Button onClick={confirm} disabled={resolve.isPending}>
              {resolve.isPending ? <Spinner data-icon="inline-start" /> : null}
              Confirm decision
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">
        <bdi dir="ltr">{formatPrice(value)}</bdi>
      </dd>
    </div>
  )
}
