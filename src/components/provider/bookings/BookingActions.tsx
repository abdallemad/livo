"use client"

import { CheckCircle2, Play, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { ReasonDialog } from "@/components/admin/shared/ReasonDialog"
import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useUpdateProviderBooking } from "@/hooks/use-provider-workspace"
import { cn } from "@/lib/utils"
import type { ProviderBookingListItem } from "@/types/provider"
import { formatZonedDateTime } from "@/utils/zoned-time"

type BookingForActions = Pick<ProviderBookingListItem, "id" | "number" | "title" | "status" | "actions" | "acceptBlockedReason" | "scheduledAt">

/**
 * The provider's next step on a booking (PR-08): only the actions valid for its status
 * (`utils/provider-booking.ts`). One primary button per booking (DESIGN-SYSTEM §2); declining is
 * secondary and asks for a reason the customer will see.
 */
export function BookingActions({
  booking: b,
  objectionWindowHours = 48,
  size = "default",
  className,
}: {
  booking: BookingForActions
  objectionWindowHours?: number
  size?: "default" | "lg"
  className?: string
}) {
  const update = useUpdateProviderBooking()
  if (b.actions.length === 0) return null
  const when = b.scheduledAt ? ` on ${formatZonedDateTime(b.scheduledAt)}` : ""
  const run = (values: Parameters<typeof update.mutate>[0], done: string) =>
    update.mutate(values, { onSuccess: () => toast.success(done), onError: (e) => toast.error(e.message) })

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {b.actions.includes("ACCEPT") ? (
        b.acceptBlockedReason ? (
          <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} />}>
              <Button size={size} disabled>
                <ThumbsUp data-icon="inline-start" aria-hidden />
                Accept booking
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{b.acceptBlockedReason}</TooltipContent>
          </Tooltip>
        ) : (
          <ConfirmDialog
            trigger={
              <Button size={size} disabled={update.isPending}>
                <ThumbsUp data-icon="inline-start" aria-hidden />
                Accept booking
              </Button>
            }
            title={`Accept booking ${b.number}?`}
            description={`You commit to "${b.title}"${when}. The customer's name, phone and full address unlock now.`}
            confirmLabel="Accept booking"
            cancelLabel="Not now"
            destructive={false}
            onConfirm={() => run({ id: b.id, status: "CONFIRMED" }, "Booking accepted")}
          />
        )
      ) : null}

      {b.actions.includes("DECLINE") ? (
        <ReasonDialog
          trigger={
            <Button size={size} variant="outline" className="text-destructive" disabled={update.isPending}>
              Decline
            </Button>
          }
          title={`Decline booking ${b.number}?`}
          description="The customer is told why and gets back anything they paid. You can't undo this."
          confirmLabel="Decline booking"
          pending={update.isPending}
          onSubmit={(reason) => update.mutateAsync({ id: b.id, status: "REJECTED", reason }).then(() => toast.success("Booking declined"))}
        />
      ) : null}

      {b.actions.includes("START") ? (
        <ConfirmDialog
          trigger={
            <Button size={size} disabled={update.isPending}>
              <Play data-icon="inline-start" aria-hidden />
              Start work
            </Button>
          }
          title={`Start work on ${b.number}?`}
          description="Tap this when you arrive and begin. The customer is told the work has started."
          confirmLabel="Start work"
          cancelLabel="Not yet"
          destructive={false}
          onConfirm={() => run({ id: b.id, status: "IN_PROGRESS" }, "Work started")}
        />
      ) : null}

      {b.actions.includes("FINISH") ? (
        <ConfirmDialog
          trigger={
            <Button size={size} disabled={update.isPending}>
              <CheckCircle2 data-icon="inline-start" aria-hidden />
              Mark the job as done
            </Button>
          }
          title={`Is the job on ${b.number} done?`}
          description={`The customer is asked to confirm. If they don't report a problem within ${objectionWindowHours} hours, the job counts as done and any online payment is released to you.`}
          confirmLabel="Mark as done"
          cancelLabel="Not yet"
          destructive={false}
          onConfirm={() => run({ id: b.id, status: "AWAITING_CONFIRMATION" }, "Marked as done — waiting for the customer")}
        />
      ) : null}
    </div>
  )
}
