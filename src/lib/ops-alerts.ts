import "server-only"

/**
 * Outbound SMS / WhatsApp hook point for operations alerts (e.g. "a new
 * provider is waiting for review"). No messaging provider is integrated yet,
 * so this only logs the event name — never the payload, which can hold names.
 * Wire a provider here; callers don't change. Failures must never break the
 * caller's request, hence no throw.
 */
export type OpsAlert = { kind: "provider.submitted_for_review" | "provider.resubmitted_for_review"; providerId: string }

export async function sendOpsAlert(alert: OpsAlert): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "test") console.info(`[ops-alert] ${alert.kind} (no SMS/WhatsApp provider configured)`)
  } catch {
    // Alerts are best effort.
  }
}
