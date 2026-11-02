import Stripe from "stripe"
import { ok, toErrorResponse } from "@/lib/api-route"
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe"
import { handleStripeEvent } from "@/services/booking-checkout.service"
import { apiFailure } from "@/types/api"

/**
 * POST /api/webhook/stripe — Stripe → Livo (CLAUDE.md §7–8; docs/booking-checkout-feature.md).
 *
 * No session: authenticated by the `Stripe-Signature` header over the **raw** body (`request.text()`, never `.json()`),
 * CSRF-exempt in `lib/api-guard.ts`. Answers 400 for a bad signature (Stripe stops), 500 when handling fails
 * (Stripe retries with backoff — handling is idempotent), 200 for everything else, including event types we ignore.
 *
 * Subscribe the endpoint to: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, checkout.session.expired.
 */
export async function POST(request: Request) {
  let event: Stripe.Event
  try {
    const signature = request.headers.get("stripe-signature")
    if (!signature) return Response.json(apiFailure("Missing signature.", "UNAUTHORIZED"), { status: 400 })
    const body = await request.text()
    event = await getStripe().webhooks.constructEventAsync(body, signature, getStripeWebhookSecret())
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return Response.json(apiFailure("Invalid signature.", "UNAUTHORIZED"), { status: 400 })
    }
    return toErrorResponse(error, "Webhook not accepted.")
  }

  try {
    const outcome = await handleStripeEvent(event)
    return ok({ received: true, outcome })
  } catch (error) {
    console.error("[webhook/stripe] handling failed", { eventId: event.id, type: event.type }, error)
    return toErrorResponse(error, "Webhook handling failed.")
  }
}
