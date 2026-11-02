"use client"

import { useState } from "react"
import { CreditCard } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useStartCheckout } from "@/hooks/use-booking"

/**
 * Opens Stripe Checkout for an unpaid booking (docs/booking-checkout-feature.md): "Pay now" in My bookings and
 * "Try paying again" on the confirmation step. The server reuses an open session or starts a new one.
 */
export function PayNowButton({ bookingId, label = "Pay now", variant = "commit", className }: { bookingId: string; label?: string; variant?: "commit" | "default" | "outline"; className?: string }) {
  const checkout = useStartCheckout()
  const [leaving, setLeaving] = useState(false)
  const busy = checkout.isPending || leaving

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={busy}
      onClick={() =>
        checkout.mutate(bookingId, {
          onSuccess: ({ checkoutUrl }) => {
            setLeaving(true)
            window.location.assign(checkoutUrl)
          },
          onError: (e) => toast.error(e.message),
        })
      }
    >
      {busy ? <Spinner data-icon="inline-start" /> : <CreditCard data-icon="inline-start" aria-hidden />}
      {label}
    </Button>
  )
}
