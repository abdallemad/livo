import "server-only"
import { z } from "zod"

/**
 * Server env, validated on first use (not at import) so `next build` and tests
 * that never touch a given integration don't need its secrets.
 * Placeholders are documented in `.env.example`.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_SERVER_URL: z.url().optional(),
  // Stripe Checkout (docs/booking-checkout-feature.md). Optional so the app runs without online payments;
  // `getStripeEnv()` refuses with 503 when they're missing.
  STRIPE_SECRET: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env)
  return cached
}

/** Stripe keys, or `null` when online payment isn't configured (callers answer 503). */
export function getStripeEnv(): { secret: string; webhookSecret: string | null } | null {
  const env = getServerEnv()
  return env.STRIPE_SECRET ? { secret: env.STRIPE_SECRET, webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? null } : null
}
