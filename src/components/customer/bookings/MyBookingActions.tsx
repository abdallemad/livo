"use client"

import { useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateMyBookingStatus } from "@/hooks/use-customer-account"
import type { CustomerBookingDetail } from "@/types/customer-account"
import { CUSTOMER_CANCEL_REASON_MAX } from "@/utils/customer-booking-actions"
import { formatPrice } from "@/utils/format"

/**
 * The customer's two booking actions (docs/customer-booking-detail-feature.md): **Confirm the job is done** (CU-09 —
 * releases the held payment, so it's confirmed first) and **Cancel** before the provider accepts (CU-11, optional reason
 * the provider sees, full refund). The server re-checks both; a stale page gets 409 and refetches.
 */
export function MyBookingActions({ booking: b }: { booking: CustomerBookingDetail }) {
  const update = useUpdateMyBookingStatus(b.id)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState("")
  const busy = update.isPending
  const cash = b.paymentMethod === "CASH"
  const paidOnline = b.held > 0

  return (
    <div className="flex flex-wrap gap-3">
      {b.actions.includes("CONFIRM") ? (
        <ConfirmDialog
          trigger={
            <Button size="lg" variant="commit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : <CheckCircle2 data-icon="inline-start" aria-hidden />}
              Confirm the job is done
            </Button>
          }
          title="Is the job done the way you wanted?"
          description={
            cash
              ? `Confirm only if the work is finished and you've paid ${b.providerName} ${formatPrice(b.amount)} in cash. After this you can't report a problem here.`
              : `Livo will release the ${formatPrice(b.held)} it's holding to ${b.providerName}. After this you can't report a problem here.`
          }
          confirmLabel="Yes, confirm"
          cancelLabel="Not yet"
          destructive={false}
          onConfirm={() =>
            update.mutate(
              { status: "COMPLETED" },
              { onSuccess: () => toast.success("Thanks — the job is confirmed"), onError: (e) => toast.error(e.message) },
            )
          }
        />
      ) : null}

      {b.actions.includes("CANCEL") ? (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" disabled={busy}>
                <XCircle data-icon="inline-start" aria-hidden />
                Cancel booking
              </Button>
            }
          />
          <DialogContent>
            <form
              className="grid gap-4"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                update.mutate(
                  { status: "CANCELLED", reason: reason.trim() || undefined },
                  {
                    onSuccess: ({ refunded }) => {
                      setCancelOpen(false)
                      toast.success("Booking cancelled", { description: refunded > 0 ? `${formatPrice(refunded)} is on its way back to your card (usually 5–10 days).` : undefined })
                    },
                    onError: (err) => toast.error(err.message),
                  },
                )
              }}
            >
              <DialogHeader>
                <DialogTitle>Cancel booking {b.number}?</DialogTitle>
                <DialogDescription>
                  {b.status === "PENDING_PAYMENT"
                    ? "You haven't paid yet, so nothing is charged."
                    : paidOnline
                      ? `The provider hasn't accepted yet, so you get the full ${formatPrice(b.held)} back.`
                      : "The provider hasn't accepted yet, so cancelling is free."}
                </DialogDescription>
              </DialogHeader>
              {b.status === "PENDING_PROVIDER" ? (
                <FormField id="cancel-reason" label="Tell the provider why" optional helper="They'll see this.">
                  <Textarea id="cancel-reason" rows={3} maxLength={CUSTOMER_CANCEL_REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} aria-describedby="cancel-reason-msg" />
                </FormField>
              ) : null}
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>Keep booking</DialogClose>
                <Button type="submit" variant="destructive" disabled={busy}>
                  {busy ? <Spinner data-icon="inline-start" /> : null}
                  Cancel booking
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
