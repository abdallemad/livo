import "server-only"
import Stripe from "stripe"
import { getStripeEnv } from "@/config/env"
import { ServiceUnavailableError } from "@/lib/errors"

/**
 * One lazily created Stripe client (CLAUDE.md §8; docs/booking-checkout-feature.md). The API version is pinned so a
 * dashboard upgrade or SDK bump never silently changes webhook payload shapes — bump it on purpose, together with the
 * `stripe` package. Missing `STRIPE_SECRET` → 503 instead of a crash, so the rest of the app runs without payments.
 */
export const STRIPE_API_VERSION = "2026-10-28.endive" as const

let client: Stripe | undefined

export function isStripeConfigured(): boolean {
  return getStripeEnv() !== null
}

export function getStripe(): Stripe {
  const env = getStripeEnv()
  if (!env) throw new ServiceUnavailableError("Online payment isn't available right now. Choose cash, or try again later.")
  client ??= new Stripe(env.secret, { apiVersion: STRIPE_API_VERSION, appInfo: { name: "Livo" }, maxNetworkRetries: 1 })
  return client
}

/** The webhook signing secret (`whsec_…`), or 503 when not set — an unsigned webhook is never trusted. */
export function getStripeWebhookSecret(): string {
  const secret = getStripeEnv()?.webhookSecret
  if (!secret) throw new ServiceUnavailableError("Stripe webhooks aren't configured.")
  return secret
}
